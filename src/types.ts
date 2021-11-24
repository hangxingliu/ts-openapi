export type Class = { name: string; new (): any };

export type JSONSchemaType = "string" | "number" | "integer" | "object" | "array" | "boolean" | "null";
export type JSONSchemaFormat =
  | "date-time"
  | "date"
  | "time"
  | "duration"
  | "email"
  | "idn-email"
  | "hostname"
  | "idn-hostname"
  | "ipv4"
  | "ipv6"
  | "uuid"
  | "uri"
  | "uri-reference"
  | "iri"
  | "iri-reference";

export type JSONSchemaObject = {
  allOf?: JSONSchemaObject[];
  anyOf?: JSONSchemaObject[];
  oneOf?: JSONSchemaObject[];

  title?: string;
  type?: JSONSchemaType | Class | symbol;
  properties?: { [x: string]: JSONSchemaObject };
  format?: JSONSchemaFormat;
  required?: boolean | string[];
  description?: string;
  items?: JSONSchemaObject;

  $ref?: string | Class;

  enum?: any[];

  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;

  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: number;
  minimum?: number;
  exclusiveMinimum?: number;

  pattern?: string;
  uniqueItems?: boolean;

  maxProperties?: number;
  minProperties?: number;
  additionalProperties?: number;

  default?: any;
};

export type OpenApiSchemaObject = JSONSchemaObject & {
  example?: any;
  externalDocs?: OpenApiExternalDocumentObject;
  deprecated?: boolean;
  nullable?: boolean;
}

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

export type OpenApiMediaTypesMap = { [mediaType: string]: OpenApiMediaTypeObject };
export type OpenApiMediaTypeObject = {
  schema?: OpenApiSchemaObject;
  example?: any;
  examples?: OpenApiExamplesMap;
  encoding?: any;
}

export type OpenApiOperationObject = {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: OpenApiExternalDocumentObject;
  operationId?: string;
  parameters?: OpenApiParameterObject[];
  requestBody?: OpenApiRequestBodyObject;
  responses?: { default?: OpenApiResponseObject, [statusCode: string]: OpenApiResponseObject };
  callbacks?: { [x: string]: any };
  deprecated?: boolean;
  security?: OpenApiSecurityRequirementObject[];
  servers?: OpenApiServerObject[];
};

export type OpenApiSecurityRequirementObject = {
  [name: string]: string[];
}

export type OpenApiRequestBodyObject = {
  description: string;
  content: OpenApiMediaTypesMap;
  required?: boolean;
}

export type OpenApiResponseObject = {
  description: string;
  headers?: OpenApiHeadersMap;
  content?: OpenApiMediaTypesMap;
  links?: any;
}

export type OpenApiParameterIn = 'query' | 'header' | 'path' | 'cookie';
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
  exmaple?: any;
  exmaples?: OpenApiExamplesMap
};

export type OpenApiHeadersMap = { [x: string]: OpenApiHeaderObject };
export type OpenApiHeaderObject = Omit<OpenApiParameterObject, 'name' | 'in'>;


export type OpenApiExamplesMap = { [x: string]: OpenApiExampleObject };
export type OpenApiExampleObject = {
  value: any;
  summary?: string;
  description?: string;
  externalValue?: string;
}

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
  paths?: any;
  components?: any;
  security?: any[];
  tags: OpenApiTagObject[];
  externalDocs?: OpenApiExternalDocumentObject;
};
