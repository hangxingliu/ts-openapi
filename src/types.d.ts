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
  title?: string;
  type?: JSONSchemaType | Class;
  properties?: { [x: string]: JSONSchemaType }
  format?: JSONSchemaFormat;
  required?: boolean | string[];
  description?: string;
  items?: JSONSchemaObject;
  $ref?: string | Class;
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
  paths?: any;
  components?: any;
  security?: any[];
  tags: OpenApiTagObject[];
  externalDocs?: OpenApiExternalDocumentObject;
};
