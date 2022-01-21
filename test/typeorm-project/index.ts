import { writeFileSync } from "fs";
import { join } from "path";
import { OpenApiSchemasManager } from "../../src";
import { User } from "./user";
import { getMetadataArgsStorage } from "typeorm"

const storage = getMetadataArgsStorage();
console.log(storage.filterColumns(User));
console.log(storage.filterColumns(User)[1].options.type === String);

const components = new OpenApiSchemasManager();
components.useTypeORM(storage, {
  column(entity, column, schema) {
    if (/password/i.test(column.propertyName)) return null;
    if (column.propertyName === 'avatarId') {
      return {
        propertyName: 'avatar',
        properties: {
          url: { type: 'string' },
          size: { type: 'integer' },
        },
        required: ['url', 'size'],
      }
    }
    return schema;
  }
});
components.add(User);
writeFileSync(join(__dirname, 'components.json'), JSON.stringify(components.getComponents(), null, 2));


