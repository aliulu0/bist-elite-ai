import { Injectable, Optional } from '@nestjs/common';
import type {
  ValidationConfig,
  ValidationIssue,
  CompatibilityIssue,
  BreakingChange,
  Warning,
  ValidationReport,
  CompatibilityReport,
  BreakingChangeReport,
  WarningReport,
  ContractValidationSummary,
  ValidationSummary,
  CompatibilitySummary,
  BreakingChangeSummary,
  WarningSummary,
  SchemaValidationResult,
  DTOCompatibilityResult,
  EnumCompatibilityResult,
  EndpointCompatibilityResult,
  SchemaCacheEntry,
  SDKCacheEntry,
  ContractValidatorInput,
  ValidationCategory,
  ValidationSeverity,
} from './contract-validator.types';
import type {
  OpenAPIDocument,
  OpenAPISchema,
  EndpointModule,
  DtoDefinition,
  EnumDefinition,
  EndpointDefinition,
  PropertyDefinition,
} from '../openapi/openapi.types';
import type {
  SDKGenerationResult,
  SDKModuleDefinition,
  SDKTypeDefinition,
  SDKEnumDefinition,
} from '../sdk-generator/sdk-generator.types';
import {
  DEFAULT_VALIDATION_CONFIG,
  ALL_VALIDATION_CATEGORIES,
  SCHEMA_TYPE_MAP,
  HTTP_METHODS,
  BREAKING_CHANGE_PATTERNS,
  PAGINATION_FIELDS,
} from './contract-validator.config';

@Injectable()
export class ContractValidatorEngine {
  private readonly config: ValidationConfig;
  private schemaCache = new Map<string, SchemaCacheEntry>();
  private sdkCache = new Map<string, SDKCacheEntry>();

  constructor(@Optional() config?: Partial<ValidationConfig>) {
    this.config = { ...DEFAULT_VALIDATION_CONFIG, ...config };
  }

  validate(input: ContractValidatorInput): ValidationReport {
    const start = Date.now();
    const issues: ValidationIssue[] = [];

    const schemaResults = this.validateSchemaConsistency(input.openApiDocument);
    for (const result of schemaResults) {
      issues.push(...result.issues);
    }

    const dtoResults = this.validateDTOCompatibility(
      input.dtoDefinitions,
      input.sdkResult,
    );
    for (const result of dtoResults) {
      issues.push(...result.issues);
    }

    const enumResults = this.validateEnumCompatibility(
      input.enumDefinitions,
      input.sdkResult,
    );
    for (const result of enumResults) {
      issues.push(...result.issues);
    }

    const endpointResults = this.validateEndpointCompatibility(
      input.endpointModules,
      input.openApiDocument,
    );
    for (const result of endpointResults) {
      issues.push(...result.issues);
    }

    if (this.config.checkNullability) {
      issues.push(...this.validateNullability(input.openApiDocument));
    }

    if (this.config.checkOptionality) {
      issues.push(...this.validateOptionality(input.openApiDocument));
    }

    if (this.config.checkPagination) {
      issues.push(...this.validatePagination(input.openApiDocument));
    }

    if (this.config.checkSDKConsistency && input.sdkResult) {
      issues.push(
        ...this.validateSDKConsistency(input.openApiDocument, input.sdkResult),
      );
    }

    const errors = issues.filter(i => i.severity === 'ERROR').length;
    const warnings = issues.filter(i => i.severity === 'WARNING').length;
    const infos = issues.filter(i => i.severity === 'INFO').length;
    const categoriesChecked = [...new Set(issues.map(i => i.category))];
    const passedChecks =
      ALL_VALIDATION_CATEGORIES.length - categoriesChecked.length;

    const summary: ValidationSummary = {
      totalChecks: ALL_VALIDATION_CATEGORIES.length,
      passedChecks,
      failedChecks: categoriesChecked.length,
      errors,
      warnings,
      infos,
      categoriesChecked,
    };

    return {
      isValid: errors === 0,
      issues,
      summary,
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - start,
    };
  }

  validateSchemaConsistency(document: OpenAPIDocument): SchemaValidationResult[] {
    const results: SchemaValidationResult[] = [];
    const schemas = document.components?.schemas || {};

    for (const [pathStr, pathItem] of Object.entries(document.paths)) {
      if (!pathItem || typeof pathItem !== 'object') continue;

      for (const [method, operation] of Object.entries(pathItem)) {
        if (!HTTP_METHODS.includes(method.toUpperCase() as typeof HTTP_METHODS[number])) continue;

        const op = operation as Record<string, unknown>;
        const operationId = (op.operationId as string) || '';
        const tags = (op.tags as string[]) || [];
        const issues: ValidationIssue[] = [];

        if (this.config.checkNullability) {
          const requestSchema = this.extractRequestSchema(op);
          if (requestSchema) {
            const nullIssues = this.validateSchemaNullability(
              requestSchema,
              `${pathStr}.${method}.requestBody`,
            );
            issues.push(...nullIssues);
          }

          const responseSchema = this.extractResponseSchema(op);
          if (responseSchema) {
            const nullIssues = this.validateSchemaNullability(
              responseSchema,
              `${pathStr}.${method}.response`,
            );
            issues.push(...nullIssues);
          }
        }

        if (this.config.strictMode) {
          if (!operationId) {
            issues.push(
              this.createIssue(
                'SCHEMA_CONSISTENCY',
                'ERROR',
                `Endpoint ${method.toUpperCase()} ${pathStr} has no operationId`,
                `${pathStr}.${method}`,
                { method, path: pathStr },
              ),
            );
          }

          if (tags.length === 0) {
            issues.push(
              this.createIssue(
                'SCHEMA_CONSISTENCY',
                'WARNING',
                `Endpoint ${method.toUpperCase()} ${pathStr} has no tags`,
                `${pathStr}.${method}`,
                { method, path: pathStr },
              ),
            );
          }
        }

        const requestValid = !issues.some(
          i => i.message.includes('requestBody') && i.severity === 'ERROR',
        );
        const responseValid = !issues.some(
          i => i.message.includes('response') && i.severity === 'ERROR',
        );

        results.push({
          endpointPath: pathStr,
          httpMethod: method.toUpperCase(),
          operationId,
          requestSchemaValid: requestValid,
          responseSchemaValid: responseValid,
          issues,
        });
      }
    }

    return results;
  }

  validateDTOCompatibility(
    dtos: DtoDefinition[],
    sdkResult?: SDKGenerationResult,
  ): DTOCompatibilityResult[] {
    const results: DTOCompatibilityResult[] = [];

    if (sdkResult) {
      const sdkTypes = sdkResult.files
        .filter(f => f.path.includes('types/') && f.path.endsWith('.ts') && !f.path.includes('node_modules'))
        .map(f => f.content);

      for (const dto of dtos) {
        const sdkType = this.findSDKTypeForDTO(dto, sdkTypes);
        const issues: CompatibilityIssue[] = [];
        const addedProperties: string[] = [];
        const removedProperties: string[] = [];
        const changedProperties: Array<{
          name: string;
          from: string;
          to: string;
        }> = [];

        if (sdkType) {
          const dtoPropNames = new Set(dto.properties.map(p => p.name));
          const sdkPropNames = this.extractSDKTypeProperties(sdkType);

          for (const prop of sdkPropNames) {
            if (!dtoPropNames.has(prop)) {
              addedProperties.push(prop);
            }
          }

          for (const prop of dtoPropNames) {
            if (!sdkPropNames.has(prop)) {
              removedProperties.push(prop);
              issues.push(
                this.createCompatIssue(
                  'DTO_COMPATIBILITY',
                  'WARNING',
                  `Property '${prop}' in DTO '${dto.name}' not found in SDK type`,
                  dto.name,
                  'SDK',
                  { property: prop },
                ),
              );
            }
          }

          for (const prop of dto.properties) {
            if (sdkPropNames.has(prop.name)) {
              const sdkTypeStr = this.extractSDKPropertyType(sdkType, prop.name);
              const dtoTypeStr = prop.type;
              if (sdkTypeStr && sdkTypeStr !== dtoTypeStr) {
                changedProperties.push({
                  name: prop.name,
                  from: dtoTypeStr,
                  to: sdkTypeStr,
                });
              }
            }
          }
        }

        results.push({
          dtoName: dto.name,
          isCompatible: removedProperties.length === 0,
          addedProperties,
          removedProperties,
          changedProperties,
          issues,
        });
      }
    } else {
      for (const dto of dtos) {
        const issues: ValidationIssue[] = [];
        for (const prop of dto.properties) {
          if (
            this.config.checkNullability &&
            prop.nullable !== undefined &&
            prop.required
          ) {
            issues.push(
              this.createIssue(
                'DTO_COMPATIBILITY',
                'WARNING',
                `Property '${prop.name}' in DTO '${dto.name}' is required but nullable`,
                `${dto.name}.${prop.name}`,
                { property: prop.name, nullable: prop.nullable, required: prop.required },
              ),
            );
          }

          if (prop.type && !SCHEMA_TYPE_MAP[prop.type] && prop.type !== 'object' && prop.type !== 'array') {
            issues.push(
              this.createIssue(
                'DTO_COMPATIBILITY',
                'INFO',
                `Property '${prop.name}' in DTO '${dto.name}' has custom type '${prop.type}'`,
                `${dto.name}.${prop.name}`,
                { property: prop.name, type: prop.type },
              ),
            );
          }
        }

        results.push({
          dtoName: dto.name,
          isCompatible: !issues.some(i => i.severity === 'ERROR'),
          addedProperties: [],
          removedProperties: [],
          changedProperties: [],
          issues,
        });
      }
    }

    return results;
  }

  validateEnumCompatibility(
    enums: EnumDefinition[],
    sdkResult?: SDKGenerationResult,
  ): EnumCompatibilityResult[] {
    const results: EnumCompatibilityResult[] = [];

    if (sdkResult) {
      const sdkEnums = this.extractSDKEnums(sdkResult);

      for (const enumDef of enums) {
        const sdkEnum = sdkEnums.find(e => e.name === enumDef.name);
        const issues: CompatibilityIssue[] = [];
        const addedValues: string[] = [];
        const removedValues: string[] = [];

        if (sdkEnum) {
          const sdkValues = new Set(sdkEnum.values);
          const specValues = new Set(enumDef.values);

          for (const val of enumDef.values) {
            if (!sdkValues.has(val)) {
              removedValues.push(val);
            }
          }

          for (const val of sdkEnum.values) {
            if (!specValues.has(val)) {
              addedValues.push(val);
              issues.push(
                this.createCompatIssue(
                  'ENUM_COMPATIBILITY',
                  'WARNING',
                  `Enum value '${val}' in SDK enum '${enumDef.name}' not found in spec`,
                  enumDef.name,
                  'SDK',
                  { value: val },
                ),
              );
            }
          }
        }

        results.push({
          enumName: enumDef.name,
          isCompatible: removedValues.length === 0,
          addedValues,
          removedValues,
          issues,
        });
      }
    } else {
      for (const enumDef of enums) {
        const issues: ValidationIssue[] = [];

        if (enumDef.values.length === 0) {
          issues.push(
            this.createIssue(
              'ENUM_COMPATIBILITY',
              'WARNING',
              `Enum '${enumDef.name}' has no values`,
              enumDef.name,
              { enumName: enumDef.name },
            ),
          );
        }

        const uniqueValues = new Set(enumDef.values);
        if (uniqueValues.size !== enumDef.values.length) {
          issues.push(
            this.createIssue(
              'ENUM_COMPATIBILITY',
              'ERROR',
              `Enum '${enumDef.name}' has duplicate values`,
              enumDef.name,
              { enumName: enumDef.name, count: enumDef.values.length, unique: uniqueValues.size },
            ),
          );
        }

        results.push({
          enumName: enumDef.name,
          isCompatible: !issues.some(i => i.severity === 'ERROR'),
          addedValues: [],
          removedValues: [],
          issues,
        });
      }
    }

    return results;
  }

  validateEndpointCompatibility(
    endpoints: EndpointModule[],
    document: OpenAPIDocument,
  ): EndpointCompatibilityResult[] {
    const results: EndpointCompatibilityResult[] = [];

    for (const module of endpoints) {
      for (const ep of module.endpoints) {
        const issues: CompatibilityIssue[] = [];
        const addedParameters: string[] = [];
        const removedParameters: string[] = [];
        const changedParameters: Array<{
          name: string;
          from: string;
          to: string;
        }> = [];

        const pathItem = document.paths[ep.path];
        if (pathItem && typeof pathItem === 'object') {
          const method = ep.method.toLowerCase();
          const operation = (pathItem as Record<string, unknown>)[method] as
            | Record<string, unknown>
            | undefined;

          if (operation) {
            const params = Array.isArray(operation.parameters)
              ? (operation.parameters as Array<Record<string, unknown>>)
              : [];

            for (const param of params) {
              const paramName = param.name as string;
              const paramIn = param.in as string;
              const paramRequired = param.required as boolean;
              const paramSchema = param.schema as OpenAPISchema | undefined;

              if (this.config.checkNullability && paramSchema?.nullable) {
                issues.push(
                  this.createCompatIssue(
                    'ENDPOINT_COMPATIBILITY',
                    'WARNING',
                    `Parameter '${paramName}' in ${method.toUpperCase()} ${ep.path} is nullable`,
                    ep.operationId,
                    ep.path,
                    { parameter: paramName, nullable: true },
                  ),
                );
              }

              if (this.config.checkOptionality && !paramRequired) {
                issues.push(
                  this.createCompatIssue(
                    'ENDPOINT_COMPATIBILITY',
                    'INFO',
                    `Parameter '${paramName}' in ${method.toUpperCase()} ${ep.path} is optional`,
                    ep.operationId,
                    ep.path,
                    { parameter: paramName, required: false },
                  ),
                );
              }
            }

            const specParamNames = new Set(
              params.map(p => `${p.name}:${p.in}`),
            );
            const defParamNames = new Set(
              ep.parameters.map(p => `${p.name}:${p.in}`),
            );

            for (const name of specParamNames) {
              if (!defParamNames.has(name)) {
                addedParameters.push(name.split(':')[0]);
              }
            }

            for (const name of defParamNames) {
              if (!specParamNames.has(name)) {
                removedParameters.push(name.split(':')[0]);
                issues.push(
                  this.createCompatIssue(
                    'ENDPOINT_COMPATIBILITY',
                    'WARNING',
                    `Parameter '${name.split(':')[0]}' in endpoint definition not found in spec`,
                    ep.operationId,
                    ep.path,
                    { parameter: name.split(':')[0] },
                  ),
                );
              }
            }
          }
        }

        results.push({
          operationId: ep.operationId,
          httpMethod: ep.method,
          path: ep.path,
          isCompatible: !issues.some(i => i.severity === 'ERROR'),
          addedParameters,
          removedParameters,
          changedParameters,
          issues,
        });
      }
    }

    return results;
  }

  validateNullability(document: OpenAPIDocument): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    for (const [name, schema] of Object.entries(
      document.components?.schemas || {},
    )) {
      if (schema.nullable && schema.type === 'string') {
        issues.push(
          this.createIssue(
            'NULLABLE_COMPATIBILITY',
            'INFO',
            `Schema '${name}' is nullable string`,
            `components.schemas.${name}`,
            { schema: name, nullable: true, type: 'string' },
          ),
        );
      }

      if (schema.type === 'object' && schema.properties) {
        const nullIssues = this.validateSchemaNullability(
          schema,
          `components.schemas.${name}`,
        );
        issues.push(...nullIssues);
      }
    }

    return issues;
  }

  validateOptionality(document: OpenAPIDocument): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    for (const [pathStr, pathItem] of Object.entries(document.paths)) {
      if (!pathItem || typeof pathItem !== 'object') continue;

      for (const [method, operation] of Object.entries(pathItem)) {
        if (!HTTP_METHODS.includes(method.toUpperCase() as typeof HTTP_METHODS[number])) continue;

        const op = operation as Record<string, unknown>;
        const params = Array.isArray(op.parameters)
          ? (op.parameters as Array<Record<string, unknown>>)
          : [];

        for (const param of params) {
          if (!param.required) {
            issues.push(
              this.createIssue(
                'OPTIONAL_COMPATIBILITY',
                'INFO',
                `Parameter '${param.name as string}' in ${method.toUpperCase()} ${pathStr} is optional`,
                `${pathStr}.${method}.${param.name as string}`,
                {
                  parameter: param.name,
                  required: false,
                  in: param.in,
                },
              ),
            );
          }
        }

        const requestBody = op.requestBody as Record<string, unknown> | undefined;
        if (requestBody && !requestBody.required) {
          issues.push(
            this.createIssue(
              'OPTIONAL_COMPATIBILITY',
              'INFO',
              `Request body in ${method.toUpperCase()} ${pathStr} is optional`,
              `${pathStr}.${method}.requestBody`,
              { required: false },
            ),
          );
        }
      }
    }

    return issues;
  }

  validatePagination(document: OpenAPIDocument): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    for (const [pathStr, pathItem] of Object.entries(document.paths)) {
      if (!pathItem || typeof pathItem !== 'object') continue;

      for (const [method, operation] of Object.entries(pathItem)) {
        if (!HTTP_METHODS.includes(method.toUpperCase() as typeof HTTP_METHODS[number])) continue;
        if (method.toLowerCase() !== 'get') continue;

        const op = operation as Record<string, unknown>;
        const params = Array.isArray(op.parameters)
          ? (op.parameters as Array<Record<string, unknown>>)
          : [];

        const paginationFieldsArr = PAGINATION_FIELDS as readonly string[];
        const hasPagination = params.some(p =>
          paginationFieldsArr.includes((p.name as string)?.toLowerCase()),
        );

        if (hasPagination) {
          const missingFields = (PAGINATION_FIELDS as readonly string[]).filter(field =>
            !params.some(p => (p.name as string)?.toLowerCase() === field),
          );

          if (missingFields.length > 0) {
            issues.push(
              this.createIssue(
                'PAGINATION_COMPATIBILITY',
                'WARNING',
                `GET ${pathStr} has pagination but missing fields: ${missingFields.join(', ')}`,
                `${pathStr}.${method}`,
                { missingFields, existingFields: params.map(p => p.name) },
              ),
            );
          }
        }
      }
    }

    return issues;
  }

  validateSDKConsistency(
    document: OpenAPIDocument,
    sdkResult: SDKGenerationResult,
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const specEndpoints = this.extractEndpointCount(document);
    const sdkEndpointCount = sdkResult.endpointCount;

    if (specEndpoints !== sdkEndpointCount) {
      issues.push(
        this.createIssue(
          'SDK_COMPATIBILITY',
          'ERROR',
          `SDK has ${sdkEndpointCount} endpoints but spec has ${specEndpoints}`,
          'SDK',
          { specEndpoints, sdkEndpoints: sdkEndpointCount },
        ),
      );
    }

    for (const file of sdkResult.files) {
      if (file.path.includes('/modules/') && file.path.endsWith('.ts')) {
        const moduleEndpoints = this.extractModuleEndpointsFromContent(file.content);
        const pathItem = this.findPathForModule(file.path, document);

        if (pathItem) {
          for (const ep of moduleEndpoints) {
            if (!this.endpointExistsInSpec(ep, document)) {
              issues.push(
                this.createIssue(
                  'SDK_COMPATIBILITY',
                  'WARNING',
                  `SDK module endpoint '${ep}' not found in spec`,
                  file.path,
                  { endpoint: ep, file: file.path },
                ),
              );
            }
          }
        }
      }
    }

    return issues;
  }

  compareDocuments(
    previous: OpenAPIDocument,
    current: OpenAPIDocument,
  ): BreakingChangeReport {
    const start = Date.now();
    const changes: BreakingChange[] = [];

    const prevEndpoints = this.extractEndpointMap(previous);
    const currEndpoints = this.extractEndpointMap(current);

    const prevPathsByPath = new Map<string, string>();
    const currPathsByPath = new Map<string, string>();
    for (const [key, ep] of prevEndpoints) prevPathsByPath.set(ep.path, ep.method);
    for (const [key, ep] of currEndpoints) currPathsByPath.set(ep.path, ep.method);

    for (const [path, prevMethod] of prevPathsByPath) {
      const currMethod = currPathsByPath.get(path);
      if (currMethod && currMethod !== prevMethod) {
        changes.push(
          this.createBreakingChange(
            'ENDPOINT_COMPATIBILITY',
            `Endpoint method changed from ${prevMethod} to ${currMethod} for path ${path}`,
            'HIGH',
            `${prevMethod}:${path}`,
            `${currMethod}:${path}`,
            { from: prevMethod, to: currMethod, path },
          ),
        );
      }
    }

    for (const [key, ep] of prevEndpoints) {
      if (!currEndpoints.has(key)) {
        changes.push(
          this.createBreakingChange(
            'ENDPOINT_COMPATIBILITY',
            `Endpoint ${ep.method} ${ep.path} was removed`,
            'HIGH',
            key,
            'removed',
            { endpoint: key },
          ),
        );
      }
    }

    for (const [key, currEp] of currEndpoints) {
      const prevEp = prevEndpoints.get(key);
      if (!prevEp) continue;

      if (prevEp.method !== currEp.method) {
        changes.push(
          this.createBreakingChange(
            'ENDPOINT_COMPATIBILITY',
            `Endpoint ${key} method changed from ${prevEp.method} to ${currEp.method}`,
            'HIGH',
            key,
            'changed',
            { from: prevEp.method, to: currEp.method },
          ),
        );
      }
    }

    const prevSchemas = previous.components?.schemas || {};
    const currSchemas = current.components?.schemas || {};

    for (const [name, prevSchema] of Object.entries(prevSchemas)) {
      const currSchema = currSchemas[name];
      if (!currSchema) {
        changes.push(
          this.createBreakingChange(
            'SCHEMA_CONSISTENCY',
            `Schema '${name}' was removed`,
            'HIGH',
            `components.schemas.${name}`,
            'removed',
            { schema: name },
          ),
        );
        continue;
      }

      if (prevSchema.properties && currSchema.properties) {
        const prevRequired = new Set(prevSchema.required || []);
        const currRequired = new Set(currSchema.required || []);

        for (const propName of Object.keys(prevSchema.properties)) {
          if (!currSchema.properties[propName]) {
            changes.push(
              this.createBreakingChange(
                'SCHEMA_CONSISTENCY',
                `Property '${propName}' removed from schema '${name}'`,
                prevRequired.has(propName) ? 'HIGH' : 'MEDIUM',
                `components.schemas.${name}.${propName}`,
                'removed',
                { schema: name, property: propName, wasRequired: prevRequired.has(propName) },
              ),
            );
          }
        }

        for (const propName of Object.keys(currSchema.properties)) {
          if (!prevSchema.properties[propName] && currRequired.has(propName)) {
            changes.push(
              this.createBreakingChange(
                'SCHEMA_CONSISTENCY',
                `New required property '${propName}' added to schema '${name}'`,
                'MEDIUM',
                `components.schemas.${name}.${propName}`,
                'added',
                { schema: name, property: propName, isRequired: true },
              ),
            );
          }
        }

        for (const propName of Object.keys(prevSchema.properties)) {
          if (currSchema.properties[propName]) {
            const prevType = prevSchema.properties[propName].type;
            const currType = currSchema.properties[propName].type;
            if (prevType && currType && prevType !== currType) {
              changes.push(
                this.createBreakingChange(
                  'TYPE_COMPATIBILITY',
                  `Property '${propName}' in schema '${name}' type changed from '${prevType}' to '${currType}'`,
                  'MEDIUM',
                  `components.schemas.${name}.${propName}`,
                  'changed',
                  { schema: name, property: propName, from: prevType, to: currType },
                ),
              );
            }
          }
        }
      }
    }

    const prevEnums = this.extractEnumMap(previous);
    const currEnums = this.extractEnumMap(current);

    for (const [name, prevEnum] of prevEnums) {
      const currEnum = currEnums.get(name);
      if (!currEnum) {
        changes.push(
          this.createBreakingChange(
            'ENUM_COMPATIBILITY',
            `Enum '${name}' was removed`,
            'HIGH',
            `components.schemas.${name}`,
            'removed',
            { enum: name },
          ),
        );
        continue;
      }

      for (const val of prevEnum) {
        if (!currEnum.includes(val)) {
          changes.push(
            this.createBreakingChange(
              'ENUM_COMPATIBILITY',
              `Enum value '${val}' removed from '${name}'`,
              'MEDIUM',
              `components.schemas.${name}`,
              'removed',
              { enum: name, value: val },
            ),
          );
        }
      }
    }

    const highImpact = changes.filter(c => c.impact === 'HIGH').length;
    const mediumImpact = changes.filter(c => c.impact === 'MEDIUM').length;
    const lowImpact = changes.filter(c => c.impact === 'LOW').length;
    const categoriesAffected = [...new Set(changes.map(c => c.category))];

    const summary: BreakingChangeSummary = {
      totalChanges: changes.length,
      highImpact,
      mediumImpact,
      lowImpact,
      categoriesAffected,
    };

    return {
      hasBreakingChanges: changes.length > 0,
      changes,
      summary,
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - start,
    };
  }

  generateWarnings(report: ValidationReport): WarningReport {
    const start = Date.now();
    const warnings: Warning[] = [];

    for (const issue of report.issues) {
      if (issue.severity === 'WARNING' || issue.severity === 'INFO') {
        warnings.push({
          id: issue.id,
          category: issue.category,
          severity: issue.severity,
          message: issue.message,
          path: issue.path,
          details: issue.details,
          timestamp: issue.timestamp,
        });
      }
    }

    const byCategory = {} as Record<ValidationCategory, number>;
    const bySeverity = {} as Record<ValidationSeverity, number>;
    for (const cat of ALL_VALIDATION_CATEGORIES) {
      byCategory[cat] = warnings.filter(w => w.category === cat).length;
    }
    for (const sev of ['ERROR', 'WARNING', 'INFO'] as ValidationSeverity[]) {
      bySeverity[sev] = warnings.filter(w =>
        w.severity === sev,
      ).length;
    }

    const summary: WarningSummary = {
      totalWarnings: warnings.length,
      byCategory,
      bySeverity,
    };

    return {
      warnings,
      summary,
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - start,
    };
  }

  generateSummaryReport(reports: {
    validation?: ValidationReport;
    compatibility?: CompatibilityReport;
    breaking?: BreakingChangeReport;
    warnings?: WarningReport;
  }): ContractValidationSummary {
    let totalValidations = 0;
    let passedValidations = 0;
    let failedValidations = 0;
    let totalIssues = 0;
    let errors = 0;
    let warnings = 0;
    let infos = 0;
    let breakingChanges = 0;

    if (reports.validation) {
      totalValidations++;
      if (reports.validation.isValid) passedValidations++;
      else failedValidations++;
      totalIssues += reports.validation.issues.length;
      errors += reports.validation.summary.errors;
      warnings += reports.validation.summary.warnings;
      infos += reports.validation.summary.infos;
    }

    if (reports.compatibility) {
      totalValidations++;
      if (reports.compatibility.isCompatible) passedValidations++;
      else failedValidations++;
      totalIssues += reports.compatibility.issues.length;
    }

    if (reports.breaking) {
      totalValidations++;
      if (!reports.breaking.hasBreakingChanges) passedValidations++;
      else failedValidations++;
      breakingChanges = reports.breaking.changes.length;
    }

    if (reports.warnings) {
      warnings += reports.warnings.summary.totalWarnings;
    }

    return {
      totalValidations,
      passedValidations,
      failedValidations,
      totalIssues,
      errors,
      warnings,
      infos,
      breakingChanges,
      durationMs: 0,
      generatedAt: new Date().toISOString(),
    };
  }

  formatReport(
    report: ValidationReport | CompatibilityReport | BreakingChangeReport | WarningReport | ContractValidationSummary,
    format: 'json' | 'markdown' | 'console' = 'json',
  ): string {
    if (format === 'json') {
      return JSON.stringify(report, null, this.config.indentSize);
    }

    if (format === 'markdown') {
      return this.formatMarkdown(report);
    }

    return this.formatConsole(report);
  }

  clearSchemaCache(): void {
    this.schemaCache.clear();
  }

  clearSDKCache(): void {
    this.sdkCache.clear();
  }

  getSchemaCacheSize(): number {
    return this.schemaCache.size;
  }

  getSDKCacheSize(): number {
    return this.sdkCache.size;
  }

  getConfig(): ValidationConfig {
    return { ...this.config };
  }

  private extractRequestSchema(
    operation: Record<string, unknown>,
  ): OpenAPISchema | null {
    const body = operation.requestBody as Record<string, unknown> | undefined;
    if (!body) return null;
    const content = body.content as
      | Record<string, { schema?: OpenAPISchema }>
      | undefined;
    return content?.['application/json']?.schema || null;
  }

  private extractResponseSchema(
    operation: Record<string, unknown>,
  ): OpenAPISchema | null {
    const responses = operation.responses as
      | Record<string, Record<string, unknown>>
      | undefined;
    if (!responses) return null;

    const resp = responses['200'] || responses['201'];
    if (!resp) return null;

    const content = resp.content as
      | Record<string, { schema?: OpenAPISchema }>
      | undefined;
    return content?.['application/json']?.schema || null;
  }

  private validateSchemaNullability(
    schema: OpenAPISchema,
    path: string,
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (schema.type === 'string' && schema.nullable) {
      issues.push(
        this.createIssue(
          'NULLABLE_COMPATIBILITY',
          'INFO',
          `Schema at ${path} is nullable string`,
          path,
          { type: 'string', nullable: true },
        ),
      );
    }

    if (schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        if (propSchema.nullable) {
          issues.push(
            this.createIssue(
              'NULLABLE_COMPATIBILITY',
              'INFO',
              `Property '${propName}' at ${path} is nullable`,
              `${path}.${propName}`,
              { property: propName, nullable: true, type: propSchema.type },
            ),
          );
        }
      }
    }

    return issues;
  }

  private findSDKTypeForDTO(
    dto: DtoDefinition,
    sdkTypes: string[],
  ): string | null {
    for (const typeContent of sdkTypes) {
      if (typeContent.includes(`interface ${dto.name}`)) {
        return typeContent;
      }
    }
    return null;
  }

  private extractSDKTypeProperties(sdkTypeContent: string): Set<string> {
    const props = new Set<string>();
    const lines = sdkTypeContent.split('\n');
    for (const line of lines) {
      const match = line.trim().match(/^(\w+)\??\s*:/);
      if (match) {
        props.add(match[1]);
      }
    }
    return props;
  }

  private extractSDKPropertyType(
    sdkTypeContent: string,
    propName: string,
  ): string | null {
    const lines = sdkTypeContent.split('\n');
    for (const line of lines) {
      const match = line.trim().match(new RegExp(`^${propName}\\??:\\s*(.+?)\\s*;?$`));
      if (match) {
        return match[1].trim();
      }
    }
    return null;
  }

  private extractSDKEnums(sdkResult: SDKGenerationResult): SDKEnumDefinition[] {
    const enums: SDKEnumDefinition[] = [];
    for (const file of sdkResult.files) {
      if (file.path.includes('enums/') && file.path.endsWith('.ts')) {
        const matches = file.content.matchAll(
          /export const (\w+) = \{([\s\S]*?)\} as const;/g,
        );
        for (const match of matches) {
          const name = match[1];
          const valuesMatch = match[2].matchAll(/(\w+):\s*'([^']+)'/g);
          const values: string[] = [];
          for (const vm of valuesMatch) {
            values.push(vm[2]);
          }
          enums.push({ name, values });
        }
      }
    }
    return enums;
  }

  private extractEndpointCount(document: OpenAPIDocument): number {
    let count = 0;
    for (const pathItem of Object.values(document.paths)) {
      if (!pathItem || typeof pathItem !== 'object') continue;
      for (const method of Object.keys(pathItem)) {
        if (HTTP_METHODS.includes(method.toUpperCase() as typeof HTTP_METHODS[number])) {
          count++;
        }
      }
    }
    return count;
  }

  private extractEndpointMap(
    document: OpenAPIDocument,
  ): Map<string, { method: string; path: string }> {
    const map = new Map<string, { method: string; path: string }>();
    for (const [pathStr, pathItem] of Object.entries(document.paths)) {
      if (!pathItem || typeof pathItem !== 'object') continue;
      for (const method of Object.keys(pathItem)) {
        if (HTTP_METHODS.includes(method.toUpperCase() as typeof HTTP_METHODS[number])) {
          map.set(`${method.toUpperCase()}:${pathStr}`, {
            method: method.toUpperCase(),
            path: pathStr,
          });
        }
      }
    }
    return map;
  }

  private extractEnumMap(
    document: OpenAPIDocument,
  ): Map<string, string[]> {
    const map = new Map<string, string[]>();
    for (const [name, schema] of Object.entries(
      document.components?.schemas || {},
    )) {
      if (schema.enum) {
        map.set(name, [...schema.enum]);
      }
    }
    return map;
  }

  private extractModuleEndpointsFromContent(content: string): string[] {
    const endpoints: string[] = [];
    const matches = content.matchAll(/async (\w+)\(/g);
    for (const match of matches) {
      endpoints.push(match[1]);
    }
    return endpoints;
  }

  private findPathForModule(
    filePath: string,
    document: OpenAPIDocument,
  ): Record<string, unknown> | null {
    const tagMatch = filePath.match(/modules\/(\w+)\.ts$/);
    if (!tagMatch) return null;
    const tag = tagMatch[1];
    return document.paths[Object.keys(document.paths)[0]] as Record<string, unknown> || null;
  }

  private endpointExistsInSpec(
    endpointName: string,
    document: OpenAPIDocument,
  ): boolean {
    for (const pathItem of Object.values(document.paths)) {
      if (!pathItem || typeof pathItem !== 'object') continue;
      for (const operation of Object.values(pathItem)) {
        if (typeof operation === 'object' && operation !== null) {
          const op = operation as Record<string, unknown>;
          if (op.operationId === endpointName) return true;
        }
      }
    }
    return false;
  }

  private createIssue(
    category: ValidationCategory,
    severity: ValidationSeverity,
    message: string,
    path: string,
    details: Record<string, unknown>,
  ): ValidationIssue {
    return {
      id: `val-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      category,
      severity,
      message,
      path,
      details,
      timestamp: new Date().toISOString(),
    };
  }

  private createCompatIssue(
    category: ValidationCategory,
    severity: ValidationSeverity,
    message: string,
    source: string,
    target: string,
    details: Record<string, unknown>,
  ): CompatibilityIssue {
    return {
      id: `compat-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      category,
      severity,
      message,
      path: source,
      source,
      target,
      details,
      timestamp: new Date().toISOString(),
    };
  }

  private createBreakingChange(
    category: ValidationCategory,
    message: string,
    impact: 'HIGH' | 'MEDIUM' | 'LOW',
    source: string,
    target: string,
    details: Record<string, unknown>,
  ): BreakingChange {
    return {
      id: `bc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      category,
      message,
      impact,
      source,
      target,
      details,
      timestamp: new Date().toISOString(),
    };
  }

  private formatMarkdown(
    report: ValidationReport | CompatibilityReport | BreakingChangeReport | WarningReport | ContractValidationSummary,
  ): string {
    const lines: string[] = [this.config.exportBanner, ''];

    if ('isValid' in report && 'issues' in report) {
      const r = report as ValidationReport;
      lines.push('# Validation Report');
      lines.push('');
      lines.push(`**Valid:** ${r.isValid ? 'Yes' : 'No'}`);
      lines.push(`**Total Issues:** ${r.issues.length}`);
      lines.push(`**Duration:** ${r.durationMs}ms`);
      lines.push('');
      lines.push('## Issues');
      lines.push('');
      for (const issue of r.issues) {
        lines.push(`- **[${issue.severity}]** ${issue.message}`);
      }
    } else if ('isCompatible' in report && 'issues' in report) {
      const r = report as CompatibilityReport;
      lines.push('# Compatibility Report');
      lines.push('');
      lines.push(`**Compatible:** ${r.isCompatible ? 'Yes' : 'No'}`);
      lines.push(`**Total Issues:** ${r.issues.length}`);
      lines.push('');
      for (const issue of r.issues) {
        lines.push(`- **[${issue.severity}]** ${issue.message}`);
      }
    } else if ('hasBreakingChanges' in report) {
      const r = report as BreakingChangeReport;
      lines.push('# Breaking Change Report');
      lines.push('');
      lines.push(`**Has Breaking Changes:** ${r.hasBreakingChanges ? 'Yes' : 'No'}`);
      lines.push(`**Total Changes:** ${r.changes.length}`);
      lines.push('');
      for (const change of r.changes) {
        lines.push(`- **[${change.impact}]** ${change.message}`);
      }
    } else if ('totalValidations' in report) {
      const r = report as ContractValidationSummary;
      lines.push('# Contract Validation Summary');
      lines.push('');
      lines.push(`**Total Validations:** ${r.totalValidations}`);
      lines.push(`**Passed:** ${r.passedValidations}`);
      lines.push(`**Failed:** ${r.failedValidations}`);
      lines.push(`**Errors:** ${r.errors}`);
      lines.push(`**Warnings:** ${r.warnings}`);
      lines.push(`**Breaking Changes:** ${r.breakingChanges}`);
    } else if ('warnings' in report) {
      const r = report as WarningReport;
      lines.push('# Warning Report');
      lines.push('');
      lines.push(`**Total Warnings:** ${r.warnings.length}`);
      lines.push('');
      for (const warning of r.warnings) {
        lines.push(`- [${warning.category}] ${warning.message}`);
      }
    }

    return lines.join('\n');
  }

  private formatConsole(
    report: ValidationReport | CompatibilityReport | BreakingChangeReport | WarningReport | ContractValidationSummary,
  ): string {
    const lines: string[] = [];

    if ('isValid' in report && 'issues' in report) {
      const r = report as ValidationReport;
      lines.push(`Validation Report: ${r.isValid ? 'VALID' : 'INVALID'}`);
      lines.push(`Issues: ${r.issues.length}`);
      for (const issue of r.issues) {
        lines.push(`  [${issue.severity}] ${issue.category}: ${issue.message}`);
      }
    } else if ('isCompatible' in report && 'issues' in report) {
      const r = report as CompatibilityReport;
      lines.push(`Compatibility Report: ${r.isCompatible ? 'COMPATIBLE' : 'INCOMPATIBLE'}`);
      lines.push(`Issues: ${r.issues.length}`);
      for (const issue of r.issues) {
        lines.push(`  [${issue.severity}] ${issue.category}: ${issue.message}`);
      }
    } else if ('hasBreakingChanges' in report) {
      const r = report as BreakingChangeReport;
      lines.push(`Breaking Changes: ${r.hasBreakingChanges ? 'YES' : 'NO'}`);
      lines.push(`Total: ${r.changes.length}`);
      for (const change of r.changes) {
        lines.push(`  [${change.impact}] ${change.category}: ${change.message}`);
      }
    } else if ('totalValidations' in report) {
      const r = report as ContractValidationSummary;
      lines.push('Contract Validation Summary');
      lines.push(`  Total: ${r.totalValidations}`);
      lines.push(`  Passed: ${r.passedValidations}`);
      lines.push(`  Failed: ${r.failedValidations}`);
    } else if ('warnings' in report) {
      const r = report as WarningReport;
      lines.push(`Warnings: ${r.warnings.length}`);
      for (const warning of r.warnings) {
        lines.push(`  [${warning.category}] ${warning.message}`);
      }
    }

    return lines.join('\n');
  }
}
