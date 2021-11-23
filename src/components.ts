import { getOpenApiSchemas } from "./decorator";
import { Class, JSONSchemaObject, OpenApiComponentType } from "./types";

export class OpenApiComponentsManager {
  private readonly map = new Map<string, unknown>();
  constructor(readonly schemaType: OpenApiComponentType = "schemas") {}

  getRef(Component: Class): string {
    const name = Component.name;
    if (!this.map.has(name)) return this.addComponent(Component);
    return `#/components/${this.schemaType}/${name}`;
  }

  addComponent(Component: Class): string {
    const { wrap, fields } = getOpenApiSchemas(Component);

    const componentName = Component.name;
    const base: JSONSchemaObject = { title: componentName };
    if (wrap?.length > 0) {
      const { schema } = wrap[0];
      if (schema) Object.assign(base, schema);
    }
    if (!base.type) base.type = 'object';
    if (!base.properties) base.properties = {};
    if (!base.required) base.required = [];

    // get ref string from object, save this object into manager if it is not existed!
    if (typeof base.$ref === "function") base.$ref = this.getRef(base.$ref);

    for (let i = 0; i < fields.length; i++) {
      const { propKey, schema } = fields[i];
      if (!propKey) continue;

      if (typeof schema.$ref === "function") schema.$ref = this.getRef(schema.$ref);
      if (schema.required === true) {
        (base.required as any[]).push(propKey);
        delete schema.required;
      }
    }

    this.map.set(componentName, base);
    return `#/components/${this.schemaType}/${componentName}`;
  }

  getComponents() {
    const componentItems = Array.from(this.map.entries()).sort((a, b) => {
      return a[0] > b[0] ? 1 : -1;
    });

    const components = {} as { [x: string]: unknown };
    for (let i = 0; i < componentItems.length; i++) {
      const [key, value] = componentItems[i];
      components[key] = value;
    }
    return { [this.schemaType]: components };
  }
}
