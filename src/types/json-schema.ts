/**
 * @see https://json-schema.org/understanding-json-schema/reference/type.html
 */
export type JSONSchemaType = "string" | "number" | "integer" | "object" | "array" | "boolean" | "null";
export const jsonSchemaTypeSet = new Set<JSONSchemaType>([
  "array",
  "boolean",
  "integer",
  "null",
  "number",
  "object",
  "string",
]);

/**
 * @see https://json-schema.org/understanding-json-schema/reference/string.html
 */
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
  /**
   * Declaring a unique identifier
   */
  $id?: string;
  /**
   * Declaring a JSON Schema
   */
  $schema?: string;
  /**
   * Referencing another schema,
   * The basic value of this field is `string`,
   * but it can be other types if there is an resolver can resolve it.
   * @see https://json-schema.org/understanding-json-schema/structuring.html#ref
   */
  $ref?: unknown;

  title?: string;
  description?: string;
  type?: JSONSchemaType | JSONSchemaType[];
  enum?: any[];
  const?: any;
  default?: any;

  //
  //#region string
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: JSONSchemaFormat;
  //#endregion string

  //
  //#region number
  multipleOf?: number;
  maximum?: number;
  minimum?: number;
  exclusiveMaximum?: number | boolean;
  exclusiveMinimum?: number | boolean;
  //#endregion number

  //
  //#region object
  properties?: { [x: string]: JSONSchemaObject };
  patternProperties?: { [x: string]: JSONSchemaObject };
  additionalProperties?: boolean | JSONSchemaObject;
  minItems?: number;
  maxItems?: number;
  propertyNames?: { pattern: string };
  /**
   * Follow the specification of JSON schema,
   * the type of this field can be only string array.
   * **But it is defined boolean also here**,
   * because the parser can tell parent schema that this property is required.
   */
  required?: boolean | string[];
  //#endregion object

  //
  //#region array
  items?: boolean | JSONSchemaObject;
  /**
   * Tuple validation
   */
  prefixItems?: JSONSchemaObject[];
  contains?: JSONSchemaObject;
  minContains?: number;
  maxContains?: number;
  minProperties?: number;
  maxProperties?: number;
  uniqueItems?: boolean;
  //#endregion array

  //
  //#region composition
  /** AND */
  allOf?: JSONSchemaObject[];
  /** OR */
  anyOf?: JSONSchemaObject[];
  /** XOR */
  oneOf?: JSONSchemaObject[];
  not?: JSONSchemaObject;
  //#endregion composition
};
