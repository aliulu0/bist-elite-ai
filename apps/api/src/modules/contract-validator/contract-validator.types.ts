import type {
  OpenAPIDocument,
  OpenAPISchema,
  EndpointModule,
  DtoDefinition,
  EnumDefinition,
} from '../openapi/openapi.types';
import type {
  SDKGenerationResult,
  SDKGeneratedFile,
  SDKModuleDefinition,
  SDKTypeDefinition,
  SDKEnumDefinition,
} from '../sdk-generator/sdk-generator.types';

export type ValidationSeverity = 'ERROR' | 'WARNING' | 'INFO';
export type ValidationCategory =
  | 'SCHEMA_CONSISTENCY'
  | 'DTO_COMPATIBILITY'
  | 'ENUM_COMPATIBILITY'
  | 'ENDPOINT_COMPATIBILITY'
  | 'TYPE_COMPATIBILITY'
  | 'PAGINATION_COMPATIBILITY'
  | 'NULLABLE_COMPATIBILITY'
  | 'OPTIONAL_COMPATIBILITY'
  | 'VERSION_COMPATIBILITY'
  | 'SDK_COMPATIBILITY'
  | 'BREAKING_CHANGE';

export interface ValidationConfig {
  strictMode: boolean;
  checkBreakingChanges: boolean;
  checkNullability: boolean;
  checkOptionality: boolean;
  checkPagination: boolean;
  checkVersionCompatibility: boolean;
  checkSDKConsistency: boolean;
  schemaCacheEnabled: boolean;
  sdkCacheEnabled: boolean;
  maxSchemaCacheSize: number;
  maxSDKCacheSize: number;
  reportFormat: ReportFormat;
  exportBanner: string;
  indentSize: number;
}

export type ReportFormat = 'json' | 'markdown' | 'console';

export interface ValidationIssue {
  id: string;
  category: ValidationCategory;
  severity: ValidationSeverity;
  message: string;
  path: string;
  source?: string;
  target?: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export interface CompatibilityIssue {
  id: string;
  category: ValidationCategory;
  severity: ValidationSeverity;
  message: string;
  path: string;
  source: string;
  target: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export interface BreakingChange {
  id: string;
  category: ValidationCategory;
  message: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  source: string;
  target: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export interface Warning {
  id: string;
  category: ValidationCategory;
  severity: ValidationSeverity;
  message: string;
  path: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export interface ValidationReport {
  isValid: boolean;
  issues: ValidationIssue[];
  summary: ValidationSummary;
  generatedAt: string;
  durationMs: number;
}

export interface CompatibilityReport {
  isCompatible: boolean;
  issues: CompatibilityIssue[];
  summary: CompatibilitySummary;
  generatedAt: string;
  durationMs: number;
}

export interface BreakingChangeReport {
  hasBreakingChanges: boolean;
  changes: BreakingChange[];
  summary: BreakingChangeSummary;
  generatedAt: string;
  durationMs: number;
}

export interface WarningReport {
  warnings: Warning[];
  summary: WarningSummary;
  generatedAt: string;
  durationMs: number;
}

export interface ContractValidationSummary {
  totalValidations: number;
  passedValidations: number;
  failedValidations: number;
  totalIssues: number;
  errors: number;
  warnings: number;
  infos: number;
  breakingChanges: number;
  durationMs: number;
  generatedAt: string;
}

export interface ValidationSummary {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  errors: number;
  warnings: number;
  infos: number;
  categoriesChecked: ValidationCategory[];
}

export interface CompatibilitySummary {
  totalChecks: number;
  compatible: number;
  incompatible: number;
  categoriesChecked: ValidationCategory[];
}

export interface BreakingChangeSummary {
  totalChanges: number;
  highImpact: number;
  mediumImpact: number;
  lowImpact: number;
  categoriesAffected: ValidationCategory[];
}

export interface WarningSummary {
  totalWarnings: number;
  byCategory: Record<ValidationCategory, number>;
  bySeverity: Record<ValidationSeverity, number>;
}

export interface SchemaValidationResult {
  endpointPath: string;
  httpMethod: string;
  operationId: string;
  requestSchemaValid: boolean;
  responseSchemaValid: boolean;
  issues: ValidationIssue[];
}

export interface DTOCompatibilityResult {
  dtoName: string;
  isCompatible: boolean;
  addedProperties: string[];
  removedProperties: string[];
  changedProperties: Array<{
    name: string;
    from: string;
    to: string;
  }>;
  issues: ValidationIssue[];
}

export interface EnumCompatibilityResult {
  enumName: string;
  isCompatible: boolean;
  addedValues: string[];
  removedValues: string[];
  issues: ValidationIssue[];
}

export interface EndpointCompatibilityResult {
  operationId: string;
  httpMethod: string;
  path: string;
  isCompatible: boolean;
  addedParameters: string[];
  removedParameters: string[];
  changedParameters: Array<{
    name: string;
    from: string;
    to: string;
  }>;
  issues: CompatibilityIssue[];
}

export interface SchemaCacheEntry {
  schema: OpenAPISchema;
  hash: string;
  timestamp: number;
}

export interface SDKCacheEntry {
  result: SDKGenerationResult;
  hash: string;
  timestamp: number;
}

export interface ContractValidatorInput {
  openApiDocument: OpenAPIDocument;
  sdkResult?: SDKGenerationResult;
  endpointModules: EndpointModule[];
  dtoDefinitions: DtoDefinition[];
  enumDefinitions: EnumDefinition[];
  previousOpenApiDocument?: OpenAPIDocument;
}
