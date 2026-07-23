import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { CacheConfig, getCacheConfig } from './cache.config';

function buildCacheKey(context: ExecutionContext, config: CacheConfig): string | null {
  const request = context.switchToHttp().getRequest();
  const { method, url, userContext } = request;

  if (method !== 'GET') return null;

  const userId = userContext?.userId || 'anonymous';
  return `${config.prefix}${userId}:${url}`;
}

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);
  private readonly config: CacheConfig;

  constructor(private readonly cacheService: CacheService) {
    this.config = getCacheConfig();
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (!this.config.enabled) return next.handle();

    const cacheKey = buildCacheKey(context, this.config);
    if (!cacheKey) return next.handle();

    const request = context.switchToHttp().getRequest();
    if (request.headers['cache-control'] === 'no-cache') {
      return next.handle();
    }

    const cached = this.cacheService.get<any>(cacheKey, 'api');
    if (cached !== undefined) {
      const response = context.switchToHttp().getResponse();
      response.setHeader('X-Cache', 'HIT');
      response.setHeader('Cache-Control', `public, max-age=${Math.floor(this.config.ttl / 1000)}`);
      return of(cached);
    }

    return next.handle().pipe(
      tap((data) => {
        if (data !== undefined && data !== null) {
          this.cacheService.set(cacheKey, data, this.config.ttl, 'api');
          const response = context.switchToHttp().getResponse();
          response.setHeader('X-Cache', 'MISS');
          response.setHeader(
            'Cache-Control',
            `public, max-age=${Math.floor(this.config.ttl / 1000)}`,
          );
        }
      }),
    );
  }
}

@Injectable()
export class ResponseCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResponseCacheInterceptor.name);

  constructor(private readonly cacheService: CacheService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    if (request.method !== 'GET') return next.handle();

    const response = context.switchToHttp().getResponse();
    const etag = request.headers['if-none-match'];

    return next.handle().pipe(
      tap((data) => {
        if (data !== undefined && data !== null) {
          const hash = simpleHash(JSON.stringify(data));
          response.setHeader('ETag', `"${hash}"`);
          response.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');

          if (etag === `"${hash}"`) {
            response.status(304);
          }
        }
      }),
    );
  }
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36);
}
