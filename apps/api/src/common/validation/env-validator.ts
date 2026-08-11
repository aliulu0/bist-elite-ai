export interface EnvVar {
  name: string;
  required: boolean;
  description: string;
}

export const REQUIRED_ENV_VARS: EnvVar[] = [
  { name: 'DATABASE_URL', required: true, description: 'PostgreSQL connection string' },
  { name: 'REDIS_URL', required: true, description: 'Redis connection string' },
  { name: 'JWT_SECRET', required: true, description: 'JWT signing secret (min 32 chars)' },
  { name: 'CORS_ORIGINS', required: false, description: 'Comma-separated allowed origins' },
  { name: 'PORT', required: false, description: 'API server port (default 3001)' },
  { name: 'NODE_ENV', required: false, description: 'Environment: development | production | staging' },
  { name: 'LOG_LEVEL', required: false, description: 'Log level: trace | debug | info | warn | error | fatal' },
  { name: 'SCHEDULER_ENABLED', required: false, description: 'Enable scheduler (true/false)' },
];

export const DEV_JWT_SECRET = 'dev-secret-change-in-production';

export function validateEnvVars(logger?: { error: (msg: string) => void }): void {
  const missing: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  for (const v of REQUIRED_ENV_VARS) {
    const value = process.env[v.name];
    if (v.required && (!value || value.trim() === '')) {
      missing.push(v.name);
    } else if (v.name === 'JWT_SECRET' && value) {
      if (value === DEV_JWT_SECRET) {
        if (isProduction) {
          missing.push(`${v.name} (dev secret must be replaced in production)`);
        } else {
          warnings.push(`JWT_SECRET uses the development default. Replace before production.`);
        }
      } else if (value.length < 32) {
        if (isProduction) {
          missing.push(`${v.name} (must be at least 32 characters in production)`);
        } else {
          warnings.push(`JWT_SECRET is too short (${value.length} chars). Minimum 32 recommended.`);
        }
      }
    }
  }

  if (isProduction && process.env.AUTH_ENABLED !== 'false') {
    const allowAnonymous = process.env.AUTH_ALLOW_ANONYMOUS !== 'false';
    if (allowAnonymous) {
      warnings.push(
        'AUTH_ALLOW_ANONYMOUS is not set to false in production — all endpoints will remain unauthenticated.',
      );
    }
  }

  if (missing.length > 0) {
    const msg = `Missing required environment variables: ${missing.join(', ')}`;
    if (logger) logger.error(msg);
    throw new Error(msg);
  }

  for (const w of warnings) {
    if (logger) logger.error(w);
  }
}
