import { getOpenApiMetadata } from "./decorator";
import {
  getSchemaFromTypeORMColumn,
  TypeORMColumnMetadataArgs,
  TypeORMEntityTransformer,
  TypeORMMetadataArgsStorage,
} from "./typeorm";
import type {
  Class,
  JSONSchemaObject,
  OpenApiComponentsObject,
  OpenApiHeaderObject,
  OpenApiParameterObject,
  OpenApiSecuritySchemeObject,
  OpenApiResponseObject,
} from "./types";

export class OpenApiSchemasManager {
  private typeORMStorage: TypeORMMetadataArgsStorage;
  private typeORMTransformer: TypeORMEntityTransformer;
  private readonly map = new Map<string, unknown>();

  useTypeORM(storage: TypeORMMetadataArgsStorage, transformer?: TypeORMEntityTransformer) {
    this.typeORMStorage = storage;
    this.typeORMTransformer = transformer;
  }

  getRef(schemaObject: Class, name?: string): string {
    if (typeof name !== "string" || !name) name = schemaObject.name;
    if (!this.map.has(name)) return this.add(schemaObject, name);
    return `#/components/schemas/${name}`;
  }

  add(schemaObject: Class, schemaName?: string): string {
    const { wrap, fields } = getOpenApiMetadata(schemaObject);

    const _columns = this.typeORMStorage?.filterColumns(schemaObject);
    const columns = new Map<string, TypeORMColumnMetadataArgs>();
    if (Array.isArray(_columns)) {
      for (let i = 0; i < _columns.length; i++) {
        const column = _columns[i];
        columns.set(column.propertyName, column);
      }
    }

    const transformer = this.typeORMTransformer;

    if (typeof schemaName !== "string" || !schemaName) schemaName = schemaObject.name;
    const base: JSONSchemaObject = { title: schemaName };
    if (wrap?.length > 0) {
      const { schema } = wrap[0];
      if (schema) Object.assign(base, schema);
    }
    if (!base.type) base.type = "object";
    if (!base.properties) base.properties = {};
    if (!base.required) base.required = [];

    // get ref string from object, save this object into manager if it is not existed!
    if (typeof base.$ref === "function") base.$ref = this.getRef(base.$ref);

    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      let propKey = field.propKey;
      if (!propKey) continue;

      let schema: JSONSchemaObject = field.schema;
      if (typeof schema.$ref === "function") {
        schema.$ref = this.getRef(schema.$ref);
      } else {
        if (schema.type === "array" && typeof schema.items?.$ref === "function")
          schema.items.$ref = this.getRef(schema.items.$ref);
      }

      const column = columns.get(propKey);
      if (column) {
        columns.delete(propKey);
        if (typeof transformer?.column === "function") {
          const r = transformer.column(schemaObject, column, schema);
          if (!r) continue;
          if (r.propertyName) propKey = r.propertyName;
          delete r.propertyName;
          schema = r;
        }
      }

      if (typeof schema.required === "boolean") {
        if (schema.required === true) (base.required as any[]).push(propKey);
        delete schema.required;
      }
      base.properties[propKey] = schema;
    }

    columns.forEach((column) => {
      let schema = getSchemaFromTypeORMColumn(column);
      if (typeof transformer?.column === "function") schema = transformer.column(schemaObject, column, schema);
      if (!schema) return;

      const propKey = schema.propertyName;
      delete schema.propertyName;
      if (!propKey) return;
      if (typeof schema.required === "boolean") {
        if (schema.required === true) (base.required as any[]).push(propKey);
        delete schema.required;
      }
      base.properties[propKey] = schema;
    });

    if (Array.isArray(base.required) && base.required.length <= 0) delete base.required;
    this.map.set(schemaName, base);
    return `#/components/schemas/${schemaName}`;
  }

  getComponents(): Partial<OpenApiComponentsObject> {
    const items = Array.from(this.map.entries()).sort((a, b) => {
      return a[0] > b[0] ? 1 : -1;
    });
    const schemas = {} as { [x: string]: unknown };
    for (let i = 0; i < items.length; i++) {
      const [key, value] = items[i];
      schemas[key] = value;
    }
    return { schemas };
  }
}

/**
 * Parameters
 */
export class OpenApiParametersManager {
  private readonly map = new Map<string, OpenApiParameterObject>();
  private readonly group = new Map<string, string[]>();

  get(name: string): OpenApiParameterObject[] {
    if (this.group.has(name)) {
      const names = this.group.get(name);
      return names.map((it) => this.map.get(it));
    }
    if (this.map.has(name)) return [this.map.get(name)];
    return [];
  }
  getRef(name: string): string[] {
    if (this.group.has(name)) {
      const names = this.group.get(name);
      return names.map((it) => `#/components/parameters/${it}`);
    }
    if (this.map.has(name)) return [`#/components/parameters/${name}`];
    return [];
  }
  add(name: string, parameter: OpenApiParameterObject, replace = false): string {
    if (this.map.has(name)) {
      if (this.group.has(name)) throw new Error(`can't add parameter "${name}", because it is existed names group`);
      if (!replace) return;
    }
    if (!parameter.schema && !parameter.content) parameter.schema = {};
    this.map.set(name, parameter);
    return `#/components/parameters/${name}`;
  }
  addGroup(groupName: string, names: string[]) {
    for (let i = 0; i < names.length; i++) {
      if (!this.map.has(names[i])) throw new Error(`Invalid parameter "${names[i]}" for group "${groupName}"`);
    }
    this.group.set(groupName, names);
  }
  getComponents(): Partial<OpenApiComponentsObject> {
    const items = Array.from(this.map.entries()).sort((a, b) => {
      return a[0] > b[0] ? 1 : -1;
    });
    const parameters = {} as { [x: string]: OpenApiParameterObject };
    for (let i = 0; i < items.length; i++) {
      const [key, value] = items[i];
      parameters[key] = value;
    }
    return { parameters };
  }
}

/**
 * Headers
 */
export class OpenApiHeadersManager {
  private readonly map = new Map<string, OpenApiHeaderObject>();
  private readonly group = new Map<string, string[]>();

  get(name: string): OpenApiHeaderObject[] {
    if (this.group.has(name)) {
      const names = this.group.get(name);
      return names.map((it) => this.map.get(it));
    }
    if (this.map.has(name)) return [this.map.get(name)];
    return [];
  }
  getRef(name: string): string[] {
    if (this.group.has(name)) {
      const names = this.group.get(name);
      return names.map((it) => `#/components/headers/${it}`);
    }
    if (this.map.has(name)) return [`#/components/headers/${name}`];
    return [];
  }
  add(name: string, header: OpenApiHeaderObject, replace = false): string {
    if (this.map.has(name)) {
      if (this.group.has(name)) throw new Error(`can't add header "${name}", because it is existed names group`);
      if (!replace) return;
    }
    this.map.set(name, header);
    return `#/components/headers/${name}`;
  }
  addGroup(groupName: string, names: string[]) {
    for (let i = 0; i < names.length; i++) {
      if (!this.map.has(names[i])) throw new Error(`Invalid header "${names[i]}" for group "${groupName}"`);
    }
    this.group.set(groupName, names);
  }
  getComponents(): Partial<OpenApiComponentsObject> {
    const items = Array.from(this.map.entries()).sort((a, b) => {
      return a[0] > b[0] ? 1 : -1;
    });
    const headers = {} as { [x: string]: OpenApiHeaderObject };
    for (let i = 0; i < items.length; i++) {
      const [key, value] = items[i];
      headers[key] = value;
    }
    return { headers };
  }
}

/**
 * Responses
 */
export class OpenApiResponsesManager {
  private readonly map = new Map<string, OpenApiResponseObject>();
  private readonly statusCode = new Map<string, string[]>();

  get(name: string): { resp: OpenApiResponseObject; status: string[] } {
    if (this.map.has(name)) return { resp: this.map.get(name), status: this.statusCode.get(name) };
  }
  getRef(name: string): string {
    if (this.map.has(name)) return `#/components/responses/${name}`;
  }

  add(name: string, resp: OpenApiResponseObject, statusCodes: string[], replace = false): string {
    if (this.map.has(name)) {
      if (!replace) return;
    }
    this.map.set(name, resp);
    this.statusCode.set(name, statusCodes);
    return `#/components/responses/${name}`;
  }
  getComponents(): Partial<OpenApiComponentsObject> {
    const items = Array.from(this.map.entries()).sort((a, b) => {
      return a[0] > b[0] ? 1 : -1;
    });
    const responses = {} as { [x: string]: OpenApiResponseObject };
    for (let i = 0; i < items.length; i++) {
      const [key, value] = items[i];
      responses[key] = value;
    }
    return { responses };
  }
}

/**
 * Security Schemes
 */
export class OpenApiSecuritySchemesManager {
  private readonly map = new Map<string, OpenApiSecuritySchemeObject>();

  add(name: string, scheme: OpenApiSecuritySchemeObject) {
    if (this.map.has(name)) return;
    this.map.set(name, scheme);
  }
  getComponents(): Partial<OpenApiComponentsObject> {
    const items = Array.from(this.map.entries()).sort((a, b) => {
      return a[0] > b[0] ? 1 : -1;
    });
    const securitySchemes = {} as { [x: string]: OpenApiSecuritySchemeObject };
    for (let i = 0; i < items.length; i++) {
      const [key, value] = items[i];
      securitySchemes[key] = value;
    }
    return { securitySchemes };
  }
}
