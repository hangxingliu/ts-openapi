import type { OpenApiSchemaObject } from "../types/openapi";

export function cloneOpenApiSchema(schema: OpenApiSchemaObject): OpenApiSchemaObject {
  if (schema && typeof schema === "object") {
    const result = {};
    for (const key in schema) {
      if (Object.hasOwnProperty.call(schema, key) === false) continue;
      if (key === '__proto__') continue;

      const value = schema[key];
      if (Array.isArray(value))
        result[key] = value.map((it) => cloneOpenApiSchema(it));
      else if (value && typeof value === "object")
        result[key] = cloneOpenApiSchema(value);
      else
        result[key] = value;
    }
    return result;
  }
  return schema;
}
