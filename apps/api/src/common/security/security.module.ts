import { Module, MiddlewareConsumer, NestModule, Global } from '@nestjs/common';
import { SecurityHeadersMiddleware, RequestTimeoutMiddleware, RequestSizeMiddleware } from './middleware/security.middleware';
import { InputSanitizationMiddleware, CorrelationIdMiddleware } from './middleware/input-sanitization.middleware';
import { AppLoggerService } from '../logger/logger.service';

@Global()
@Module({})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware)
      .forRoutes('*');

    consumer
      .apply(SecurityHeadersMiddleware)
      .forRoutes('*');

    consumer
      .apply(InputSanitizationMiddleware)
      .forRoutes('*');

    consumer
      .apply(RequestTimeoutMiddleware)
      .forRoutes('*');

    consumer
      .apply(RequestSizeMiddleware)
      .forRoutes('*');
  }
}
