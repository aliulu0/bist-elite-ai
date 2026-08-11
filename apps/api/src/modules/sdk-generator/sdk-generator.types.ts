import type {
  OpenAPIDocument,
  EndpointModule,
  EndpointDefinition,
  DtoDefinition,
  EnumDefinition,
  OpenAPISchema,
} from '../openapi/openapi.types';

export interface SDKGeneratorConfig {
  outputDir: string;
  clientClassName: string;
  clientFileName: string;
  typesDir: string;
  enumsDir: string;
  modulesDir: string;
  enablePagination: boolean;
  enableRetry: boolean;
  maxRetries: number;
  retryDelayMs: number;
  enableInterceptors: boolean;
  indentSize: number;
  exportBanner: string;
  generateReadme: boolean;
}

export interface SDKGenerationResult {
  files: SDKGeneratedFile[];
  moduleCount: number;
  endpointCount: number;
  typeCount: number;
  enumCount: number;
  generatedAt: string;
  durationMs: number;
  outputDir: string;
}

export interface SDKGeneratedFile {
  path: string;
  content: string;
  sizeBytes: number;
}

export interface SDKModuleDefinition {
  name: string;
  tag: string;
  className: string;
  filePath: string;
  endpoints: SDKEndpointDefinition[];
}

export interface SDKEndpointDefinition {
  operationId: string;
  name: string;
  method: string;
  path: string;
  description?: string;
  summary: string;
  pathParams: SDKParameter[];
  queryParams: SDKParameter[];
  bodyParam: SDKBodyParameter | null;
  responseType: string;
  deprecated?: boolean;
}

export interface SDKParameter {
  name: string;
  typeScriptType: string;
  required: boolean;
  description?: string;
  example?: unknown;
}

export interface SDKBodyParameter {
  type: string;
  required: boolean;
}

export interface SDKTypeDefinition {
  name: string;
  properties: SDKTypeProperty[];
  description?: string;
}

export interface SDKTypeProperty {
  name: string;
  typeScriptType: string;
  required: boolean;
  nullable?: boolean;
  description?: string;
}

export interface SDKEnumDefinition {
  name: string;
  values: string[];
  description?: string;
}

export interface SDKClientDefinition {
  className: string;
  baseUrl: string;
  modules: SDKModuleClientRef[];
  enableRetry: boolean;
  maxRetries: number;
  retryDelayMs: number;
  enableInterceptors: boolean;
}

export interface SDKModuleClientRef {
  propertyName: string;
  moduleName: string;
  importPath: string;
}

export interface SDKPaginationHelper {
  functionName: string;
  paramName: string;
  limitParam: string;
  offsetParam: string;
}

export type { OpenAPIDocument, EndpointModule, EndpointDefinition, DtoDefinition, EnumDefinition, OpenAPISchema };
