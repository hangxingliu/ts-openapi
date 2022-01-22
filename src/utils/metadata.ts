import type { Class } from "../types/base";
import type { OpenApiSchemaObject } from "../types/openapi";
import { MetadataKeys, OpenApiResolvedFlags, OpenApiResolvedFlagsMap } from "../types/reflect-metadata";
import { cloneOpenApiSchema } from "./clone-schema";

export function hasOpenApiResolvedFlags(_Class: Class, flag: OpenApiResolvedFlags) {
  const flags: OpenApiResolvedFlagsMap = Reflect.getMetadata(MetadataKeys.flags, _Class);
  return flags && flags[flag];
}

export function cloneOpenApiResolvedFlags(src: Class, dest: Class, ...additional: OpenApiResolvedFlags[]) {
  const flags: OpenApiResolvedFlagsMap = Reflect.getMetadata(MetadataKeys.flags, src) || {};
  for (let i = 0; i < additional.length; i++)
    flags[additional[i]] = true;
  Reflect.defineMetadata(MetadataKeys.flags, flags, dest);
  return flags;
}

export function getOpenApiNameFromClass(_Class: Class) {
  let className = Reflect.getMetadata(MetadataKeys.componentName, _Class);
  if (!className) className = _Class.name;
  return className;
}

export function getOpenApiSchemasFromClass(_Class: Class, clone = false) {
  type SchemaItem = { propKey?: string; schema: OpenApiSchemaObject };
  const cloneItem = (it: SchemaItem): SchemaItem => ({ propKey: it.propKey, schema: cloneOpenApiSchema(it.schema) });

  const onTheClass: SchemaItem[] = Reflect.getMetadata(MetadataKeys.schema, _Class) || [];
  const onTheProps: SchemaItem[] = Reflect.getMetadata(MetadataKeys.schema, _Class.prototype) || [];
  if (clone) return { wrap: onTheClass.map(cloneItem), fields: onTheProps.map(cloneItem) };
  return { wrap: onTheClass, fields: onTheProps };
}
