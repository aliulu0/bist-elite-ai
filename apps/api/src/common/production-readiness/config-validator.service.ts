import { Injectable } from '@nestjs/common';
import {
  ConfigValidationResult,
  ConfigItem,
  ReadinessStatus,
  ValidationIssue,
  Severity,
} from './types';

const DEFAULT_REQUIRED_ENV_VARS = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'REDIS_URL',
  'APP_VERSION',
];

const DEFAULT_OPTIONAL_ENV_VARS = [
  'LOG_LEVEL',
  'LOG_CONSOLE',
  'LOG_FILE',
  'CACHE_ENABLED',
  'CACHE_TTL',
  'FEATURE_FLAGS',
  'CORS_ORIGIN',
  'JWT_SECRET',
  'API_KEY',
  'TELEGRAM_BOT_TOKEN',
];

const SENSITIVE_KEYS = ['SECRET', 'TOKEN', 'PASSWORD', 'API_KEY', 'JWT'];

@Injectable()
export class ConfigValidatorService {
  validate(
    required: string[] = DEFAULT_REQUIRED_ENV_VARS,
    optional: string[] = DEFAULT_OPTIONAL_ENV_VARS,
  ): ConfigValidationResult {
    const items: ConfigItem[] = [];
    const issues: ValidationIssue[] = [];

    for (const key of required) {
      const item = this.validateItem(key, true);
      items.push(item);
      if (!item.present || !item.valid) {
        issues.push({
          severity: Severity.CRITICAL,
          category: 'config',
          message: `Required environment variable '${key}' is missing or invalid`,
          recommendation: `Set the '${key}' environment variable before deployment`,
          impact: 'Application may fail to start or function correctly',
        });
      }
    }

    for (const key of optional) {
      const item = this.validateItem(key, false);
      items.push(item);
      if (item.present && !item.valid) {
        issues.push({
          severity: Severity.MEDIUM,
          category: 'config',
          message: `Optional environment variable '${key}' is present but invalid`,
          recommendation: `Review the value of '${key}' or remove it to use defaults`,
          impact: 'Feature may not work as expected',
        });
      }
    }

    const totalRequired = items.filter((i) => i.required).length;
    const totalPresent = items.filter((i) => i.present).length;
    const totalValid = items.filter((i) => i.valid || !i.required).length;

    const allRequiredValid = items
      .filter((i) => i.required)
      .every((i) => i.present && i.valid);

    return {
      status: allRequiredValid ? ReadinessStatus.PASS : ReadinessStatus.FAIL,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      items,
      totalRequired,
      totalPresent,
      totalValid,
      issues,
    };
  }

  private validateItem(key: string, required: boolean): ConfigItem {
    const value = process.env[key];
    const sensitive = SENSITIVE_KEYS.some((s) => key.toUpperCase().includes(s));

    const item: ConfigItem = {
      key,
      present: value !== undefined && value !== '',
      required,
      valid: true,
      sensitive,
    };

    if (item.present && value) {
      item.resolvedValue = sensitive ? '[REDACTED]' : value;

      if (key === 'PORT') {
        const port = parseInt(value, 10);
        item.valid = !isNaN(port) && port > 0 && port <= 65535;
        if (!item.valid) {
          item.validationMessage = `PORT must be a number between 1 and 65535, got '${value}'`;
        }
      }

      if (key === 'NODE_ENV') {
        const validEnvs = ['development', 'production', 'test', 'staging'];
        item.valid = validEnvs.includes(value);
        if (!item.valid) {
          item.validationMessage = `NODE_ENV must be one of: ${validEnvs.join(', ')}`;
        }
      }

      if (key === 'DATABASE_URL') {
        item.valid = value.startsWith('postgresql://') || value.startsWith('postgres://');
        if (!item.valid) {
          item.validationMessage = 'DATABASE_URL must be a valid PostgreSQL connection string';
        }
      }

      if (key === 'REDIS_URL') {
        item.valid = value.startsWith('redis://') || value.startsWith('rediss://');
        if (!item.valid) {
          item.validationMessage = 'REDIS_URL must be a valid Redis connection string';
        }
      }
    } else {
      item.resolvedValue = undefined;
    }

    return item;
  }
}
