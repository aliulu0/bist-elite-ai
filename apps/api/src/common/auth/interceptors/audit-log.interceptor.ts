import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { UserContext } from '../types';

interface AuditLogEntry {
  timestamp: string;
  userId: string;
  method: string;
  path: string;
  statusCode?: number;
  duration?: number;
  ip?: string;
  userAgent?: string;
  authenticated: boolean;
  authMethod: string;
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditLog');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const user: UserContext = request.userContext;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const entry: AuditLogEntry = {
            timestamp: new Date().toISOString(),
            userId: user?.userId || 'anonymous',
            method: request.method,
            path: request.url,
            statusCode: response.statusCode,
            duration: Date.now() - startTime,
            ip: request.ip || request.connection?.remoteAddress,
            userAgent: request.headers['user-agent'],
            authenticated: user?.isAuthenticated || false,
            authMethod: user?.authMethod || 'none',
          };

          if (request.method !== 'GET') {
            this.logger.log(JSON.stringify(entry));
          }
        },
        error: (error) => {
          const entry: AuditLogEntry = {
            timestamp: new Date().toISOString(),
            userId: user?.userId || 'anonymous',
            method: request.method,
            path: request.url,
            statusCode: response.statusCode,
            duration: Date.now() - startTime,
            ip: request.ip || request.connection?.remoteAddress,
            userAgent: request.headers['user-agent'],
            authenticated: user?.isAuthenticated || false,
            authMethod: user?.authMethod || 'none',
          };
          this.logger.error(JSON.stringify(entry));
        },
      }),
    );
  }
}
