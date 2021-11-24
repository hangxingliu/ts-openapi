import "reflect-metadata";

import { getOpenApiSchemas, OpenApiArray, OpenApiComponentsManager, OpenApiObject, OpenApiSchema } from "../src";
import { resolveGenericClass, SchemaGenerics } from "../src/generics";

@OpenApiObject()
class Pagination {
  @OpenApiArray(SchemaGenerics.T)
  items: any[];

  @OpenApiSchema("integer")
  page: number;

  @OpenApiSchema(SchemaGenerics.T)
  firstItem: any;

  @OpenApiObject(SchemaGenerics.T2, { required: true })
  input: any;
}

@OpenApiObject()
class Person {
  @OpenApiSchema("string")
  name: string;

  @OpenApiSchema("integer")
  age: string;
}

@OpenApiSchema('object', { description: 'query input' })
class QueryInput {

  @OpenApiSchema('string', {})
  keyword: string;
}

console.log(getOpenApiSchemas(Pagination));

const Resolved = resolveGenericClass(Pagination, [Person, QueryInput]);
console.log(Pagination, Person, Resolved);

console.log("Resolved schema:", getOpenApiSchemas(Resolved));

const components = new OpenApiComponentsManager();
components.addComponent(Resolved);
console.log(JSON.stringify(components.getComponents(), null, 2));
