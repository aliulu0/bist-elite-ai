import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { MetricsService } from '../monitoring/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();
    const { method, url } = request;
    const requestId = request.requestId;

    return next.handle().pipe({
      next: () => {
        const duration = Date.now() - startTime;
        const response = context.switchToHttp().getResponse();
        this.metrics.recordRequest({
          method,
          path: url,
          statusCode: response.statusCode,
          duration,
          timestamp: Date.now(),
          requestId,
        });
      },
      error: () => {
        const duration = Date.now() - startTime;
        const response = context.switchToHttp().getResponse();
        this.metrics.recordRequest({
          method,
          path: url,
          statusCode: response.statusCode || 500,
          duration,
          timestamp: Date.now(),
          requestId,
        });
      },
    });
  }
}
