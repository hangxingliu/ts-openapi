import { Class } from "./types/base";
import { OpenApiSchemaObject } from "./types/openapi";
import { MetadataKeys } from "./types/reflect-metadata";
import { isRefObj } from "./utils/base";
import { getSchemaFromClassMetadata } from "./utils/class-metadata-to-schema";

type AddProperty = OpenApiSchemaObject &
  (
    | {
        /** The name of new property */
        property: string;
      }
    | {
        /** The pattern of new pattern property */
        patternProperty: string;
      }
  );

/**
 * Example of parameter `properties`:
 * - `"-password"`: Remove property `password`
 * - `"email"`/`"+email"`: Add required property `email`
 * - `"?remark"`/`"+?remark"`: Add optional property `remark`
 * - `{property:"age",type:"integer"}`
 */
export function derivedClass(newName: string, BaseClass: Class, ...properties: Array<string | AddProperty>): Class {

  const result = getSchemaFromClassMetadata(BaseClass);
  const finalName = newName || `Derived_${result.name}`;

  const schemaRoot = result.schema;
  if (typeof schemaRoot.properties !== 'object' || !schemaRoot.properties)
    schemaRoot.properties = {};

  const required = new Set<string>();
  if (Array.isArray(schemaRoot.required)) schemaRoot.required.forEach((it) => required.add(it));

  for (let i = 0; i < properties.length; i++) {
    const p = properties[i];
    if (typeof p === 'string') {
      // remove property
      if (p[0] === '-') {
        const pName = p.slice(1);
        delete schemaRoot.properties[pName];
        required.delete(pName);
        continue;
      }
      // add property
      let pName = p;
      let isRequired = true;
      if (pName[0] === '+') { pName = pName.slice(1); }
      if (pName[0] === '?') { pName = pName.slice(1); isRequired = false; }
      if (pName[0] === '+') { pName = pName.slice(1); }
      if (!schemaRoot.properties[pName]) {
        schemaRoot.properties[pName] = {};
      }
      if (isRequired) required.add(pName);
      continue;
    }

    if ('property' in p && p.property) {
      const pName = p.property;
      delete p.property;
      schemaRoot.properties[pName] = p;
      if (p.required === true) required.add(pName);
      else if (p.required === false) required.delete(pName);
      continue;
    }

    if ('patternProperty' in p && p.patternProperty) {
      const pName = p.patternProperty;
      delete p.patternProperty;
      if (!schemaRoot.patternProperties) schemaRoot.patternProperties = {};
      schemaRoot.patternProperties[pName] = p;
      continue;
    }
  }
  if (!isRefObj(schemaRoot)) schemaRoot.required = Array.from(required);

  const C = class NewClass {};
  Object.defineProperty(C, "name", { value: finalName });
  const final = { schema: schemaRoot };
  Reflect.defineMetadata(MetadataKeys.schema, [final], C);
  return C;
}
