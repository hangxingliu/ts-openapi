import { OpenApiParametersManager, OpenApiResponsesManager, OpenApiSchemasManager } from "./components";
import { ApplyParameterPriority, Class } from "./types/base";
import type { JSONSchemaObject } from "./types/json-schema";
import type {
  OpenApiExamplesMap,
  OpenApiExternalDocumentObject,
  OpenApiOperationObject,
  OpenApiParameterObject,
  OpenApiPathItemObject,
  OpenApiParameterIn,
  OpenApiPathsObject,
  OpenApiHeadersMap,
  OpenApiMediaTypeObject,
  OpenApiResponseObject,
  OpenApiSchemaObject,
} from "./types/openapi";
import type { DefaultOpenApiSchemaGetter } from "./types/openapi-extra";
import { findOpenApiParamIndex, isRefObj, resolveOpenApiHeadersMap } from "./utils/base";

const jsonMediaType = "application/json";
const statusTextMap = new Map<string, string>([
  ["200", "OK"],
  ["2XX", "Successful"],
  ["201", "Created"],
  ["202", "Accepted"],
  ["200", "OK"],
  ["4XX", "Client Error"],
  ["400", "Bad Request"],
  ["401", "Unauthorized"],
  ["403", "Forbidden"],
  ["404", "Not Found"],
  ["405", "Method Not Allowed"],
  ["5XX", "Server Error"],
  ["500", "Internal Server Error"],
  ["502", "Bad Gateway"],
  ["503", "Service Unavailable"],
]);
const validMethods = new Set([
  //
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
  "use",
]);

export class _OpenApiPathEditor {
  /** @see https://swagger.io/specification/#path-item-object */
  readonly path: OpenApiPathItemObject;
  readonly op: OpenApiOperationObject;

  readonly warnings: Array<string>;

  private schemasManager: OpenApiSchemasManager;
  private parametersManager: OpenApiParametersManager;
  private responsesManager: OpenApiResponsesManager;
  private defaultSchemaGetter: DefaultOpenApiSchemaGetter;

  constructor(
    paths: any,
    readonly method: string,
    readonly uri: string,
    pathParameters: Array<OpenApiParameterObject>
  ) {
    if (paths === null) return; // for extends
    this.warnings = [];

    this.path = paths[this.uri];
    if (!this.path) {
      this.path = {};
      paths[this.uri] = this.path;
    }

    this.op = this.path[method];
    if (this.op) {
      this.warnings.push(`duplicated api "${method} ${uri}"`);
    } else {
      this.op = {};
      this.path[method] = this.op;
    }

    if (!this.path.parameters) this.path.parameters = [];

    const pNamesInPath = new Set(this.path.parameters.filter((it) => it.in === "path").map((it) => it.name));

    for (let i = 0; i < pathParameters.length; i++) {
      const p = pathParameters[i];
      if (pNamesInPath.has(p.name)) continue;
      pNamesInPath.add(p.name);
      if (typeof p.description !== "string" && typeof p.schema?.description === "string")
        p.description = p.schema.description;
      this.path.parameters.push(p);
    }
  }

  bindDefaultSchemaGetter = (getter: DefaultOpenApiSchemaGetter) => {
    this.defaultSchemaGetter = getter;
  };

  bindManagers = (managers: {
    schemas?: OpenApiSchemasManager;
    parameters?: OpenApiParametersManager;
    responses?: OpenApiResponsesManager;
  }) => {
    if (managers.schemas) this.schemasManager = managers.schemas;
    if (managers.parameters) this.parametersManager = managers.parameters;
    if (managers.responses) this.responsesManager = managers.responses;
  };

  baseInfo = (operationId: string, summary: string, description?: string) => {
    Object.assign(this.op, { operationId, summary, description });
    return this;
  };

  externalDocs = (docs: OpenApiExternalDocumentObject) => {
    this.op.externalDocs = docs;
    return this;
  };

  tags = (tags: string[]) => {
    if (!tags || tags.length <= 0) return;
    if (!this.op.tags) this.op.tags = [];
    this.op.tags.push(...tags);
    return this;
  };

  get parameters() {
    if (!this.op.parameters) this.op.parameters = [];
    return this.op.parameters;
  }
  get responses() {
    if (!this.op.responses) this.op.responses = {};
    return this.op.responses;
  }

  query = (qs: Array<string | Omit<OpenApiParameterObject, "in">>) => {
    if (!qs || qs.length <= 0) return;

    const list = this.parameters;
    const push = (p: OpenApiParameterObject) => {
      const index = findOpenApiParamIndex(list, p.name, p.in);
      if (index >= 0) list[index] = p;
      else list.push(p);
    };

    for (let i = 0; i < qs.length; i++) {
      const it = qs[i];
      if (typeof it === "string") {
        const schema: OpenApiSchemaObject = { type: "string" };
        if (this.defaultSchemaGetter) Object.assign(schema, this.defaultSchemaGetter("query", it));
        push(resolveOpenApiParameter({ name: it, in: "query", schema }));
        continue;
      }

      if (!it.name) continue;
      const schema: JSONSchemaObject = { type: "string", ...(it.schema || {}) };
      push(
        resolveOpenApiParameter({
          ...it,
          in: "query" as OpenApiParameterIn,
          schema,
        })
      );
    }
    return this;
  };

  private _initRequestBody = () => {
    if (!this.op.requestBody) {
      this.op.requestBody = {
        required: true,
        description: "Request payload",
        content: {},
      };
    }
  };

  jsonRequest = (_ref: Array<string | Class>, exampleValue?: any) => {
    this._initRequestBody();

    const ref = _ref.map((it) => {
      if (typeof it === "string") return it;
      if (!this.schemasManager) throw new Error(`There is no OpenApiSchemasManager bound`);
      return this.schemasManager.getRef(it);
    });

    const { content } = this.op.requestBody;
    let schema: any;
    if (ref?.length > 0) {
      schema = ref.length > 1 ? { oneOf: ref.map(($ref) => ({ $ref })) } : { $ref: ref[0] };
    } else {
      schema = {};
    }

    const examples: OpenApiExamplesMap = {};
    if (exampleValue !== undefined && exampleValue !== null) {
      examples.default = {
        summary: "Example json request payload",
        value: exampleValue,
      };
    }

    content[jsonMediaType] = {
      schema,
      examples,
    };
    return this;
  };

  addJsonRequestExample = (exampleName: string, exampleValue: any) => {
    this._initRequestBody();

    const { content } = this.op.requestBody;

    const examples = { [exampleName]: exampleValue };
    if (content[jsonMediaType]) {
      const data = content[jsonMediaType] as OpenApiMediaTypeObject;
      if (data.examples) Object.assign(data.examples, examples);
      else data.examples = examples;
    } else {
      content[jsonMediaType] = { schema: {}, examples };
    }
    return this;
  };

  private _initResponses = (statusCode: string) => {
    if (!this.op.responses) {
      this.op.responses = {};
    }
    const resps = this.op.responses;
    if (!resps[statusCode])
      resps[statusCode] = {
        description: statusTextMap.get(statusCode) || statusCode,
        content: {},
      };
    return resps[statusCode] as OpenApiResponseObject;
  };

  /**
   * @param statusCode can be '2XX', '4XX', ...
   */
  jsonResponse = (statusCode: string, _ref: Array<string | Class>, exampleValue?: any) => {
    const resp = this._initResponses(statusCode);

    const ref = _ref.map((it) => {
      if (typeof it === "string") return it;
      if (!this.schemasManager) throw new Error(`There is no OpenApiSchemasManager bound`);
      return this.schemasManager.getRef(it);
    });

    let schema: any;
    if (ref?.length > 0) {
      schema = ref.length > 1 ? { oneOf: ref.map(($ref) => ({ $ref })) } : { $ref: ref[0] };
    } else {
      schema = {};
    }
    resp.content[jsonMediaType] = { schema };
    if (exampleValue !== undefined && exampleValue !== null) {
      (resp.content[jsonMediaType] as OpenApiMediaTypeObject).examples = {
        default: {
          summary: "Example json response body",
          value: exampleValue,
        },
      };
    }
    return this;
  };

  responseHeaders = (statusCode: string, headers: OpenApiHeadersMap) => {
    const resp = this._initResponses(statusCode);
    resp.headers = resolveOpenApiHeadersMap(headers);
    return this;
  };

  useParameterComponent = (nameOrGroupName: string, priority?: ApplyParameterPriority) => {
    if (!this.parametersManager) throw new Error(`There is no OpenApiParametersManager bound`);

    const ps = this.parametersManager.get(nameOrGroupName);
    if (ps.length <= 0) return this;

    const refs = this.parametersManager.getRef(nameOrGroupName);
    const list = this.parameters;
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      const ref = refs[i];
      const existedIndex = list.findIndex((it) =>
        isRefObj(it) ? it.$ref === ref : it.name === p.name && it.in === p.in
      );
      if (existedIndex >= 0) {
        if (priority === ApplyParameterPriority.HIGH) list[existedIndex] = { $ref: ref };
      } else {
        list.push({ $ref: ref });
      }
    } // end of loop `for`
    return this;
  };

  useResponseComponent = (name: string, priority?: ApplyParameterPriority) => {
    if (!this.responsesManager) throw new Error(`There is no OpenApiResponsesManager bound`);

    const resp = this.responsesManager.get(name);
    if (!resp) return this;

    const ref = this.responsesManager.getRef(name);
    const resps = this.responses;
    const existedStatusCode = new Set(Object.keys(resps));
    for (let i = 0; i < resp.status.length; i++) {
      const status = resp.status[i];
      if (existedStatusCode.has(status)) if (priority !== ApplyParameterPriority.HIGH) continue;
      resps[status] = { $ref: ref };
    } // end of loop `for`
    return this;
  };
}

export type EditFuncInOpenApiPathsEditor = (
  method: string,
  uri: string,
  opts?: {
    pathParameters?: Array<string | OpenApiParameterObject>;
    defaultSchemaGetter?: DefaultOpenApiSchemaGetter;
    isExpressUri?: boolean;
  }
) => _OpenApiPathEditor;

export class OpenApiPathsEditor {
  readonly paths: OpenApiPathsObject = {};

  edit: EditFuncInOpenApiPathsEditor = (method, uri, opts) => {
    let pathParameters: Array<string | OpenApiParameterObject> = [];
    if (opts?.isExpressUri === false) {
      pathParameters = uri.match(/\{[\w-]+\}/g);
    } else {
      uri = uri.replace(/\:([\w-]+)/g, (_, name) => {
        pathParameters.push(name);
        return `{${name}}`;
      });
    }
    if (Array.isArray(opts?.pathParameters)) pathParameters = [...opts.pathParameters, ...pathParameters];

    method = String(method || "").toLowerCase();
    if (!validMethods.has(method)) throw new Error(`Invalid http method "${method}" for OpenApiPathsEditor`);

    let getter = opts?.defaultSchemaGetter;
    if (typeof getter !== "function") getter = undefined;
    const pps: Array<OpenApiParameterObject> = pathParameters
      .map((p) => {
        if (typeof p === "string") {
          const schema: JSONSchemaObject = { type: "string" };
          if (getter) Object.assign(schema, getter("path", p));
          return resolveOpenApiParameter({
            in: "path" as OpenApiParameterIn,
            name: p,
            schema,
          });
        }
        if (p.name) return p;
      })
      .filter((it) => it);

    const editor = new _OpenApiPathEditor(this.paths, method, uri, pps);
    if (getter) editor.bindDefaultSchemaGetter(opts.defaultSchemaGetter);
    return editor;
  };

  getPaths() {
    const result: OpenApiPathsObject = {};
    Object.keys(this.paths).forEach((key) => {
      let path = this.paths[key];
      // expaned the use middleware
      if (path["use"]) {
        const use = path["use"] as OpenApiOperationObject;
        const get = Object.assign({}, use);
        delete get.requestBody;

        path = Object.assign({}, path);
        delete path["use"];
        if (!path.get) path.get = get;
        if (!path.head) path.head = get;
        if (!path.post) path.post = use;
        if (!path.put) path.put = use;
        if (!path.patch) path.patch = use;
        if (!path.delete) path.delete = use;
      }
      result[key] = path;
    });
    return result;
  }
}

function resolveOpenApiParameter(param: OpenApiParameterObject) {
  if (typeof param.schema !== "object" || !param.schema) return param;
  const { title, description, required, deprecated } = param.schema;
  if (typeof param.description !== "string") {
    if (typeof description === "string" && description) {
      param.description = description;
      delete param.schema.description;
    } else if (typeof title === "string" && title) {
      param.description = title;
    }
  }

  if (typeof param.required !== "boolean" && typeof required === "boolean") {
    param.required = required;
    delete param.schema.required;
  }

  if (typeof param.required !== 'boolean') {
    param.required = param.in === 'path';
  }

  if (typeof param.deprecated !== "boolean" && deprecated === true) {
    param.deprecated = true;
    delete param.schema.deprecated;
  }

  return param;
}
