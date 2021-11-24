import { OpenApiSchemaObject } from ".";
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
  return decorator as any;
}

/**
 * Decorator
 */
export function OpenApiObject(ref?: string | Class | symbol, schema?: Partial<OpenApiSchemaObject>) {
  schema = { ...(schema || {}), type: "object" };
  if (ref) {
    if (typeof ref === "symbol") schema.type = ref;
    else schema.$ref = ref;
  }
  return getDecorator(schema);
}

/**
 * Decorator
 */
export function OpenApiArray(
  itemRef?: string | Class | symbol,
  schema?: Partial<OpenApiSchemaObject>,
  itemSchema?: Partial<OpenApiSchemaObject>
) {
  const mergedItemSchema: JSONSchemaObject = {};
  if (schema && schema.items) Object.assign(mergedItemSchema, schema.items);
  if (itemSchema) Object.assign(mergedItemSchema, itemSchema);
  if (itemRef) {
    if (typeof itemRef === "symbol") mergedItemSchema.type = itemRef;
    else mergedItemSchema.$ref = itemRef;
  }
  schema = { ...(schema || {}), type: "array", items: mergedItemSchema };
  return getDecorator(schema);
}

/**
 * Decorator
 */
export function OpenApiSchema(type: JSONSchemaType | symbol, schema?: OpenApiSchemaObject): any {
  schema = { type, ...(schema || {}) };
  return getDecorator(schema);
}

export function getOpenApiSchemas(Class: { new (): any }) {
  type Item = { propKey?: string; schema: any };
  return {
    wrap: (Reflect.getMetadata(OpenApiSchemaMetaKey, Class) || []) as Item[],
    fields: (Reflect.getMetadata(OpenApiSchemaMetaKey, new Class()) || []) as Item[],
  };
}
