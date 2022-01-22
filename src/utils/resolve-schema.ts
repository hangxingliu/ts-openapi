import type { OpenApiSchemaObject } from "../types/openapi";
import { iterateObject } from "./base";

export function resolveOpenApiSchema(schema: OpenApiSchemaObject, refResolver: (ref: unknown) => unknown) {
  if (typeof schema !== "object" || schema === null) return schema;
  if (schema.$ref !== null && schema.$ref !== undefined) {
    const unknownRef = schema.$ref;
    if (typeof unknownRef !== "string") {
      const ref = refResolver(unknownRef);
      if (ref !== null && ref !== undefined && ref !== false) {
        schema.$ref = ref;
      } else {
        delete schema.$ref;
      }
    }
  }

  let requiredProps = new Set<string>();
  if (Array.isArray(schema.required)) {
    schema.required.forEach((propKey) => {
      if (typeof propKey === "string") requiredProps.add(propKey);
    });
  }
  iterateObject(schema.properties, (key, property) => {
    if (property && property.required === true) requiredProps.add(key);
    resolveOpenApiSchema(property, refResolver);
  });
  iterateObject(schema.patternProperties, (key, property) => {
    resolveOpenApiSchema(property, refResolver);
  });

  handleObject(schema.items);
  handleObject(schema.contains);
  handleArray(schema.prefixItems);
  handleArray(schema.allOf);
  handleArray(schema.anyOf);
  handleArray(schema.oneOf);
  handleObject(schema.not);

  if (requiredProps.size > 0) schema.required = Array.from(requiredProps);
  else delete schema.required;
  return schema;

  function handleObject(v: unknown) {
    if (!v || typeof v !== "object") return;
    return resolveOpenApiSchema(v, refResolver);
  }
  function handleArray(v: unknown[]) {
    if (!Array.isArray(v)) return v;
    return v.forEach((it) => resolveOpenApiSchema(it, refResolver));
  }
}
