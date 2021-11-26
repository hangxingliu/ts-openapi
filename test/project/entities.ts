import { OpenApiArray, OpenApiObject, OpenApiSchema, SchemaGenerics } from "../../src";

@OpenApiObject(null, { description: "User entity" })
export class User {
  @OpenApiSchema("string", {
    required: true,
    description: "User name for login",
    example: "admin",
  })
  userName: string;

  @OpenApiSchema("string", {
    description: "Email address of user",
    format: "email",
    example: "test@email.com",
  })
  email: string;
}

@OpenApiObject()
export class ListResults {
  @OpenApiArray(SchemaGenerics.T1)
  results: any[];

  @OpenApiSchema("string", {
    required: true,
    description: "Token for next query",
  })
  token: string;
}
