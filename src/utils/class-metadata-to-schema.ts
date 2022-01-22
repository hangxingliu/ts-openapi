import { OpenApiSchemaObject } from "..";
import { Class } from "../types/base";
import { isRefObj } from "./base";
import { cloneOpenApiSchema } from "./clone-schema";
import { getOpenApiNameFromClass, getOpenApiSchemasFromClass } from "./metadata";

type Result = {
  name: string;
  schema: OpenApiSchemaObject;
};

/**
 * @returns a name string and a cloned schema that merged from metadatas
 */
export function getSchemaFromClassMetadata(_Class: Class) {
  const result: Result = { name: getOpenApiNameFromClass(_Class), schema: {} };
  const { wrap, fields } = getOpenApiSchemasFromClass(_Class);
  if (wrap.length > 0) result.schema = cloneOpenApiSchema(wrap[0].schema);

  const schemaRoot = result.schema;
  const required = new Set<string>();
  if (!schemaRoot.properties) schemaRoot.properties = {};
  if (Array.isArray(schemaRoot.required)) schemaRoot.required.forEach((it) => required.add(it));

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    let propKey = field.propKey;
    if (!propKey) continue;

    const schema = field.schema;
    if (typeof schema.required === "boolean") {
      if (schema.required === true) required.add(propKey);
      delete schema.required;
    }
    schemaRoot.properties[propKey] = schema;
  }

  if (!isRefObj(schemaRoot)) schemaRoot.required = Array.from(required);
  return result;
}
