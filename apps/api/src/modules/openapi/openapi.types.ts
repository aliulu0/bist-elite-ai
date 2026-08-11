export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ParameterIn = 'path' | 'query' | 'header' | 'cookie';

export interface EndpointParameter {
  name: string;
  in: ParameterIn;
  required: boolean;
  description?: string;
  schema: OpenAPISchema;
  example?: unknown;
}

export interface EndpointResponse {
  statusCode: number;
  description: string;
  schema?: OpenAPISchema;
  contentType?: string;
}

export interface EndpointDefinition {
  path: string;
  method: HttpMethod;
  operationId: string;
  summary: string;
  description?: string;
  tags: string[];
  parameters: EndpointParameter[];
  requestBody?: {
    required: boolean;
    contentType: string;
    schema: OpenAPISchema;
  };
  responses: EndpointResponse[];
  deprecated?: boolean;
}

export interface EndpointModule {
  name: string;
  tag: string;
  basePath: string;
  endpoints: EndpointDefinition[];
}

export interface PropertyDefinition {
  name: string;
  type: string;
  required: boolean;
  nullable?: boolean;
  example?: unknown;
  description?: string;
  enum?: string[];
  items?: OpenAPISchema;
  properties?: Record<string, OpenAPISchema>;
}

export interface DtoDefinition {
  name: string;
  description?: string;
  properties: PropertyDefinition[];
}

export interface EnumDefinition {
  name: string;
  values: string[];
  description?: string;
}

export interface OpenAPISchema {
  type?: string;
  format?: string;
  properties?: Record<string, OpenAPISchema>;
  items?: OpenAPISchema;
  required?: string[];
  enum?: string[];
  nullable?: boolean;
  example?: unknown;
  $ref?: string;
  description?: string;
  allOf?: OpenAPISchema[];
  oneOf?: OpenAPISchema[];
}

export interface OpenAPIDocument {
  openapi: string;
  info: OpenAPIInfo;
  servers: OpenAPIServer[];
  tags: OpenAPITag[];
  paths: Record<string, Record<string, unknown>>;
  components: {
    schemas: Record<string, OpenAPISchema>;
    securitySchemes: Record<string, unknown>;
  };
}

export interface OpenAPIInfo {
  title: string;
  description: string;
  version: string;
}

export interface OpenAPIServer {
  url: string;
  description: string;
}

export interface OpenAPITag {
  name: string;
  description: string;
}

export interface OpenAPIGenerationResult {
  document: OpenAPIDocument;
  endpointCount: number;
  schemaCount: number;
  tagCount: number;
  generatedAt: string;
  durationMs: number;
}

export interface OpenAPICacheEntry {
  document: OpenAPIDocument;
  generatedAt: string;
  endpointCount: number;
  schemaCount: number;
  version: number;
}

export interface OpenAPIStatistics {
  totalEndpoints: number;
  totalSchemas: number;
  totalTags: number;
  endpointsByTag: Record<string, number>;
  endpointsByMethod: Record<string, number>;
  lastGenerated: string | null;
  cacheVersion: number;
}

export type ExportFormat = 'json' | 'yaml' | 'markdown';
