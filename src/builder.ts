import {
  OpenApiParametersManager,
  OpenApiResponsesManager,
  OpenApiSchemasManager,
  OpenApiSecuritySchemesManager,
} from "./components";
import { EditFuncInOpenApiPathsEditor, OpenApiPathsEditor, _OpenApiPathEditor } from "./paths";
import { OpenApiTagsManager } from "./tags";
import { createOpenApiBaseDocument } from "./base-document";
import { Class, PackageInfoForOpenAPI } from "./types/base";
import {
  OpenApiDocument,
  OpenApiHeadersMap,
  OpenApiHTTPStatusCode,
  OpenApiMediaTypeObject,
  OpenApiParameterObject,
  OpenApiResponseObject,
  OpenApiSchemaObject,
} from "./types/openapi";
import { isClass } from "is-class";
import { getOpenApiNameFromClass } from "./utils/metadata";
import { isRefObj } from "./utils/base";

export class OpenAPIDocumentBuilder {
  private readonly document: OpenApiDocument;
  private readonly paths = new OpenApiPathsEditor();

  readonly schemas = new OpenApiSchemasManager();
  readonly parameters = new OpenApiParametersManager();
  readonly securitySchemes = new OpenApiSecuritySchemesManager();
  readonly responses = new OpenApiResponsesManager();
  readonly tags = new OpenApiTagsManager();

  constructor(packageJSON: PackageInfoForOpenAPI) {
    this.document = createOpenApiBaseDocument(packageJSON);
  }

  editPath = (...args: Parameters<EditFuncInOpenApiPathsEditor>) => {
    const editor = this.paths.edit(...args);
    editor.bindManagers({
      // managers
      schemas: this.schemas,
      parameters: this.parameters,
      responses: this.responses,
    });
    return editor;
  };

  addParameterComponent = (
    parameterName: string,
    base: OpenApiParameterObject,
    schema?: string | Class | OpenApiSchemaObject
  ) => {
    const param: OpenApiParameterObject = { ...base };
    if (!param.name) param.name = parameterName;
    if (!param.in) param.in = "query";

    if (typeof schema === "string") {
      param.schema = { $ref: schema };
    } else if (isClass(schema)) {
      let refName = getOpenApiNameFromClass(schema);
      refName = `Parameter__${parameterName}_${refName}`;
      param.schema = { $ref: this.schemas.getRef(schema, refName) };
    } else if (schema) {
      param.schema = this.schemas.resolve(schema);
    }
    return this.parameters.add(parameterName, param);
  };

  addResponseComponent = (
    componentName: string,
    statusCode: OpenApiHTTPStatusCode | Array<OpenApiHTTPStatusCode>,
    mediaType: string,
    schema?: string | Class | OpenApiSchemaObject,
    mediaObject?: Partial<OpenApiMediaTypeObject>,
    responseInfo?: Partial<Omit<OpenApiResponseObject, "$ref" | "content">>
  ) => {
    const resp: OpenApiResponseObject = { description:'', content: {} };
    const media: OpenApiMediaTypeObject = { schema: {} };
    if (typeof schema === "string") {
      media.schema = { $ref: schema };
    } else if (isClass(schema)) {
      let refName = getOpenApiNameFromClass(schema);
      refName = `Response__${componentName}_${refName}`;
      media.schema = { $ref: this.schemas.getRef(schema, refName) };
    } else if (schema) {
      media.schema = this.schemas.resolve(schema);
    }
    if (mediaObject) Object.assign(media, mediaObject);
    resp.content[mediaType] = media;

    if (responseInfo) {
      const { description, headers, links } = responseInfo;
      if (description) resp.description = description;
      if (headers) resp.headers = Object.assign(resp.headers || {}, headers);
      if (links) resp.links = Object.assign(resp.links || {}, links);
    }

    if (!resp.description || typeof resp.description !== "string") {
      if (typeof media.schema.description === "string") resp.description = media.schema.description;
      else if (isRefObj(media.schema) && typeof media.schema.$ref === "string") {
        const realSchema = this.schemas.get(media.schema.$ref);
        if (realSchema && typeof realSchema.description === "string") resp.description = realSchema.description;
      }
    }

    if (!Array.isArray(statusCode)) statusCode = [statusCode];
    return this.responses.add(componentName, resp, statusCode, true);
  };

  build() {
    const result = Object.assign({}, this.document);
    result.paths = this.paths.getPaths();
    result.components = Object.assign(
      {},
      this.securitySchemes.getComponents(),
      this.schemas.getComponents(),
      this.parameters.getComponents(),
      this.responses.getComponents(this.schemas)
    );
    result.tags = this.tags.getAllTags();
    result.security;
    return result;
  }
}
