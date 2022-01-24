import type { OpenApiHeaderObject, OpenApiHeadersMap, OpenApiParameterObject, OpenApiSchemaObject } from "../types/openapi";

export function resolveOpenApiHeader(header: OpenApiHeaderObject | OpenApiSchemaObject): OpenApiHeaderObject {
  if (!header) return { schema: {} };
  const result: OpenApiHeaderObject = {};
  if (
    // is OpenApiSchemaObject
    typeof (header as OpenApiSchemaObject).type === "string" &&
    !(header as OpenApiHeaderObject).schema
  ) {
    const schema: OpenApiSchemaObject = Object.assign({}, header);
    result.schema = schema;
    if (typeof schema.description === "string" && schema.description) {
      result.description = schema.description;
      delete schema.description;
    }
    if (typeof schema.required === "boolean") {
      result.required = schema.required;
      delete schema.required;
    }
    if (typeof schema.deprecated === "boolean") {
      result.deprecated = schema.deprecated;
      delete schema.deprecated;
    }
  } else {
    Object.assign(result, header);
  }
  return result;
}

export function resolveOpenApiHeadersMap(headers: {
  [x: string]: OpenApiHeaderObject | OpenApiSchemaObject;
}): OpenApiHeadersMap {
  if (!headers) return {};
  const result: OpenApiHeadersMap = {};
  const keys = Object.keys(headers);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    result[key] = resolveOpenApiHeader(headers[key]);
  }
  return result;
}

export function getOpenApiParameterFromHeader(name: string, header: OpenApiHeaderObject): OpenApiParameterObject {
  return { ...header, name, in: 'header' };
}
