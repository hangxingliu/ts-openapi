export const MetadataKeys = {
  flags: Symbol("OpenApiResolvedFlags"),
  schema: Symbol("OpenApiSchemaSymbol"),
  /** Overwrite the Class#name */
  componentName: Symbol('OpenApiComponentName'),
};

export const enum OpenApiResolvedFlags {
  Genrics = 1,
  TypeORM = 2,
}
export type OpenApiResolvedFlagsMap = {
  [x in OpenApiResolvedFlags]: boolean;
};
