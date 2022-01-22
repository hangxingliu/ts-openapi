import type { OpenApiSchemaObject, OpenApiSchemaInput } from "../types/openapi";
import { jsonSchemaTypeSet } from "../types/json-schema";

import { isPlainObject } from "is-plain-object";
import { isClass } from "is-class";

export function parseOpenApiSchemaInput(schema?: OpenApiSchemaInput): OpenApiSchemaObject {
  if (Array.isArray(schema)) {
    if (schema.length > 0) return { type: "array", items: parseOpenApiSchemaInput(schema[0]) };
    return { type: "array" };
  }

  const result: OpenApiSchemaObject = {};

  if (typeof schema === "string") {
    if (jsonSchemaTypeSet.has(schema as any)) {
      result.type = schema as any;
    } else {
      result.$ref = schema;
    }
    return result;
  }
  if (typeof schema === "symbol") {
    result.$ref = schema;
    return result;
  }

  if (isPlainObject(schema)) return schema as OpenApiSchemaObject;

  if (schema === String) {
    result.type = "string";
    return result;
  }
  if (schema === Number) {
    result.type = "number";
    return result;
  }
  if (schema === Date) {
    result.type = "string";
    result.format = "date-time";
    return result;
  }

  if (isClass(schema)) result.$ref = schema;

  return result;
}
