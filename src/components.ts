import type { TypeORMEntityTransformer, TypeORMMetadataArgsStorage } from "./typeorm/base";
import type { Class } from "./types/base";
import type {
  OpenApiComponentsObject,
  OpenApiHeaderObject,
  OpenApiParameterObject,
  OpenApiSecuritySchemeObject,
  OpenApiResponseObject,
  OpenApiSchemaObject,
  OpenApiHTTPStatusCode,
} from "./types/openapi";
import { resolveTypeORMEntityClass } from "./typeorm";
import { OpenApiResolvedFlags } from "./types/reflect-metadata";
import { getSchemaFromClassMetadata } from "./utils/class-metadata-to-schema";
import { getOpenApiNameFromClass, hasOpenApiResolvedFlags } from "./utils/metadata";
import { resolveOpenApiSchema } from "./utils/resolve-schema";
import { isClass } from "is-class";

export class OpenApiSchemasManager {
  private typeORMStorage: TypeORMMetadataArgsStorage;
  private typeORMTransformer: TypeORMEntityTransformer;
  private readonly map = new Map<string, OpenApiSchemaObject>();

  useTypeORM(storage: TypeORMMetadataArgsStorage, transformer?: TypeORMEntityTransformer) {
    this.typeORMStorage = storage;
    this.typeORMTransformer = transformer;
  }

  getRef(schemaObject: Class, name?: string): string {
    if (typeof name !== "string" || !name) name = getOpenApiNameFromClass(schemaObject);
    if (!this.map.has(name)) return this.add(schemaObject, name);
    return `#/components/schemas/${name}`;
  }
  get($ref: string): OpenApiSchemaObject {
    const prefix = '#/components/schemas/';
    if (!$ref.startsWith(prefix)) return null;
    return this.map.get($ref.slice(prefix.length));
  }
  resolve(schema: OpenApiSchemaObject) {
    resolveOpenApiSchema(schema, (ref) => {
      if (isClass(ref)) return this.getRef(ref);
      return null;
    });
    return schema;
  }

  add(schemaObject: Class, schemaName?: string): string {
    const originalName = getOpenApiNameFromClass(schemaObject);

    if (this.typeORMStorage && !hasOpenApiResolvedFlags(schemaObject, OpenApiResolvedFlags.TypeORM)) {
      schemaObject = resolveTypeORMEntityClass(schemaObject, {
        storage: this.typeORMStorage,
        transformer: this.typeORMTransformer,
        name: schemaName,
      });
    }
    const result = getSchemaFromClassMetadata(schemaObject);
    if (typeof schemaName !== "string" || !schemaName) schemaName = result.name;

    const schema: OpenApiSchemaObject = {
      title: originalName,
      type: "object",
    };
    Object.assign(schema, result.schema);
    this.map.set(schemaName, schema);

    this.resolve(schema);
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
  getComponents(schemasManager?: OpenApiSchemasManager): Partial<OpenApiComponentsObject> {
    const items = Array.from(this.map.entries()).sort((a, b) => {
      return a[0] > b[0] ? 1 : -1;
    });
    const parameters = {} as { [x: string]: OpenApiParameterObject };
    for (let i = 0; i < items.length; i++) {
      const [key, value] = items[i];
      if (schemasManager) {
        resolveOpenApiSchema(value, (ref) => {
          if (isClass(ref)) return schemasManager.getRef(ref);
          return null;
        });
      }
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

  add(name: string, resp: OpenApiResponseObject, statusCodes: OpenApiHTTPStatusCode[], replace = false): string {
    if (this.map.has(name)) {
      if (!replace) return;
    }
    this.map.set(name, resp);
    this.statusCode.set(name, statusCodes.map(it => String(it)));
    return `#/components/responses/${name}`;
  }

  getComponents(schemasManager?: OpenApiSchemasManager): Partial<OpenApiComponentsObject> {
    const items = Array.from(this.map.entries()).sort((a, b) => {
      return a[0] > b[0] ? 1 : -1;
    });
    const responses = {} as { [x: string]: OpenApiResponseObject };
    for (let i = 0; i < items.length; i++) {
      const [key, value] = items[i];
      if (schemasManager) {
        resolveOpenApiSchema(value, (ref) => {
          if (isClass(ref)) return schemasManager.getRef(ref);
          return null;
        });
      }
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
