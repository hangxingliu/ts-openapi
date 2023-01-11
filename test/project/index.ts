import "reflect-metadata";
import { writeFileSync } from "fs";
import { resolve as resolvePath } from "path";
import { OpenApiSchemasManager, resolveGenericClass, OpenAPIDocumentBuilder, mediaTypes } from "../../src";
import { ListResults, User } from "./entities";
import { NotFoundResponse } from "./responses";

const pkgJSON = require("../../package.json");
pkgJSON.version = '1.0.0';

const document = new OpenAPIDocumentBuilder(pkgJSON);
document.tags.add({ name: "User", description: "APIs for manage users", externalDocs: { url: "https://github.com" } });

const ListUserResults = resolveGenericClass(ListResults, [User]);
document.schemas.add(ListUserResults);

document.parameters.add("keyword_for_list", {
  name: "keyword",
  in: "query",
  description: "Keyword for searching",
});
document.parameters.add("token_for_list", {
  name: "token",
  in: "query",
  description: "Token for pagination",
  example: "1:token....",
});
document.parameters.add("cache_type", {
  name: "x-cache-type",
  in: "header",
  description: "Cache type for list",
  schema: { enum: ["1", "2", "3"] },
});
document.parameters.addGroup("list", ["keyword_for_list", "token_for_list", "cache_type"]);
document.addResponseComponent("item_not_found", 404, mediaTypes.json, NotFoundResponse);

document
  .editPath("get", "/users")
  .tags(["User"])
  .baseInfo("get_users", "Get users")
  .setJsonResponse('2XX', ListUserResults)
  .query(["test"])
  .useParameterComponent("list")
  .useResponseComponent("item_not_found");

document
  .editPath("get", "/user/:userId")
  .tags(["User"])
  .baseInfo("get_user_userId", "Get user by userId", "Details ...")
  .useResponseComponent("item_not_found")
  .setResponseHeaders('2XX', { "x-date": { example: "2021-11-26" } });

const json = document.build();
// console.log(json);

writeFileSync(resolvePath(__dirname, "swagger.json"), JSON.stringify(json, null, 2) + '\n');
