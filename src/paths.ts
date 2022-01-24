import { OpenApiParametersManager, OpenApiResponsesManager, OpenApiSchemasManager } from "./components";
import { ApplyParameterPriority, Class } from "./types/base";
import type { JSONSchemaObject } from "./types/json-schema";
import { httpStatusTexts, mediaTypes, validHttpMethods } from "./types/http";
import type {
  OpenApiExternalDocumentObject,
  OpenApiOperationObject,
  OpenApiParameterObject,
  OpenApiPathItemObject,
  OpenApiParameterIn,
  OpenApiPathsObject,
  OpenApiMediaTypeObject,
  OpenApiResponseObject,
  OpenApiSchemaObject,
  OpenApiHTTPStatusCode,
  OpenApiHeaderObject,
  OpenApiRequestBodyObject,
} from "./types/openapi";
import type { DefaultOpenApiSchemaGetter } from "./types/openapi-extra";
import { findOpenApiParamIndex, isRefObj } from "./utils/base";
import { isClass } from "is-class";
import { getOpenApiParameterFromHeader, resolveOpenApiHeadersMap } from "./utils/headers";

type SetSpecialRequest = (
  schema?: string | Class | OpenApiSchemaObject,
  mediaObject?: Partial<OpenApiMediaTypeObject>,
  mergeInfo?: Partial<Omit<OpenApiRequestBodyObject, "$ref">>
) => _OpenApiPathEditor;

type SetSpecialResponse = (
  statusCode: OpenApiHTTPStatusCode,
  schema?: string | Class | OpenApiSchemaObject,
  mediaObject?: Partial<OpenApiMediaTypeObject>,
  mergeInfo?: Partial<Omit<OpenApiResponseObject, "$ref">>
) => _OpenApiPathEditor;

export class _OpenApiPathEditor {
  /** @see https://swagger.io/specification/#path-item-object */
  readonly path: OpenApiPathItemObject;
  readonly op: OpenApiOperationObject;

  readonly warnings: Array<string>;

  private _schemasManager: OpenApiSchemasManager;
  private _parametersManager: OpenApiParametersManager;
  private _responsesManager: OpenApiResponsesManager;
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
    if (managers.schemas) this._schemasManager = managers.schemas;
    if (managers.parameters) this._parametersManager = managers.parameters;
    if (managers.responses) this._responsesManager = managers.responses;
  };
  private get schemasManager() {
    if (!this._schemasManager) throw new Error(`There is no OpenApiSchemasManager bound`);
    return this._schemasManager;
  }
  private get parametersManager() {
    if (!this._parametersManager) throw new Error(`There is no OpenApiParametersManager bound`);
    return this._parametersManager;
  }
  private get responsesManager() {
    if (!this._responsesManager) throw new Error(`There is no OpenApiResponsesManager bound`);
    return this._responsesManager;
  }

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
      const schema: OpenApiSchemaObject = { type: "string", ...(it.schema || {}) };
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
  setHeaders = (_headers: { [x: string]: OpenApiHeaderObject | OpenApiSchemaObject }, merge = false) => {
    const headers = resolveOpenApiHeadersMap(_headers);
    const headersMap = new Map(Object.keys(headers).map((key) => [key, headers[key]]));

    let list = this.parameters;
    if (!merge) list = list.filter((it) => isRefObj(it) || it.in !== "header");
    this.op.parameters = list.map((it) => {
      if (!isRefObj(it) && it.in === "header") {
        const newHeader = headersMap.get(it.name);
        if (newHeader) return getOpenApiParameterFromHeader(it.name, newHeader);
      }
      return it;
    });
  };
  addHeader = (name: string, header?: OpenApiHeaderObject | OpenApiSchemaObject) =>
    this.setHeaders({ [name]: header }, true);
  useParameterComponent = (nameOrGroupName: string, priority?: ApplyParameterPriority) => {
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

  //
  //#region request
  //
  private _initRequestBody = () => {
    if (!this.op.requestBody)
      this.op.requestBody = { required: true, content: {} };
    return this.op.requestBody;
  };
  setRequestBody = (
    mediaType: string,
    schema?: string | Class | OpenApiSchemaObject,
    mediaObject?: Partial<OpenApiMediaTypeObject>
  ) => {
    const req = this._initRequestBody();
    const object: OpenApiMediaTypeObject = { schema: {} };
    if (typeof schema === "string") {
      object.schema = { $ref: schema };
    } else if (isClass(schema)) {
      object.schema = { $ref: this.schemasManager.getRef(schema) };
    } else if (schema) {
      object.schema = this._schemasManager ? this._schemasManager.resolve(schema) : schema;
    }
    if (mediaObject) Object.assign(object, mediaObject);
    req.content[mediaType] = object;
    return this;
  };
  setRequestInfo = (requestInfo: Partial<Omit<OpenApiRequestBodyObject, "$ref" | "content">>) => {
    const req = this._initRequestBody();
    const { description, required } = requestInfo;
    if (description) req.description = description;
    if (typeof required === "boolean") req.required = required;
    return this;
  };
  setJsonRequest: SetSpecialRequest = (schema, mediaObject, mergeInfo) => {
    this.setRequestBody(mediaTypes.json, schema, mediaObject);
    if (mergeInfo) this.setRequestInfo(mergeInfo);
    return this;
  };
  setTextRequest: SetSpecialRequest = (schema, mediaObject, mergeInfo) => {
    this.setRequestBody(mediaTypes.text, schema, mediaObject);
    if (mergeInfo) this.setRequestInfo(mergeInfo);
    return this;
  };
  setXmlRequest: SetSpecialRequest = (schema, mediaObject, mergeInfo) => {
    this.setRequestBody(mediaTypes.xml, schema, mediaObject);
    if (mergeInfo) this.setRequestInfo(mergeInfo);
    return this;
  };
  //
  //#endregion request
  //

  //
  //#region response
  //
  private _initResponses = (statusCode: OpenApiHTTPStatusCode) => {
    if (!this.op.responses) {
      this.op.responses = {};
    }
    const resps = this.op.responses;
    const status = String(statusCode);
    if (!resps[status]) {
      resps[status] = {
        description: httpStatusTexts.get(status) || status,
        content: {},
      };
    }
    return resps[statusCode] as OpenApiResponseObject;
  };
  setResponseInfo = (
    statusCode: OpenApiHTTPStatusCode,
    responseInfo?: Partial<Omit<OpenApiResponseObject, "$ref" | "content">>
  ) => {
    const resp = this._initResponses(statusCode);
    if (responseInfo) {
      const { description, headers, links } = responseInfo;
      if (description) resp.description = description;
      if (headers) resp.headers = Object.assign(resp.headers || {}, headers);
      if (links) resp.links = Object.assign(resp.links || {}, links);
    }
    return this;
  };
  setResponseBody = (
    statusCode: OpenApiHTTPStatusCode,
    mediaType: string,
    schema?: string | Class | OpenApiSchemaObject,
    mediaObject?: Partial<OpenApiMediaTypeObject>
  ) => {
    const resp = this._initResponses(statusCode);
    const object: OpenApiMediaTypeObject = { schema: {} };
    if (typeof schema === "string") {
      object.schema = { $ref: schema };
    } else if (isClass(schema)) {
      object.schema = { $ref: this.schemasManager.getRef(schema) };
    } else if (schema) {
      object.schema = this._schemasManager ? this._schemasManager.resolve(schema) : schema;
    }
    if (mediaObject) Object.assign(object, mediaObject);
    resp.content[mediaType] = object;
    return this;
  };
  setResponseHeaders = (
    statusCode: OpenApiHTTPStatusCode,
    headers: { [x: string]: OpenApiHeaderObject | OpenApiSchemaObject },
    merge = false
  ) => {
    const resp = this._initResponses(statusCode);
    resp.headers = Object.assign((merge && resp.headers) || {}, resolveOpenApiHeadersMap(headers));
    return this;
  };
  setJsonResponse: SetSpecialResponse = (statusCode, schema, mediaObject, mergeInfo) => {
    this.setResponseInfo(statusCode, mergeInfo);
    this.setResponseBody(statusCode, mediaTypes.json, schema, mediaObject);
    return this;
  };
  setTextResponse: SetSpecialResponse = (statusCode, schema, mediaObject, mergeInfo) => {
    this.setResponseInfo(statusCode, mergeInfo);
    this.setResponseBody(statusCode, mediaTypes.text, schema, mediaObject);
    return this;
  };
  setXmlResponse: SetSpecialResponse = (statusCode, schema, mediaObject, mergeInfo) => {
    this.setResponseInfo(statusCode, mergeInfo);
    this.setResponseBody(statusCode, mediaTypes.xml, schema, mediaObject);
    return this;
  };
  setResponseComponent = (name: string, priority?: ApplyParameterPriority) => {
    const resp = this.responsesManager.get(name);
    if (!resp) return this;

    const ref = this.responsesManager.getRef(name);
    const resps = this.responses;
    const existedStatusCode = new Set<any>(Object.keys(resps));
    for (let i = 0; i < resp.status.length; i++) {
      const status = resp.status[i];
      if (existedStatusCode.has(status)) if (priority !== ApplyParameterPriority.HIGH) continue;
      resps[status] = { $ref: ref };
    } // end of loop `for`
    return this;
  };
  useResponseComponent = this.setResponseComponent;
  //
  //#endregion response
  //
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
    if (!validHttpMethods.has(method)) throw new Error(`Invalid http method "${method}" for OpenApiPathsEditor`);

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

  if (typeof param.required !== "boolean") {
    param.required = param.in === "path";
  }

  if (typeof param.deprecated !== "boolean" && deprecated === true) {
    param.deprecated = true;
    delete param.schema.deprecated;
  }

  return param;
}
