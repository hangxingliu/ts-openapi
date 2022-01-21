# Typescript OpenAPI Utils

``` bash
npm install @hangxingliu/ts-openapi
# or
yarn add @hangxingliu/ts-openapi
```

## Usage

Most cases start from `OpenApiDocument`, 
Then adding api by `OpenApiDocument#editPath`,
and describe the api by method chains.

In a nutshell:

``` javascript
const docs = new OpenAPIDocumentBuilder();
docs.editPath('get', '/user/:userId')
  .tags(["User"])
  .jsonResponse('200', [UserEntity]);
```

See [test/project/index.ts](test/project/index.ts)

## TODO

- [ ] Add documents, js2doc
- [ ] Add unit tests for TypeORM
