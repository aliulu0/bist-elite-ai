import { Logger } from '@nestjs/common';
import { IResearchProvider } from './research-provider.interface';
import { ResearchArticle, ResearchFilter } from '../interfaces/research.types';
import { CircuitBreakerService } from '../../market-data/circuit-breaker/circuit-breaker.service';

export abstract class BaseResearchProvider implements IResearchProvider {
  abstract readonly name: string;
  protected readonly logger: Logger;
  protected connected = false;
  protected readonly timeoutMs: number;
  protected readonly maxRetries: number;
  private readonly startTime: number;
  private totalRequests = 0;
  private successfulRequests = 0;
  private failedRequests = 0;
  private totalLatencyMs = 0;
  private lastHealthCheck: string | null = null;
  private lastSync: string | null = null;

  constructor(
    loggerContext: string,
    protected readonly circuitBreaker: CircuitBreakerService,
    timeoutMs?: number,
    maxRetries?: number,
  ) {
    this.logger = new Logger(loggerContext);
    this.timeoutMs = timeoutMs ?? 15000;
    this.maxRetries = maxRetries ?? 3;
    this.startTime = Date.now();
  }

  async health(): Promise<boolean> {
    try {
      const result = await this.validateConnection();
      this.lastHealthCheck = new Date().toISOString();
      return result;
    } catch {
      this.lastHealthCheck = new Date().toISOString();
      return false;
    }
  }

  abstract validateConnection(): Promise<boolean>;

  getStatus() {
    const circuitState = this.circuitBreaker.getState(this.name);
    return {
      name: this.name,
      connected: this.connected,
      circuitState: circuitState.state,
      consecutiveFailures: circuitState.consecutiveFailures,
      lastSuccessTime: circuitState.lastSuccessTime,
      lastFailureTime: circuitState.lastFailureTime,
      uptimeMs: Date.now() - this.startTime,
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      avgLatencyMs: this.totalRequests > 0 ? Math.round(this.totalLatencyMs / this.totalRequests) : 0,
      lastHealthCheck: this.lastHealthCheck,
      lastSync: this.lastSync,
    };
  }

  protected recordMetrics(success: boolean, latencyMs: number): void {
    this.totalRequests++;
    this.totalLatencyMs += latencyMs;
    if (success) {
      this.successfulRequests++;
      this.lastSync = new Date().toISOString();
    } else {
      this.failedRequests++;
    }
  }

  abstract fetchNews(filter?: ResearchFilter): Promise<ResearchArticle[]>;
  abstract fetchCompanyNews(ticker: string, filter?: ResearchFilter): Promise<ResearchArticle[]>;
  abstract fetchSectorNews(sector: string, filter?: ResearchFilter): Promise<ResearchArticle[]>;
  abstract fetchEconomicNews(filter?: ResearchFilter): Promise<ResearchArticle[]>;
  abstract fetchKAPAnnouncements(filter?: ResearchFilter): Promise<ResearchArticle[]>;
  abstract fetchTCMBAnnouncements(filter?: ResearchFilter): Promise<ResearchArticle[]>;

  protected async withRetry<T>(fn: () => Promise<T>, context: string): Promise<T | null> {
    if (this.circuitBreaker.isCircuitOpen(this.name)) {
      this.logger.warn(`Circuit open for ${this.name}, skipping ${context}`);
      return null;
    }

    let lastError: Error | null = null;
    const startTime = Date.now();

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.withTimeout(fn(), this.timeoutMs);
        const latencyMs = Date.now() - startTime;
        this.circuitBreaker.recordSuccess(this.name);
        this.recordMetrics(true, latencyMs);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(
          `${this.name} ${context} attempt ${attempt + 1}/${this.maxRetries + 1} failed: ${lastError.message}`,
        );

        if (attempt < this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          const jitter = delay * (0.5 + Math.random() * 0.5);
          await new Promise((resolve) => setTimeout(resolve, jitter));
        }
      }
    }

    const latencyMs = Date.now() - startTime;
    this.circuitBreaker.recordFailure(this.name);
    this.recordMetrics(false, latencyMs);
    this.logger.error(`${this.name} ${context} exhausted retries: ${lastError?.message}`);
    return null;
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
      promise
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }
}
