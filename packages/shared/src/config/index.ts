export const config = {
  app: {
    name: process.env.APP_NAME || 'BIST Elite AI',
    version: process.env.APP_VERSION || '1.0.0',
    env: process.env.APP_ENV || 'development',
    debug: process.env.APP_DEBUG === 'true',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/bist_elite_ai',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379/0',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || '',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  },
} as const;
