import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { AppLoggerService } from '../../logger/logger.service';
import { getSecurityConfig, SecurityConfig } from '../security.config';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly store = new Map<string, RateLimitEntry>();
  private readonly config: SecurityConfig['rateLimit'];
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(private readonly logger: AppLoggerService) {
    this.config = getSecurityConfig().rateLimit;
    this.cleanupInterval = setInterval(() => this.cleanup(), this.config.windowMs * 2);
  }

  canActivate(context: ExecutionContext): boolean {
    if (!this.config.enabled) return true;

    const request = context.switchToHttp().getRequest();
    const path = request.route?.path || request.url;

    if (this.config.skipPaths.some((p) => path.startsWith(p))) {
      return true;
    }

    const clientId = this.getClientId(request);
    const now = Date.now();
    const entry = this.store.get(clientId);

    if (!entry || now > entry.resetTime) {
      this.store.set(clientId, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      this.setRateLimitHeaders(context, 1, this.config.maxRequests, this.config.windowMs);
      return true;
    }

    entry.count++;

    if (entry.count > this.config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      this.logger.warn(
        `Rate limit exceeded for ${clientId}: ${entry.count}/${this.config.maxRequests}`,
        'RateLimitGuard',
        { clientId, path, count: entry.count, retryAfter },
      );

      context.switchToHttp().getResponse().setHeader('Retry-After', String(retryAfter));
      context.switchToHttp().getResponse().setHeader('X-RateLimit-Remaining', '0');
      context.switchToHttp().getResponse().setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetTime / 1000)));

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: this.config.message,
          error: 'Too Many Requests',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.setRateLimitHeaders(context, entry.count, this.config.maxRequests, entry.resetTime - now);
    return true;
  }

  private getClientId(request: any): string {
    const apiKey = request.headers['x-api-key'];
    if (apiKey) return `apikey:${apiKey}`;

    const userId = request.userContext?.userId;
    if (userId) return `user:${userId}`;

    const forwarded = request.headers['x-forwarded-for'];
    const ip = forwarded
      ? String(forwarded).split(',')[0].trim()
      : request.ip || request.connection?.remoteAddress || 'unknown';
    return `ip:${ip}`;
  }

  private setRateLimitHeaders(context: ExecutionContext, current: number, max: number, remainingMs: number): void {
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', String(max));
    response.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - current)));
    response.setHeader('X-RateLimit-Reset', String(Math.ceil((Date.now() + remainingMs) / 1000)));
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  onModuleDestroy(): void {
    clearInterval(this.cleanupInterval);
  }
}
