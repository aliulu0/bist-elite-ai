import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../logger/logger.service';
import {
  RecoveryResult,
  RecoveryAction,
  CircuitBreakerState,
  RetryPolicy,
  ReadinessStatus,
} from './types';

const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  backoffMs: 1000,
  backoffMultiplier: 2,
  maxBackoffMs: 30000,
};

@Injectable()
export class RecoveryService {
  private readonly circuitBreakers = new Map<string, CircuitBreakerState>();
  private readonly shutdownHooks: Array<() => Promise<void>> = [];
  private isShuttingDown = false;

  constructor(private readonly logger: AppLoggerService) {}

  async gracefulShutdown(): Promise<RecoveryResult> {
    if (this.isShuttingDown) {
      return {
        status: ReadinessStatus.WARN,
        timestamp: new Date().toISOString(),
        actions: [{ name: 'shutdown', status: ReadinessStatus.WARN, message: 'Shutdown already in progress' }],
        circuitBreakers: this.getCircuitBreakerStates(),
      };
    }

    this.isShuttingDown = true;
    const actions: RecoveryAction[] = [];
    const start = Date.now();

    this.logger.log('Graceful shutdown initiated', 'RecoveryService');

    for (const hook of this.shutdownHooks) {
      const hookStart = Date.now();
      try {
        await Promise.race([
          hook(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Shutdown hook timeout')), 5000),
          ),
        ]);
        actions.push({
          name: 'shutdown_hook',
          status: ReadinessStatus.PASS,
          message: 'Shutdown hook completed',
          executedAt: new Date().toISOString(),
          durationMs: Date.now() - hookStart,
        });
      } catch (err) {
        actions.push({
          name: 'shutdown_hook',
          status: ReadinessStatus.FAIL,
          message: err instanceof Error ? err.message : 'Shutdown hook failed',
          executedAt: new Date().toISOString(),
          durationMs: Date.now() - hookStart,
        });
      }
    }

    const totalDuration = Date.now() - start;
    this.logger.log(`Graceful shutdown completed in ${totalDuration}ms`, 'RecoveryService');

    const status = actions.every((a) => a.status === ReadinessStatus.PASS)
      ? ReadinessStatus.PASS
      : ReadinessStatus.WARN;

    return {
      status,
      timestamp: new Date().toISOString(),
      actions,
      circuitBreakers: this.getCircuitBreakerStates(),
    };
  }

  registerShutdownHook(hook: () => Promise<void>): void {
    this.shutdownHooks.push(hook);
  }

  async retry<T>(
    name: string,
    fn: () => Promise<T>,
    policy: RetryPolicy = DEFAULT_RETRY_POLICY,
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
      try {
        const result = await fn();
        this.resetCircuitBreaker(name);
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.recordCircuitBreakerFailure(name);

        if (attempt < policy.maxRetries) {
          const delay = Math.min(
            policy.backoffMs * Math.pow(policy.backoffMultiplier, attempt),
            policy.maxBackoffMs,
          );
          this.logger.warn(
            `Retry ${attempt + 1}/${policy.maxRetries} for '${name}' after ${delay}ms`,
            'RecoveryService',
          );
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    throw lastError;
  }

  getCircuitBreaker(name: string): CircuitBreakerState {
    if (!this.circuitBreakers.has(name)) {
      this.circuitBreakers.set(name, {
        name,
        state: 'closed',
        failureCount: 0,
        successCount: 0,
      });
    }
    return this.circuitBreakers.get(name)!;
  }

  private recordCircuitBreakerFailure(name: string): void {
    const cb = this.getCircuitBreaker(name);
    cb.failureCount++;
    cb.lastFailureTime = new Date().toISOString();

    if (cb.failureCount >= 5) {
      cb.state = 'open';
      cb.nextAttemptTime = new Date(Date.now() + 30000).toISOString();
      this.logger.warn(`Circuit breaker '${name}' opened after ${cb.failureCount} failures`, 'RecoveryService');
    }
  }

  private resetCircuitBreaker(name: string): void {
    const cb = this.getCircuitBreaker(name);
    cb.failureCount = 0;
    cb.successCount++;
    if (cb.state === 'half_open') {
      cb.state = 'closed';
      this.logger.log(`Circuit breaker '${name}' closed`, 'RecoveryService');
    }
  }

  private getCircuitBreakerStates(): CircuitBreakerState[] {
    return Array.from(this.circuitBreakers.values());
  }
}
