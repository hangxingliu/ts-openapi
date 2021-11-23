import type { OpenApiDocument } from "./types";


/**
 * @param packageJSON The object from package.json
*/
export function createOpenApiBaseDocument(packageJSON: unknown): OpenApiDocument {
  let openApiTitle = '';
  let openApiDescription = '';
  let openApiVersion = '';

  if (typeof packageJSON !== 'object' || !packageJSON)
    throw new Error(`Invalid packageJSON parameter for function createOpenApiBaseDocument`);

  if (packageJSON['openapi'] && packageJSON['openapi']) {
    const openapi = packageJSON['openapi'];
    if (openapi.title) openApiTitle = openapi.title
    if (openapi.description) openApiDescription = openapi.description
  }

  if (typeof packageJSON['version'] === 'string')
    openApiVersion = packageJSON['version'];

  const result: OpenApiDocument = {
    openapi: "3.0.0",
    info: {
      title: openApiTitle,
      version: openApiVersion,
    },
    servers: [],
    tags: [],
    components: {},
    paths: {},
  };
  if (openApiDescription) result.info.description = openApiDescription;

  const _author = packageJSON['author'];
  if (_author) {
    const author = Array.isArray(_author) ? _author[0] : _author;
    if (author) {
      if (typeof author === "string") result.info.contact = { name: author };
      else result.info.contact = author;
    }
  }

  const _license = packageJSON['license'];
  if (_license !== null && _license !== undefined) {
    const license = Array.isArray(_license) ? _license[0] : _license;
    if (license) {
      if (typeof license === "string") result.info.license = { name: license };
      else result.info.license = { name: license.type, url: license.url };
    }
  }
  return result;
}
