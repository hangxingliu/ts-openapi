import type { OpenApiRef, OpenApiParameterObject, OpenApiParameterIn, OpenApiHeaderObject, OpenApiHeadersMap } from "./types";

export function isRefObj(obj: unknown): obj is OpenApiRef {
  return obj && typeof obj["$ref"] === "string";
}

export function findOpenApiRefIndex(list: Array<unknown>, ref: string): number {
  for (let i = 0; i < list.length; i++) {
    const it = list[i];
    if (isRefObj(it) && it.$ref === ref) return i;
  }
  return -1;
}

export function findOpenApiParamIndex(
  list: Array<OpenApiParameterObject | OpenApiRef>,
  name: string,
  paramIn?: OpenApiParameterIn
) {
  for (let i = 0; i < list.length; i++) {
    const it = list[i];
    if (isRefObj(it)) continue;
    if (it.name !== name) continue;
    if (paramIn && it.in !== paramIn) continue;
    return i;
  }
  return -1;
}

export function resolveOpenApiHeader(header: OpenApiHeaderObject): OpenApiHeaderObject {
  if (!header) return { schema: {} };

  const result: OpenApiHeaderObject = header.schema || header.content ? {} : { schema: {} };
  Object.assign(result, header);
  return result;
}
export function resolveOpenApiHeadersMap(headers: OpenApiHeadersMap): OpenApiHeadersMap {
  if (!headers) return {};
  const keys = Object.keys(headers);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    headers[key] = resolveOpenApiHeader(headers[key]);
  }
  return headers;
}
