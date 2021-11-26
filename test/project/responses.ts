import { OpenApiObject } from "../../src";
import { OpenApiString } from "../../src/decorator";

@OpenApiObject(null, { description: "response for item not found" })
export class NotFoundResponse {
  @OpenApiString({ required: true })
  type: string;

  @OpenApiString({ required: true })
  message: string;
}
