import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { AppLoggerService } from '../../logger/logger.service';

const HTML_TAG_REGEX = /<[^>]*>/g;
const SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const EVENT_HANDLER_REGEX = /\s*on\w+\s*=\s*["'][^"']*["']/gi;
const JAVASCRIPT_URL_REGEX = /javascript\s*:/gi;
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE|CAST|CONVERT|TRUNCATE)\b)/gi,
  /(--|;|\/\*|\*\/|xp_|sp_)/gi,
  /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/gi,
  /['"]\s*(OR|AND)\s+['"].*?['"]\s*=\s*['"]/gi,
];

@Injectable()
export class SanitizePipe implements PipeTransform {
  constructor(private readonly logger: AppLoggerService) {}

  transform(value: any): any {
    if (value === null || value === undefined) return value;
    if (typeof value === 'string') return this.sanitizeString(value);
    if (Array.isArray(value)) return value.map((item) => this.transform(item));
    if (typeof value === 'object') return this.sanitizeObject(value);
    return value;
  }

  private sanitizeString(input: string): string {
    let sanitized = input;

    sanitized = sanitized.replace(SCRIPT_REGEX, '');
    sanitized = sanitized.replace(HTML_TAG_REGEX, '');
    sanitized = sanitized.replace(EVENT_HANDLER_REGEX, '');
    sanitized = sanitized.replace(JAVASCRIPT_URL_REGEX, '');

    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');

    return sanitized;
  }

  private sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item) => this.transform(item));
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}

@Injectable()
export class SqlInjectionDetector implements PipeTransform {
  private readonly patterns = SQL_INJECTION_PATTERNS;

  constructor(private readonly logger: AppLoggerService) {}

  transform(value: any): any {
    if (typeof value === 'string') {
      this.checkForSqlInjection(value);
    } else if (typeof value === 'object' && value !== null) {
      for (const [key, val] of Object.entries(value)) {
        if (typeof val === 'string') {
          this.checkForSqlInjection(val, key);
        }
      }
    }
    return value;
  }

  private checkForSqlInjection(value: string, fieldName?: string): void {
    for (const pattern of this.patterns) {
      pattern.lastIndex = 0;
      if (pattern.test(value)) {
        this.logger.warn(
          `Potential SQL injection detected in ${fieldName || 'input'}`,
          'SqlInjectionDetector',
          { field: fieldName, value: value.substring(0, 50) },
        );
        throw new BadRequestException({
          statusCode: 400,
          message: 'Geçersiz karakter içeren veri gönderdiniz.',
          error: 'Bad Request',
        });
      }
    }
  }
}
