import "reflect-metadata";
import type { OpenApiSchemaInput, OpenApiSchemaObject } from "./types/openapi";
import { MetadataKeys } from "./types/reflect-metadata";
import { parseOpenApiSchemaInput } from "./utils/parse-schema-input";

function getSchemaDecorator(schema: unknown) {
  const decorator: MethodDecorator = (instance, propKey) => {
    let types: unknown[] = Reflect.getOwnMetadata(MetadataKeys.schema, instance);
    if (!types) types = [];
    types.push({
      propKey,
      schema,
    });
    Reflect.defineMetadata(MetadataKeys.schema, types, instance);
  };
  return decorator as any;
}

export function OpenApiName(componentName: string) {
  return Reflect.metadata(MetadataKeys.componentName, componentName);
}

export const OpenApiProperty = OpenApiSchema;
/** @alias OpenApiProperty */
export function OpenApiSchema(schema?: OpenApiSchemaInput): any {
  return getSchemaDecorator(parseOpenApiSchemaInput(schema));
}


export function OpenApiUUID(schema?: OpenApiSchemaObject) {
  schema = { type: "string", format: 'uuid', ...(schema || {}) };
  return getSchemaDecorator(schema);
}

export const OpenApiFile = OpenApiBinary;
/** @alias OpenApiFile */
export function OpenApiBinary(schema?: OpenApiSchemaObject) {
  schema = { type: "string", format: 'binary', ...(schema || {}) };
  return getSchemaDecorator(schema);
}

export function OpenApiBoolean(schema?: OpenApiSchemaObject) {
  schema = { type: "boolean", ...(schema || {}) };
  return getSchemaDecorator(schema);
}

export function OpenApiString(schema?: OpenApiSchemaObject) {
  schema = { type: "string", ...(schema || {}) };
  return getSchemaDecorator(schema);
}

export function OpenApiInt(schema?: OpenApiSchemaObject) {
  schema = { type: "integer", ...(schema || {}) };
  return getSchemaDecorator(schema);
}

export function OpenApiNumber(schema?: OpenApiSchemaObject) {
  schema = { type: "number", ...(schema || {}) };
  return getSchemaDecorator(schema);
}

export function OpenApiObject(schema1?: OpenApiSchemaInput, schema2?: OpenApiSchemaObject) {
  const finalSchema = parseOpenApiSchemaInput(schema1);
  if (!finalSchema.type) finalSchema.type = "object";
  if (schema2) Object.assign(finalSchema, schema2);
  return getSchemaDecorator(finalSchema);
}

export function OpenApiArray(item?: OpenApiSchemaInput, schema?: OpenApiSchemaObject) {
  const finalSchema = { type: "array", items: parseOpenApiSchemaInput(item) };
  if (schema) Object.assign(finalSchema, schema);
  return getSchemaDecorator(finalSchema);
}
