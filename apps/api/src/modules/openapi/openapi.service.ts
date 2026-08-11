import { Injectable, Optional } from '@nestjs/common';
import {
  OpenAPIDocument,
  OpenAPIGenerationResult,
  OpenAPICacheEntry,
  OpenAPIStatistics,
  ExportFormat,
  OpenAPISchema,
  EndpointModule,
  DtoDefinition,
  EnumDefinition,
  PropertyDefinition,
  EndpointDefinition,
} from './openapi.types';
import {
  OpenAPIEngineConfig,
  DEFAULT_OPENAPI_CONFIG,
  ALL_ENDPOINT_MODULES,
  BUILT_IN_DTOS,
  BUILT_IN_ENUMS,
  TAG_DESCRIPTIONS,
} from './openapi.config';

@Injectable()
export class OpenAPIEngine {
  private readonly config: OpenAPIEngineConfig;
  private cache: OpenAPICacheEntry | null = null;
  private readonly history: OpenAPIGenerationResult[] = [];
  private cacheVersion = 0;

  constructor(@Optional() config?: Partial<OpenAPIEngineConfig>) {
    this.config = { ...DEFAULT_OPENAPI_CONFIG, ...config };
  }

  generate(): OpenAPIGenerationResult {
    const start = Date.now();
    const document = this.buildDocument();
    const endpointCount = this.countEndpoints(ALL_ENDPOINT_MODULES);
    const schemaCount = Object.keys(document.components.schemas).length;
    const tagCount = document.tags.length;
    const durationMs = Date.now() - start;
    const generatedAt = new Date().toISOString();

    const result: OpenAPIGenerationResult = {
      document,
      endpointCount,
      schemaCount,
      tagCount,
      generatedAt,
      durationMs,
    };

    if (this.config.cacheEnabled) {
      this.updateCache(document, endpointCount, schemaCount);
    }

    this.history.push(result);
    if (this.history.length > this.config.maxHistorySize) {
      this.history.shift();
    }

    return result;
  }

  getCachedDocument(): OpenAPIDocument | null {
    if (!this.config.cacheEnabled || !this.cache) return null;
    return this.cache.document;
  }

  isCacheValid(): boolean {
    if (!this.config.cacheEnabled || !this.cache) return false;
    const age = Date.now() - new Date(this.cache.generatedAt).getTime();
    return age < this.config.cacheMaxAgeMs;
  }

  invalidateCache(): void {
    this.cache = null;
    this.cacheVersion++;
  }

  forceRegenerate(): OpenAPIGenerationResult {
    this.invalidateCache();
    return this.generate();
  }

  getStatistics(): OpenAPIStatistics {
    const doc = this.cache?.document ?? this.buildDocument();
    const endpointsByTag: Record<string, number> = {};
    const endpointsByMethod: Record<string, number> = {};

    for (const tag of doc.tags) {
      endpointsByTag[tag.name] = 0;
    }

    for (const pathItem of Object.values(doc.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
          const op = operation as Record<string, unknown>;
          endpointsByMethod[method.toUpperCase()] = (endpointsByMethod[method.toUpperCase()] || 0) + 1;
          const tags = op.tags as string[] | undefined;
          if (tags) {
            for (const tag of tags) {
              endpointsByTag[tag] = (endpointsByTag[tag] || 0) + 1;
            }
          }
        }
      }
    }

    return {
      totalEndpoints: this.countEndpoints(ALL_ENDPOINT_MODULES),
      totalSchemas: Object.keys(doc.components.schemas).length,
      totalTags: doc.tags.length,
      endpointsByTag,
      endpointsByMethod,
      lastGenerated: this.cache?.generatedAt ?? null,
      cacheVersion: this.cacheVersion,
    };
  }

  getEndpointModules(): EndpointModule[] {
    return [...ALL_ENDPOINT_MODULES];
  }

  getDtoDefinitions(): DtoDefinition[] {
    return [...BUILT_IN_DTOS];
  }

  getEnumDefinitions(): EnumDefinition[] {
    return [...BUILT_IN_ENUMS];
  }

  getModuleNames(): string[] {
    return ALL_ENDPOINT_MODULES.map((m) => m.name);
  }

  getTagNames(): string[] {
    return [...new Set(ALL_ENDPOINT_MODULES.map((m) => m.tag))];
  }

  getEndpointsByTag(tag: string): EndpointDefinition[] {
    const results: EndpointDefinition[] = [];
    for (const mod of ALL_ENDPOINT_MODULES) {
      if (mod.tag === tag) {
        results.push(...mod.endpoints);
      }
    }
    return results;
  }

  getEndpointsByMethod(method: string): EndpointDefinition[] {
    const results: EndpointDefinition[] = [];
    for (const mod of ALL_ENDPOINT_MODULES) {
      for (const ep of mod.endpoints) {
        if (ep.method === method) results.push(ep);
      }
    }
    return results;
  }

  exportJson(pretty = true): string {
    const result = this.ensureGenerated();
    return pretty ? JSON.stringify(result.document, null, 2) : JSON.stringify(result.document);
  }

  exportYaml(): string {
    const result = this.ensureGenerated();
    return this.toYaml(result.document);
  }

  exportMarkdown(): string {
    const result = this.ensureGenerated();
    return this.toMarkdown(result.document);
  }

  export(format: ExportFormat): string {
    switch (format) {
      case 'json': return this.exportJson();
      case 'yaml': return this.exportYaml();
      case 'markdown': return this.exportMarkdown();
    }
  }

  getHistory(): OpenAPIGenerationResult[] {
    return [...this.history];
  }

  private ensureGenerated(): OpenAPIGenerationResult {
    if (this.config.cacheEnabled && this.cache && this.isCacheValid()) {
      const cached = this.cache;
      return {
        document: cached.document,
        endpointCount: cached.endpointCount,
        schemaCount: cached.schemaCount,
        tagCount: this.countTags(cached.document),
        generatedAt: cached.generatedAt,
        durationMs: 0,
      };
    }
    return this.generate();
  }

  private buildDocument(): OpenAPIDocument {
    const paths = this.buildPaths();
    const schemas = this.buildSchemas();
    const tags = this.buildTags();

    return {
      openapi: '3.0.3',
      info: {
        title: this.config.apiTitle,
        description: this.config.apiDescription,
        version: this.config.apiVersion,
      },
      servers: [
        { url: this.config.serverUrl, description: this.config.serverDescription },
      ],
      tags,
      paths,
      components: {
        schemas,
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          apiKey: { type: 'apiKey', name: 'x-api-key', in: 'header' },
        },
      },
    };
  }

  private buildPaths(): Record<string, Record<string, unknown>> {
    const paths: Record<string, Record<string, unknown>> = {};

    for (const mod of ALL_ENDPOINT_MODULES) {
      for (const ep of mod.endpoints) {
        if (!paths[ep.path]) paths[ep.path] = {};
        paths[ep.path][ep.method.toLowerCase()] = this.buildOperation(ep);
      }
    }

    return paths;
  }

  private buildOperation(ep: EndpointDefinition): Record<string, unknown> {
    const operation: Record<string, unknown> = {
      operationId: ep.operationId,
      summary: ep.summary,
      tags: ep.tags,
      responses: this.buildResponses(ep.responses),
    };

    if (ep.description) operation.description = ep.description;
    if (ep.deprecated) operation.deprecated = true;

    if (ep.parameters.length > 0) {
      operation.parameters = ep.parameters.map((p) => ({
        name: p.name,
        in: p.in,
        required: p.required,
        ...(p.description ? { description: p.description } : {}),
        schema: p.schema,
      }));
    }

    if (ep.requestBody) {
      operation.requestBody = {
        required: ep.requestBody.required,
        content: {
          [ep.requestBody.contentType]: {
            schema: ep.requestBody.schema,
          },
        },
      };
    }

    return operation;
  }

  private buildResponses(responses: EndpointDefinition['responses']): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const r of responses) {
      const key = String(r.statusCode);
      const entry: Record<string, unknown> = { description: r.description };
      if (r.schema) {
        entry.content = {
          'application/json': { schema: r.schema },
        };
      }
      result[key] = entry;
    }
    return result;
  }

  private buildSchemas(): Record<string, OpenAPISchema> {
    const schemas: Record<string, OpenAPISchema> = {};

    for (const dto of BUILT_IN_DTOS) {
      schemas[dto.name] = this.dtoToSchema(dto);
    }

    for (const en of BUILT_IN_ENUMS) {
      schemas[en.name] = this.enumToSchema(en);
    }

    return schemas;
  }

  private dtoToSchema(dto: DtoDefinition): OpenAPISchema {
    const properties: Record<string, OpenAPISchema> = {};
    const required: string[] = [];

    for (const prop of dto.properties) {
      const propSchema = this.propertyToSchema(prop);
      properties[prop.name] = propSchema;
      if (prop.required) required.push(prop.name);
    }

    return {
      type: 'object',
      properties,
      ...(required.length > 0 ? { required } : {}),
      ...(dto.description ? { description: dto.description } : {}),
    };
  }

  private propertyToSchema(prop: PropertyDefinition): OpenAPISchema {
    const schema: OpenAPISchema = {};

    switch (prop.type) {
      case 'string': schema.type = 'string'; break;
      case 'number': schema.type = 'number'; break;
      case 'integer': schema.type = 'integer'; break;
      case 'boolean': schema.type = 'boolean'; break;
      case 'object': schema.type = 'object'; break;
      case 'array': schema.type = 'array'; break;
      default: schema.type = 'string';
    }

    if (prop.example !== undefined) schema.example = prop.example;
    if (prop.nullable) schema.nullable = true;
    if (prop.enum) schema.enum = prop.enum;
    if (prop.description) schema.description = prop.description;
    if (prop.items) schema.items = prop.items;
    if (prop.properties) schema.properties = prop.properties;

    return schema;
  }

  private enumToSchema(en: EnumDefinition): OpenAPISchema {
    const schema: OpenAPISchema = {
      type: 'string',
      enum: [...en.values],
    };
    if (en.description) schema.description = en.description;
    return schema;
  }

  private buildTags(): Array<{ name: string; description: string }> {
    const seen = new Set<string>();
    const tags: Array<{ name: string; description: string }> = [];

    for (const mod of ALL_ENDPOINT_MODULES) {
      if (!seen.has(mod.tag)) {
        seen.add(mod.tag);
        tags.push({
          name: mod.tag,
          description: TAG_DESCRIPTIONS[mod.tag] || mod.tag,
        });
      }
    }

    return tags;
  }

  private updateCache(document: OpenAPIDocument, endpointCount: number, schemaCount: number): void {
    this.cache = {
      document,
      generatedAt: new Date().toISOString(),
      endpointCount,
      schemaCount,
      version: ++this.cacheVersion,
    };
  }

  private countEndpoints(modules: EndpointModule[]): number {
    let count = 0;
    for (const mod of modules) {
      count += mod.endpoints.length;
    }
    return count;
  }

  private countTags(doc: OpenAPIDocument): number {
    return doc.tags.length;
  }

  private toYaml(obj: unknown, indent = 0): string {
    if (obj === null || obj === undefined) return 'null';
    if (typeof obj === 'string') return this.yamlString(obj);
    if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);

    const pad = '  '.repeat(indent);

    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      return obj.map((item) => {
        const serialized = this.toYaml(item, indent + 1);
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          return `${pad}- ${serialized.trimStart()}`;
        }
        return `${pad}- ${serialized}`;
      }).join('\n');
    }

    if (typeof obj === 'object') {
      const entries = Object.entries(obj as Record<string, unknown>);
      if (entries.length === 0) return '{}';
      return entries.map(([key, value]) => {
        const serialized = this.toYaml(value, indent + 1);
        if (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value as Record<string, unknown>).length > 0) {
          return `${pad}${key}:\n${serialized}`;
        }
        if (Array.isArray(value) && value.length > 0) {
          return `${pad}${key}:\n${serialized}`;
        }
        return `${pad}${key}: ${serialized}`;
      }).join('\n');
    }

    return String(obj);
  }

  private yamlString(str: string): string {
    if (str === '') return "''";
    if (/[:{}\[\],&*?|>!%@`#'"\n\r\t]/.test(str) || /^\s|\s$/.test(str)) {
      return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }
    return str;
  }

  private toMarkdown(doc: OpenAPIDocument): string {
    const lines: string[] = [];
    lines.push(`# ${doc.info.title}`);
    lines.push('');
    lines.push(`> ${doc.info.description}`);
    lines.push('');
    lines.push(`**Version:** ${doc.info.version}`);
    lines.push('');
    if (doc.servers.length > 0) {
      lines.push('## Servers');
      lines.push('');
      for (const server of doc.servers) {
        lines.push(`- **${server.description}:** \`${server.url}\``);
      }
      lines.push('');
    }

    const endpointsByTag = this.groupEndpointsByTag(doc);
    const tagOrder = doc.tags.map((t) => t.name);

    for (const tag of tagOrder) {
      const endpoints = endpointsByTag[tag];
      if (!endpoints || endpoints.length === 0) continue;

      const tagInfo = doc.tags.find((t) => t.name === tag);
      lines.push(`## ${tag}`);
      if (tagInfo?.description) lines.push(`> ${tagInfo.description}`);
      lines.push('');
      lines.push('| Method | Path | Description |');
      lines.push('|--------|------|-------------|');

      for (const ep of endpoints) {
        lines.push(`| ${ep.method} | \`${ep.path}\` | ${ep.summary} |`);
      }
      lines.push('');
    }

    const schemaNames = Object.keys(doc.components.schemas);
    if (schemaNames.length > 0) {
      lines.push('## Schemas');
      lines.push('');
      for (const name of schemaNames) {
        const schema = doc.components.schemas[name];
        const type = schema.type || 'object';
        const desc = schema.description ? ` — ${schema.description}` : '';
        lines.push(`### ${name} (${type})${desc}`);
        lines.push('');
        if (schema.enum) {
          lines.push('Values: ' + schema.enum.map((v) => `\`${v}\``).join(', '));
          lines.push('');
        }
        if (schema.properties) {
          lines.push('| Property | Type | Required |');
          lines.push('|----------|------|----------|');
          const requiredSet = new Set(schema.required || []);
          for (const [propName, propSchema] of Object.entries(schema.properties)) {
            const propType = propSchema.type || propSchema.$ref || 'unknown';
            const isRequired = requiredSet.has(propName) ? 'Yes' : 'No';
            lines.push(`| ${propName} | ${propType} | ${isRequired} |`);
          }
          lines.push('');
        }
      }
    }

    return lines.join('\n');
  }

  private groupEndpointsByTag(doc: OpenAPIDocument): Record<string, EndpointDefinition[]> {
    const result: Record<string, EndpointDefinition[]> = {};
    for (const mod of ALL_ENDPOINT_MODULES) {
      for (const ep of mod.endpoints) {
        if (!result[ep.tags[0]]) result[ep.tags[0]] = [];
        result[ep.tags[0]].push(ep);
      }
    }
    return result;
  }
}
