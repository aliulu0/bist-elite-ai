import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AppLoggerService } from '../logger/logger.service';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const requestId = request.headers['x-request-id'] || randomUUID();
    const startTime = Date.now();
    const { method, url, ip } = request;
    const userAgent = request.headers['user-agent'] || '';
    const userId = request.userContext?.userId;

    request.requestId = requestId;
    response.setHeader('X-Request-Id', requestId);

    this.logger.logRequest(requestId, method, url, userId);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.logResponse(requestId, method, url, response.statusCode, duration);
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.logResponse(requestId, method, url, response.statusCode || 500, duration);
          this.logger.error(
            `Request failed: ${method} ${url}`,
            error instanceof Error ? error.stack : undefined,
            'HTTP',
            { requestId, statusCode: response.statusCode, duration, userId, ip, userAgent },
          );
        },
      }),
    );
  }
}
