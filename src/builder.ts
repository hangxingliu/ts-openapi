import {
  OpenApiParametersManager,
  OpenApiResponsesManager,
  OpenApiSchemasManager,
  OpenApiSecuritySchemesManager,
} from "./components";
import { EditFuncInOpenApiPathsEditor, OpenApiPathsEditor, _OpenApiPathEditor } from "./paths";
import { OpenApiTagsManager } from "./tags";
import { resolveOpenApiHeadersMap } from "./utils/base";
import { createOpenApiBaseDocument } from "./base-document";
import { Class, PackageInfoForOpenAPI } from "./types/base";
import { OpenApiDocument, OpenApiHeadersMap, OpenApiResponseObject } from "./types/openapi";

const jsonMediaType = "application/json";

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
    editor.bindManagers({
      // managers
      schemas: this.schemas,
      parameters: this.parameters,
      responses: this.responses,
    });
    return editor;
  };

  addJsonResponse(
    name: string,
    status: string | Array<string>,
    schemaObject: Class,
    opts?: { headers?: OpenApiHeadersMap; description?: string }
  ) {
    if (!Array.isArray(status)) status = [status];

    const schemaName = `JsonResponse__${status.join("_")}__${schemaObject.name}`;
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
