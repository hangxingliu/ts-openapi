import { Class, OpenApiSchemaObject } from "./types";

export type TypeORMColumnOptions = {
  type?: any;
  name?: string;
  length?: any;
  width?: number;
  nullable?: boolean;
  readonly?: boolean;
  update?: boolean;
  select?: boolean;
  insert?: boolean;
  default?: any;
  primary?: boolean;
  unique?: boolean;
  comment?: string;
  enum?: any;
  enumName?: string;
  array?: boolean;
  generated?: any;
};

export type TypeORMColumnMetadataArgs = {
  target: any;
  propertyName: string;
  mode: any;
  options: TypeORMColumnOptions;
};

export type TypeORMMetadataArgsStorage = {
  filterColumns(target: Function | string): TypeORMColumnMetadataArgs[];
};

export type TypeORMColumnTransformerResult = OpenApiSchemaObject & {
  /** Generated new property name */
  propertyName?: string;
};

export interface TypeORMEntityTransformer {
  column?(
    entity: Class,
    column: TypeORMColumnMetadataArgs,
    schema?: OpenApiSchemaObject
  ): TypeORMColumnTransformerResult;
}

const bigintColumnTypes = new Set([
  "int64",
  "bigint",
  "unsigned big int",
]);
const intColumnTypes = new Set([
  "int",
  "int2",
  "int4",
  "int8",
  "integer",
  "tinyint",
  "smallint",
  "mediumint",
]);
const numberColumnTypes = new Set([
  "dec",
  "decimal",
  "smalldecimal",
  "fixed",
  "numeric",
  "number",
  "float",
  "float4",
  "float8",
  "double",
  "real",
  "double precision",
]);
const stringColumnTypes = new Set([
  "character varying",
  "varying character",
  "char varying",
  "nvarchar",
  "national varchar",
  "character",
  "native character",
  "varchar",
  "char",
  "nchar",
  "national char",
  "varchar2",
  "nvarchar2",
  "alphanum",
  "shorttext",
  "string",
  "tinytext",
  "mediumtext",
  "text",
  "ntext",
  "citext",
  "longtext",
]);
const dateColumnTypes = new Set([
  "datetime",
  "datetime2",
  "datetimeoffset",
  "time",
  "time with time zone",
  "time without time zone",
  "timestamp",
  "timestamp without time zone" ,
  "timestamp with time zone" ,
  "timestamp with local time zone"
]);
const booleanColumnTypes = new Set([
  "boolean",
  "bool",
]);

export function getSchemaFromTypeORMColumn(column: TypeORMColumnMetadataArgs) {
  const result: TypeORMColumnTransformerResult = {
    propertyName: column.propertyName,
  };
  const columnOptions = column.options || {};
  const type = columnOptions.type;
  if (typeof type === "string") {
    if (bigintColumnTypes.has(type)) {
      result.type = 'string';
      result.description = 'bigint';
    } else if (intColumnTypes.has(type)) {
      result.type = 'integer';
    } else if (numberColumnTypes.has(type)) {
      result.type = 'number';
    } else if (stringColumnTypes.has(type)) {
      result.type = 'string';
    } else if (booleanColumnTypes.has(type)) {
      result.type = 'boolean';
    } else if (dateColumnTypes.has(type)) {
      result.type = 'string';
      result.format = 'date-time';
    }
  } else {
    if (type === String) { result.type = 'string'; }
    else if (type === Boolean) { result.type = 'boolean'; }
    else if (type === Number) { result.type = 'number'; }
    else if (type === Date) {
      result.type = 'string';
      result.format = 'date-time';
    }
  }
  if (columnOptions.nullable !== true)
    result.required = true;
  return result;
}
