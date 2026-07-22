import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AppLoggerService } from '../../logger/logger.service';
import { getSecurityConfig, SecurityConfig } from '../security.config';

@Injectable()
export class RequestSizeInterceptor implements NestInterceptor {
  private readonly config: SecurityConfig['request'];

  constructor(private readonly logger: AppLoggerService) {
    this.config = getSecurityConfig().request;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const contentLength = parseInt(request.headers['content-length'] || '0', 10);

    const maxSizeBytes = this.parseSize(this.config.maxBodySize);

    if (contentLength > maxSizeBytes) {
      this.logger.warn(
        `Request body too large: ${contentLength} bytes (max: ${maxSizeBytes})`,
        'RequestSizeInterceptor',
        { url: request.url, contentLength, maxSize: maxSizeBytes },
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
          message: 'İstek gövdesi çok büyük.',
          error: 'Payload Too Large',
        },
        HttpStatus.PAYLOAD_TOO_LARGE,
      );
    }

    return next.handle();
  }

  private parseSize(size: string): number {
    const units: Record<string, number> = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/);
    if (!match) return 10 * 1024 * 1024;
    return Math.floor(parseFloat(match[1]) * units[match[2]]);
  }
}

@Injectable()
export class ResponseSanitizeInterceptor implements NestInterceptor {
  private readonly sensitiveFields = new Set([
    'password',
    'passwordHash',
    'password_hash',
    'secret',
    'token',
    'accessToken',
    'access_token',
    'refreshToken',
    'refresh_token',
    'apiKey',
    'api_key',
    'privateKey',
    'private_key',
    'jwt',
    'authorization',
    'credentials',
  ]);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle();
  }

  sanitizeResponse(data: any): any {
    if (data === null || data === undefined) return data;
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) return data.map((item) => this.sanitizeResponse(item));
    if (typeof data === 'object') {
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        if (this.sensitiveFields.has(key)) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeResponse(value);
        }
      }
      return sanitized;
    }
    return data;
  }
}
