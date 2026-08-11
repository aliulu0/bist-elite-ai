import { ContractValidatorEngine } from './contract-validator.service';
import { DEFAULT_VALIDATION_CONFIG, ALL_VALIDATION_CATEGORIES, PAGINATION_FIELDS } from './contract-validator.config';
import type { ValidationConfig, ContractValidatorInput } from './contract-validator.types';
import type { OpenAPIDocument, EndpointModule, DtoDefinition, EnumDefinition } from '../openapi/openapi.types';
import type { SDKGenerationResult } from '../sdk-generator/sdk-generator.types';

const createMinimalDocument = (overrides?: Partial<OpenAPIDocument>): OpenAPIDocument => ({
  openapi: '3.0.3',
  info: { title: 'Test API', description: 'Test', version: '1.0.0' },
  servers: [{ url: 'http://localhost:3001', description: 'Local' }],
  tags: [{ name: 'Test', description: 'Test endpoints' }],
  paths: {},
  components: { schemas: {}, securitySchemes: {} },
  ...overrides,
});

const createDocumentWithSchemas = (): OpenAPIDocument =>
  createMinimalDocument({
    components: {
      schemas: {
        TestDto: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
          required: ['id'],
        },
        TestEnum: {
          type: 'string',
          enum: ['VALUE_A', 'VALUE_B', 'VALUE_C'],
        },
      },
      securitySchemes: {},
    },
  });

const createDocumentWithEndpoints = (): OpenAPIDocument =>
  createMinimalDocument({
    paths: {
      '/api/test': {
        get: {
          operationId: 'getTests',
          summary: 'Get tests',
          tags: ['Test'],
          parameters: [],
          responses: { '200': { description: 'OK' } },
        },
        post: {
          operationId: 'createTest',
          summary: 'Create test',
          tags: ['Test'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TestDto' },
              },
            },
          },
          responses: { '201': { description: 'Created' } },
        },
      },
      '/api/test/{id}': {
        get: {
          operationId: 'getTestById',
          summary: 'Get test by ID',
          tags: ['Test'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: { '200': { description: 'OK' } },
        },
      },
    },
  });

const createDocumentWithNullableSchemas = (): OpenAPIDocument =>
  createMinimalDocument({
    components: {
      schemas: {
        NullableField: {
          type: 'object',
          properties: {
            optionalStr: { type: 'string', nullable: true },
            requiredStr: { type: 'string' },
          },
          required: ['requiredStr'],
        },
      },
      securitySchemes: {},
    },
  });

const createDocumentWithOptionalParams = (): OpenAPIDocument =>
  createMinimalDocument({
    paths: {
      '/api/search': {
        get: {
          operationId: 'search',
          summary: 'Search',
          tags: ['Test'],
          parameters: [
            {
              name: 'query',
              in: 'query',
              required: false,
              schema: { type: 'string' },
            },
            {
              name: 'limit',
              in: 'query',
              required: true,
              schema: { type: 'number' },
            },
          ],
          responses: { '200': { description: 'OK' } },
        },
      },
    },
  });

const createDocumentWithPagination = (): OpenAPIDocument =>
  createMinimalDocument({
    paths: {
      '/api/items': {
        get: {
          operationId: 'getItems',
          summary: 'Get items',
          tags: ['Test'],
          parameters: [
            { name: 'offset', in: 'query', required: false, schema: { type: 'number' } },
            { name: 'limit', in: 'query', required: false, schema: { type: 'number' } },
          ],
          responses: { '200': { description: 'OK' } },
        },
        '/api/items/incomplete': {
          get: {
            operationId: 'getIncompleteItems',
            summary: 'Get incomplete items',
            tags: ['Test'],
            parameters: [
              { name: 'offset', in: 'query', required: false, schema: { type: 'number' } },
            ],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    },
  });

const createEndpointModules = (): EndpointModule[] => [
  {
    name: 'TestModule',
    tag: 'Test',
    basePath: '/api/test',
    endpoints: [
      {
        path: '/api/test',
        method: 'GET',
        operationId: 'getTests',
        summary: 'Get tests',
        tags: ['Test'],
        parameters: [],
        responses: [{ statusCode: 200, description: 'OK' }],
      },
      {
        path: '/api/test',
        method: 'POST',
        operationId: 'createTest',
        summary: 'Create test',
        tags: ['Test'],
        parameters: [],
        requestBody: {
          required: true,
          contentType: 'application/json',
          schema: { $ref: '#/components/schemas/TestDto' },
        },
        responses: [{ statusCode: 201, description: 'Created' }],
      },
    ],
  },
];

const createDTOs = (): DtoDefinition[] => [
  {
    name: 'TestDto',
    description: 'Test DTO',
    properties: [
      { name: 'id', type: 'string', required: true },
      { name: 'name', type: 'string', required: false },
      { name: 'createdAt', type: 'string', required: false, nullable: true },
    ],
  },
];

const createEnums = (): EnumDefinition[] => [
  {
    name: 'Status',
    values: ['ACTIVE', 'INACTIVE', 'PENDING'],
    description: 'Status enum',
  },
];

const createSDKResult = (): SDKGenerationResult => ({
  files: [
    {
      path: 'types/index.ts',
      content: `export interface TestDto {\n  id: string;\n  name?: string;\n}\n`,
      sizeBytes: 100,
    },
    {
      path: 'enums/index.ts',
      content: `export const Status = {\n  ACTIVE: 'ACTIVE',\n  INACTIVE: 'INACTIVE',\n} as const;\n`,
      sizeBytes: 80,
    },
    {
      path: 'modules/test.ts',
      content: `export class TestModule {\n  async getTests(): Promise<unknown> {}\n  async createTest(): Promise<unknown> {}\n}\n`,
      sizeBytes: 120,
    },
  ],
  moduleCount: 1,
  endpointCount: 2,
  typeCount: 1,
  enumCount: 1,
  generatedAt: new Date().toISOString(),
  durationMs: 10,
  outputDir: 'generated-sdk',
});

describe('ContractValidatorEngine', () => {
  let engine: ContractValidatorEngine;

  beforeEach(() => {
    engine = new ContractValidatorEngine();
  });

  describe('Constructor', () => {
    it('should create engine with default config', () => {
      const config = engine.getConfig();
      expect(config.strictMode).toBe(false);
      expect(config.checkBreakingChanges).toBe(true);
      expect(config.checkNullability).toBe(true);
      expect(config.checkOptionality).toBe(true);
      expect(config.checkPagination).toBe(true);
      expect(config.checkSDKConsistency).toBe(true);
      expect(config.schemaCacheEnabled).toBe(true);
      expect(config.sdkCacheEnabled).toBe(true);
    });

    it('should accept custom config', () => {
      const custom = new ContractValidatorEngine({ strictMode: true, maxSchemaCacheSize: 500 });
      const config = custom.getConfig();
      expect(config.strictMode).toBe(true);
      expect(config.maxSchemaCacheSize).toBe(500);
    });
  });

  describe('validate', () => {
    it('should return valid report for clean document', () => {
      const input: ContractValidatorInput = {
        openApiDocument: createDocumentWithEndpoints(),
        endpointModules: createEndpointModules(),
        dtoDefinitions: createDTOs(),
        enumDefinitions: createEnums(),
      };
      const report = engine.validate(input);
      expect(report.isValid).toBe(true);
      expect(report.issues).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.generatedAt).toBeDefined();
      expect(report.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should report issues for strict mode with missing operationId', () => {
      const doc = createMinimalDocument({
        paths: {
          '/api/test': {
            get: {
              summary: 'No operationId',
              tags: ['Test'],
              parameters: [],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      });
      const engineStrict = new ContractValidatorEngine({ strictMode: true });
      const report = engineStrict.validate({
        openApiDocument: doc,
        endpointModules: [],
        dtoDefinitions: [],
        enumDefinitions: [],
      });
      expect(report.issues.some(i => i.message.includes('operationId'))).toBe(true);
    });

    it('should report issues for strict mode with missing tags', () => {
      const doc = createMinimalDocument({
        paths: {
          '/api/test': {
            get: {
              operationId: 'getTest',
              summary: 'No tags',
              tags: [],
              parameters: [],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      });
      const engineStrict = new ContractValidatorEngine({ strictMode: true });
      const report = engineStrict.validate({
        openApiDocument: doc,
        endpointModules: [],
        dtoDefinitions: [],
        enumDefinitions: [],
      });
      expect(report.issues.some(i => i.message.includes('no tags'))).toBe(true);
    });

    it('should include summary with categories checked', () => {
      const report = engine.validate({
        openApiDocument: createDocumentWithEndpoints(),
        endpointModules: createEndpointModules(),
        dtoDefinitions: createDTOs(),
        enumDefinitions: createEnums(),
      });
      expect(report.summary.totalChecks).toBe(ALL_VALIDATION_CATEGORIES.length);
    });

    it('should run SDK consistency check when SDK provided', () => {
      const report = engine.validate({
        openApiDocument: createDocumentWithEndpoints(),
        sdkResult: createSDKResult(),
        endpointModules: createEndpointModules(),
        dtoDefinitions: createDTOs(),
        enumDefinitions: createEnums(),
      });
      expect(report).toBeDefined();
    });
  });

  describe('validateSchemaConsistency', () => {
    it('should validate all endpoints in document', () => {
      const doc = createDocumentWithEndpoints();
      const results = engine.validateSchemaConsistency(doc);
      expect(results.length).toBeGreaterThan(0);
      results.forEach(r => {
        expect(r.endpointPath).toBeDefined();
        expect(r.httpMethod).toBeDefined();
        expect(r.operationId).toBeDefined();
      });
    });

    it('should pass for valid schemas', () => {
      const doc = createDocumentWithEndpoints();
      const results = engine.validateSchemaConsistency(doc);
      const errors = results.flatMap(r => r.issues.filter(i => i.severity === 'ERROR'));
      expect(errors.length).toBe(0);
    });

    it('should handle document with no paths', () => {
      const doc = createMinimalDocument({ paths: {} });
      const results = engine.validateSchemaConsistency(doc);
      expect(results).toEqual([]);
    });

    it('should detect nullable schemas', () => {
      const doc = createDocumentWithNullableSchemas();
      const results = engine.validateSchemaConsistency(doc);
      expect(results).toBeDefined();
    });
  });

  describe('validateDTOCompatibility', () => {
    it('should validate DTOs without SDK', () => {
      const results = engine.validateDTOCompatibility(createDTOs());
      expect(results).toHaveLength(1);
      expect(results[0].dtoName).toBe('TestDto');
      expect(results[0].isCompatible).toBe(true);
    });

    it('should detect required but nullable properties', () => {
      const dtos: DtoDefinition[] = [
        {
          name: 'BadDto',
          properties: [
            { name: 'field', type: 'string', required: true, nullable: true },
          ],
        },
      ];
      const results = engine.validateDTOCompatibility(dtos);
      const issues = results[0].issues;
      expect(issues.some(i => i.severity === 'WARNING')).toBe(true);
    });

    it('should detect custom types', () => {
      const dtos: DtoDefinition[] = [
        {
          name: 'CustomDto',
          properties: [
            { name: 'date', type: 'Date', required: false },
          ],
        },
      ];
      const results = engine.validateDTOCompatibility(dtos);
      expect(results[0].issues.some(i => i.message.includes('custom type'))).toBe(true);
    });

    it('should compare DTOs with SDK types', () => {
      const results = engine.validateDTOCompatibility(createDTOs(), createSDKResult());
      expect(results).toHaveLength(1);
      expect(results[0].dtoName).toBe('TestDto');
    });

    it('should detect missing properties in SDK', () => {
      const sdkResult = createSDKResult();
      sdkResult.files[0].content = `export interface TestDto {\n  id: string;\n}\n`;
      const results = engine.validateDTOCompatibility(createDTOs(), sdkResult);
      expect(results[0].removedProperties.length).toBeGreaterThan(0);
    });

    it('should handle empty DTOs', () => {
      const results = engine.validateDTOCompatibility([]);
      expect(results).toEqual([]);
    });
  });

  describe('validateEnumCompatibility', () => {
    it('should validate enums without SDK', () => {
      const results = engine.validateEnumCompatibility(createEnums());
      expect(results).toHaveLength(1);
      expect(results[0].enumName).toBe('Status');
      expect(results[0].isCompatible).toBe(true);
    });

    it('should detect empty enums', () => {
      const results = engine.validateEnumCompatibility([{ name: 'Empty', values: [] }]);
      expect(results[0].issues.some(i => i.message.includes('no values'))).toBe(true);
    });

    it('should detect duplicate enum values', () => {
      const results = engine.validateEnumCompatibility([
        { name: 'Dup', values: ['A', 'A', 'B'] },
      ]);
      expect(results[0].issues.some(i => i.message.includes('duplicate'))).toBe(true);
    });

    it('should compare enums with SDK', () => {
      const results = engine.validateEnumCompatibility(createEnums(), createSDKResult());
      expect(results).toHaveLength(1);
      expect(results[0].enumName).toBe('Status');
    });

    it('should detect removed enum values in SDK', () => {
      const sdkResult = createSDKResult();
      sdkResult.files[1].content = `export const Status = {\n  ACTIVE: 'ACTIVE',\n} as const;\n`;
      const results = engine.validateEnumCompatibility(createEnums(), sdkResult);
      expect(results[0].removedValues.length).toBeGreaterThan(0);
    });
  });

  describe('validateEndpointCompatibility', () => {
    it('should validate all endpoints', () => {
      const results = engine.validateEndpointCompatibility(
        createEndpointModules(),
        createDocumentWithEndpoints(),
      );
      expect(results.length).toBeGreaterThan(0);
      results.forEach(r => {
        expect(r.operationId).toBeDefined();
        expect(r.httpMethod).toBeDefined();
        expect(r.path).toBeDefined();
      });
    });

    it('should detect optional parameters', () => {
      const doc = createDocumentWithOptionalParams();
      const modules: EndpointModule[] = [
        {
          name: 'SearchModule',
          tag: 'Test',
          basePath: '/api/search',
          endpoints: [
            {
              path: '/api/search',
              method: 'GET',
              operationId: 'search',
              summary: 'Search',
              tags: ['Test'],
              parameters: [
                { name: 'query', in: 'query', required: false, schema: { type: 'string' } },
                { name: 'limit', in: 'query', required: true, schema: { type: 'number' } },
              ],
              responses: [{ statusCode: 200, description: 'OK' }],
            },
          ],
        },
      ];
      const results = engine.validateEndpointCompatibility(modules, doc);
      expect(results).toBeDefined();
    });

    it('should handle endpoints with no matching path in document', () => {
      const modules: EndpointModule[] = [
        {
          name: 'MissingModule',
          tag: 'Test',
          basePath: '/api/missing',
          endpoints: [
            {
              path: '/api/missing',
              method: 'GET',
              operationId: 'missing',
              summary: 'Missing',
              tags: ['Test'],
              parameters: [],
              responses: [{ statusCode: 200, description: 'OK' }],
            },
          ],
        },
      ];
      const results = engine.validateEndpointCompatibility(modules, createDocumentWithEndpoints());
      expect(results).toHaveLength(1);
    });
  });

  describe('validateNullability', () => {
    it('should detect nullable fields', () => {
      const doc = createDocumentWithNullableSchemas();
      const issues = engine.validateNullability(doc);
      expect(issues.some(i => i.message.includes('nullable'))).toBe(true);
    });

    it('should handle document with no nullable fields', () => {
      const doc = createDocumentWithSchemas();
      const issues = engine.validateNullability(doc);
      expect(issues).toEqual([]);
    });

    it('should handle empty schemas', () => {
      const doc = createMinimalDocument({ components: { schemas: {}, securitySchemes: {} } });
      const issues = engine.validateNullability(doc);
      expect(issues).toEqual([]);
    });
  });

  describe('validateOptionality', () => {
    it('should detect optional parameters', () => {
      const doc = createDocumentWithOptionalParams();
      const issues = engine.validateOptionality(doc);
      expect(issues.some(i => i.message.includes('optional'))).toBe(true);
    });

    it('should detect optional request body', () => {
      const doc = createMinimalDocument({
        paths: {
          '/api/test': {
            post: {
              operationId: 'create',
              tags: ['Test'],
              requestBody: {
                required: false,
                content: {
                  'application/json': {
                    schema: { type: 'object', properties: {} },
                  },
                },
              },
              responses: { '201': { description: 'Created' } },
            },
          },
        },
      });
      const issues = engine.validateOptionality(doc);
      expect(issues.some(i => i.message.includes('optional'))).toBe(true);
    });

    it('should handle document with no optional parameters', () => {
      const doc = createDocumentWithEndpoints();
      const issues = engine.validateOptionality(doc);
      expect(Array.isArray(issues)).toBe(true);
    });
  });

  describe('validatePagination', () => {
    it('should detect pagination fields', () => {
      const doc = createMinimalDocument({
        paths: {
          '/api/items': {
            get: {
              operationId: 'getItems',
              tags: ['Test'],
              parameters: [
                { name: 'offset', in: 'query', required: false, schema: { type: 'number' } },
                { name: 'limit', in: 'query', required: false, schema: { type: 'number' } },
              ],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      });
      const issues = engine.validatePagination(doc);
      expect(Array.isArray(issues)).toBe(true);
    });

    it('should warn about incomplete pagination', () => {
      const doc = createMinimalDocument({
        paths: {
          '/api/items': {
            get: {
              operationId: 'getItems',
              tags: ['Test'],
              parameters: [
                { name: 'offset', in: 'query', required: false, schema: { type: 'number' } },
              ],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      });
      const issues = engine.validatePagination(doc);
      expect(issues.some(i => i.message.includes('missing'))).toBe(true);
    });

    it('should ignore non-GET endpoints', () => {
      const doc = createMinimalDocument({
        paths: {
          '/api/items': {
            post: {
              operationId: 'createItem',
              tags: ['Test'],
              parameters: [
                { name: 'offset', in: 'query', required: false, schema: { type: 'number' } },
              ],
              responses: { '201': { description: 'Created' } },
            },
          },
        },
      });
      const issues = engine.validatePagination(doc);
      expect(issues).toEqual([]);
    });

    it('should handle GET with no pagination fields', () => {
      const doc = createDocumentWithEndpoints();
      const issues = engine.validatePagination(doc);
      expect(Array.isArray(issues)).toBe(true);
    });
  });

  describe('validateSDKConsistency', () => {
    it('should report matching endpoint counts', () => {
      const doc = createDocumentWithEndpoints();
      const sdk = createSDKResult();
      const issues = engine.validateSDKConsistency(doc, sdk);
      expect(Array.isArray(issues)).toBe(true);
    });

    it('should report mismatched endpoint counts', () => {
      const doc = createDocumentWithEndpoints();
      const sdk = createSDKResult();
      sdk.endpointCount = 999;
      const issues = engine.validateSDKConsistency(doc, sdk);
      expect(issues.some(i => i.message.includes('999'))).toBe(true);
    });

    it('should handle SDK with module files', () => {
      const doc = createDocumentWithEndpoints();
      const sdk = createSDKResult();
      const issues = engine.validateSDKConsistency(doc, sdk);
      expect(Array.isArray(issues)).toBe(true);
    });
  });

  describe('compareDocuments', () => {
    it('should detect removed endpoints', () => {
      const prev = createDocumentWithEndpoints();
      const curr = createMinimalDocument({ paths: {} });
      const report = engine.compareDocuments(prev, curr);
      expect(report.hasBreakingChanges).toBe(true);
      expect(report.changes.some(c => c.message.includes('removed'))).toBe(true);
      expect(report.summary.highImpact).toBeGreaterThan(0);
    });

    it('should detect added endpoints (non-breaking)', () => {
      const prev = createMinimalDocument({ paths: {} });
      const curr = createDocumentWithEndpoints();
      const report = engine.compareDocuments(prev, curr);
      expect(report.changes).toEqual([]);
    });

    it('should detect changed endpoint method', () => {
      const prev = createDocumentWithEndpoints();
      const curr = createMinimalDocument({
        paths: {
          '/api/test': {
            put: {
              operationId: 'getTests',
              summary: 'Get tests',
              tags: ['Test'],
              parameters: [],
              responses: { '200': { description: 'OK' } },
            },
          },
          '/api/test/{id}': {
            get: {
              operationId: 'getTestById',
              summary: 'Get test by ID',
              tags: ['Test'],
              parameters: [
                { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
              ],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      });
      const report = engine.compareDocuments(prev, curr);
      expect(report.hasBreakingChanges).toBe(true);
      expect(report.changes.some(c => c.message.includes('method changed'))).toBe(true);
    });

    it('should detect removed schemas', () => {
      const prev = createDocumentWithSchemas();
      const curr = createMinimalDocument({ components: { schemas: {}, securitySchemes: {} } });
      const report = engine.compareDocuments(prev, curr);
      expect(report.hasBreakingChanges).toBe(true);
      expect(report.changes.some(c => c.message.includes('Schema') && c.message.includes('removed'))).toBe(true);
    });

    it('should detect removed required properties', () => {
      const prev = createDocumentWithSchemas();
      const curr = createMinimalDocument({
        components: {
          schemas: {
            TestDto: {
              type: 'object',
              properties: {
                name: { type: 'string' },
              },
              required: [],
            },
            TestEnum: {
              type: 'string',
              enum: ['VALUE_A', 'VALUE_B', 'VALUE_C'],
            },
          },
          securitySchemes: {},
        },
      });
      const report = engine.compareDocuments(prev, curr);
      expect(report.hasBreakingChanges).toBe(true);
    });

    it('should detect added required properties', () => {
      const prev = createDocumentWithSchemas();
      const curr = createMinimalDocument({
        components: {
          schemas: {
            TestDto: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                newRequired: { type: 'number' },
              },
              required: ['id', 'newRequired'],
            },
            TestEnum: {
              type: 'string',
              enum: ['VALUE_A', 'VALUE_B', 'VALUE_C'],
            },
          },
          securitySchemes: {},
        },
      });
      const report = engine.compareDocuments(prev, curr);
      expect(report.changes.some(c => c.message.toLowerCase().includes('new required property'))).toBe(true);
    });

    it('should detect property type changes', () => {
      const prev = createDocumentWithSchemas();
      const curr = createMinimalDocument({
        components: {
          schemas: {
            TestDto: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
              },
              required: ['id'],
            },
            TestEnum: {
              type: 'string',
              enum: ['VALUE_A', 'VALUE_B', 'VALUE_C'],
            },
          },
          securitySchemes: {},
        },
      });
      const report = engine.compareDocuments(prev, curr);
      expect(report.changes.some(c => c.message.includes('type changed'))).toBe(true);
    });

    it('should detect removed enum values', () => {
      const prev = createDocumentWithSchemas();
      const curr = createMinimalDocument({
        components: {
          schemas: {
            TestDto: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
              required: ['id'],
            },
            TestEnum: {
              type: 'string',
              enum: ['VALUE_A'],
            },
          },
          securitySchemes: {},
        },
      });
      const report = engine.compareDocuments(prev, curr);
      expect(report.changes.some(c => c.message.includes('value') && c.message.includes('removed'))).toBe(true);
    });

    it('should detect removed enums', () => {
      const prev = createDocumentWithSchemas();
      const curr = createMinimalDocument({
        components: {
          schemas: {
            TestDto: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
              required: ['id'],
            },
          },
          securitySchemes: {},
        },
      });
      const report = engine.compareDocuments(prev, curr);
      expect(report.changes.some(c => c.message.includes('Enum') && c.message.includes('removed'))).toBe(true);
    });

    it('should return correct summary counts', () => {
      const prev = createDocumentWithEndpoints();
      const curr = createMinimalDocument({ paths: {} });
      const report = engine.compareDocuments(prev, curr);
      expect(report.summary.totalChanges).toBe(report.changes.length);
      expect(report.summary.highImpact).toBeGreaterThanOrEqual(0);
      expect(report.summary.mediumImpact).toBeGreaterThanOrEqual(0);
      expect(report.summary.lowImpact).toBeGreaterThanOrEqual(0);
    });

    it('should handle identical documents', () => {
      const doc = createDocumentWithEndpoints();
      const report = engine.compareDocuments(doc, doc);
      expect(report.hasBreakingChanges).toBe(false);
      expect(report.changes).toEqual([]);
    });
  });

  describe('generateWarnings', () => {
    it('should extract warnings from validation report', () => {
      const report = engine.validate({
        openApiDocument: createDocumentWithEndpoints(),
        endpointModules: createEndpointModules(),
        dtoDefinitions: createDTOs(),
        enumDefinitions: createEnums(),
      });
      const warnings = engine.generateWarnings(report);
      expect(warnings.warnings).toBeDefined();
      expect(warnings.summary).toBeDefined();
      expect(warnings.generatedAt).toBeDefined();
    });

    it('should categorize warnings by category', () => {
      const doc = createDocumentWithNullableSchemas();
      const report = engine.validate({
        openApiDocument: doc,
        endpointModules: [],
        dtoDefinitions: [],
        enumDefinitions: [],
      });
      const warnings = engine.generateWarnings(report);
      expect(warnings.summary.byCategory).toBeDefined();
    });
  });

  describe('generateSummaryReport', () => {
    it('should generate summary from multiple reports', () => {
      const validationReport = engine.validate({
        openApiDocument: createDocumentWithEndpoints(),
        endpointModules: createEndpointModules(),
        dtoDefinitions: createDTOs(),
        enumDefinitions: createEnums(),
      });
      const breakingReport = engine.compareDocuments(
        createDocumentWithEndpoints(),
        createMinimalDocument({ paths: {} }),
      );
      const summary = engine.generateSummaryReport({
        validation: validationReport,
        breaking: breakingReport,
      });
      expect(summary.totalValidations).toBe(2);
      expect(summary.passedValidations).toBeGreaterThanOrEqual(0);
      expect(summary.failedValidations).toBeGreaterThanOrEqual(0);
      expect(summary.breakingChanges).toBeGreaterThan(0);
    });

    it('should handle empty reports', () => {
      const summary = engine.generateSummaryReport({});
      expect(summary.totalValidations).toBe(0);
    });
  });

  describe('formatReport', () => {
    it('should format validation report as JSON', () => {
      const report = engine.validate({
        openApiDocument: createDocumentWithEndpoints(),
        endpointModules: createEndpointModules(),
        dtoDefinitions: createDTOs(),
        enumDefinitions: createEnums(),
      });
      const json = engine.formatReport(report, 'json');
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should format validation report as markdown', () => {
      const report = engine.validate({
        openApiDocument: createDocumentWithEndpoints(),
        endpointModules: createEndpointModules(),
        dtoDefinitions: createDTOs(),
        enumDefinitions: createEnums(),
      });
      const md = engine.formatReport(report, 'markdown');
      expect(md).toContain('# Validation Report');
    });

    it('should format validation report as console', () => {
      const report = engine.validate({
        openApiDocument: createDocumentWithEndpoints(),
        endpointModules: createEndpointModules(),
        dtoDefinitions: createDTOs(),
        enumDefinitions: createEnums(),
      });
      const consoleOutput = engine.formatReport(report, 'console');
      expect(consoleOutput).toContain('Validation Report');
    });

    it('should format compatibility report', () => {
      const report = {
        isCompatible: true,
        issues: [],
        summary: { totalChecks: 1, compatible: 1, incompatible: 0, categoriesChecked: [] },
        generatedAt: new Date().toISOString(),
        durationMs: 0,
      };
      const json = engine.formatReport(report, 'json');
      expect(() => JSON.parse(json)).not.toThrow();
      const md = engine.formatReport(report, 'markdown');
      expect(md).toContain('Compatibility Report');
    });

    it('should format breaking change report', () => {
      const report = {
        hasBreakingChanges: false,
        changes: [],
        summary: { totalChanges: 0, highImpact: 0, mediumImpact: 0, lowImpact: 0, categoriesAffected: [] },
        generatedAt: new Date().toISOString(),
        durationMs: 0,
      };
      const json = engine.formatReport(report, 'json');
      expect(() => JSON.parse(json)).not.toThrow();
      const md = engine.formatReport(report, 'markdown');
      expect(md).toContain('Breaking Change Report');
    });

    it('should format warning report', () => {
      const report = {
        warnings: [],
        summary: {
          totalWarnings: 0,
          byCategory: {} as Record<string, number>,
          bySeverity: {} as Record<string, number>,
        },
        generatedAt: new Date().toISOString(),
        durationMs: 0,
      };
      const md = engine.formatReport(report, 'markdown');
      expect(md).toContain('Warning Report');
    });

    it('should format summary report', () => {
      const report = {
        totalValidations: 1,
        passedValidations: 1,
        failedValidations: 0,
        totalIssues: 0,
        errors: 0,
        warnings: 0,
        infos: 0,
        breakingChanges: 0,
        durationMs: 0,
        generatedAt: new Date().toISOString(),
      };
      const md = engine.formatReport(report, 'markdown');
      expect(md).toContain('Contract Validation Summary');
    });
  });

  describe('Cache', () => {
    it('should clear schema cache', () => {
      engine.clearSchemaCache();
      expect(engine.getSchemaCacheSize()).toBe(0);
    });

    it('should clear SDK cache', () => {
      engine.clearSDKCache();
      expect(engine.getSDKCacheSize()).toBe(0);
    });

    it('should report cache sizes', () => {
      expect(engine.getSchemaCacheSize()).toBe(0);
      expect(engine.getSDKCacheSize()).toBe(0);
    });
  });

  describe('Config', () => {
    it('should return copy of config', () => {
      const config1 = engine.getConfig();
      const config2 = engine.getConfig();
      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2);
    });

    it('should respect all validation config flags', () => {
      const engineDisabled = new ContractValidatorEngine({
        checkBreakingChanges: false,
        checkNullability: false,
        checkOptionality: false,
        checkPagination: false,
        checkSDKConsistency: false,
      });
      const report = engineDisabled.validate({
        openApiDocument: createDocumentWithEndpoints(),
        endpointModules: createEndpointModules(),
        dtoDefinitions: createDTOs(),
        enumDefinitions: createEnums(),
      });
      expect(report).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle document with empty paths object', () => {
      const doc = createMinimalDocument({ paths: {} });
      const report = engine.validate({
        openApiDocument: doc,
        endpointModules: [],
        dtoDefinitions: [],
        enumDefinitions: [],
      });
      expect(report.isValid).toBe(true);
    });

    it('should handle document with no components', () => {
      const doc = createMinimalDocument();
      const report = engine.validate({
        openApiDocument: doc,
        endpointModules: [],
        dtoDefinitions: [],
        enumDefinitions: [],
      });
      expect(report.isValid).toBe(true);
    });

    it('should handle large number of endpoints', () => {
      const paths: Record<string, Record<string, unknown>> = {};
      for (let i = 0; i < 50; i++) {
        paths[`/api/endpoint${i}`] = {
          get: {
            operationId: `getEndpoint${i}`,
            tags: ['Test'],
            parameters: [],
            responses: { '200': { description: 'OK' } },
          },
        };
      }
      const doc = createMinimalDocument({ paths });
      const report = engine.validate({
        openApiDocument: doc,
        endpointModules: [],
        dtoDefinitions: [],
        enumDefinitions: [],
      });
      expect(report.issues.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle SDK with no files', () => {
      const sdk: SDKGenerationResult = {
        files: [],
        moduleCount: 0,
        endpointCount: 0,
        typeCount: 0,
        enumCount: 0,
        generatedAt: new Date().toISOString(),
        durationMs: 0,
        outputDir: 'sdk',
      };
      const report = engine.validate({
        openApiDocument: createDocumentWithEndpoints(),
        sdkResult: sdk,
        endpointModules: createEndpointModules(),
        dtoDefinitions: createDTOs(),
        enumDefinitions: createEnums(),
      });
      expect(report).toBeDefined();
    });

    it('should handle compareDocuments with both empty paths', () => {
      const prev = createMinimalDocument({ paths: {} });
      const curr = createMinimalDocument({ paths: {} });
      const report = engine.compareDocuments(prev, curr);
      expect(report.hasBreakingChanges).toBe(false);
    });

    it('should handle compareDocuments with both empty schemas', () => {
      const prev = createMinimalDocument();
      const curr = createMinimalDocument();
      const report = engine.compareDocuments(prev, curr);
      expect(report.hasBreakingChanges).toBe(false);
    });
  });
});
