import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppLoggerService } from '../../logger/logger.service';

const SUSPICIOUS_PATTERNS = [
  /\.\.[\/\\]/,
  /\/etc\/passwd/,
  /\/etc\/shadow/,
  /\/proc\//,
  /\/sys\//,
  /\/dev\//,
  /\\windows\\system32/i,
  /cmd\.exe/i,
  /powershell/i,
  /\bexec\b/i,
  /\beval\b/i,
  /__proto__/,
  /constructor\s*\(/,
  /\breturn\s+require\b/,
];

@Injectable()
export class InputSanitizationMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    this.scanObject(req.query, 'query');
    this.scanObject(req.params, 'params');

    if (req.body && typeof req.body === 'object') {
      this.scanObject(req.body, 'body');
    }

    next();
  }

  private scanObject(obj: any, source: string): void {
    if (!obj || typeof obj !== 'object') return;

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        for (const pattern of SUSPICIOUS_PATTERNS) {
          if (pattern.test(value)) {
            this.logger.warn(
              `Suspicious input detected in ${source}.${key}`,
              'InputSanitization',
              { source, key, value: value.substring(0, 100) },
            );
            throw new BadRequestException({
              statusCode: 400,
              message: 'Geçersiz veri içeriği tespit edildi.',
              error: 'Bad Request',
            });
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        this.scanObject(value, `${source}.${key}`);
      }
    }
  }
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  private readonly logger: AppLoggerService;

  constructor(logger: AppLoggerService) {
    this.logger = logger;
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const correlationId =
      req.headers['x-correlation-id'] as string ||
      req.headers['x-request-id'] as string ||
      req.headers['x-b3-traceid'] as string ||
      '';

    if (correlationId) {
      (req as any).correlationId = correlationId;
      res.setHeader('X-Correlation-Id', correlationId);
    }

    next();
  }
}
