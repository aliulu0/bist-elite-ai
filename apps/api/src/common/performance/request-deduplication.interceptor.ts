import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, Subject, of } from 'rxjs';
import { share, take, tap } from 'rxjs/operators';

interface PendingRequest {
  subject: Subject<any>;
  createdAt: number;
}

interface DedupConfig {
  enabled: boolean;
  windowMs: number;
  maxPending: number;
}

@Injectable()
export class RequestDeduplicationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestDeduplicationInterceptor.name);
  private readonly pending = new Map<string, PendingRequest>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private readonly config: DedupConfig;

  constructor() {
    this.config = {
      enabled: true,
      windowMs: 5000,
      maxPending: 100,
    };

    if (this.config.enabled) {
      this.cleanupInterval = setInterval(() => this.cleanup(), 10_000);
    }
  }

  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (!this.config.enabled) return next.handle();

    const request = context.switchToHttp().getRequest();
    if (request.method !== 'GET') return next.handle();

    const key = this.buildKey(request);
    if (!key) return next.handle();

    const existing = this.pending.get(key);
    if (existing) {
      const age = Date.now() - existing.createdAt;
      if (age < this.config.windowMs) {
        this.logger.debug(`Deduplicating request: ${key}`);
        return existing.subject.asObservable().pipe(take(1));
      }
      this.pending.delete(key);
    }

    if (this.pending.size >= this.config.maxPending) {
      this.cleanup();
    }

    const subject = new Subject<any>();
    this.pending.set(key, { subject, createdAt: Date.now() });

    return next.handle().pipe(
      share(),
      take(1),
      tap({
        next: (data: any) => {
          subject.next(data);
          subject.complete();
          this.pending.delete(key);
        },
        error: (err: any) => {
          subject.error(err);
          this.pending.delete(key);
        },
      }),
    );
  }

  private buildKey(request: any): string | null {
    const { method, url, query, userContext } = request;
    const userId = userContext?.userId || 'anonymous';
    const queryString = Object.keys(query || {})
      .sort()
      .map((k) => `${k}=${query[k]}`)
      .join('&');
    return `${userId}:${method}:${url}${queryString ? `?${queryString}` : ''}`;
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.pending) {
      if (now - entry.createdAt > this.config.windowMs) {
        entry.subject.complete();
        this.pending.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Dedup cleanup: removed ${cleaned} stale entries`);
    }
  }

  getPendingCount(): number {
    return this.pending.size;
  }
}
