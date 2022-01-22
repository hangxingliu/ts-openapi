/**
 * This package info is compatible with `package.json`
 */
export type PackageInfoForOpenAPI = {
  openapi?: {
    title?: string;
    description?: string;
  };
  version: string;
  author?: any;
  license?: any;
};

export type Class = { name: string; new(): any };

export const enum ApplyParameterPriority {
  LOW = -1,
  HIGH = 1,
};
