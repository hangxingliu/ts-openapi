import type { OpenApiSchemaObject, OpenApiParameterIn } from "./openapi";

export type DefaultOpenApiSchemaGetter = (type: "property" | OpenApiParameterIn, propertyName: string) => OpenApiSchemaObject;

