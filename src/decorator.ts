import type { Class, JSONSchemaObject, JSONSchemaType } from "./types";

export const OpenApiSchemaMetaKey = Symbol("OpenApiSchemaSymbol");

function getDecorator(schema: unknown) {
  const decorator: MethodDecorator = (instance, propKey) => {
    let types: unknown[] = Reflect.getOwnMetadata(OpenApiSchemaMetaKey, instance);
    if (!types) types = [];
    types.push({
      propKey,
      schema,
    });
    Reflect.defineMetadata(OpenApiSchemaMetaKey, types, instance);
  };
  return decorator;
}

/**
 * Decorator
 */
export function OpenApiObject(ref: string | Class, schema?: Partial<JSONSchemaObject>) {
  schema = { ...(schema || {}), type: "object", $ref: ref };
  return getDecorator(schema);
}

/**
 * Decorator
 */
export function OpenApiArray(
  itemRef: string | Class,
  schema?: Partial<JSONSchemaObject>,
  itemSchema?: Partial<JSONSchemaObject>
) {
  const mergedItemSchema: JSONSchemaObject = {};
  if (schema) {
    if (schema.items) Object.assign(mergedItemSchema, schema.items);
    if (itemSchema) Object.assign(mergedItemSchema, itemSchema);
    mergedItemSchema.$ref = itemRef;
  }
  schema = { ...(schema || {}), type: "array", items: mergedItemSchema };
  return getDecorator(schema);
}

/**
 * Decorator
 */
export function OpenApiSchema(type: JSONSchemaType, schema?: JSONSchemaObject): any {
  schema = { type, ...(schema || {}) }
  return getDecorator(schema);
}

export function getOpenApiSchemas(Class: { new (): any }) {
  return {
    wrap: (Reflect.getMetadata(OpenApiSchemaMetaKey, Class) || []) as any[],
    fields: (Reflect.getMetadata(OpenApiSchemaMetaKey, new Class()) || []) as any[],
  };
}
