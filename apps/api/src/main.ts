import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppLoggerService } from './common/logger/logger.service';
import { HealthService } from './common/monitoring/health.service';
import { PrismaService } from './common/database/prisma.service';
import { getSecurityConfig } from './common/security/security.config';
import { CacheService } from './common/cache/cache.service';
import { PerformanceMonitorService } from './common/performance/performance.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = app.get(AppLoggerService);
  const securityConfig = getSecurityConfig();
  const cacheService = app.get(CacheService);
  const performanceMonitor = app.get(PerformanceMonitorService);
  app.useLogger(logger);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: true,
  }));

  app.enableCors(securityConfig.cors);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    disableErrorMessages: process.env.NODE_ENV === 'production',
    maxLength: 1000,
  }));

  app.setGlobalPrefix('api', {
    exclude: ['health', 'health/ready', 'health/live'],
  });

  const healthService = app.get(HealthService);
  const prisma = app.get(PrismaService);
  healthService.registerCheck(healthService.createDatabaseCheck(prisma));
  healthService.registerCheck(healthService.createMemoryCheck());

  try {
    const redis = await import('ioredis').then(
      (mod) => new mod.default(process.env.REDIS_URL || 'redis://localhost:6379'),
    );
    healthService.registerCheck(
      healthService.createRedisCheck({
        ping: async () => redis.ping(),
      }),
    );
  } catch {
    logger.warn('Redis not available, skipping Redis health check', 'Bootstrap');
  }

  const config = new DocumentBuilder()
    .setTitle('BIST Elite AI API')
    .setDescription('AI-Powered Early Opportunity Detection Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.enableShutdownHooks();

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`API running on http://localhost:${port}`, 'Bootstrap');
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`, 'Bootstrap');
  logger.log('Security hardening initialized', 'Bootstrap');
  logger.log(
    `Performance optimization initialized: cache=${cacheService.size()} entries, compression=enabled, deduplication=enabled`,
    'Bootstrap',
  );
}
bootstrap();
