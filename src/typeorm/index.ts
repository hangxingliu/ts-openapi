import type { Class } from "../types/base";
import { MetadataKeys, OpenApiResolvedFlags } from "../types/reflect-metadata";
import { isRefObj, iterateObject } from "../utils/base";
import { getSchemaFromClassMetadata } from "../utils/class-metadata-to-schema";
import { cloneOpenApiResolvedFlags, getOpenApiNameFromClass, getOpenApiSchemasFromClass, hasOpenApiResolvedFlags } from "../utils/metadata";
import {
  bigintColumnTypes,
  booleanColumnTypes,
  dateColumnTypes,
  intColumnTypes,
  numberColumnTypes,
  stringColumnTypes,
  TypeORMColumnMetadataArgs,
  TypeORMColumnTransformerResult,
  TypeORMEntityTransformer,
  TypeORMMetadataArgsStorage,
  TypeORMTableMetadataArgs,
} from "./base";

export function getSchemaFromTypeORMColumn(column: TypeORMColumnMetadataArgs) {
  const result: TypeORMColumnTransformerResult = {
    newPropertyName: column.propertyName,
  };
  const columnOptions = column.options || {};
  const type = columnOptions.type;
  if (typeof type === "string") {
    if (bigintColumnTypes.has(type)) {
      result.type = "string";
      result.description = "bigint";
    } else if (intColumnTypes.has(type)) {
      result.type = "integer";
    } else if (numberColumnTypes.has(type)) {
      result.type = "number";
    } else if (stringColumnTypes.has(type)) {
      result.type = "string";
    } else if (booleanColumnTypes.has(type)) {
      result.type = "boolean";
    } else if (dateColumnTypes.has(type)) {
      result.type = "string";
      result.format = "date-time";
    }
  } else {
    if (type === String) {
      result.type = "string";
    } else if (type === Boolean) {
      result.type = "boolean";
    } else if (type === Number) {
      result.type = "number";
    } else if (type === Date) {
      result.type = "string";
      result.format = "date-time";
    }
  }
  if (columnOptions.nullable !== true) result.required = true;
  return result;
}

export type OptionsForResolveTypeORMEntityClass = {
  name?: string | ((base: Class, metadata: TypeORMTableMetadataArgs[]) => string);
  storage: TypeORMMetadataArgsStorage;
  transformer?: TypeORMEntityTransformer;
};

export function resolveTypeORMEntityClass(EntityClass: Class, options: OptionsForResolveTypeORMEntityClass) {
  if (hasOpenApiResolvedFlags(EntityClass, OpenApiResolvedFlags.TypeORM)) return EntityClass;

  const { storage, transformer } = options;
  const result = getSchemaFromClassMetadata(EntityClass);
  const schemaRoot = result.schema;

  const tableMetadata = storage?.filterTables(EntityClass);
  let finalName = options.name;
  if (typeof finalName === "function") finalName = finalName(EntityClass, tableMetadata || []);
  if (!finalName) finalName = "Entity_" + getOpenApiNameFromClass(EntityClass);

  const _columns = storage?.filterColumns(EntityClass);
  const columns = new Map<string, TypeORMColumnMetadataArgs>();
  if (Array.isArray(_columns)) {
    for (let i = 0; i < _columns.length; i++) {
      const column = _columns[i];
      columns.set(column.propertyName, column);
    }
  }

  const required = new Set<string>();
  if (Array.isArray(schemaRoot.required)) schemaRoot.required.forEach((it) => required.add(it));
  if (typeof schemaRoot.properties !== 'object' || !schemaRoot.properties)
    schemaRoot.properties = {};

  const keys = Object.keys(schemaRoot.properties);
  for (let i = 0; i < keys.length; i++) {
    let propKey = keys[i];
    let schema = schemaRoot.properties[propKey];
    const column = columns.get(propKey);
    if (column) {
      columns.delete(propKey);
      if (typeof transformer?.column === "function") {
        const r = transformer.column(EntityClass, column, schema);
        if (!r) continue;
        if (r.newPropertyName) propKey = r.newPropertyName;
        delete r.newPropertyName;
        schema = r;
      }
    }
    if (typeof schema.required === "boolean") {
      if (schema.required === true) required.add(propKey);
      delete schema.required;
    }
    schemaRoot.properties[propKey] = schema;
  }
  columns.forEach((column) => {
    let schema = getSchemaFromTypeORMColumn(column);
    if (typeof transformer?.column === "function") schema = transformer.column(EntityClass, column, schema);
    if (!schema) return;

    const propKey = schema.newPropertyName;
    delete schema.newPropertyName;
    if (!propKey) return;
    if (typeof schema.required === "boolean") {
      if (schema.required === true) required.add(propKey);
      delete schema.required;
    }
    schemaRoot.properties[propKey] = schema;
  });
  if (!isRefObj(schemaRoot)) schemaRoot.required = Array.from(required);

  const C = class NewClass {};
  Object.defineProperty(C, "name", { value: finalName });
  cloneOpenApiResolvedFlags(EntityClass, C, OpenApiResolvedFlags.TypeORM);
  const final = { schema: schemaRoot };
  Reflect.defineMetadata(MetadataKeys.schema, [final], C);
  return C;
}
