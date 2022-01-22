import type { Class } from "../types/base";
import type { OpenApiSchemaObject } from "../types/openapi";

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
  [x: string]: any;
};

export type TypeORMColumnMetadataArgs = {
  target: any;
  propertyName: string;
  mode: any;
  options: TypeORMColumnOptions;
  [x: string]: any;
};

export type TypeORMTableMetadataArgs = {
  target: any;
  /**
   * Table's name. If name is not set then table's name will be generated from target's name.
   */
  name?: string;
  type: any;
  [x: string]: any;
};

export type TypeORMMetadataArgsStorage = {
  filterTables(target: Function | string): TypeORMTableMetadataArgs[];
  filterColumns(target: Function | string): TypeORMColumnMetadataArgs[];
};

export type TypeORMColumnTransformerResult = OpenApiSchemaObject & {
  /** Generated new property name */
  newPropertyName?: string;
};

export interface TypeORMEntityTransformer {
  column?(
    entity: Class,
    column: TypeORMColumnMetadataArgs,
    schema?: OpenApiSchemaObject
  ): TypeORMColumnTransformerResult;
}

export const bigintColumnTypes = new Set([
  //
  "int64",
  "bigint",
  "unsigned big int",
]);

export const intColumnTypes = new Set([
  //
  "int",
  "int2",
  "int4",
  "int8",
  "integer",
  "tinyint",
  "smallint",
  "mediumint",
]);

export const numberColumnTypes = new Set([
  //
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

export const stringColumnTypes = new Set([
  //
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

export const dateColumnTypes = new Set([
  //
  "datetime",
  "datetime2",
  "datetimeoffset",
  "time",
  "time with time zone",
  "time without time zone",
  "timestamp",
  "timestamp without time zone",
  "timestamp with time zone",
  "timestamp with local time zone",
]);

export const booleanColumnTypes = new Set([
  //
  "boolean",
  "bool",
]);
