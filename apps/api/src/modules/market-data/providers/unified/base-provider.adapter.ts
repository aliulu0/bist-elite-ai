import { Logger } from '@nestjs/common';
import { IUnifiedMarketDataProvider } from './unified-provider.interface';
import {
  Company,
  FinancialStatement,
  UnifiedBalanceSheet,
  UnifiedIncomeStatement,
  CashFlow,
  Sector,
  Disclosure,
  MarketDataResult,
} from '../../interfaces/unified-domain.types';
import { MarketDataPoint, FetchOptions, MacroIndicator } from '../../interfaces';
import { CircuitBreakerService } from '../../circuit-breaker/circuit-breaker.service';
import { FundamentalProfile } from '../../interfaces/unified-domain.types';
import {
  ProviderError,
  ProviderErrorClassifier,
  FailureCategory,
} from '../../error/error-classifier.service';

export interface ProviderDiagnostics {
  lastErrorCategory: FailureCategory | null;
  lastErrorMessage: string | null;
  lastErrorTime: number | null;
  lastSuccessTime: number | null;
}

export interface ProviderStatus {
  name: string;
  connected: boolean;
  circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  consecutiveFailures: number;
  lastSuccessTime: number | null;
  lastFailureTime: number | null;
  uptimeMs: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatencyMs: number;
  lastHealthCheck: string | null;
}

export abstract class BaseProviderAdapter implements IUnifiedMarketDataProvider {
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
  private lastErrorCategory: FailureCategory | null = null;
  private lastErrorMessage: string | null = null;
  private lastErrorTime: number | null = null;
  private lastSuccessTime: number | null = null;
  protected readonly errorClassifier = new ProviderErrorClassifier();

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

  async connect(): Promise<void> {
    this.connected = true;
    this.logger.log(`${this.name} connected`);
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.logger.log(`${this.name} disconnected`);
  }

  async reconnect(): Promise<boolean> {
    this.logger.log(`${this.name} attempting reconnection...`);
    await this.disconnect();
    try {
      await this.connect();
      const healthy = await this.health();
      if (healthy) {
        this.circuitBreaker.reset(this.name);
        this.logger.log(`${this.name} reconnected successfully`);
      }
      return healthy;
    } catch (error) {
      this.logger.error(`${this.name} reconnection failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
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

  async validateConnection(): Promise<boolean> {
    return this.connected;
  }

  getStatus(): ProviderStatus {
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
    };
  }

  protected recordMetrics(success: boolean, latencyMs: number): void {
    this.totalRequests++;
    this.totalLatencyMs += latencyMs;
    if (success) {
      this.successfulRequests++;
      this.lastSuccessTime = Date.now();
    } else {
      this.failedRequests++;
    }
  }

  getDiagnostics(): ProviderDiagnostics {
    return {
      lastErrorCategory: this.lastErrorCategory,
      lastErrorMessage: this.lastErrorMessage,
      lastErrorTime: this.lastErrorTime,
      lastSuccessTime: this.lastSuccessTime,
    };
  }

  protected recordError(error: unknown): FailureCategory {
    const classified = this.errorClassifier.classify(error);
    this.lastErrorCategory = classified.category;
    this.lastErrorMessage = this.errorClassifier.extractMessage(error);
    this.lastErrorTime = Date.now();
    return classified.category;
  }

  protected toProviderError(error: unknown): ProviderError {
    if (error instanceof ProviderError) return error;
    const classified = this.errorClassifier.classify(error);
    return new ProviderError(
      this.errorClassifier.extractMessage(error),
      classified.httpStatus ?? undefined,
      classified.category,
    );
  }

  abstract fetchCompany(symbol: string): Promise<Company | null>;
  abstract fetchFinancials(symbol: string): Promise<FinancialStatement | null>;
  abstract fetchBalanceSheet(symbol: string): Promise<UnifiedBalanceSheet | null>;
  abstract fetchIncomeStatement(symbol: string): Promise<UnifiedIncomeStatement | null>;
  abstract fetchCashFlow(symbol: string): Promise<CashFlow | null>;
  abstract fetchSector(symbol: string): Promise<Sector | null>;
  abstract fetchDisclosures(symbol: string): Promise<Disclosure[]>;
  abstract getHistoricalData(symbol: string, timeframe: string, options?: FetchOptions): Promise<MarketDataPoint[]>;
  abstract getLatestPrice(symbol: string): Promise<MarketDataPoint | null>;
  abstract getAvailableTimeframes(): string[];
  abstract getCompanyProfile(symbol: string): Promise<import('../../interfaces').CompanyProfile | null>;
  abstract getFinancialRatios(symbol: string): Promise<import('../../interfaces').FinancialRatios | null>;
  abstract getBalanceSheet(symbol: string): Promise<import('../../interfaces').BalanceSheet | null>;
  abstract getIncomeStatement(symbol: string): Promise<import('../../interfaces').IncomeStatement | null>;
  abstract getSector(symbol: string): Promise<import('../../interfaces').CompanySector | null>;
  abstract getMacroIndicators(): Promise<MacroIndicator[]>;

  normalize<T>(data: unknown, _source: string): T {
    return data as T;
  }

  async fetchFundamentalData(_symbol: string): Promise<FundamentalProfile | null> {
    return null;
  }

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
        const category = this.recordError(error);
        this.logger.warn(
          `${this.name} ${context} attempt ${attempt + 1}/${this.maxRetries + 1} failed [${category}]: ${lastError.message}`,
        );

        if (!this.errorClassifier.isRetryable(category)) {
          this.logger.warn(
            `${this.name} ${context} aborting retries for non-retryable category ${category}`,
          );
          break;
        }

        if (attempt < this.maxRetries) {
          const delay = category === 'RATE_LIMIT'
            ? Math.min(2000 * Math.pow(2, attempt), 15000)
            : Math.min(1000 * Math.pow(2, attempt), 10000);
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
