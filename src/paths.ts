import {
  OpenApiExamplesMap,
  OpenApiExternalDocumentObject,
  OpenApiOperationObject,
  OpenApiParameterObject,
  OpenApiPathItemObject,
} from ".";
import type { JSONSchemaObject, OpenApiParameterIn, OpenApiPathsObject } from "./types";

const jsonMediaType = "application/json";
const statusTextMap = new Map<string, string>([
  ["200", "OK"],
  ["201", "Created"],
  ["202", "Accepted"],
  ["400", "Bad Request"],
  ["401", "Unauthorized"],
  ["403", "Forbidden"],
  ["404", "Not Found"],
  ["405", "Method Not Allowed"],
  ["500", "Internal Server Error"],
  ["502", "Bad Gateway"],
  ["503", "Service Unavailable"],
]);

class _OpenApiPathsEditor {
  /** @see https://swagger.io/specification/#path-item-object */
  readonly path: OpenApiPathItemObject;

  readonly op: OpenApiOperationObject;

  readonly warnings: Array<string>;

  constructor(
    paths: any,
    readonly method: string,
    readonly uri: string,
    pathParameters: Array<string | OpenApiParameterObject>
  ) {
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
      if (typeof p === "string") {
        if (pNamesInPath.has(p)) continue;

        const schema: JSONSchemaObject = { type: "string" };
        if (p.endsWith("UUID")) {
          schema.format = "uuid";
        }

        pNamesInPath.add(p);
        this.path.parameters.push({ name: p, required: true, in: "path", schema });
      } else if (p.name) {
        if (pNamesInPath.has(p.name)) continue;
        pNamesInPath.add(p.name);
        this.path.parameters.push(p);
      }
    }
  }

  baseInfo(operationId: string, summary: string, description?: string) {
    Object.assign(this.op, { operationId, summary, description });
    return this;
  }

  externalDocs(docs: OpenApiExternalDocumentObject) {
    this.op.externalDocs = docs;
    return this;
  }

  tags(tags: string[]) {
    if (!tags || tags.length <= 0) return;
    if (!this.op.tags) this.op.tags = [];
    this.op.tags.push(...tags);
    return this;
  }

  query(qs: Array<string | Omit<OpenApiParameterObject, "in">>) {
    if (!qs || qs.length <= 0) return;
    if (!this.op.parameters) this.op.parameters = [];

    const list = this.op.parameters;
    const push = (p: OpenApiParameterObject) => {
      const index = list.findIndex((item) => item.name === p.name && item.in === "query");
      if (index >= 0) list[index] = p;
      else list.push(p);
    };

    for (let i = 0; i < qs.length; i++) {
      const it = qs[i];
      if (typeof it === "string") {
        push({ name: it, in: "query", required: false, schema: { type: "string" } });
        continue;
      }

      if (!it.name) continue;
      const schema: JSONSchemaObject = { type: "string", ...(it.schema || {}) };
      if (it.schemaType) {
        schema.type = it.schemaType as any;
      }
      const q = Object.assign({}, it, {
        in: "query" as OpenApiParameterIn,
        schema,
        required: !!it.required,
      });
      push(q);
    }
    return this;
  }

  private _initRequestBody = () => {
    if (!this.op.requestBody) {
      this.op.requestBody = {
        required: true,
        description: "Request payload",
        content: {},
      };
    }
  };

  jsonRequest(ref: string[], exampleValue?: any) {
    this._initRequestBody();

    const { content } = this.op.requestBody;
    let schema: any;
    if (ref?.length > 0) {
      schema = ref.length > 1 ? { oneOf: ref.map(($ref) => ({ $ref })) } : { $ref: ref[0] };
    } else {
      schema = {};
    }

    const examples: OpenApiExamplesMap = {};
    if (typeof exampleValue !== 'undefined')
      examples.default = {
        summary: "Example json request payload",
        value: exampleValue,
      };

    content[jsonMediaType] = {
      schema,
      examples,
    };
    return this;
  }

  addJsonRequestExample(exampleName: string, exampleValue: any) {
    this._initRequestBody();

    const { content } = this.op.requestBody;

    const examples = { [exampleName]: exampleValue };
    if (content[jsonMediaType]) {
      const data = content[jsonMediaType];
      if (data.examples) Object.assign(data.examples, examples);
      else data.examples = examples;
    } else {
      content[jsonMediaType] = { schema: {}, examples };
    }
    return this;
  }

  private _initResponses = (statusCode: number) => {
    if (!this.op.responses) {
      this.op.responses = {};
    }
    const resps = this.op.responses;
    const st = String(statusCode || "");
    if (!resps[st])
      resps[st] = {
        description: statusTextMap.get(st) || st,
        content: {},
      };
    return resps[st];
  };

  jsonResponse(statusCode: number, ref: string, exampleValue?: any) {
    const resp = this._initResponses(statusCode);
    resp.content[jsonMediaType] = {
      schema: ref ? { $ref: ref } : {},
    };
    if (typeof exampleValue !== 'undefined') {
      resp.content[jsonMediaType].examples = {
        default: {
          summary: 'Example json response body',
          value: exampleValue,
        }
      }
    }
    return this;
  }
}

const validMethods = new Set(["get", "put", "post", "delete", "options", "head", "patch", "trace", "use"]);

export class OpenApiPathsEditor {
  readonly paths: OpenApiPathsObject = {};

  edit(
    method: string,
    uri: string,
    opts?: {
      pathParameters?: Array<string | OpenApiParameterObject>;
      isExpressUri?: boolean;
    }
  ) {
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

    const editor = new _OpenApiPathsEditor(this.paths, method, uri, pathParameters);
    return editor;
  }
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
export type OpenApiPathEditor = _OpenApiPathsEditor;
