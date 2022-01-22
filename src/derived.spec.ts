import { deepStrictEqual } from "assert";
import { OpenApiSchemasManager, OpenApiString } from ".";
import { derivedClass } from "./derived";

class Pet {
  @OpenApiString({ required: true })
  name: string;
}
class User {
  @OpenApiString({ required: true })
  userName: string;

  @OpenApiString({ required: true })
  password: string;

  @OpenApiString({ required: false })
  remark?: string;
}

const components = new OpenApiSchemasManager();
console.log(components.add(derivedClass("UserView", User, "-password", "+avatar", { property: 'pet', $ref: Pet })));
console.log(components.add(derivedClass("UserView2", User, "-password", "+?avatar", '?+pet')));

const result = components.getComponents();
// console.log(JSON.stringify(result, null, 2));

deepStrictEqual(Object.keys(result.schemas), ['Pet', 'UserView', 'UserView2']);
deepStrictEqual(Object.keys(result.schemas.UserView.properties), ['userName', 'remark', 'avatar', 'pet']);
deepStrictEqual(Object.keys(result.schemas.UserView2.properties), ['userName', 'remark', 'avatar', 'pet']);
