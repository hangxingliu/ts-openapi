import { OpenApiHeadersMap, OpenApiResponseObject } from ".";
import {
  OpenApiParametersManager,
  OpenApiResponsesManager,
  OpenApiSchemasManager,
  OpenApiSecuritySchemesManager,
} from "./components";
import { ApplyParameterPriority } from "./enum";
import { OpenApiPathsEditor, _OpenApiPathEditor, EditFuncInOpenApiPathsEditor } from "./paths";
import { OpenApiTagsManager } from "./tags";
import type { Class, OpenApiDocument, PackageInfoForOpenAPI } from "./types";
import { isRefObj, resolveOpenApiHeadersMap } from "./utils";

const jsonMediaType = "application/json";

export type AdvancedOpenApiPathEditor = _OpenApiPathEditor & {
  useParameterComponent: (nameOrGroupName: string, priority?: ApplyParameterPriority) => AdvancedOpenApiPathEditor;
  useResponseComponent: (name: string, priority?: ApplyParameterPriority) => AdvancedOpenApiPathEditor;
  jsonResponse: (statusCode: string, ref: Array<string | Class>, exampleValue?: any) => AdvancedOpenApiPathEditor;
  jsonRequest: (ref: Array<string | Class>, exampleValue?: any) => AdvancedOpenApiPathEditor;
};

export class OpenAPIDocumentBuilder {
  private readonly document: OpenApiDocument;
  readonly schemas = new OpenApiSchemasManager();
  readonly parameters = new OpenApiParametersManager();
  readonly securitySchemes = new OpenApiSecuritySchemesManager();
  readonly responses = new OpenApiResponsesManager();
  readonly tags = new OpenApiTagsManager();
  private readonly paths = new OpenApiPathsEditor();

  constructor(packageJSON: PackageInfoForOpenAPI) {
    this.document = createOpenApiBaseDocument(packageJSON);
  }

  editPath = (...args: Parameters<EditFuncInOpenApiPathsEditor>) => {
    const editor = this.paths.edit(...args);
    const { jsonResponse, jsonRequest } = editor;
    const wrappedEditor: AdvancedOpenApiPathEditor = Object.assign(editor, {
      useParameterComponent: (nameOrGroupName: string, priority?: ApplyParameterPriority) => {
        const ps = this.parameters.get(nameOrGroupName);
        if (ps.length <= 0) return wrappedEditor;

        const refs = this.parameters.getRef(nameOrGroupName);
        const list = editor.parameters;
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
        return wrappedEditor;
      },
      useResponseComponent: (name: string, priority?: ApplyParameterPriority) => {
        const resp = this.responses.get(name);
        if (!resp) return wrappedEditor;

        const ref = this.responses.getRef(name);
        const resps = editor.responses;
        const existedStatusCode = new Set(Object.keys(resps));
        for (let i = 0; i < resp.status.length; i++) {
          const status = resp.status[i];
          if (existedStatusCode.has(status)) if (priority !== ApplyParameterPriority.HIGH) continue;
          resps[status] = { $ref: ref };
        } // end of loop `for`
        return wrappedEditor;
      },
      jsonResponse: (statusCode: string, ref: Array<string | Class>, exampleValue?: any) => {
        const nextRef: string[] = ref.map((it) => (typeof it === "string" ? it : this.schemas.getRef(it)));
        return jsonResponse(statusCode, nextRef, exampleValue);
      },
      jsonRequest: (ref: Array<string | Class>, exampleValue?: any) => {
        const nextRef: string[] = ref.map((it) => (typeof it === "string" ? it : this.schemas.getRef(it)));
        return jsonRequest(nextRef, exampleValue);
      },
    });

    return wrappedEditor;
  };

  addJsonResponse(
    name: string,
    status: string | Array<string>,
    schemaObject: Class,
    opts?: { headers?: OpenApiHeadersMap; description?: string }
  ) {
    if (!Array.isArray(status)) status = [status];

    const schemaName = `resp_json__${status.join("_")}__${schemaObject.name}`;
    const $ref = this.schemas.add(schemaObject, schemaName);
    const resp: OpenApiResponseObject = {
      description: opts?.description || `json response for ${status}`,
      content: { [jsonMediaType]: { schema: { $ref } } },
    };
    if (opts?.headers) resp.headers = resolveOpenApiHeadersMap(opts.headers);
    return this.responses.add(name, resp, status, true);
  }

  build() {
    const result = Object.assign({}, this.document);
    result.paths = this.paths.getPaths();
    result.components = Object.assign(
      {},
      this.securitySchemes.getComponents(),
      this.schemas.getComponents(),
      this.parameters.getComponents(),
      this.responses.getComponents()
    );
    result.tags = this.tags.getAllTags();
    result.security;
    return result;
  }
}

/**
 * @param packageJSON The object from package.json
 */
function createOpenApiBaseDocument(packageJSON: PackageInfoForOpenAPI): OpenApiDocument {
  let openApiTitle = "";
  let openApiDescription = "";
  let openApiVersion = "";

  if (typeof packageJSON !== "object" || !packageJSON)
    throw new Error(`Invalid packageJSON parameter for function createOpenApiBaseDocument`);

  if (packageJSON.openapi) {
    const { openapi } = packageJSON;
    if (openapi.title) openApiTitle = openapi.title;
    if (openapi.description) openApiDescription = openapi.description;
  }

  if (typeof packageJSON.version === "string") openApiVersion = packageJSON.version;

  const result: OpenApiDocument = {
    openapi: "3.0.0",
    info: {
      title: openApiTitle,
      version: openApiVersion,
    },
    servers: [],
    tags: [],
    components: {},
    paths: {},
  };
  if (openApiDescription) result.info.description = openApiDescription;

  const _author = packageJSON.author;
  if (_author) {
    const author = Array.isArray(_author) ? _author[0] : _author;
    if (author) {
      if (typeof author === "string") result.info.contact = { name: author };
      else result.info.contact = author;
    }
  }

  const _license = packageJSON.license;
  if (_license !== null && _license !== undefined) {
    const license = Array.isArray(_license) ? _license[0] : _license;
    if (license) {
      if (typeof license === "string") result.info.license = { name: license };
      else result.info.license = { name: license.type, url: license.url };
    }
  }
  return result;
}
