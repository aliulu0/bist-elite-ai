import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppLoggerService } from '../../logger/logger.service';
import { getSecurityConfig, parseSecurityConfigFromEnv, SecurityConfig } from '../security.config';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  private readonly headers: SecurityConfig['headers'];

  constructor(private readonly logger: AppLoggerService) {
    this.headers = getSecurityConfig().headers;
  }

  use(req: Request, res: Response, next: NextFunction): void {
    res.setHeader('Content-Security-Policy', this.headers.contentSecurityPolicy);
    res.setHeader('Strict-Transport-Security', this.headers.strictTransportSecurity);
    res.setHeader('X-Frame-Options', this.headers.xFrameOptions);
    res.setHeader('X-Content-Type-Options', this.headers.xContentTypeOptions);
    res.setHeader('Referrer-Policy', this.headers.referrerPolicy);
    res.setHeader('Permissions-Policy', this.headers.permissionsPolicy);
    res.setHeader('X-Permitted-Cross-Domain-Policies', this.headers.xPermittedCrossDomainPolicies);
    res.setHeader('Cross-Origin-Embedder-Policy', this.headers.crossOriginEmbedderPolicy);
    res.setHeader('Cross-Origin-Opener-Policy', this.headers.crossOriginOpenerPolicy);
    res.setHeader('Cross-Origin-Resource-Policy', this.headers.crossOriginResourcePolicy);
    res.removeHeader('X-Powered-By');

    next();
  }
}

@Injectable()
export class RequestTimeoutMiddleware implements NestMiddleware {
  private readonly timeoutMs: number;

  constructor(private readonly logger: AppLoggerService) {
    this.timeoutMs = getSecurityConfig(parseSecurityConfigFromEnv()).request.timeoutMs;
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        this.logger.warn(
          `Request timeout: ${req.method} ${req.url} after ${this.timeoutMs}ms`,
          'RequestTimeout',
        );
        res.status(408).json({
          statusCode: 408,
          message: 'İstek zaman aşımına uğradı.',
          error: 'Request Timeout',
        });
      }
    }, this.timeoutMs);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  }
}

@Injectable()
export class RequestSizeMiddleware implements NestMiddleware {
  private readonly maxUrlLength: number;

  constructor(private readonly logger: AppLoggerService) {
    this.maxUrlLength = getSecurityConfig().request.maxUrlLength;
  }

  use(req: Request, res: Response, next: NextFunction): void {
    if (req.url.length > this.maxUrlLength) {
      this.logger.warn(`URL too long: ${req.url.length} chars`, 'RequestSize', {
        url: req.url.substring(0, 100),
      });
      throw new HttpException(
        {
          statusCode: HttpStatus.URI_TOO_LONG,
          message: "İstek URL'i çok uzun.",
          error: 'URI Too Long',
        },
        HttpStatus.URI_TOO_LONG,
      );
    }

    next();
  }
}
