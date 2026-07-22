import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, from, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { Response } from 'express';

function compressGzip(buffer: Buffer, level: number): Promise<Buffer> {
  const { gzip } = require('zlib') as typeof import('zlib');
  return new Promise((resolve, reject) => {
    gzip(buffer, { level }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function compressBrotli(buffer: Buffer, level: number): Promise<Buffer> {
  const { brotliCompress, constants } = require('zlib') as typeof import('zlib');
  return new Promise((resolve, reject) => {
    brotliCompress(
      buffer,
      {
        params: {
          [constants.BROTLI_PARAM_QUALITY]: level,
          [constants.BROTLI_PARAM_SIZE_HINT]: buffer.length,
        },
      },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      },
    );
  });
}

@Injectable()
export class CompressionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CompressionInterceptor.name);
  private readonly threshold: number;
  private readonly level: number;

  constructor(options?: { threshold?: number; level?: number }) {
    this.threshold = options?.threshold ?? 1024;
    this.level = options?.level ?? 6;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const acceptEncoding = request.headers['accept-encoding'] || '';

    return next.handle().pipe(
      switchMap((data) => {
        if (data === undefined || data === null) return of(data);

        const response = context.switchToHttp().getResponse() as Response;
        const body = typeof data === 'string' ? data : JSON.stringify(data);
        const buffer = Buffer.from(body);

        if (buffer.length < this.threshold) return of(data);

        let compressFn: Promise<Buffer> | null = null;
        let encoding = '';

        if (acceptEncoding.includes('br')) {
          compressFn = compressBrotli(buffer, this.level);
          encoding = 'br';
        } else if (acceptEncoding.includes('gzip')) {
          compressFn = compressGzip(buffer, this.level);
          encoding = 'gzip';
        }

        if (!compressFn) return of(data);

        return from(compressFn).pipe(
          tap((compressed) => {
            response.setHeader('Content-Encoding', encoding);
            response.setHeader('Content-Length', compressed.length);
            response.setHeader('Vary', 'Accept-Encoding');
            (response as any).send(compressed);
          }),
          switchMap(() => of(undefined)),
        );
      }),
    );
  }
}

@Injectable()
export class ETagInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    if (request.method !== 'GET') return next.handle();

    return next.handle().pipe(
      tap((data) => {
        if (data === undefined || data === null) return;

        const response = context.switchToHttp().getResponse() as Response;
        const body = typeof data === 'string' ? data : JSON.stringify(data);
        const hash = simpleHash(body);

        response.setHeader('ETag', `"${hash}"`);
        response.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');

        const ifNoneMatch = request.headers['if-none-match'];
        if (ifNoneMatch === `"${hash}"`) {
          response.status(304);
          (response as any).send('');
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
