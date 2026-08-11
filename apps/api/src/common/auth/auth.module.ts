import { Module, Global, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { ApiKeyGuard } from './guards/api-key.guard';
import { DevBypassGuard } from './guards/dev-bypass.guard';
import { AuthMiddleware } from './middleware/auth.middleware';
import { UserContextMiddleware } from './middleware/user-context.middleware';
import { AuditLogInterceptor } from './interceptors/audit-log.interceptor';
import { FeatureFlags } from './feature-flags';

const GUARDS = [AuthGuard, RolesGuard, PermissionsGuard, ApiKeyGuard, DevBypassGuard];
const MIDDLEWARE = [AuthMiddleware, UserContextMiddleware];
const INTERCEPTORS = [AuditLogInterceptor];

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [AuthController],
  providers: [AuthService, FeatureFlags, ...GUARDS, ...INTERCEPTORS],
  exports: [AuthService, FeatureFlags, ...GUARDS, ...INTERCEPTORS],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(...MIDDLEWARE).forRoutes('*');
  }
}
