import type { Class } from "./base";
import type { JSONSchemaObject } from "./json-schema";

export type OpenApiRef = { $ref: unknown };

export type OpenApiSchemaInput = string | symbol | Class | OpenApiSchemaObject | [string] | [symbol] | [Class] | [OpenApiSchemaObject];

export type OpenApiSchemaObject = JSONSchemaObject & {
  example?: any;
  externalDocs?: OpenApiExternalDocumentObject;
  deprecated?: boolean;
  nullable?: boolean;
};

export type OpenApiPathsObject = { [path: string]: OpenApiPathItemObject };
export type OpenApiPathItemObject = {
  $ref?: string;
  summary?: string;
  description?: string;

  get?: OpenApiOperationObject;
  put?: OpenApiOperationObject;
  post?: OpenApiOperationObject;
  delete?: OpenApiOperationObject;
  options?: OpenApiOperationObject;
  head?: OpenApiOperationObject;
  patch?: OpenApiOperationObject;
  trace?: OpenApiOperationObject;

  servers?: OpenApiServerObject[];
  parameters?: OpenApiParameterObject[];
};

export type OpenApiMediaTypesMap = { [mediaType: string]: OpenApiMediaTypeObject | OpenApiRef };
export type OpenApiMediaTypeObject = {
  schema?: OpenApiSchemaObject;
  example?: any;
  examples?: OpenApiExamplesMap;
  encoding?: any;
};

export type OpenApiOperationObject = {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: OpenApiExternalDocumentObject;
  operationId?: string;
  parameters?: Array<OpenApiParameterObject | OpenApiRef>;
  requestBody?: OpenApiRequestBodyObject;
  responses?: {
    default?: OpenApiResponseObject | OpenApiRef;
    [statusCode: string]: OpenApiResponseObject | OpenApiRef;
  };
  callbacks?: { [x: string]: any };
  deprecated?: boolean;
  security?: OpenApiSecurityRequirementObject[];
  servers?: OpenApiServerObject[];
};

export type OpenApiSecurityRequirementObject = {
  [name: string]: string[];
};

export type OpenApiRequestBodyObject = {
  description: string;
  content: OpenApiMediaTypesMap;
  required?: boolean;
};

export type OpenApiResponseObject = {
  description: string;
  headers?: OpenApiHeadersMap;
  content?: OpenApiMediaTypesMap;
  links?: any;
};

export type OpenApiParameterIn = "query" | "header" | "path" | "cookie";
export type OpenApiParameterObject = {
  name: string;
  in: OpenApiParameterIn;

  /** schema.type */
  schemaType?: string;
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;

  schema?: OpenApiSchemaObject;
  content?: OpenApiMediaTypesMap;
  example?: any;
  examples?: OpenApiExamplesMap;
};

export type OpenApiHeadersMap = { [x: string]: OpenApiHeaderObject };
export type OpenApiHeaderObject = Omit<OpenApiParameterObject, "name" | "in">;

export type OpenApiExamplesMap = { [x: string]: OpenApiExampleObject };
export type OpenApiExampleObject = {
  value: any;
  summary?: string;
  description?: string;
  externalValue?: string;
};

export type OpenApiSecuritySchemeType = "apiKey" | "http" | "oauth2" | "openIdConnect";
export type OpenApiSecuritySchemeIn = "query" | "header" | "cookie";
export type OpenApiSecuritySchemeObject = {
  type: OpenApiSecuritySchemeType;
  name: string;
  in: OpenApiSecuritySchemeIn;
  description?: string;
  scheme?: string;
  bearerFormat?: string;
  flows?: {
    implicit: OpenApiOAuthFlowObject;
    password: OpenApiOAuthFlowObject;
    clientCredentials: OpenApiOAuthFlowObject;
    authorizationCode: OpenApiOAuthFlowObject;
  };
  openIdConnectUrl?: string;
};
export type OpenApiOAuthFlowObject = {
  authorizationUrl: string;
  tokenUrl: string;
  refreshUrl?: string;
  scopes: { [x: string]: string };
};

export type OpenApiComponentsObject = {
  schemas?: { [name: string]: OpenApiSchemaObject };
  responses?: { [name: string]: any };
  parameters?: { [name: string]: OpenApiParameterObject };
  examples?: { [name: string]: any };
  requestBodies?: { [name: string]: any };
  headers?: { [name: string]: OpenApiHeaderObject };
  securitySchemes?: { [name: string]: OpenApiSecuritySchemeObject };
  links?: { [name: string]: any };
  callbacks?: { [name: string]: any };
};

export type OpenApiComponentType =
  | "schemas"
  | "responses"
  | "parameters"
  | "examples"
  | "requestBodies"
  | "headers"
  | "securitySchemes"
  | "links"
  | "callbacks";

export type OpenApiServerVariableObject = {
  default: string;
  enum?: string[];
  description?: string;
};

export type OpenApiServerObject = {
  url: string;
  description?: string;
  variables: { [x: string]: OpenApiServerVariableObject };
};

export type OpenApiExternalDocumentObject = {
  url: string;
  description?: string;
};

export type OpenApiTagObject = {
  name: string;
  description?: string;
  externalDocs?: OpenApiExternalDocumentObject;
};

export type OpenApiContactObject = {
  name?: string;
  url?: string;
  email?: string;
};

export type OpenApiLicenseObject = {
  name?: string;
  url?: string;
};

export type OpenApiInfoObject = {
  title: string;
  version: string;
  description?: string;
  termsOfService?: string;
  contact?: OpenApiContactObject;
  license?: OpenApiLicenseObject;
};

export type OpenApiDocument = {
  openapi: string;
  info: OpenApiInfoObject;
  servers?: OpenApiServerObject[];
  paths?: OpenApiPathsObject;
  components?: OpenApiComponentsObject;
  security?: { [name: string]: string[] }[];
  tags: OpenApiTagObject[];
  externalDocs?: OpenApiExternalDocumentObject;
};
