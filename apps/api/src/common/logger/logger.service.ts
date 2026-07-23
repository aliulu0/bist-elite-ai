import { Injectable, LoggerService, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LogLevel,
  LOG_LEVEL_PRIORITY,
  StructuredLogEntry,
  LoggerConfig,
  DEFAULT_SENSITIVE_FIELDS,
} from './types';

@Injectable()
export class AppLoggerService implements LoggerService {
  private readonly nestLogger: Logger;
  private readonly config: LoggerConfig;

  private readonly sensitivePatterns: RegExp[];

  constructor(private readonly configService: ConfigService) {
    const level = (this.configService.get<string>('LOG_LEVEL', 'info') || 'info') as LogLevel;

    this.config = {
      level,
      enableConsole: this.configService.get<string>('LOG_CONSOLE', 'true') !== 'false',
      enableFile: this.configService.get<string>('LOG_FILE', 'false') === 'true',
      filePath: this.configService.get<string>('LOG_FILE_PATH', 'logs/app.log'),
      maskSensitiveFields: DEFAULT_SENSITIVE_FIELDS,
      maxFileSize: parseInt(this.configService.get<string>('LOG_MAX_FILE_SIZE', '10485760'), 10),
      maxFiles: parseInt(this.configService.get<string>('LOG_MAX_FILES', '5'), 10),
      retentionDays: parseInt(this.configService.get<string>('LOG_RETENTION_DAYS', '30'), 10),
    };

    this.nestLogger = new Logger('App');

    this.sensitivePatterns = this.config.maskSensitiveFields.map(
      (field) => new RegExp(`("${field}"\\s*:\\s*)"[^"]*"`, 'gi'),
    );
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.level];
  }

  private maskSensitiveData(data: unknown): unknown {
    if (data === null || data === undefined) return data;
    if (typeof data !== 'string') return data;

    let masked = data;
    for (const pattern of this.sensitivePatterns) {
      masked = masked.replace(pattern, '$1"[MASKED]"');
    }
    return masked;
  }

  private formatEntry(entry: StructuredLogEntry): string {
    try {
      const str = JSON.stringify(entry);
      return typeof this.maskSensitiveData(str) === 'string'
        ? (this.maskSensitiveData(str) as string)
        : str;
    } catch {
      try {
        return JSON.stringify({
          timestamp: entry.timestamp,
          level: entry.level,
          context: entry.context,
          message: entry.message,
        });
      } catch {
        return `${entry.timestamp} [${entry.level}] ${entry.context}: ${entry.message}`;
      }
    }
  }

  private write(level: LogLevel, context: string, message: string, meta?: Record<string, unknown>) {
    if (!this.shouldLog(level)) return;

    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      metadata: meta,
    };

    const formatted = this.formatEntry(entry);

    switch (level) {
      case LogLevel.TRACE:
      case LogLevel.DEBUG:
        this.nestLogger.debug(formatted, context);
        break;
      case LogLevel.INFO:
        this.nestLogger.log(formatted, context);
        break;
      case LogLevel.WARN:
        this.nestLogger.warn(formatted, context);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        this.nestLogger.error(formatted, context);
        break;
    }
  }

  trace(message: string, context?: string, meta?: Record<string, unknown>) {
    this.write(LogLevel.TRACE, context || 'App', message, meta);
  }

  debug(message: string, context?: string, meta?: Record<string, unknown>) {
    this.write(LogLevel.DEBUG, context || 'App', message, meta);
  }

  log(message: string, context?: string, meta?: Record<string, unknown>) {
    this.write(LogLevel.INFO, context || 'App', message, meta);
  }

  warn(message: string, context?: string, meta?: Record<string, unknown>) {
    this.write(LogLevel.WARN, context || 'App', message, meta);
  }

  error(message: string, trace?: string, context?: string, meta?: Record<string, unknown>) {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      context: context || 'App',
      message,
      stack: trace,
      metadata: meta,
    };

    const formatted = this.formatEntry(entry);
    this.nestLogger.error(formatted, trace, context);
  }

  fatal(message: string, trace?: string, context?: string, meta?: Record<string, unknown>) {
    if (!this.shouldLog(LogLevel.FATAL)) return;

    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.FATAL,
      context: context || 'App',
      message,
      stack: trace,
      metadata: meta,
    };

    const formatted = this.formatEntry(entry);
    this.nestLogger.error(formatted, trace, context);
  }

  logRequest(requestId: string, method: string, path: string, userId?: string) {
    this.write(LogLevel.INFO, 'HTTP', `${method} ${path}`, {
      requestId,
      userId: userId || 'anonymous',
      method,
      path,
    });
  }

  logResponse(
    requestId: string,
    method: string,
    path: string,
    statusCode: number,
    duration: number,
  ) {
    const level =
      statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    this.write(level, 'HTTP', `${method} ${path} ${statusCode} ${duration}ms`, {
      requestId,
      method,
      path,
      statusCode,
      duration,
    });
  }

  logEvent(context: string, event: string, data?: Record<string, unknown>) {
    this.write(LogLevel.INFO, context, event, data);
  }

  getConfig(): Readonly<LoggerConfig> {
    return { ...this.config };
  }
}
