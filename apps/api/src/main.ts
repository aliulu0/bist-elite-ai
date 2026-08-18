import './common/validation/load-env';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { AppLoggerService } from './common/logger/logger.service';
import { HealthService } from './common/monitoring/health.service';
import { PrismaService } from './common/database/prisma.service';
import { getSecurityConfig, parseSecurityConfigFromEnv } from './common/security/security.config';
import { validateEnvVars } from './common/validation/env-validator';

async function bootstrap() {
  const logger = new AppLoggerService({ get: () => undefined } as any);
  validateEnvVars({ error: (msg) => logger.error(msg) });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: process.env.NODE_ENV === 'production' ? ['log', 'error', 'warn'] : ['error', 'warn'],
  });

  const appLogger = app.get(AppLoggerService);
  const securityConfig = getSecurityConfig(parseSecurityConfigFromEnv());

  app.use(compression());

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'"],
          connectSrc: ["'self'", ...(process.env.CORS_ORIGINS?.split(',') || [])],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-origin' },
    }),
  );

  app.enableCors(securityConfig.cors);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  app.setGlobalPrefix('api', {
    exclude: ['health', 'health/ready', 'health/live'],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('BIST Elite AI API')
    .setDescription('AI-Powered Early Opportunity Detection Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const healthService = app.get(HealthService);
  const prisma = app.get(PrismaService);
  healthService.registerCheck(healthService.createDatabaseCheck(prisma));
  healthService.registerCheck(healthService.createMemoryCheck());

  const REDIS_URL = process.env.REDIS_URL;
  if (REDIS_URL) {
    try {
      const Redis = (await import('ioredis')).default;
      const redis = new Redis(REDIS_URL, {
        retryStrategy: (times) => {
          if (times > 10) return null;
          return Math.min(times * 200, 5000);
        },
        maxRetriesPerRequest: 3,
        enableOfflineQueue: true,
        lazyConnect: true,
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) return true;
          return false;
        },
      });

      const redisHealthCheck = healthService.createRedisCheck({
        ping: async () => redis.ping(),
      });
      // Redis is an optional cache: the app runs fine without it (in-memory
      // fallback). An unreachable Redis must not degrade aggregate health or
      // readiness, but stays visible as an optional component in /health.
      redisHealthCheck.optional = true;
      healthService.registerCheck(redisHealthCheck);

      appLogger.log('Redis client initialized', 'Bootstrap');
    } catch {
      appLogger.warn('Redis not available — running without cache', 'Bootstrap');
    }
  }

  app.enableShutdownHooks();

  const port = process.env.PORT || 3001;
  await app.listen(port);
  appLogger.log(`API running on http://localhost:${port}`, 'Bootstrap');
  appLogger.log(`Swagger docs at http://localhost:${port}/api/docs`, 'Bootstrap');
}
bootstrap();
