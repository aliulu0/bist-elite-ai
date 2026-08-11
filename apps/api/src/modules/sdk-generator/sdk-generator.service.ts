import { Injectable, Optional } from '@nestjs/common';
import type {
  SDKGeneratorConfig,
  SDKGenerationResult,
  SDKGeneratedFile,
  SDKModuleDefinition,
  SDKEndpointDefinition,
  SDKParameter,
  SDKBodyParameter,
  SDKTypeDefinition,
  SDKTypeProperty,
  SDKEnumDefinition,
  SDKClientDefinition,
} from './sdk-generator.types';
import type {
  OpenAPIDocument,
  EndpointModule,
  EndpointDefinition,
  DtoDefinition,
  EnumDefinition,
  OpenAPISchema,
  PropertyDefinition,
} from '../openapi/openapi.types';
import {
  DEFAULT_SDK_CONFIG,
  RESERVED_KEYWORDS,
  TYPE_MAP,
  PAGINATION_OPS,
} from './sdk-generator.config';

@Injectable()
export class SDKGeneratorEngine {
  private readonly config: SDKGeneratorConfig;

  constructor(@Optional() config?: Partial<SDKGeneratorConfig>) {
    this.config = { ...DEFAULT_SDK_CONFIG, ...config };
  }

  generate(document: OpenAPIDocument): SDKGenerationResult {
    const start = Date.now();
    const files: SDKGeneratedFile[] = [];
    const modules = this.buildModuleDefinitions(document);
    const types = this.buildTypeDefinitions(document);
    const enums = this.buildEnumDefinitions(document);

    files.push(this.generateIndexFile(modules, types, enums));
    files.push(this.generateClientFile(document, modules, types, enums));
    files.push(this.generateTypesFile(document));
    files.push(this.generateEnumsFile(document));

    for (const mod of modules) {
      files.push(this.generateModuleFile(mod, document));
    }

    const totalEndpoints = modules.reduce((sum, m) => sum + m.endpoints.length, 0);
    const generatedAt = new Date().toISOString();
    const durationMs = Date.now() - start;

    return {
      files,
      moduleCount: modules.length,
      endpointCount: totalEndpoints,
      typeCount: types.length,
      enumCount: enums.length,
      generatedAt,
      durationMs,
      outputDir: this.config.outputDir,
    };
  }

  getConfig(): SDKGeneratorConfig {
    return { ...this.config };
  }

  buildModuleDefinitions(document: OpenAPIDocument): SDKModuleDefinition[] {
    const tags = new Map<string, EndpointModule[]>();

    for (const tag of document.tags) {
      const moduleEndpoints = this.getEndpointsForTag(document, tag.name);
      if (moduleEndpoints.length > 0) {
        const module: EndpointModule = {
          name: tag.name.replace(/[^a-zA-Z0-9]/g, ''),
          tag: tag.name,
          basePath: '',
          endpoints: moduleEndpoints,
        };
        if (!tags.has(tag.name)) tags.set(tag.name, []);
        tags.get(tag.name)!.push(module);
      }
    }

    const result: SDKModuleDefinition[] = [];
    const seenModules = new Set<string>();

    for (const tag of document.tags) {
      const tagEndpoints = this.getEndpointsForTag(document, tag.name);
      if (tagEndpoints.length === 0 || seenModules.has(tag.name)) continue;
      seenModules.add(tag.name);

      const moduleName = this.toPascalCase(tag.name);
      const moduleDef: SDKModuleDefinition = {
        name: moduleName,
        tag: tag.name,
        className: `${moduleName}Module`,
        filePath: `${this.config.modulesDir}/${this.toCamelCase(tag.name)}.ts`,
        endpoints: tagEndpoints.map(ep => this.buildEndpointDefinition(ep)),
      };
      result.push(moduleDef);
    }

    return result;
  }

  buildTypeDefinitions(document: OpenAPIDocument): SDKTypeDefinition[] {
    const types: SDKTypeDefinition[] = [];
    const schemas = document.components?.schemas || {};

    for (const [name, schema] of Object.entries(schemas)) {
      if (schema.enum) {
        // Enums handled separately
        continue;
      }
      if (schema.type === 'string') {
        // Simple string type alias
        continue;
      }
      if (schema.type === 'object' && schema.properties) {
        types.push(this.schemaToTypeDefinition(name, schema));
      } else if (schema.allOf || schema.oneOf) {
        // allOf/oneOf schemas without explicit type: 'object'
        types.push(this.schemaToTypeDefinition(name, schema));
      }
    }

    return types;
  }

  buildEnumDefinitions(document: OpenAPIDocument): SDKEnumDefinition[] {
    const enums: SDKEnumDefinition[] = [];
    const schemas = document.components?.schemas || {};

    for (const [name, schema] of Object.entries(schemas)) {
      if (schema.enum) {
        enums.push({
          name,
          values: [...schema.enum],
          description: schema.description,
        });
      }
    }

    return enums;
  }

  schemaToTypeDefinition(name: string, schema: OpenAPISchema): SDKTypeDefinition {
    const properties: SDKTypeProperty[] = [];

    if (schema.properties) {
      const requiredSet = new Set(schema.required || []);
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        properties.push({
          name: propName,
          typeScriptType: this.schemaToTypeScriptType(propSchema, schema),
          required: requiredSet.has(propName),
          nullable: propSchema.nullable,
          description: propSchema.description,
        });
      }
    }

    return {
      name,
      properties,
      description: schema.description,
    };
  }

  schemaToTypeScriptType(schema: OpenAPISchema, parentSchema?: OpenAPISchema): string {
    if (schema.$ref) {
      const refName = schema.$ref.split('/').pop() || 'unknown';
      return refName;
    }

    if (schema.allOf) {
      const types = schema.allOf.map(s => this.schemaToTypeScriptType(s, parentSchema));
      return types.join(' & ');
    }

    if (schema.oneOf) {
      const types = schema.oneOf.map(s => this.schemaToTypeScriptType(s, parentSchema));
      return types.join(' | ');
    }

    if (schema.type === 'array' && schema.items) {
      const itemType = this.schemaToTypeScriptType(schema.items, parentSchema);
      return `${itemType}[]`;
    }

    if (schema.type === 'object' && schema.properties) {
      const entries: string[] = [];
      const requiredSet = new Set(schema.required || []);
      for (const [key, val] of Object.entries(schema.properties)) {
        const opt = requiredSet.has(key) ? '' : '?';
        entries.push(`${key}${opt}: ${this.schemaToTypeScriptType(val, parentSchema)}`);
      }
      return `{ ${entries.join('; ')} }`;
    }

    return TYPE_MAP[schema.type || 'string'] || 'unknown';
  }

  sanitizeName(name: string): string {
    if (RESERVED_KEYWORDS.has(name)) return `${name}_`;
    return name;
  }

  formatPropertyName(name: string): string {
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
      if (RESERVED_KEYWORDS.has(name)) return `${name}_`;
      return name;
    }
    return `'${name.replace(/'/g, "\\'")}'`;
  }

  escapeString(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
  }

  private generateIndexFile(
    modules: SDKModuleDefinition[],
    types: SDKTypeDefinition[],
    enums: SDKEnumDefinition[],
  ): SDKGeneratedFile {
    const lines: string[] = [this.config.exportBanner, ''];
    const typeNames: string[] = [];
    const enumNames: string[] = [];

    for (const type of types) typeNames.push(type.name);
    for (const en of enums) enumNames.push(en.name);

    if (typeNames.length > 0) {
      lines.push(`export type { ${typeNames.join(', ')} } from './${this.config.typesDir}';`);
      lines.push('');
    }

    if (enumNames.length > 0) {
      lines.push(`export { ${enumNames.join(', ')} } from './${this.config.enumsDir}';`);
      lines.push('');
    }

    for (const mod of modules) {
      lines.push(`export { ${mod.className} } from './${mod.filePath.replace(/\.ts$/, '').replace(/\\/g, '/')}';`);
    }

    lines.push('');
    lines.push(`export { ${this.config.clientClassName} } from './${this.config.clientFileName.replace(/\.ts$/, '')}';`);
    lines.push('');

    const content = lines.join('\n');
    return { path: 'index.ts', content, sizeBytes: Buffer.byteLength(content, 'utf8') };
  }

  private generateClientFile(
    document: OpenAPIDocument,
    modules: SDKModuleDefinition[],
    types: SDKTypeDefinition[],
    enums: SDKEnumDefinition[],
  ): SDKGeneratedFile {
    const indent = ' '.repeat(this.config.indentSize);
    const lines: string[] = [
      this.config.exportBanner,
      '',
      "import type { RequestInit } from 'node-fetch';",
      '',
      `import { ${modules.map(m => m.className).join(', ')} } from './${this.config.modulesDir}';`,
      '',
    ];

    const enumNames = enums.map(e => e.name);
    if (enumNames.length > 0) {
      lines.push(`export { ${enumNames.join(', ')} } from './${this.config.enumsDir}';`);
      lines.push('');
    }

    lines.push(`export interface SDKConfig {`);
    lines.push(`${indent}baseUrl: string;`);
    if (this.config.enableRetry) {
      lines.push(`${indent}maxRetries?: number;`);
      lines.push(`${indent}retryDelayMs?: number;`);
    }
    if (this.config.enableInterceptors) {
      lines.push(`${indent}requestInterceptors?: Array<(url: string, init: RequestInit) => RequestInit>;`);
      lines.push(`${indent}responseInterceptors?: Array<(response: Response) => Response>;`);
    }
    lines.push('}');
    lines.push('');

    lines.push(`export interface PaginationParams {`);
    lines.push(`${indent}offset?: number;`);
    lines.push(`${indent}limit?: number;`);
    lines.push('}');
    lines.push('');

    const clientDef: SDKClientDefinition = {
      className: this.config.clientClassName,
      baseUrl: document.servers?.[0]?.url || 'http://localhost:3001',
      modules: modules.map(m => ({
        propertyName: this.toCamelCase(m.name),
        moduleName: m.className,
        importPath: `./${this.config.modulesDir}`,
      })),
      enableRetry: this.config.enableRetry,
      maxRetries: this.config.maxRetries,
      retryDelayMs: this.config.retryDelayMs,
      enableInterceptors: this.config.enableInterceptors,
    };

    lines.push(`export class ${clientDef.className} {`);
    lines.push(`${indent}readonly baseUrl: string;`);
    if (this.config.enableRetry) {
      lines.push(`${indent}readonly maxRetries: number;`);
      lines.push(`${indent}readonly retryDelayMs: number;`);
    }
    if (this.config.enableInterceptors) {
      lines.push(`${indent}private requestInterceptors: Array<(url: string, init: RequestInit) => RequestInit> = [];`);
      lines.push(`${indent}private responseInterceptors: Array<(response: Response) => Response> = [];`);
    }
    lines.push('');

    lines.push(`${indent}readonly health: ${this.getModuleNameForTag('Health', modules)};`);
    for (const mod of modules) {
      if (mod.tag === 'Health') continue;
      const propName = this.toCamelCase(mod.name);
      lines.push(`${indent}readonly ${propName}: ${mod.className};`);
    }
    lines.push('');

    lines.push(`${indent}constructor(config: SDKConfig) {`);
    lines.push(`${indent}${indent}this.baseUrl = config.baseUrl;`);
    if (this.config.enableRetry) {
      lines.push(`${indent}${indent}this.maxRetries = config.maxRetries ?? ${this.config.maxRetries};`);
      lines.push(`${indent}${indent}this.retryDelayMs = config.retryDelayMs ?? ${this.config.retryDelayMs};`);
    }

    const healthMod = modules.find(m => m.tag === 'Health');
    lines.push(`${indent}${indent}this.health = new ${healthMod?.className || 'HealthModule'}(this.baseUrl, this.fetch.bind(this));`);
    for (const mod of modules) {
      if (mod.tag === 'Health') continue;
      const propName = this.toCamelCase(mod.name);
      lines.push(`${indent}${indent}this.${propName} = new ${mod.className}(this.baseUrl, this.fetch.bind(this));`);
    }

    if (this.config.enableInterceptors) {
      lines.push(`${indent}${indent}if (config.requestInterceptors) this.requestInterceptors = config.requestInterceptors;`);
      lines.push(`${indent}${indent}if (config.responseInterceptors) this.responseInterceptors = config.responseInterceptors;`);
    }
    lines.push(`${indent}}`);
    lines.push('');

    lines.push(`${indent}async fetch<T>(url: string, init?: RequestInit): Promise<T> {`);
    lines.push(`${indent}${indent}const fullUrl = url.startsWith('http') ? url : \`\${this.baseUrl}\${url}\`;`);
    lines.push(`${indent}${indent}let finalInit = { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } };`);

    if (this.config.enableInterceptors) {
      lines.push(`${indent}${indent}for (const interceptor of this.requestInterceptors) {`);
      lines.push(`${indent}${indent}${indent}finalInit = interceptor(fullUrl, finalInit);`);
      lines.push(`${indent}${indent}}`);
    }

    lines.push(`${indent}${indent}let lastError: Error | undefined;`);

    if (this.config.enableRetry) {
      lines.push(`${indent}${indent}for (let attempt = 0; attempt <= this.maxRetries; attempt++) {`);
      lines.push(`${indent}${indent}${indent}try {`);
    } else {
      lines.push(`${indent}${indent}try {`);
    }

    if (this.config.enableRetry) {
      lines.push(`${indent}${indent}${indent}${indent}if (attempt > 0) {`);
      lines.push(`${indent}${indent}${indent}${indent}${indent}await new Promise(r => setTimeout(r, this.retryDelayMs * attempt));`);
      lines.push(`${indent}${indent}${indent}${indent}}`);
    }

    const fetchIndent = this.config.enableRetry ? `${indent}${indent}${indent}${indent}` : `${indent}${indent}${indent}`;
    lines.push(`${fetchIndent}let response = await globalThis.fetch(fullUrl, finalInit);`);

    if (this.config.enableInterceptors) {
      lines.push(`${fetchIndent}for (const interceptor of this.responseInterceptors) {`);
      lines.push(`${fetchIndent}${indent}response = interceptor(response);`);
      lines.push(`${fetchIndent}}`);
    }

    lines.push(`${fetchIndent}if (!response.ok) {`);
    lines.push(`${fetchIndent}${indent}const errorBody = await response.text().catch(() => 'Unknown error');`);
    lines.push(`${fetchIndent}${indent}throw new Error(\`HTTP \${response.status}: \${errorBody}\`);`);
    lines.push(`${fetchIndent}}`);
    lines.push(`${fetchIndent}const text = await response.text();`);
    lines.push(`${fetchIndent}return text ? JSON.parse(text) as T : ({} as T);`);

    const catchIndent = this.config.enableRetry ? `${indent}${indent}${indent}` : `${indent}${indent}`;
    lines.push(`${catchIndent}} catch (err) {`);
    lines.push(`${catchIndent}${indent}lastError = err instanceof Error ? err : new Error(String(err));`);

    if (this.config.enableRetry) {
      lines.push(`${catchIndent}${indent}if (attempt === this.maxRetries) break;`);
    }

    lines.push(`${catchIndent}}`);
    lines.push(`${catchIndent}throw lastError;`);

    if (this.config.enableRetry) {
      lines.push(`${indent}${indent}}`);
    }

    lines.push(`${indent}}`);
    lines.push('}');

    const content = lines.join('\n');
    return { path: this.config.clientFileName, content, sizeBytes: Buffer.byteLength(content, 'utf8') };
  }

  private generateTypesFile(document: OpenAPIDocument): SDKGeneratedFile {
    const indent = ' '.repeat(this.config.indentSize);
    const lines: string[] = [this.config.exportBanner, ''];
    const types = this.buildTypeDefinitions(document);

    for (const type of types) {
      if (type.description) lines.push(`/** ${type.description} */`);
      lines.push(`export interface ${type.name} {`);
      for (const prop of type.properties) {
        if (prop.description) lines.push(`${indent}/** ${prop.description} */`);
        const opt = prop.required ? '' : '?';
        const nullable = prop.nullable ? ' | null' : '';
        lines.push(`${indent}${this.formatPropertyName(prop.name)}${opt}: ${prop.typeScriptType}${nullable};`);
      }
      lines.push('}');
      lines.push('');
    }

    const content = lines.join('\n');
    return { path: `${this.config.typesDir}/index.ts`, content, sizeBytes: Buffer.byteLength(content, 'utf8') };
  }

  private generateEnumsFile(document: OpenAPIDocument): SDKGeneratedFile {
    const indent = ' '.repeat(this.config.indentSize);
    const lines: string[] = [this.config.exportBanner, ''];
    const enums = this.buildEnumDefinitions(document);

    for (const en of enums) {
      if (en.description) lines.push(`/** ${en.description} */`);
      lines.push(`export const ${en.name} = {`);
      for (const value of en.values) {
        lines.push(`${indent}${this.toConstantCase(value)}: '${this.escapeString(value)}',`);
      }
      lines.push(`} as const;`);
      lines.push('');
      lines.push(`export type ${en.name} = typeof ${en.name}[keyof typeof ${en.name}];`);
      lines.push('');
    }

    const content = lines.join('\n');
    return { path: `${this.config.enumsDir}/index.ts`, content, sizeBytes: Buffer.byteLength(content, 'utf8') };
  }

  private generateModuleFile(mod: SDKModuleDefinition, document: OpenAPIDocument): SDKGeneratedFile {
    const indent = ' '.repeat(this.config.indentSize);
    const lines: string[] = [this.config.exportBanner, ''];

    const referencedTypes = new Set<string>();
    for (const ep of mod.endpoints) {
      if (ep.pathParams.length > 0) referencedTypes.add('URLSearchParams');
    }

    const bodyDtos = new Set<string>();
    for (const ep of mod.endpoints) {
      if (ep.bodyParam) bodyDtos.add(ep.bodyParam.type);
    }
    for (const dtoName of bodyDtos) {
      lines.push(`import type { ${dtoName} } from '../${this.config.typesDir}';`);
    }
    lines.push('');

    lines.push(`export class ${mod.className} {`);

    lines.push(`${indent}private readonly baseUrl: string;`);
    lines.push(`${indent}private readonly fetchFn: <T>(url: string, init?: RequestInit) => Promise<T>;`);
    lines.push('');

    lines.push(`${indent}constructor(baseUrl: string, fetchFn: <T>(url: string, init?: RequestInit) => Promise<T>) {`);
    lines.push(`${indent}${indent}this.baseUrl = baseUrl;`);
    lines.push(`${indent}${indent}this.fetchFn = fetchFn;`);
    lines.push(`${indent}}`);
    lines.push('');

    for (const ep of mod.endpoints) {
      lines.push(...this.generateEndpointMethod(ep, indent));
      lines.push('');
    }

    lines.push('}');

    const content = lines.join('\n');
    return { path: mod.filePath, content, sizeBytes: Buffer.byteLength(content, 'utf8') };
  }

  private generateEndpointMethod(ep: SDKEndpointDefinition, indent: string): string[] {
    const lines: string[] = [];

    if (ep.description) lines.push(`${indent}/** ${this.escapeString(ep.description)} */`);
    if (ep.deprecated) lines.push(`${indent}/** @deprecated */`);

    const params: string[] = [];
    for (const p of ep.pathParams) {
      params.push(`${this.sanitizeName(p.name)}: ${p.typeScriptType}`);
    }
    for (const p of ep.queryParams) {
      params.push(`${this.sanitizeName(p.name)}${p.required ? '' : '?'}: ${p.typeScriptType}`);
    }
    if (ep.bodyParam) {
      params.push(`body: ${ep.bodyParam.type}${ep.bodyParam.required ? '' : '?'}`);
    }

    // paramStr is not used — parameters are joined inline

    lines.push(`${indent}async ${ep.name}(${params.join(', ')}): Promise<unknown> {`);

    lines.push(`${indent}${indent}let path = '${this.escapeString(ep.path)}';`);

    for (const p of ep.pathParams) {
      lines.push(`${indent}${indent}path = path.replace('${this.escapeString(`{${p.name}}`)}', encodeURIComponent(String(${this.sanitizeName(p.name)})));`);
    }

    if (ep.queryParams.length > 0) {
      lines.push(`${indent}${indent}const params = new URLSearchParams();`);
      for (const p of ep.queryParams) {
        if (p.required) {
          lines.push(`${indent}${indent}params.set('${this.escapeString(p.name)}', String(${this.sanitizeName(p.name)}));`);
        } else {
          lines.push(`${indent}${indent}if (${this.sanitizeName(p.name)} !== undefined) params.set('${this.escapeString(p.name)}', String(${this.sanitizeName(p.name)}));`);
        }
      }
      lines.push(`${indent}${indent}const qs = params.toString();`);
      lines.push(`${indent}${indent}if (qs) path += '?' + qs;`);
    }

    const initParts: string[] = [`method: '${ep.method}'`];
    if (ep.bodyParam) {
      initParts.push(`body: JSON.stringify(body)`);
    }
    lines.push(`${indent}${indent}const init: RequestInit = { ${initParts.join(', ')} };`);
    lines.push(`${indent}${indent}return this.fetchFn<unknown>(path, init);`);

    lines.push(`${indent}}`);

    return lines;
  }

  private getEndpointsForTag(document: OpenAPIDocument, tag: string): EndpointDefinition[] {
    const endpoints: EndpointDefinition[] = [];
    for (const [pathStr, pathItem] of Object.entries(document.paths)) {
      if (!pathItem || typeof pathItem !== 'object') continue;
      for (const [method, operation] of Object.entries(pathItem)) {
        if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue;
        const op = operation as Record<string, unknown>;
        const opTags = (op.tags as string[]) || [];
        if (opTags.includes(tag)) {
          const parameters = Array.isArray(op.parameters) ? (op.parameters as EndpointDefinition['parameters']) : [];
          const rawBody = op.requestBody as Record<string, unknown> | undefined;
          let requestBody: EndpointDefinition['requestBody'] | undefined;
          if (rawBody) {
            const bodyContent = rawBody.content as Record<string, { schema?: OpenAPISchema }> | undefined;
            const bodySchema = bodyContent?.['application/json']?.schema;
            if (bodySchema) {
              requestBody = {
                required: !!rawBody.required,
                contentType: 'application/json',
                schema: bodySchema,
              };
            }
          }
          const responses: EndpointDefinition['responses'] = [];
          if (op.responses && typeof op.responses === 'object') {
            for (const [code, resp] of Object.entries(op.responses as Record<string, Record<string, unknown>>)) {
              const statusCode = parseInt(code, 10);
              if (!isNaN(statusCode)) {
                const contentMap = resp.content as Record<string, { schema?: OpenAPISchema }> | undefined;
                const contentSchema = contentMap?.['application/json']?.schema as OpenAPISchema | undefined;
                responses.push({
                  statusCode,
                  description: (resp.description as string) || '',
                  schema: contentSchema,
                });
              }
            }
          }
          if (responses.length === 0) {
            responses.push({ statusCode: 200, description: 'Success' });
          }
          endpoints.push({
            path: pathStr,
            method: method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
            operationId: (op.operationId as string) || '',
            summary: (op.summary as string) || '',
            description: op.description as string | undefined,
            tags: opTags,
            parameters,
            requestBody: requestBody as EndpointDefinition['requestBody'] | undefined,
            responses,
            deprecated: op.deprecated as boolean | undefined,
          });
        }
      }
    }
    return endpoints;
  }

  private buildEndpointDefinition(ep: EndpointDefinition): SDKEndpointDefinition {
    const pathParams: SDKParameter[] = [];
    const queryParams: SDKParameter[] = [];
    let bodyParam: SDKBodyParameter | null = null;

    if (ep.parameters) {
      for (const param of ep.parameters) {
        const sdkParam: SDKParameter = {
          name: param.name,
          typeScriptType: this.schemaToTypeScriptType(param.schema),
          required: param.required,
          description: param.description,
          example: param.example,
        };
        if (param.in === 'path') pathParams.push(sdkParam);
        else if (param.in === 'query') queryParams.push(sdkParam);
      }
    }

    if (ep.requestBody) {
      bodyParam = {
        type: ep.requestBody.schema.$ref?.split('/').pop() || 'unknown',
        required: ep.requestBody.required,
      };
    }

    const responseType = this.extractResponseType(ep);

    return {
      operationId: ep.operationId,
      name: this.toCamelCase(ep.operationId),
      method: ep.method.toLowerCase(),
      path: ep.path,
      description: ep.description,
      summary: ep.summary,
      pathParams,
      queryParams,
      bodyParam,
      responseType,
      deprecated: ep.deprecated,
    };
  }

  private extractResponseType(ep: EndpointDefinition): string {
    const response200 = ep.responses.find(r => r.statusCode === 200 || r.statusCode === 201);
    if (!response200?.schema) return 'unknown';

    if (response200.schema.$ref) {
      return response200.schema.$ref.split('/').pop() || 'unknown';
    }

    if (response200.schema.type === 'array' && response200.schema.items) {
      if (response200.schema.items.$ref) {
        const refName = response200.schema.items.$ref.split('/').pop() || 'unknown';
        return `${refName}[]`;
      }
      return `${this.schemaToTypeScriptType(response200.schema.items)}[]`;
    }

    return this.schemaToTypeScriptType(response200.schema);
  }

  private toCamelCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^[A-Z]/, char => char.toLowerCase())
      .replace(/[^a-zA-Z0-9]/g, '');
  }

  private toPascalCase(str: string): string {
    const camel = this.toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  }

  private toConstantCase(str: string): string {
    return str.replace(/-/g, '_').replace(/[a-z]/g, c => c.toUpperCase()).replace(/[^A-Z0-9_]/g, '_');
  }

  private getModuleNameForTag(tag: string, modules: SDKModuleDefinition[]): string {
    const mod = modules.find(m => m.tag === tag);
    return mod?.className || `${this.toPascalCase(tag)}Module`;
  }
}
