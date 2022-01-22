import type { Class } from "./types/base";
import type { JSONSchemaObject } from "./types/json-schema";
import { cloneOpenApiResolvedFlags, hasOpenApiResolvedFlags } from "./utils/metadata";
import { resolveOpenApiSchema } from "./utils/resolve-schema";
import { MetadataKeys, OpenApiResolvedFlags } from "./types/reflect-metadata";
import { getSchemaFromClassMetadata } from "./utils/class-metadata-to-schema";

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
  if (hasOpenApiResolvedFlags(GenericClass, OpenApiResolvedFlags.Genrics)) return GenericClass;

  const result = getSchemaFromClassMetadata(GenericClass);
  const schema = result.schema;

  let finalName = opts && opts.name;
  if (typeof finalName === "function") finalName = finalName(GenericClass, Types);
  if (!finalName) finalName = result.name + "__" + Types.map((it) => it.name).join("_");

  let unresolved = opts && opts.unresolved;
  if (!unresolved) unresolved = {}; // {} means any type

  const C = class NewClass {};
  Object.defineProperty(C, "name", { value: finalName });
  cloneOpenApiResolvedFlags(GenericClass, C, OpenApiResolvedFlags.Genrics);

  const final = { schema: resolveOpenApiSchema(schema, resolver) };
  Reflect.defineMetadata(MetadataKeys.schema, [final], C);
  return C;

  function resolver(ref: unknown) {
    if (typeof ref !== "symbol") return ref;
    const index = typeIndexMap.get(ref);
    if (index >= 0) {
      const T = Types[index];
      if (T) return T;
      return null;
    } else {
      return ref;
    }
  }
}
