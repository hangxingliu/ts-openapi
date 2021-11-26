import { getOpenApiMetadata, OpenApiSchemaMetaKey } from "./decorator";
import type { Class, JSONSchemaObject } from "./types";

const GenericsT1 = Symbol("GenericsT1");
export const SchemaGenerics = {
  T: GenericsT1,
  T1: GenericsT1,
  T2: Symbol("GenericsT2"),
  T3: Symbol("GenericsT3"),
  T4: Symbol("GenericsT4"),
};

const typeIndexMap = new Map<Symbol, number>([
  [SchemaGenerics.T1, 0],
  [SchemaGenerics.T2, 1],
  [SchemaGenerics.T3, 2],
  [SchemaGenerics.T4, 3],
]);

export type OptionsForResolveGenericClass = {
  name?: string | ((base: Class, classes: Class[]) => string);
  unresolved?: JSONSchemaObject;
};

export function resolveGenericClass(GenericClass: Class, Types: Class[], opts?: OptionsForResolveGenericClass) {
  let finalName = opts && opts.name;
  if (typeof finalName === "function") finalName = finalName(GenericClass, Types);
  if (!finalName) finalName = GenericClass.name + "__" + Types.map((it) => it.name).join("_");

  let unresolved = opts && opts.unresolved;
  if (!unresolved) unresolved = {}; // {} means any type

  const C = class NewClass {};
  Object.defineProperty(C, "name", { value: finalName });

  const { wrap, fields } = getOpenApiMetadata(GenericClass);
  Reflect.defineMetadata(OpenApiSchemaMetaKey, wrap, C);

  const nextFields = [];
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    let schema: JSONSchemaObject = Object.assign({}, field.schema);
    if (typeof schema.type === "symbol") {
      schema = getSchemaByTypeSymbol(schema);
    } else if (schema.type === "array") {
      if (typeof schema.items?.type === "symbol") {
        schema.items = getSchemaByTypeSymbol(schema.items);
      }
    } else if (schema.type === "object") {
      const ps = schema.properties || {};
      const pNames = Object.keys(ps);
      for (let i = 0; i < pNames.length; i++) {
        const pName = pNames[i];
        const p = ps[pName];
        if (p && typeof p.type === "symbol") ps[pName] = getSchemaByTypeSymbol(p);
      }
    }
    nextFields.push({ propKey: field.propKey, schema });
  }
  Reflect.defineMetadata(OpenApiSchemaMetaKey, nextFields, C.prototype);
  return C;

  function getSchemaByTypeSymbol(schema: any) {
    const index = typeIndexMap.get(schema.type);
    if (index >= 0) {
      const T = Types[index];
      if (T) {
        schema.$ref = T;
        delete schema.type;
        return schema;
      }
    }
    const result = Object.assign({}, schema);
    delete schema.type;
    Object.assign(schema, unresolved);
    return result;
  }
}
