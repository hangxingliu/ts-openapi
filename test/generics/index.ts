import "reflect-metadata";

import { OpenApiArray, OpenApiSchemasManager, OpenApiObject, OpenApiSchema } from "../../src";
import { getOpenApiSchemasFromClass } from "../../src/utils/metadata";
import { resolveGenericClass, SchemaGenerics } from "../../src/generics";
import { writeFileSync } from "fs";
import { join } from "path";

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

@OpenApiObject({ description: "query input" })
class QueryInput {
  @OpenApiSchema("string")
  keyword: string;
}

console.log(getOpenApiSchemasFromClass(Pagination));

const Resolved = resolveGenericClass(Pagination, [Person, QueryInput]);
console.log(Pagination, Person, Resolved);

console.log("Resolved schema:", getOpenApiSchemasFromClass(Resolved));

const components = new OpenApiSchemasManager();
components.add(Resolved);
writeFileSync(join(__dirname, "components.json"), JSON.stringify(components.getComponents(), null, 2));
