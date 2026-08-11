import { SDKGeneratorEngine } from './sdk-generator.service';
import { DEFAULT_SDK_CONFIG, RESERVED_KEYWORDS, TYPE_MAP, PAGINATION_OPS } from './sdk-generator.config';
import type { OpenAPIDocument } from './sdk-generator.types';

const makeDoc = (overrides: Partial<OpenAPIDocument> = {}): OpenAPIDocument => ({
  openapi: '3.0.3',
  info: { title: 'Test API', description: 'Test', version: '1.0.0' },
  servers: [{ url: 'http://localhost:3001', description: 'Local' }],
  tags: [
    { name: 'Health', description: 'Health endpoints' },
    { name: 'Market Data', description: 'Market data' },
    { name: 'Financial Analysis', description: 'Financial analysis' },
  ],
  paths: {
    '/health': {
      get: {
        operationId: 'healthCheck',
        summary: 'Health check',
        tags: ['Health'],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/market-data/{symbol}/latest': {
      get: {
        operationId: 'getLatestPrice',
        summary: 'Get latest price',
        tags: ['Market Data'],
        parameters: [
          { name: 'symbol', in: 'path', required: true, description: 'Stock symbol', schema: { type: 'string', example: 'THYAO' } },
        ],
        responses: {
          '200': { description: 'Latest price', content: { 'application/json': { schema: { type: 'object' } } } },
          '404': { description: 'Not found' },
        },
      },
    },
    '/api/market-data/{symbol}/history': {
      get: {
        operationId: 'getHistory',
        summary: 'Get history',
        tags: ['Market Data'],
        parameters: [
          { name: 'symbol', in: 'path', required: true, description: 'Stock symbol', schema: { type: 'string' } },
          { name: 'timeframe', in: 'query', required: true, description: 'Timeframe', schema: { type: 'string', enum: ['4h', '1d', '1w', '1m'] } },
          { name: 'from', in: 'query', required: false, description: 'Start date', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'History data' } },
      },
    },
    '/api/market-data/timeframes': {
      get: {
        operationId: 'getTimeframes',
        summary: 'Get timeframes',
        tags: ['Market Data'],
        responses: { '200': { description: 'Timeframes' } },
      },
    },
    '/api/financial-analysis/{symbol}': {
      get: {
        operationId: 'financialAnalysis',
        summary: 'Financial analysis',
        tags: ['Financial Analysis'],
        parameters: [
          { name: 'symbol', in: 'path', required: true, description: 'Stock symbol', schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { '$ref': '#/components/schemas/FinancialAnalysisInput' } } },
        },
        responses: { '200': { description: 'Analysis result' } },
      },
    },
    '/api/workflows': {
      get: {
        operationId: 'listWorkflows',
        summary: 'List workflows',
        tags: ['Workflows'],
        parameters: [
          { name: 'offset', in: 'query', required: false, description: 'Skip items', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', required: false, description: 'Max items', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'Workflow list' } },
      },
      post: {
        operationId: 'createWorkflow',
        summary: 'Create workflow',
        tags: ['Workflows'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { '$ref': '#/components/schemas/CreateWorkflowDto' } } },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/api/workflows/{id}': {
      get: {
        operationId: 'getWorkflow',
        summary: 'Get workflow',
        tags: ['Workflows'],
        parameters: [
          { name: 'id', in: 'path', required: true, description: 'Workflow ID', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Workflow details' } },
      },
    },
    '/api/scanner/top': {
      get: {
        operationId: 'getTopCandidates',
        summary: 'Get top candidates',
        tags: ['Scanner'],
        parameters: [
          { name: 'offset', in: 'query', required: false, description: 'Skip', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', required: false, description: 'Max', schema: { type: 'integer' } },
          { name: 'sortBy', in: 'query', required: false, schema: { type: 'string', enum: ['compositeScore', 'rank'] } },
          { name: 'sortDir', in: 'query', required: false, schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: { '200': { description: 'Candidates' } },
      },
    },
  },
  components: {
    schemas: {
      HealthCheckResult: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          timestamp: { type: 'string' },
          checks: { type: 'object' },
        },
        required: ['status', 'timestamp', 'checks'],
        description: 'Health check result',
      },
      CreateWorkflowDto: {
        type: 'object',
        properties: {
          type: { type: 'string', example: 'single_stock_analysis' },
          symbol: { type: 'string', nullable: true },
          metadata: { type: 'object', nullable: true },
        },
        required: ['type'],
        description: 'Request body for creating a workflow',
      },
      FinancialAnalysisInput: {
        type: 'object',
        properties: {
          priceToBook: { type: 'number', example: 1.2, nullable: true },
          enterpriseValueToEBITDA: { type: 'number', example: 8, nullable: true },
          netProfit: { type: 'number', nullable: true },
        },
        required: ['priceToBook', 'enterpriseValueToEBITDA', 'netProfit'],
      },
      WorkflowType: {
        type: 'string',
        enum: ['single_stock_analysis', 'market_scan', 'backtest', 'optimization'],
        description: 'Available workflow types',
      },
      WorkflowStatus: {
        type: 'string',
        enum: ['pending', 'queued', 'running', 'completed', 'failed', 'timeout', 'cancelled'],
        description: 'Workflow statuses',
      },
      Timeframe: {
        type: 'string',
        enum: ['4h', '1d', '1w', '1m', '3m', '6m'],
        description: 'Data timeframe',
      },
      NestedSchema: {
        type: 'object',
        properties: {
          inner: {
            type: 'object',
            properties: {
              value: { type: 'number' },
            },
          },
          items: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
      ArrayRef: {
        type: 'object',
        properties: {
          results: {
            type: 'array',
            items: { '$ref': '#/components/schemas/HealthCheckResult' },
          },
        },
      },
      AllOfSchema: {
        type: 'object',
        allOf: [
          { '$ref': '#/components/schemas/CreateWorkflowDto' },
          {
            type: 'object',
            properties: {
              extra: { type: 'string' },
            },
          },
        ],
      },
      OneOfSchema: {
        type: 'object',
        oneOf: [
          { '$ref': '#/components/schemas/HealthCheckResult' },
          { '$ref': '#/components/schemas/CreateWorkflowDto' },
        ],
      },
      SimpleString: {
        type: 'string',
      },
    },
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer' },
    },
  },
  ...overrides,
});

describe('SDKGeneratorEngine', () => {
  let engine: SDKGeneratorEngine;

  beforeEach(() => {
    engine = new SDKGeneratorEngine();
  });

  describe('Constructor', () => {
    it('should create with default config', () => {
      const eng = new SDKGeneratorEngine();
      expect(eng.getConfig()).toEqual(DEFAULT_SDK_CONFIG);
    });

    it('should override config', () => {
      const eng = new SDKGeneratorEngine({ maxRetries: 5, clientClassName: 'MyClient' });
      const cfg = eng.getConfig();
      expect(cfg.maxRetries).toBe(5);
      expect(cfg.clientClassName).toBe('MyClient');
      expect(cfg.outputDir).toBe(DEFAULT_SDK_CONFIG.outputDir);
    });

    it('should return a copy of config', () => {
      const cfg1 = engine.getConfig();
      cfg1.maxRetries = 999;
      const cfg2 = engine.getConfig();
      expect(cfg2.maxRetries).toBe(DEFAULT_SDK_CONFIG.maxRetries);
    });
  });

  describe('generate()', () => {
    it('should return SDKGenerationResult with correct structure', () => {
      const doc = makeDoc();
      const result = engine.generate(doc);
      expect(result).toHaveProperty('files');
      expect(result).toHaveProperty('moduleCount');
      expect(result).toHaveProperty('endpointCount');
      expect(result).toHaveProperty('typeCount');
      expect(result).toHaveProperty('enumCount');
      expect(result).toHaveProperty('generatedAt');
      expect(result).toHaveProperty('durationMs');
      expect(result).toHaveProperty('outputDir');
    });

    it('should include generatedAt as ISO string', () => {
      const result = engine.generate(makeDoc());
      expect(new Date(result.generatedAt).toISOString()).toBe(result.generatedAt);
    });

    it('should include durationMs >= 0', () => {
      const result = engine.generate(makeDoc());
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should set outputDir from config', () => {
      const result = engine.generate(makeDoc());
      expect(result.outputDir).toBe(DEFAULT_SDK_CONFIG.outputDir);
    });

    it('should generate files array', () => {
      const result = engine.generate(makeDoc());
      expect(Array.isArray(result.files)).toBe(true);
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('should generate index.ts, client.ts, types, enums, and module files', () => {
      const result = engine.generate(makeDoc());
      const paths = result.files.map(f => f.path);
      expect(paths).toContain('index.ts');
      expect(paths).toContain(DEFAULT_SDK_CONFIG.clientFileName);
      expect(paths).toContain(`${DEFAULT_SDK_CONFIG.typesDir}/index.ts`);
      expect(paths).toContain(`${DEFAULT_SDK_CONFIG.enumsDir}/index.ts`);
    });

    it('should have sizeBytes for each file', () => {
      const result = engine.generate(makeDoc());
      for (const file of result.files) {
        expect(file.sizeBytes).toBeGreaterThan(0);
        expect(file.content.length).toBeGreaterThan(0);
      }
    });

    it('should use custom outputDir from config', () => {
      const eng = new SDKGeneratorEngine({ outputDir: 'my-sdk' });
      const result = eng.generate(makeDoc());
      expect(result.outputDir).toBe('my-sdk');
    });

    it('should count moduleCount correctly', () => {
      const result = engine.generate(makeDoc());
      expect(result.moduleCount).toBeGreaterThanOrEqual(1);
    });

    it('should count endpointCount correctly', () => {
      const result = engine.generate(makeDoc());
      expect(result.endpointCount).toBeGreaterThanOrEqual(1);
    });

    it('should count typeCount from schemas', () => {
      const result = engine.generate(makeDoc());
      expect(result.typeCount).toBeGreaterThanOrEqual(1);
    });

    it('should count enumCount from enum schemas', () => {
      const result = engine.generate(makeDoc());
      expect(result.enumCount).toBeGreaterThanOrEqual(1);
    });

    it('should include the export banner in each file', () => {
      const result = engine.generate(makeDoc());
      for (const file of result.files) {
        expect(file.content).toContain(DEFAULT_SDK_CONFIG.exportBanner);
      }
    });
  });

  describe('buildModuleDefinitions()', () => {
    it('should create modules for each tag', () => {
      const doc = makeDoc();
      const modules = engine.buildModuleDefinitions(doc);
      const tags = modules.map(m => m.tag);
      expect(tags).toContain('Health');
      expect(tags).toContain('Market Data');
      expect(tags).toContain('Financial Analysis');
    });

    it('should generate PascalCase className for modules', () => {
      const doc = makeDoc();
      const modules = engine.buildModuleDefinitions(doc);
      const healthMod = modules.find(m => m.tag === 'Health');
      expect(healthMod?.className).toBe('HealthModule');
    });

    it('should generate camelCase file paths', () => {
      const doc = makeDoc();
      const modules = engine.buildModuleDefinitions(doc);
      const healthMod = modules.find(m => m.tag === 'Health');
      expect(healthMod?.filePath).toContain('health.ts');
    });

    it('should include all endpoints for each tag', () => {
      const doc = makeDoc();
      const modules = engine.buildModuleDefinitions(doc);
      const healthMod = modules.find(m => m.tag === 'Health');
      expect(healthMod?.endpoints.length).toBe(1);

      const marketMod = modules.find(m => m.tag === 'Market Data');
      expect(marketMod?.endpoints.length).toBe(3);
    });

    it('should handle empty paths', () => {
      const doc = makeDoc({ paths: {} });
      const modules = engine.buildModuleDefinitions(doc);
      expect(modules).toHaveLength(0);
    });

    it('should handle tags with no endpoints', () => {
      const doc = makeDoc({
        tags: [
          { name: 'Health', description: 'Health endpoints' },
          { name: 'Empty', description: 'Empty tag' },
        ],
        paths: {
          '/health': {
            get: { operationId: 'healthCheck', summary: 'Health', tags: ['Health'], responses: { '200': { description: 'OK' } } },
          },
        },
      });
      const modules = engine.buildModuleDefinitions(doc);
      expect(modules).toHaveLength(1);
      expect(modules[0].tag).toBe('Health');
    });
  });

  describe('buildTypeDefinitions()', () => {
    it('should extract object schemas with properties', () => {
      const doc = makeDoc();
      const types = engine.buildTypeDefinitions(doc);
      const healthType = types.find(t => t.name === 'HealthCheckResult');
      expect(healthType).toBeDefined();
      expect(healthType?.properties.length).toBe(3);
    });

    it('should mark required vs optional properties', () => {
      const doc = makeDoc();
      const types = engine.buildTypeDefinitions(doc);
      const wfType = types.find(t => t.name === 'CreateWorkflowDto');
      expect(wfType).toBeDefined();
      const typeProp = wfType?.properties.find(p => p.name === 'type');
      expect(typeProp?.required).toBe(true);
      const symbolProp = wfType?.properties.find(p => p.name === 'symbol');
      expect(symbolProp?.required).toBe(false);
    });

    it('should include description', () => {
      const doc = makeDoc();
      const types = engine.buildTypeDefinitions(doc);
      const healthType = types.find(t => t.name === 'HealthCheckResult');
      expect(healthType?.description).toBe('Health check result');
    });

    it('should not include enum schemas in types', () => {
      const doc = makeDoc();
      const types = engine.buildTypeDefinitions(doc);
      const names = types.map(t => t.name);
      expect(names).not.toContain('WorkflowType');
      expect(names).not.toContain('WorkflowStatus');
    });

    it('should not include simple string schemas in types', () => {
      const doc = makeDoc();
      const types = engine.buildTypeDefinitions(doc);
      const names = types.map(t => t.name);
      expect(names).not.toContain('SimpleString');
    });

    it('should handle nullable properties', () => {
      const doc = makeDoc();
      const types = engine.buildTypeDefinitions(doc);
      const wfType = types.find(t => t.name === 'CreateWorkflowDto');
      const symbolProp = wfType?.properties.find(p => p.name === 'symbol');
      expect(symbolProp?.nullable).toBe(true);
    });

    it('should handle nested object properties', () => {
      const doc = makeDoc();
      const types = engine.buildTypeDefinitions(doc);
      const nestedType = types.find(t => t.name === 'NestedSchema');
      expect(nestedType).toBeDefined();
      expect(nestedType?.properties.length).toBe(2);
    });

    it('should handle $ref in properties', () => {
      const doc = makeDoc();
      const types = engine.buildTypeDefinitions(doc);
      const arrRefType = types.find(t => t.name === 'ArrayRef');
      expect(arrRefType).toBeDefined();
      const resultsProp = arrRefType?.properties.find(p => p.name === 'results');
      expect(resultsProp?.typeScriptType).toContain('HealthCheckResult');
    });

    it('should handle allOf schemas', () => {
      const doc = makeDoc();
      const types = engine.buildTypeDefinitions(doc);
      const allOfType = types.find(t => t.name === 'AllOfSchema');
      expect(allOfType).toBeDefined();
    });

    it('should handle oneOf schemas', () => {
      const doc = makeDoc();
      const types = engine.buildTypeDefinitions(doc);
      const oneOfType = types.find(t => t.name === 'OneOfSchema');
      expect(oneOfType).toBeDefined();
    });
  });

  describe('buildEnumDefinitions()', () => {
    it('should extract enum schemas', () => {
      const doc = makeDoc();
      const enums = engine.buildEnumDefinitions(doc);
      const wfEnum = enums.find(e => e.name === 'WorkflowType');
      expect(wfEnum).toBeDefined();
      expect(wfEnum?.values).toContain('single_stock_analysis');
    });

    it('should include all enum values', () => {
      const doc = makeDoc();
      const enums = engine.buildEnumDefinitions(doc);
      const timeEnum = enums.find(e => e.name === 'Timeframe');
      expect(timeEnum?.values).toEqual(['4h', '1d', '1w', '1m', '3m', '6m']);
    });

    it('should include description', () => {
      const doc = makeDoc();
      const enums = engine.buildEnumDefinitions(doc);
      const wfEnum = enums.find(e => e.name === 'WorkflowType');
      expect(wfEnum?.description).toBe('Available workflow types');
    });

    it('should not include object schemas', () => {
      const doc = makeDoc();
      const enums = engine.buildEnumDefinitions(doc);
      const names = enums.map(e => e.name);
      expect(names).not.toContain('HealthCheckResult');
    });

    it('should handle empty enum array', () => {
      const doc = makeDoc({
        components: {
          schemas: {
            EmptyEnum: { type: 'string', enum: [] },
          },
          securitySchemes: {},
        },
      });
      const enums = engine.buildEnumDefinitions(doc);
      const emptyEnum = enums.find(e => e.name === 'EmptyEnum');
      expect(emptyEnum?.values).toEqual([]);
    });
  });

  describe('schemaToTypeScriptType()', () => {
    it('should map string to string', () => {
      expect(engine.schemaToTypeScriptType({ type: 'string' })).toBe('string');
    });

    it('should map number to number', () => {
      expect(engine.schemaToTypeScriptType({ type: 'number' })).toBe('number');
    });

    it('should map integer to number', () => {
      expect(engine.schemaToTypeScriptType({ type: 'integer' })).toBe('number');
    });

    it('should map boolean to boolean', () => {
      expect(engine.schemaToTypeScriptType({ type: 'boolean' })).toBe('boolean');
    });

    it('should map $ref to ref name', () => {
      expect(engine.schemaToTypeScriptType({ '$ref': '#/components/schemas/WorkflowType' })).toBe('WorkflowType');
    });

    it('should map array with items', () => {
      const result = engine.schemaToTypeScriptType({ type: 'array', items: { type: 'string' } });
      expect(result).toBe('string[]');
    });

    it('should map array with $ref items', () => {
      const result = engine.schemaToTypeScriptType({ type: 'array', items: { '$ref': '#/components/schemas/HealthCheckResult' } });
      expect(result).toBe('HealthCheckResult[]');
    });

    it('should map object with properties', () => {
      const result = engine.schemaToTypeScriptType({
        type: 'object',
        properties: {
          name: { type: 'string' },
          count: { type: 'number' },
        },
        required: ['name'],
      });
      expect(result).toContain('name');
      expect(result).toContain('count');
      expect(result).toContain('string');
      expect(result).toContain('number');
    });

    it('should map allOf to intersection', () => {
      const result = engine.schemaToTypeScriptType({
        allOf: [{ type: 'string' }, { type: 'number' }],
      });
      expect(result).toBe('string & number');
    });

    it('should map oneOf to union', () => {
      const result = engine.schemaToTypeScriptType({
        oneOf: [{ type: 'string' }, { type: 'number' }],
      });
      expect(result).toBe('string | number');
    });

    it('should default to string for unknown type', () => {
      expect(engine.schemaToTypeScriptType({ type: 'something' })).toBe('unknown');
    });

    it('should default to string when no type provided', () => {
      expect(engine.schemaToTypeScriptType({})).toBe('string');
    });

    it('should map object without properties to Record<string, unknown>', () => {
      expect(engine.schemaToTypeScriptType({ type: 'object' })).toBe('Record<string, unknown>');
    });

    it('should map array without items to unknown[]', () => {
      expect(engine.schemaToTypeScriptType({ type: 'array' })).toBe('unknown[]');
    });

    it('should handle nested object properties', () => {
      const result = engine.schemaToTypeScriptType({
        type: 'object',
        properties: {
          nested: {
            type: 'object',
            properties: {
              value: { type: 'number' },
            },
          },
        },
        required: ['nested'],
      });
      expect(result).toContain('nested');
      expect(result).toContain('value');
    });

    it('should mark optional properties with ?', () => {
      const result = engine.schemaToTypeScriptType({
        type: 'object',
        properties: {
          required: { type: 'string' },
          optional: { type: 'number' },
        },
        required: ['required'],
      });
      expect(result).toContain('required: string');
      expect(result).toContain('optional?: number');
    });
  });

  describe('sanitizeName()', () => {
    it('should return normal names unchanged', () => {
      expect(engine.sanitizeName('symbol')).toBe('symbol');
      expect(engine.sanitizeName('priceToBook')).toBe('priceToBook');
      expect(engine.sanitizeName('_private')).toBe('_private');
    });

    it('should append underscore for reserved keywords', () => {
      for (const keyword of RESERVED_KEYWORDS) {
        expect(engine.sanitizeName(keyword)).toBe(`${keyword}_`);
      }
    });

    it('should handle all ES reserved words', () => {
      expect(engine.sanitizeName('class')).toBe('class_');
      expect(engine.sanitizeName('return')).toBe('return_');
      expect(engine.sanitizeName('import')).toBe('import_');
      expect(engine.sanitizeName('new')).toBe('new_');
      expect(engine.sanitizeName('null')).toBe('null_');
      expect(engine.sanitizeName('undefined')).toBe('undefined_');
    });
  });

  describe('formatPropertyName()', () => {
    it('should return normal property names unchanged', () => {
      expect(engine.formatPropertyName('symbol')).toBe('symbol');
      expect(engine.formatPropertyName('priceToBook')).toBe('priceToBook');
      expect(engine.formatPropertyName('_hidden')).toBe('_hidden');
    });

    it('should quote property names with special characters', () => {
      expect(engine.formatPropertyName('invalid-name')).toBe("'invalid-name'");
      expect(engine.formatPropertyName('123abc')).toBe("'123abc'");
    });

    it('should append underscore for reserved keywords', () => {
      expect(engine.formatPropertyName('class')).toBe('class_');
      expect(engine.formatPropertyName('return')).toBe('return_');
    });

    it('should escape quotes in property names', () => {
      expect(engine.formatPropertyName("it's")).toBe("'it\\'s'");
    });
  });

  describe('escapeString()', () => {
    it('should escape backslashes', () => {
      expect(engine.escapeString('a\\b')).toBe('a\\\\b');
    });

    it('should escape single quotes', () => {
      expect(engine.escapeString("it's")).toBe("it\\'s");
    });

    it('should escape newlines', () => {
      expect(engine.escapeString('line1\nline2')).toBe('line1\\nline2');
    });

    it('should handle empty strings', () => {
      expect(engine.escapeString('')).toBe('');
    });

    it('should handle strings with no special chars', () => {
      expect(engine.escapeString('hello world')).toBe('hello world');
    });
  });

  describe('generateIndexFile()', () => {
    it('should include type exports', () => {
      const result = engine.generate(makeDoc());
      const indexFile = result.files.find(f => f.path === 'index.ts');
      expect(indexFile?.content).toContain('export type {');
    });

    it('should include enum exports', () => {
      const result = engine.generate(makeDoc());
      const indexFile = result.files.find(f => f.path === 'index.ts');
      expect(indexFile?.content).toContain('export {');
    });

    it('should include module exports', () => {
      const result = engine.generate(makeDoc());
      const indexFile = result.files.find(f => f.path === 'index.ts');
      expect(indexFile?.content).toContain('HealthModule');
    });

    it('should include client export', () => {
      const result = engine.generate(makeDoc());
      const indexFile = result.files.find(f => f.path === 'index.ts');
      expect(indexFile?.content).toContain(DEFAULT_SDK_CONFIG.clientClassName);
    });
  });

  describe('generateClientFile()', () => {
    it('should include client class declaration', () => {
      const result = engine.generate(makeDoc());
      const clientFile = result.files.find(f => f.path === DEFAULT_SDK_CONFIG.clientFileName);
      expect(clientFile?.content).toContain(`class ${DEFAULT_SDK_CONFIG.clientClassName}`);
    });

    it('should include SDKConfig interface', () => {
      const result = engine.generate(makeDoc());
      const clientFile = result.files.find(f => f.path === DEFAULT_SDK_CONFIG.clientFileName);
      expect(clientFile?.content).toContain('export interface SDKConfig');
    });

    it('should include baseUrl property', () => {
      const result = engine.generate(makeDoc());
      const clientFile = result.files.find(f => f.path === DEFAULT_SDK_CONFIG.clientFileName);
      expect(clientFile?.content).toContain('baseUrl: string');
    });

    it('should include constructor taking SDKConfig', () => {
      const result = engine.generate(makeDoc());
      const clientFile = result.files.find(f => f.path === DEFAULT_SDK_CONFIG.clientFileName);
      expect(clientFile?.content).toContain('constructor(config: SDKConfig)');
    });

    it('should include fetch method', () => {
      const result = engine.generate(makeDoc());
      const clientFile = result.files.find(f => f.path === DEFAULT_SDK_CONFIG.clientFileName);
      expect(clientFile?.content).toContain('async fetch<T>');
    });

    it('should include module instances', () => {
      const result = engine.generate(makeDoc());
      const clientFile = result.files.find(f => f.path === DEFAULT_SDK_CONFIG.clientFileName);
      expect(clientFile?.content).toContain('readonly health');
      expect(clientFile?.content).toContain('readonly marketData');
    });

    it('should include retry config when enabled', () => {
      const result = engine.generate(makeDoc());
      const clientFile = result.files.find(f => f.path === DEFAULT_SDK_CONFIG.clientFileName);
      expect(clientFile?.content).toContain('maxRetries');
      expect(clientFile?.content).toContain('retryDelayMs');
    });

    it('should include interceptor support when enabled', () => {
      const result = engine.generate(makeDoc());
      const clientFile = result.files.find(f => f.path === DEFAULT_SDK_CONFIG.clientFileName);
      expect(clientFile?.content).toContain('requestInterceptors');
      expect(clientFile?.content).toContain('responseInterceptors');
    });

    it('should include PaginationParams interface', () => {
      const result = engine.generate(makeDoc());
      const clientFile = result.files.find(f => f.path === DEFAULT_SDK_CONFIG.clientFileName);
      expect(clientFile?.content).toContain('export interface PaginationParams');
    });

    it('should use custom clientClassName from config', () => {
      const eng = new SDKGeneratorEngine({ clientClassName: 'BistClient' });
      const result = eng.generate(makeDoc());
      const clientFile = result.files.find(f => f.path === DEFAULT_SDK_CONFIG.clientFileName);
      expect(clientFile?.content).toContain('class BistClient');
    });

    it('should use custom clientFileName from config', () => {
      const eng = new SDKGeneratorEngine({ clientFileName: 'api-client.ts' });
      const result = eng.generate(makeDoc());
      const clientFile = result.files.find(f => f.path === 'api-client.ts');
      expect(clientFile).toBeDefined();
    });

    it('should use config.baseUrl in constructor', () => {
      const result = engine.generate(makeDoc());
      const clientFile = result.files.find(f => f.path === DEFAULT_SDK_CONFIG.clientFileName);
      expect(clientFile?.content).toContain('this.baseUrl = config.baseUrl');
    });

    it('should handle missing servers in document', () => {
      const doc = makeDoc({ servers: [] });
      const result = engine.generate(doc);
      const clientFile = result.files.find(f => f.path === DEFAULT_SDK_CONFIG.clientFileName);
      expect(clientFile).toBeDefined();
    });
  });

  describe('generateTypesFile()', () => {
    it('should generate TypeScript interfaces', () => {
      const result = engine.generate(makeDoc());
      const typesFile = result.files.find(f => f.path === `${DEFAULT_SDK_CONFIG.typesDir}/index.ts`);
      expect(typesFile?.content).toContain('export interface HealthCheckResult');
      expect(typesFile?.content).toContain('export interface CreateWorkflowDto');
    });

    it('should include property definitions with types', () => {
      const result = engine.generate(makeDoc());
      const typesFile = result.files.find(f => f.path === `${DEFAULT_SDK_CONFIG.typesDir}/index.ts`);
      expect(typesFile?.content).toContain('status: string;');
      expect(typesFile?.content).toContain('timestamp: string;');
    });

    it('should mark optional properties with ?', () => {
      const result = engine.generate(makeDoc());
      const typesFile = result.files.find(f => f.path === `${DEFAULT_SDK_CONFIG.typesDir}/index.ts`);
      expect(typesFile?.content).toContain('symbol?: string');
    });

    it('should mark nullable properties with | null', () => {
      const result = engine.generate(makeDoc());
      const typesFile = result.files.find(f => f.path === `${DEFAULT_SDK_CONFIG.typesDir}/index.ts`);
      expect(typesFile?.content).toContain('| null');
    });

    it('should include description as JSDoc', () => {
      const result = engine.generate(makeDoc());
      const typesFile = result.files.find(f => f.path === `${DEFAULT_SDK_CONFIG.typesDir}/index.ts`);
      expect(typesFile?.content).toContain('/** Health check result */');
    });

    it('should include number type', () => {
      const result = engine.generate(makeDoc());
      const typesFile = result.files.find(f => f.path === `${DEFAULT_SDK_CONFIG.typesDir}/index.ts`);
      expect(typesFile?.content).toContain('priceToBook: number');
    });

    it('should include Record<string, unknown> for plain objects', () => {
      const result = engine.generate(makeDoc());
      const typesFile = result.files.find(f => f.path === `${DEFAULT_SDK_CONFIG.typesDir}/index.ts`);
      expect(typesFile?.content).toContain('checks: Record<string, unknown>');
    });
  });

  describe('generateEnumsFile()', () => {
    it('should generate const objects for enums', () => {
      const result = engine.generate(makeDoc());
      const enumsFile = result.files.find(f => f.path === `${DEFAULT_SDK_CONFIG.enumsDir}/index.ts`);
      expect(enumsFile?.content).toContain('export const WorkflowType = {');
    });

    it('should include all enum values', () => {
      const result = engine.generate(makeDoc());
      const enumsFile = result.files.find(f => f.path === `${DEFAULT_SDK_CONFIG.enumsDir}/index.ts`);
      expect(enumsFile?.content).toContain("SINGLE_STOCK_ANALYSIS: 'single_stock_analysis'");
      expect(enumsFile?.content).toContain("MARKET_SCAN: 'market_scan'");
    });

    it('should include type aliases', () => {
      const result = engine.generate(makeDoc());
      const enumsFile = result.files.find(f => f.path === `${DEFAULT_SDK_CONFIG.enumsDir}/index.ts`);
      expect(enumsFile?.content).toContain('export type WorkflowType = typeof WorkflowType[keyof typeof WorkflowType]');
    });

    it('should include description as JSDoc', () => {
      const result = engine.generate(makeDoc());
      const enumsFile = result.files.find(f => f.path === `${DEFAULT_SDK_CONFIG.enumsDir}/index.ts`);
      expect(enumsFile?.content).toContain('/** Available workflow types */');
    });

    it('should escape special characters in enum values', () => {
      const doc = makeDoc({
        components: {
          schemas: {
            SpecialEnum: { type: 'string', enum: ["it's", 'hello\\world'] },
          },
          securitySchemes: {},
        },
      });
      const result = engine.generate(doc);
      const enumsFile = result.files.find(f => f.path === `${DEFAULT_SDK_CONFIG.enumsDir}/index.ts`);
      expect(enumsFile?.content).toContain("IT_S: 'it\\'s'");
    });
  });

  describe('generateModuleFile()', () => {
    it('should generate class with correct name', () => {
      const result = engine.generate(makeDoc());
      const moduleFile = result.files.find(f => f.path?.includes('health.ts'));
      expect(moduleFile?.content).toContain('class HealthModule');
    });

    it('should include baseUrl and fetchFn in constructor', () => {
      const result = engine.generate(makeDoc());
      const moduleFile = result.files.find(f => f.path?.includes('health.ts'));
      expect(moduleFile?.content).toContain('private readonly baseUrl');
      expect(moduleFile?.content).toContain('private readonly fetchFn');
    });

    it('should generate async methods for endpoints', () => {
      const result = engine.generate(makeDoc());
      const moduleFile = result.files.find(f => f.path?.includes('health.ts'));
      expect(moduleFile?.content).toContain('async healthCheck');
    });

    it('should handle path parameters', () => {
      const result = engine.generate(makeDoc());
      const moduleFile = result.files.find(f => f.path?.includes('marketData.ts'));
      expect(moduleFile?.content).toContain('async getLatestPrice');
      expect(moduleFile?.content).toContain('symbol: string');
      expect(moduleFile?.content).toContain('encodeURIComponent');
    });

    it('should handle query parameters', () => {
      const result = engine.generate(makeDoc());
      const moduleFile = result.files.find(f => f.path?.includes('marketData.ts'));
      expect(moduleFile?.content).toContain('async getHistory');
      expect(moduleFile?.content).toContain('timeframe');
      expect(moduleFile?.content).toContain('params.set');
    });

    it('should handle optional query parameters', () => {
      const result = engine.generate(makeDoc());
      const moduleFile = result.files.find(f => f.path?.includes('marketData.ts'));
      expect(moduleFile?.content).toContain('if (from !== undefined)');
    });

    it('should handle request bodies', () => {
      const result = engine.generate(makeDoc());
      const moduleFile = result.files.find(f => f.path?.includes('financialAnalysis.ts'));
      expect(moduleFile?.content).toContain('async financialAnalysis');
      expect(moduleFile?.content).toContain('body: FinancialAnalysisInput');
      expect(moduleFile?.content).toContain('JSON.stringify(body)');
    });

    it('should set correct HTTP methods', () => {
      const result = engine.generate(makeDoc());
      const marketFile = result.files.find(f => f.path?.includes('marketData.ts'));
      expect(marketFile?.content).toContain("method: 'get'");
      const finFile = result.files.find(f => f.path?.includes('financialAnalysis.ts'));
      expect(finFile?.content).toContain("method: 'get'");
    });

    it('should include method JSDoc from description', () => {
      const doc = makeDoc({
        paths: {
          '/api/described': {
            get: {
              operationId: 'describedOp',
              summary: 'Described operation',
              description: 'This is a detailed description',
              tags: ['Health'],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      });
      const result = engine.generate(doc);
      const moduleFile = result.files.find(f => f.path?.includes('health.ts'));
      expect(moduleFile?.content).toContain('/**');
      expect(moduleFile?.content).toContain('This is a detailed description');
    });

    it('should generate one module per tag', () => {
      const result = engine.generate(makeDoc());
      const moduleFiles = result.files.filter(f => f.path?.startsWith(DEFAULT_SDK_CONFIG.modulesDir + '/'));
      expect(moduleFiles.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('buildEndpointDefinition()', () => {
    it('should extract operationId and name', () => {
      const doc = makeDoc();
      const modules = engine.buildModuleDefinitions(doc);
      const healthMod = modules.find(m => m.tag === 'Health');
      const ep = healthMod?.endpoints[0];
      expect(ep?.operationId).toBe('healthCheck');
      expect(ep?.name).toBe('healthCheck');
    });

    it('should extract method', () => {
      const doc = makeDoc();
      const modules = engine.buildModuleDefinitions(doc);
      const healthMod = modules.find(m => m.tag === 'Health');
      expect(healthMod?.endpoints[0].method).toBe('get');
    });

    it('should extract path params', () => {
      const doc = makeDoc();
      const modules = engine.buildModuleDefinitions(doc);
      const marketMod = modules.find(m => m.tag === 'Market Data');
      const ep = marketMod?.endpoints.find(e => e.operationId === 'getLatestPrice');
      expect(ep?.pathParams.length).toBe(1);
      expect(ep?.pathParams[0].name).toBe('symbol');
      expect(ep?.pathParams[0].typeScriptType).toBe('string');
    });

    it('should extract query params', () => {
      const doc = makeDoc();
      const modules = engine.buildModuleDefinitions(doc);
      const marketMod = modules.find(m => m.tag === 'Market Data');
      const ep = marketMod?.endpoints.find(e => e.operationId === 'getHistory');
      expect(ep?.queryParams.length).toBe(2);
      expect(ep?.queryParams[0].name).toBe('timeframe');
      expect(ep?.queryParams[0].required).toBe(true);
    });

    it('should extract body params', () => {
      const doc = makeDoc();
      const modules = engine.buildModuleDefinitions(doc);
      const finMod = modules.find(m => m.tag === 'Financial Analysis');
      const ep = finMod?.endpoints.find(e => e.operationId === 'financialAnalysis');
      expect(ep?.bodyParam).not.toBeNull();
      expect(ep?.bodyParam?.type).toBe('FinancialAnalysisInput');
      expect(ep?.bodyParam?.required).toBe(true);
    });

    it('should set null bodyParam when no request body', () => {
      const doc = makeDoc();
      const modules = engine.buildModuleDefinitions(doc);
      const healthMod = modules.find(m => m.tag === 'Health');
      expect(healthMod?.endpoints[0].bodyParam).toBeNull();
    });
  });

  describe('extractResponseType()', () => {
    it('should return unknown for responses without schema', () => {
      const doc = makeDoc();
      const modules = engine.buildModuleDefinitions(doc);
      const healthMod = modules.find(m => m.tag === 'Health');
      expect(healthMod?.endpoints[0].responseType).toBe('unknown');
    });

    it('should handle 200 response with content schema', () => {
      const doc = makeDoc();
      const modules = engine.buildModuleDefinitions(doc);
      const marketMod = modules.find(m => m.tag === 'Market Data');
      const ep = marketMod?.endpoints.find(e => e.operationId === 'getLatestPrice');
      expect(ep?.responseType).toBe('Record<string, unknown>');
    });

    it('should return unknown for non-200 responses', () => {
      const doc = makeDoc();
      const modules = engine.buildModuleDefinitions(doc);
      const marketMod = modules.find(m => m.tag === 'Market Data');
      const ep = marketMod?.endpoints.find(e => e.operationId === 'getLatestPrice');
      expect(ep).toBeDefined();
    });
  });

  describe('schemaToTypeDefinition()', () => {
    it('should create type definition from schema', () => {
      const schema = {
        type: 'object' as const,
        properties: {
          name: { type: 'string' as const },
          count: { type: 'number' as const },
        },
        required: ['name'],
        description: 'A test type',
      };
      const typeDef = engine.schemaToTypeDefinition('TestType', schema);
      expect(typeDef.name).toBe('TestType');
      expect(typeDef.description).toBe('A test type');
      expect(typeDef.properties.length).toBe(2);

      const nameProp = typeDef.properties.find(p => p.name === 'name');
      expect(nameProp?.required).toBe(true);
      expect(nameProp?.typeScriptType).toBe('string');

      const countProp = typeDef.properties.find(p => p.name === 'count');
      expect(countProp?.required).toBe(false);
      expect(countProp?.typeScriptType).toBe('number');
    });

    it('should handle nullable properties', () => {
      const schema = {
        type: 'object' as const,
        properties: {
          value: { type: 'number' as const, nullable: true },
        },
      };
      const typeDef = engine.schemaToTypeDefinition('NullableType', schema);
      const prop = typeDef.properties[0];
      expect(prop.nullable).toBe(true);
    });
  });

  describe('config variations', () => {
    it('should disable retry when enableRetry is false', () => {
      const eng = new SDKGeneratorEngine({ enableRetry: false });
      const result = eng.generate(makeDoc());
      const clientFile = result.files.find(f => f.path === DEFAULT_SDK_CONFIG.clientFileName);
      expect(clientFile?.content).not.toContain('for (let attempt');
    });

    it('should disable interceptors when enableInterceptors is false', () => {
      const eng = new SDKGeneratorEngine({ enableInterceptors: false });
      const result = eng.generate(makeDoc());
      const clientFile = result.files.find(f => f.path === DEFAULT_SDK_CONFIG.clientFileName);
      expect(clientFile?.content).not.toContain('requestInterceptors');
      expect(clientFile?.content).not.toContain('responseInterceptors');
    });

    it('should use custom indent size', () => {
      const eng = new SDKGeneratorEngine({ indentSize: 4 });
      const result = eng.generate(makeDoc());
      const clientFile = result.files.find(f => f.path === DEFAULT_SDK_CONFIG.clientFileName);
      expect(clientFile?.content).toContain('    ');
    });

    it('should use custom maxRetries', () => {
      const eng = new SDKGeneratorEngine({ maxRetries: 5 });
      const cfg = eng.getConfig();
      expect(cfg.maxRetries).toBe(5);
    });

    it('should use custom retryDelayMs', () => {
      const eng = new SDKGeneratorEngine({ retryDelayMs: 2000 });
      const cfg = eng.getConfig();
      expect(cfg.retryDelayMs).toBe(2000);
    });

    it('should use custom exportBanner', () => {
      const eng = new SDKGeneratorEngine({ exportBanner: '// CUSTOM BANNER' });
      const result = eng.generate(makeDoc());
      for (const file of result.files) {
        expect(file.content).toContain('// CUSTOM BANNER');
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle document with no components', () => {
      const doc: OpenAPIDocument = {
        openapi: '3.0.3',
        info: { title: 'Empty', description: '', version: '1.0.0' },
        servers: [],
        tags: [],
        paths: {},
        components: { schemas: {}, securitySchemes: {} },
      };
      const result = engine.generate(doc);
      expect(result.files.length).toBeGreaterThan(0);
      expect(result.typeCount).toBe(0);
      expect(result.enumCount).toBe(0);
    });

    it('should handle document with no tags', () => {
      const doc = makeDoc({ tags: [] });
      const result = engine.generate(doc);
      expect(result.moduleCount).toBe(0);
    });

    it('should handle paths with no methods', () => {
      const doc = makeDoc({
        paths: {
          '/empty': {},
        },
      });
      const result = engine.generate(doc);
      expect(result.endpointCount).toBe(0);
    });

    it('should handle non-GET/POST methods', () => {
      const doc = makeDoc({
        paths: {
          '/api/items/{id}': {
            delete: {
              operationId: 'deleteItem',
              summary: 'Delete item',
              tags: ['Health'],
              parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
              responses: { '200': { description: 'Deleted' } },
            },
          },
        },
      });
      const result = engine.generate(doc);
      const moduleFile = result.files.find(f => f.path?.includes('health.ts'));
      expect(moduleFile?.content).toContain("method: 'delete'");
    });

    it('should handle PUT and PATCH methods', () => {
      const doc = makeDoc({
        paths: {
          '/api/items/{id}': {
            put: {
              operationId: 'updateItem',
              summary: 'Update',
              tags: ['Health'],
              parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
              requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
              responses: { '200': { description: 'Updated' } },
            },
          },
        },
      });
      const result = engine.generate(doc);
      const moduleFile = result.files.find(f => f.path?.includes('health.ts'));
      expect(moduleFile?.content).toContain("method: 'put'");
    });

    it('should handle missing server URL', () => {
      const doc = makeDoc({ servers: [] });
      const result = engine.generate(doc);
      const clientFile = result.files.find(f => f.path === DEFAULT_SDK_CONFIG.clientFileName);
      expect(clientFile).toBeDefined();
    });

    it('should handle deeply nested $ref', () => {
      const doc = makeDoc({
        components: {
          schemas: {
            Level1: {
              type: 'object',
              properties: {
                nested: { '$ref': '#/components/schemas/Level2' },
              },
            },
            Level2: {
              type: 'object',
              properties: {
                value: { type: 'string' },
              },
            },
          },
          securitySchemes: {},
        },
      });
      const types = engine.buildTypeDefinitions(doc);
      const level1 = types.find(t => t.name === 'Level1');
      expect(level1).toBeDefined();
      const nestedProp = level1?.properties.find(p => p.name === 'nested');
      expect(nestedProp?.typeScriptType).toBe('Level2');
    });

    it('should handle schema with empty properties', () => {
      const doc = makeDoc({
        components: {
          schemas: {
            EmptyObj: { type: 'object', properties: {} },
          },
          securitySchemes: {},
        },
      });
      const types = engine.buildTypeDefinitions(doc);
      const emptyType = types.find(t => t.name === 'EmptyObj');
      expect(emptyType?.properties).toHaveLength(0);
    });

    it('should handle query params without required field', () => {
      const doc = makeDoc({
        paths: {
          '/api/search': {
            get: {
              operationId: 'search',
              summary: 'Search',
              tags: ['Health'],
              parameters: [
                { name: 'q', in: 'query', required: false, schema: { type: 'string' } },
              ],
              responses: { '200': { description: 'Results' } },
            },
          },
        },
      });
      const modules = engine.buildModuleDefinitions(doc);
      const healthMod = modules.find(m => m.tag === 'Health');
      const ep = healthMod?.endpoints.find(e => e.operationId === 'search');
      expect(ep?.queryParams[0].required).toBe(false);
    });

    it('should handle operationId with spaces', () => {
      const doc = makeDoc({
        paths: {
          '/api/test': {
            get: {
              operationId: 'Test Operation',
              summary: 'Test',
              tags: ['Health'],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      });
      const modules = engine.buildModuleDefinitions(doc);
      const healthMod = modules.find(m => m.tag === 'Health');
      const ep = healthMod?.endpoints.find(e => e.operationId === 'Test Operation');
      expect(ep?.name).toBe('testOperation');
    });

    it('should handle operationId with special characters', () => {
      const doc = makeDoc({
        paths: {
          '/api/test': {
            get: {
              operationId: 'get-test_items.v2',
              summary: 'Test',
              tags: ['Health'],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      });
      const modules = engine.buildModuleDefinitions(doc);
      const healthMod = modules.find(m => m.tag === 'Health');
      const ep = healthMod?.endpoints.find(e => e.operationId === 'get-test_items.v2');
      expect(ep?.name).toBe('getTestItemsV2');
    });
  });

  describe('PAGINATION_OPS constant', () => {
    it('should include expected pagination operations', () => {
      expect(PAGINATION_OPS.has('getTopCandidates')).toBe(true);
      expect(PAGINATION_OPS.has('getWatchlist')).toBe(true);
      expect(PAGINATION_OPS.has('getQueueJobs')).toBe(true);
      expect(PAGINATION_OPS.has('getEvents')).toBe(true);
      expect(PAGINATION_OPS.has('getProviderHistory')).toBe(true);
    });

    it('should not include non-paginated operations', () => {
      expect(PAGINATION_OPS.has('healthCheck')).toBe(false);
      expect(PAGINATION_OPS.has('getLatestPrice')).toBe(false);
    });
  });

  describe('TYPE_MAP constant', () => {
    it('should map all basic types', () => {
      expect(TYPE_MAP['string']).toBe('string');
      expect(TYPE_MAP['number']).toBe('number');
      expect(TYPE_MAP['integer']).toBe('number');
      expect(TYPE_MAP['boolean']).toBe('boolean');
      expect(TYPE_MAP['object']).toBe('Record<string, unknown>');
      expect(TYPE_MAP['array']).toBe('unknown[]');
    });
  });

  describe('RESERVED_KEYWORDS constant', () => {
    it('should contain essential ES reserved words', () => {
      expect(RESERVED_KEYWORDS.has('class')).toBe(true);
      expect(RESERVED_KEYWORDS.has('function')).toBe(true);
      expect(RESERVED_KEYWORDS.has('return')).toBe(true);
      expect(RESERVED_KEYWORDS.has('const')).toBe(true);
      expect(RESERVED_KEYWORDS.has('let')).toBe(true);
      expect(RESERVED_KEYWORDS.has('import')).toBe(true);
      expect(RESERVED_KEYWORDS.has('export')).toBe(true);
      expect(RESERVED_KEYWORDS.has('async')).toBe(true);
      expect(RESERVED_KEYWORDS.has('await')).toBe(true);
    });

    it('should contain additional problematic names', () => {
      expect(RESERVED_KEYWORDS.has('undefined')).toBe(true);
      expect(RESERVED_KEYWORDS.has('null')).toBe(true);
      expect(RESERVED_KEYWORDS.has('NaN')).toBe(true);
      expect(RESERVED_KEYWORDS.has('Infinity')).toBe(true);
      expect(RESERVED_KEYWORDS.has('process')).toBe(true);
      expect(RESERVED_KEYWORDS.has('global')).toBe(true);
      expect(RESERVED_KEYWORDS.has('globalThis')).toBe(true);
      expect(RESERVED_KEYWORDS.has('console')).toBe(true);
      expect(RESERVED_KEYWORDS.has('window')).toBe(true);
      expect(RESERVED_KEYWORDS.has('document')).toBe(true);
      expect(RESERVED_KEYWORDS.has('require')).toBe(true);
    });
  });
});
