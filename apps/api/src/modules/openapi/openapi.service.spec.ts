import { OpenAPIEngine } from './openapi.service';
import { DEFAULT_OPENAPI_CONFIG, ALL_ENDPOINT_MODULES, BUILT_IN_DTOS, BUILT_IN_ENUMS } from './openapi.config';
import type { OpenAPIEngineConfig } from './openapi.config';

describe('OpenAPIEngine', () => {
  let engine: OpenAPIEngine;

  beforeEach(() => {
    engine = new OpenAPIEngine();
  });

  describe('Generation', () => {
    it('should generate a valid OpenAPI 3.0 document', () => {
      const result = engine.generate();
      expect(result.document.openapi).toBe('3.0.3');
      expect(result.document.info.title).toBe('BIST Elite AI API');
      expect(result.document.info.version).toBe('1.0.0');
    });

    it('should include servers', () => {
      const result = engine.generate();
      expect(result.document.servers).toHaveLength(1);
      expect(result.document.servers[0].url).toBe('http://localhost:3001');
    });

    it('should include security schemes', () => {
      const result = engine.generate();
      expect(result.document.components.securitySchemes).toHaveProperty('bearerAuth');
      expect(result.document.components.securitySchemes).toHaveProperty('apiKey');
    });

    it('should return endpoint count', () => {
      const result = engine.generate();
      expect(result.endpointCount).toBeGreaterThan(0);
    });

    it('should return schema count', () => {
      const result = engine.generate();
      expect(result.schemaCount).toBeGreaterThan(0);
    });

    it('should return tag count', () => {
      const result = engine.generate();
      expect(result.tagCount).toBeGreaterThan(0);
    });

    it('should include durationMs', () => {
      const result = engine.generate();
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should include generatedAt ISO string', () => {
      const result = engine.generate();
      expect(new Date(result.generatedAt).toISOString()).toBe(result.generatedAt);
    });
  });

  describe('Schema validation', () => {
    it('should generate paths for all registered endpoints', () => {
      const result = engine.generate();
      let totalEndpoints = 0;
      for (const mod of ALL_ENDPOINT_MODULES) {
        totalEndpoints += mod.endpoints.length;
      }
      let pathCount = 0;
      for (const pathItem of Object.values(result.document.paths)) {
        pathCount += Object.keys(pathItem).length;
      }
      expect(pathCount).toBe(totalEndpoints);
    });

    it('should include all tags from modules', () => {
      const result = engine.generate();
      const tagNames = result.document.tags.map((t) => t.name);
      const expectedTags = [...new Set(ALL_ENDPOINT_MODULES.map((m) => m.tag))];
      for (const tag of expectedTags) {
        expect(tagNames).toContain(tag);
      }
    });

    it('should generate path parameters for endpoints with path params', () => {
      const result = engine.generate();
      const getOp = result.document.paths['/api/market-data/{symbol}/latest']?.['get'] as Record<string, unknown>;
      expect(getOp).toBeDefined();
      const params = getOp.parameters as Array<Record<string, unknown>>;
      expect(params).toBeDefined();
      expect(params.length).toBeGreaterThan(0);
      expect(params[0].in).toBe('path');
      expect(params[0].name).toBe('symbol');
    });

    it('should generate query parameters for endpoints with query params', () => {
      const result = engine.generate();
      const getOp = result.document.paths['/api/market-data/{symbol}/history']?.['get'] as Record<string, unknown>;
      expect(getOp).toBeDefined();
      const params = getOp.parameters as Array<Record<string, unknown>>;
      const queryParam = params.find((p) => p.in === 'query');
      expect(queryParam).toBeDefined();
    });

    it('should generate request body for POST endpoints', () => {
      const result = engine.generate();
      const postOp = result.document.paths['/api/workflows']?.['post'] as Record<string, unknown>;
      expect(postOp).toBeDefined();
      expect(postOp.requestBody).toBeDefined();
      const rb = postOp.requestBody as Record<string, unknown>;
      expect(rb.required).toBe(true);
      expect(rb.content).toHaveProperty('application/json');
    });

    it('should include responses with status codes', () => {
      const result = engine.generate();
      const getOp = result.document.paths['/api/market-data/{symbol}/latest']?.['get'] as Record<string, unknown>;
      const responses = getOp.responses as Record<string, unknown>;
      expect(responses).toHaveProperty('200');
      expect(responses).toHaveProperty('400');
      expect(responses).toHaveProperty('404');
    });
  });

  describe('DTO parsing', () => {
    it('should generate schemas for all built-in DTOs', () => {
      const result = engine.generate();
      for (const dto of BUILT_IN_DTOS) {
        expect(result.document.components.schemas).toHaveProperty(dto.name);
      }
    });

    it('should generate correct property types for DTOs', () => {
      const result = engine.generate();
      const workflowSchema = result.document.components.schemas['CreateWorkflowDto'];
      expect(workflowSchema).toBeDefined();
      expect(workflowSchema.type).toBe('object');
      expect(workflowSchema.properties).toHaveProperty('type');
      expect(workflowSchema.properties!.type.type).toBe('string');
      expect(workflowSchema.required).toContain('type');
    });

    it('should mark nullable properties correctly', () => {
      const result = engine.generate();
      const workflowSchema = result.document.components.schemas['CreateWorkflowDto'];
      const symbolProp = workflowSchema.properties!.symbol;
      expect(symbolProp.nullable).toBe(true);
    });

    it('should include examples from DTO definitions', () => {
      const result = engine.generate();
      const workflowSchema = result.document.components.schemas['CreateWorkflowDto'];
      const typeProp = workflowSchema.properties!.type;
      expect(typeProp.example).toBe('single_stock_analysis');
    });

    it('should include DTO descriptions', () => {
      const result = engine.generate();
      const schema = result.document.components.schemas['CreateWorkflowDto'];
      expect(schema.description).toBe('Request body for creating a new workflow');
    });
  });

  describe('Enum parsing', () => {
    it('should generate schemas for all built-in enums', () => {
      const result = engine.generate();
      for (const en of BUILT_IN_ENUMS) {
        expect(result.document.components.schemas).toHaveProperty(en.name);
      }
    });

    it('should have correct enum values', () => {
      const result = engine.generate();
      const tfSchema = result.document.components.schemas['Timeframe'];
      expect(tfSchema.type).toBe('string');
      expect(tfSchema.enum).toEqual(['4h', '1d', '1w', '1m', '3m', '6m']);
    });

    it('should include enum descriptions', () => {
      const result = engine.generate();
      const enumSchema = result.document.components.schemas['WorkflowType'];
      expect(enumSchema.description).toBe('Available workflow types');
    });

    it('should have WorkflowStatus enum with all statuses', () => {
      const result = engine.generate();
      const schema = result.document.components.schemas['WorkflowStatus'];
      expect(schema.enum).toContain('pending');
      expect(schema.enum).toContain('running');
      expect(schema.enum).toContain('completed');
      expect(schema.enum).toContain('cancelled');
    });
  });

  describe('Caching', () => {
    it('should cache after first generation', () => {
      engine.generate();
      expect(engine.getCachedDocument()).not.toBeNull();
    });

    it('should return cached document on subsequent calls', () => {
      const result1 = engine.generate();
      const cached = engine.getCachedDocument();
      expect(cached).toBe(result1.document);
    });

    it('should report cache validity', () => {
      expect(engine.isCacheValid()).toBe(false);
      engine.generate();
      expect(engine.isCacheValid()).toBe(true);
    });

    it('should invalidate cache', () => {
      engine.generate();
      expect(engine.getCachedDocument()).not.toBeNull();
      engine.invalidateCache();
      expect(engine.getCachedDocument()).toBeNull();
    });

    it('should return null from getCachedDocument when cache disabled', () => {
      const noCacheEngine = new OpenAPIEngine({ cacheEnabled: false });
      noCacheEngine.generate();
      expect(noCacheEngine.getCachedDocument()).toBeNull();
    });

    it('should report invalid cache when disabled', () => {
      const noCacheEngine = new OpenAPIEngine({ cacheEnabled: false });
      noCacheEngine.generate();
      expect(noCacheEngine.isCacheValid()).toBe(false);
    });
  });

  describe('Incremental generation', () => {
    it('should increment cache version on invalidate', () => {
      const stats1 = engine.getStatistics();
      engine.invalidateCache();
      const stats2 = engine.getStatistics();
      expect(stats2.cacheVersion).toBeGreaterThan(stats1.cacheVersion);
    });

    it('should force regenerate even with valid cache', () => {
      engine.generate();
      expect(engine.isCacheValid()).toBe(true);
      const result = engine.forceRegenerate();
      expect(result.endpointCount).toBeGreaterThan(0);
      expect(engine.isCacheValid()).toBe(true);
    });
  });

  describe('Export', () => {
    it('should export valid JSON', () => {
      const json = engine.exportJson();
      const parsed = JSON.parse(json);
      expect(parsed.openapi).toBe('3.0.3');
    });

    it('should export compact JSON when pretty=false', () => {
      const compact = engine.exportJson(false);
      expect(compact).not.toContain('\n');
      const parsed = JSON.parse(compact);
      expect(parsed.openapi).toBe('3.0.3');
    });

    it('should export YAML', () => {
      const yaml = engine.exportYaml();
      expect(yaml).toContain('openapi: 3.0.3');
      expect(yaml).toContain('title:');
    });

    it('should export Markdown', () => {
      const md = engine.exportMarkdown();
      expect(md).toContain('# BIST Elite AI API');
      expect(md).toContain('## Servers');
    });

    it('should export via format parameter', () => {
      expect(engine.export('json')).toBe(engine.exportJson());
      expect(engine.export('yaml')).toBe(engine.exportYaml());
      expect(engine.export('markdown')).toBe(engine.exportMarkdown());
    });

    it('should include endpoint table in Markdown', () => {
      const md = engine.exportMarkdown();
      expect(md).toContain('| Method | Path | Description |');
      expect(md).toContain('| GET |');
    });

    it('should include schemas section in Markdown', () => {
      const md = engine.exportMarkdown();
      expect(md).toContain('## Schemas');
    });

    it('should include enum values in Markdown', () => {
      const md = engine.exportMarkdown();
      expect(md).toContain('### Timeframe (string)');
      expect(md).toContain('Values:');
    });

    it('should include property tables for DTOs in Markdown', () => {
      const md = engine.exportMarkdown();
      expect(md).toContain('| Property | Type | Required |');
    });
  });

  describe('Statistics', () => {
    it('should return correct endpoint count', () => {
      const stats = engine.getStatistics();
      let expected = 0;
      for (const mod of ALL_ENDPOINT_MODULES) {
        expected += mod.endpoints.length;
      }
      expect(stats.totalEndpoints).toBe(expected);
    });

    it('should return correct schema count', () => {
      const stats = engine.getStatistics();
      expect(stats.totalSchemas).toBe(BUILT_IN_DTOS.length + BUILT_IN_ENUMS.length);
    });

    it('should return correct tag count', () => {
      const stats = engine.getStatistics();
      const expectedTags = [...new Set(ALL_ENDPOINT_MODULES.map((m) => m.tag))];
      expect(stats.totalTags).toBe(expectedTags.length);
    });

    it('should include endpoints by method', () => {
      const stats = engine.getStatistics();
      expect(stats.endpointsByMethod).toHaveProperty('GET');
      expect(stats.endpointsByMethod).toHaveProperty('POST');
      expect(stats.endpointsByMethod).toHaveProperty('DELETE');
    });

    it('should include endpoints by tag', () => {
      const stats = engine.getStatistics();
      expect(stats.endpointsByTag).toHaveProperty('Health');
      expect(stats.endpointsByTag).toHaveProperty('Market Data');
      expect(stats.endpointsByTag['Health']).toBeGreaterThan(0);
    });

    it('should return null lastGenerated before any generation', () => {
      const freshEngine = new OpenAPIEngine();
      const stats = freshEngine.getStatistics();
      expect(stats.lastGenerated).toBeNull();
    });
  });

  describe('Metadata retrieval', () => {
    it('should return endpoint modules', () => {
      const modules = engine.getEndpointModules();
      expect(modules.length).toBe(ALL_ENDPOINT_MODULES.length);
    });

    it('should return DTO definitions', () => {
      const dtos = engine.getDtoDefinitions();
      expect(dtos.length).toBe(BUILT_IN_DTOS.length);
    });

    it('should return enum definitions', () => {
      const enums = engine.getEnumDefinitions();
      expect(enums.length).toBe(BUILT_IN_ENUMS.length);
    });

    it('should return module names', () => {
      const names = engine.getModuleNames();
      expect(names).toContain('Health');
      expect(names).toContain('Market Data');
      expect(names).toContain('Configuration');
    });

    it('should return tag names', () => {
      const tags = engine.getTagNames();
      expect(tags).toContain('Health');
      expect(tags).toContain('Workflows');
    });

    it('should return endpoints by tag', () => {
      const endpoints = engine.getEndpointsByTag('Health');
      expect(endpoints.length).toBeGreaterThan(0);
      expect(endpoints[0].tags[0]).toBe('Health');
    });

    it('should return endpoints by method', () => {
      const posts = engine.getEndpointsByMethod('POST');
      expect(posts.length).toBeGreaterThan(0);
      for (const ep of posts) {
        expect(ep.method).toBe('POST');
      }
    });
  });

  describe('History', () => {
    it('should maintain generation history', () => {
      engine.generate();
      engine.generate();
      const history = engine.getHistory();
      expect(history.length).toBe(2);
    });

    it('should respect maxHistorySize', () => {
      const smallEngine = new OpenAPIEngine({ maxHistorySize: 2 });
      smallEngine.generate();
      smallEngine.generate();
      smallEngine.generate();
      expect(smallEngine.getHistory().length).toBe(2);
    });

    it('should return copy of history', () => {
      engine.generate();
      const history = engine.getHistory();
      history.pop();
      expect(engine.getHistory().length).toBe(1);
    });
  });

  describe('Custom config', () => {
    it('should accept custom config', () => {
      const custom: Partial<OpenAPIEngineConfig> = {
        apiTitle: 'Custom API',
        apiVersion: '2.0.0',
      };
      const customEngine = new OpenAPIEngine(custom);
      const result = customEngine.generate();
      expect(result.document.info.title).toBe('Custom API');
      expect(result.document.info.version).toBe('2.0.0');
    });

    it('should merge with defaults', () => {
      const custom = new OpenAPIEngine({ apiTitle: 'Custom' });
      const result = custom.generate();
      expect(result.document.info.description).toBe(DEFAULT_OPENAPI_CONFIG.apiDescription);
      expect(result.document.servers[0].url).toBe(DEFAULT_OPENAPI_CONFIG.serverUrl);
    });
  });

  describe('YAML export', () => {
    it('should handle empty objects', () => {
      const yaml = engine.exportYaml();
      expect(yaml).toBeDefined();
      expect(typeof yaml).toBe('string');
    });

    it('should properly escape strings with special characters', () => {
      const yaml = engine.exportYaml();
      expect(yaml).toContain('openapi:');
      expect(yaml).toContain('3.0.3');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty endpoint tag list', () => {
      const endpoints = engine.getEndpointsByTag('nonexistent');
      expect(endpoints).toEqual([]);
    });

    it('should handle empty method filter', () => {
      const endpoints = engine.getEndpointsByMethod('PATCH');
      expect(endpoints).toEqual([]);
    });

    it('should handle double generation without cache', () => {
      const noCacheEngine = new OpenAPIEngine({ cacheEnabled: false });
      const r1 = noCacheEngine.generate();
      const r2 = noCacheEngine.generate();
      expect(r1.endpointCount).toBe(r2.endpointCount);
    });
  });
});
