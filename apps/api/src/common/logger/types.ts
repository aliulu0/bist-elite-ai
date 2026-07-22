export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.TRACE]: 0,
  [LogLevel.DEBUG]: 1,
  [LogLevel.INFO]: 2,
  [LogLevel.WARN]: 3,
  [LogLevel.ERROR]: 4,
  [LogLevel.FATAL]: 5,
};

export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  requestId?: string;
  userId?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
  stack?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  filePath?: string;
  maskSensitiveFields: string[];
  maxFileSize: number;
  maxFiles: number;
  retentionDays: number;
}

export const DEFAULT_SENSITIVE_FIELDS = [
  'password',
  'secret',
  'token',
  'apiKey',
  'api_key',
  'authorization',
  'creditCard',
  'credit_card',
  'ssn',
  'nationalId',
  'national_id',
  'jwt',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'privateKey',
  'private_key',
  'credentials',
];
