import type { OpenApiHeaderObject, OpenApiHeadersMap, OpenApiParameterIn, OpenApiParameterObject, OpenApiRef } from "../types/openapi";

export function iterateObject<T extends any>(
  obj: { [x: string | number]: T },
  callback: (key: string, value: T) => any
) {
  if (!obj || Object.prototype.toString.call(obj) !== "[object Object]") return;
  Object.keys(obj).forEach(key => callback(key, obj[key]));
}

export function isRefObj(obj: unknown): obj is OpenApiRef {
  if (!obj) return false;
  const ref = obj['$ref'];
  if (ref !== null && ref !== undefined && ref !== false) return true;
  return false;
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

