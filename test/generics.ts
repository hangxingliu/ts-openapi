import "reflect-metadata";

import { getOpenApiMetadata, OpenApiArray, OpenApiSchemasManager, OpenApiObject, OpenApiSchema } from "../src";
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

console.log(getOpenApiMetadata(Pagination));

const Resolved = resolveGenericClass(Pagination, [Person, QueryInput]);
console.log(Pagination, Person, Resolved);

console.log("Resolved schema:", getOpenApiMetadata(Resolved));

const components = new OpenApiSchemasManager();
components.add(Resolved);
console.log(JSON.stringify(components.getComponents(), null, 2));
