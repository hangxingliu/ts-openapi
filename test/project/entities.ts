import { OpenApiArray, OpenApiObject, OpenApiProperty, OpenApiString, SchemaGenerics } from "../../src";

@OpenApiObject(null, { description: "User entity" })
export class User {
  @OpenApiString({
    required: true,
    description: "User name for login",
    example: "admin",
  })
  userName: string;

  @OpenApiString({
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

  @OpenApiProperty({
    properties: {
      value: { $ref: SchemaGenerics.T1 },
    },
  })
  current: any;

  @OpenApiProperty({
    type: "string",
    required: true,
    description: "Token for next query",
  })
  token: string;
}
