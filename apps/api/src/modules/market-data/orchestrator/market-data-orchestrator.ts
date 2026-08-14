import { Injectable, Logger, Optional } from '@nestjs/common';
import { IUnifiedMarketDataProvider, ProviderStatus } from '../providers/unified/unified-provider.interface';
import { ProviderDiagnostics } from '../providers/unified/base-provider.adapter';
import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';
import { MarketDataCacheService } from '../cache/market-data-cache.service';
import { MarketDataValidationService } from '../market-data-validation.service';
import { MarketDataConfig, getMarketDataConfig, ProviderConfig } from '../config/market-data.config';
import { SymbolRegistryService } from '../symbol-registry/symbol-registry.service';
import { RequestDeduplicatorService } from '../dedup/request-deduplicator.service';
import { SymbolNormalizerService } from '../symbol-normalizer/symbol-normalizer.service';
import { MacroIndicator } from '../interfaces/macro-indicator.types';
import { MarketDataPoint, FetchOptions, SUPPORTED_TIMEFRAMES } from '../interfaces';
import { TCMBAdapter, TCMBInterestDecision } from '../providers/unified/tcmb.adapter';
import {
  Company,
  FinancialStatement,
  UnifiedBalanceSheet,
  UnifiedIncomeStatement,
  CashFlow,
  Sector,
  Disclosure,
  MarketDataResult,
  DataQuality,
  FundamentalProfile,
} from '../interfaces/unified-domain.types';
import { PLATFORM_TIMEFRAMES, PREDICTION_TIMEFRAME_MAPPING } from '../coverage/coverage-report.types';

export type ProviderDashboardStatus = 'healthy' | 'degraded' | 'down' | 'unconfigured';

export interface ProviderBudgetEntry {
  provider: string;
  capability: string;
  limit: number;
  used: number;
  remaining: number;
  resetAt: number | null;
  priority: number;
  cooldownUntil: number | null;
}

export interface ProviderDashboardEntry {
  name: string;
  enabled: boolean;
  priority: number;
  status: ProviderDashboardStatus;
  circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  latencyMs: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  lastSync: string | null;
  authConfigured: boolean;
  cacheEntries: number;
  coverage: number;
  budget?: ProviderBudgetEntry;
}

export interface ProviderConfigurationEntry {
  name: string;
  enabled: boolean;
  configured: boolean;
  authenticated: boolean;
  priority: number;
  timeoutMs: number;
  retries: number;
  baseUrlHost: string;
  public: boolean;
}

export type TimeframeStatus = 'REAL' | 'DERIVED' | 'UNAVAILABLE';

export interface TimeframeStatusEntry {
  timeframe: string;
  status: TimeframeStatus;
  predictionTarget: string;
  providers: string[];
  sourceTimeframe: string | null;
}

@Injectable()
export class MarketDataOrchestrator {
  private readonly logger = new Logger(MarketDataOrchestrator.name);
  private readonly providers: IUnifiedMarketDataProvider[] = [];
  private readonly providerConfigs: Map<string, ProviderConfig> = new Map();
  private readonly providerBudgets: Map<string, Map<string, ProviderBudgetEntry>> = new Map();
  private readonly config: MarketDataConfig;

  constructor(
    private readonly circuitBreaker: CircuitBreakerService,
    private readonly cacheService: MarketDataCacheService,
    @Optional() providers?: IUnifiedMarketDataProvider[],
    @Optional() config?: MarketDataConfig,
    @Optional() private readonly symbolRegistry?: SymbolRegistryService,
    @Optional() private readonly normalizer?: SymbolNormalizerService,
    @Optional() private readonly deduplicator?: RequestDeduplicatorService,
    @Optional() private readonly validationService?: MarketDataValidationService,
  ) {
    this.config = config ?? getMarketDataConfig();
    if (providers) {
      this.registerProviders(providers);
    }
  }

  registerProviders(providers: IUnifiedMarketDataProvider[]): void {
    for (const provider of providers) {
      this.registerProvider(provider);
    }
  }

  registerProvider(provider: IUnifiedMarketDataProvider): void {
    const providerConfig = this.getProviderConfig(provider.name);
    this.providerConfigs.set(provider.name, providerConfig);
    this.providers.push(provider);
    this.logger.log(
      `Provider "${provider.name}" registered (priority: ${providerConfig.priority}, enabled: ${providerConfig.enabled})`,
    );
  }

  async fetchCompany(symbol: string): Promise<MarketDataResult<Company> | null> {
    return this.executeWithFallback<Company>(
      symbol,
      'company',
      (provider) => provider.fetchCompany(symbol),
      this.config.cache.companyTtlMs,
    );
  }

  async fetchFinancials(symbol: string): Promise<MarketDataResult<FinancialStatement> | null> {
    return this.executeWithFallback<FinancialStatement>(
      symbol,
      'financials',
      (provider) => provider.fetchFinancials(symbol),
      this.config.cache.financialTtlMs,
    );
  }

  async fetchBalanceSheet(symbol: string): Promise<MarketDataResult<UnifiedBalanceSheet> | null> {
    return this.executeWithFallback<UnifiedBalanceSheet>(
      symbol,
      'balanceSheet',
      (provider) => provider.fetchBalanceSheet(symbol),
      this.config.cache.financialTtlMs,
    );
  }

  async fetchIncomeStatement(symbol: string): Promise<MarketDataResult<UnifiedIncomeStatement> | null> {
    return this.executeWithFallback<UnifiedIncomeStatement>(
      symbol,
      'incomeStatement',
      (provider) => provider.fetchIncomeStatement(symbol),
      this.config.cache.financialTtlMs,
    );
  }

  async fetchCashFlow(symbol: string): Promise<MarketDataResult<CashFlow> | null> {
    return this.executeWithFallback<CashFlow>(
      symbol,
      'cashFlow',
      (provider) => provider.fetchCashFlow(symbol),
      this.config.cache.financialTtlMs,
    );
  }

  async fetchSector(symbol: string): Promise<MarketDataResult<Sector> | null> {
    return this.executeWithFallback<Sector>(
      symbol,
      'sector',
      (provider) => provider.fetchSector(symbol),
      this.config.cache.sectorTtlMs,
    );
  }

  async fetchDisclosures(symbol: string): Promise<MarketDataResult<Disclosure[]> | null> {
    return this.executeWithFallback<Disclosure[]>(
      symbol,
      'disclosures',
      (provider) => provider.fetchDisclosures(symbol),
      this.config.cache.disclosureTtlMs,
    );
  }

  async fetchFundamentalData(symbol: string): Promise<MarketDataResult<FundamentalProfile> | null> {
    return this.executeWithFallback<FundamentalProfile>(
      symbol,
      'fundamental',
      (provider) => provider.fetchFundamentalData(symbol),
      this.config.cache.financialTtlMs,
    );
  }

  async fetchMacroIndicators(): Promise<MacroIndicator[]> {
    const cached = this.cacheService.get<MacroIndicator[]>('any', 'macroIndicators', 'all');
    if (cached !== undefined) {
      this.logger.debug('Macro indicators served from cache');
      return cached;
    }

    const allIndicators: MacroIndicator[] = [];
    const seen = new Set<string>();

    const sortedProviders = this.getSortedProviders();
    for (const provider of sortedProviders) {
      if (!this.isProviderEnabled(provider.name)) continue;
      if (this.circuitBreaker.isCircuitOpen(provider.name)) continue;

      try {
        const indicators = await provider.getMacroIndicators();
        for (const ind of indicators) {
          if (!seen.has(ind.symbol)) {
            seen.add(ind.symbol);
            allIndicators.push(ind);
          }
        }
      } catch {
        this.circuitBreaker.recordFailure(provider.name);
      }
    }

    this.cacheService.set('any', 'macroIndicators', 'all', allIndicators, this.config.cache.macroIndicatorsTtlMs);
    return allIndicators;
  }

  async getProviderStatus(): Promise<Array<ProviderStatus & { enabled: boolean; priority: number }>> {
    return this.providers.map((provider) => {
      const config = this.providerConfigs.get(provider.name);
      const status = provider.getStatus();
      return {
        ...status,
        enabled: config?.enabled ?? false,
        priority: config?.priority ?? 99,
      };
    });
  }

  getProviderDashboard(): ProviderDashboardEntry[] {
    return this.getSortedProviders().map((provider) => {
      const config = this.providerConfigs.get(provider.name);
      const status = provider.getStatus();
      const enabled = config?.enabled ?? false;
      const authConfigured = !!config?.apiKey || this.hasPublicEndpoint(provider.name);
      const latestBudget = this.getProviderBudget(provider.name, 'latestPrice')
        ?? this.getProviderBudget(provider.name, 'historicalData')
        ?? this.getProviderBudget(provider.name, 'company')
        ?? this.configuredBudgetEntry(provider.name, config);

      return {
        name: provider.name,
        enabled,
        priority: config?.priority ?? 99,
        status: this.computeStatus(status, enabled, authConfigured),
        circuitState: status.circuitState,
        latencyMs: status.avgLatencyMs,
        totalRequests: status.totalRequests,
        successfulRequests: status.successfulRequests,
        failedRequests: status.failedRequests,
        lastSync: status.lastHealthCheck,
        authConfigured,
        cacheEntries: this.cacheService.getProviderCacheEntries(provider.name),
        coverage: this.symbolRegistry?.getCoverageForProvider(provider.name as never) ?? 0,
        budget: latestBudget ? { ...latestBudget } : undefined,
      };
    });
  }

  getProviderConfiguration(): ProviderConfigurationEntry[] {
    return this.getSortedProviders().map((provider) => {
      const config = this.providerConfigs.get(provider.name);
      const publicEndpoint = this.hasPublicEndpoint(provider.name);
      const authenticated = !!config?.apiKey;
      return {
        name: provider.name,
        enabled: config?.enabled ?? false,
        configured: authenticated || publicEndpoint,
        authenticated,
        priority: config?.priority ?? 99,
        timeoutMs: config?.timeout ?? 15000,
        retries: config?.retries ?? 3,
        baseUrlHost: this.baseUrlHost(config?.baseUrl),
        public: publicEndpoint,
      };
    });
  }

  getTimeframeStatusReport(): TimeframeStatusEntry[] {
    const providerTimeframes = new Map<string, string[]>();
    for (const provider of this.providers) {
      if (this.isProviderEnabled(provider.name)) {
        providerTimeframes.set(provider.name, provider.getAvailableTimeframes());
      }
    }

    return PLATFORM_TIMEFRAMES.map((timeframe) => {
      const predictionTarget = PREDICTION_TIMEFRAME_MAPPING[timeframe] ?? timeframe;
      const nativeProviders = [...providerTimeframes.entries()]
        .filter(([, timeframes]) => timeframes.includes(timeframe))
        .map(([name]) => name);

      if (nativeProviders.length > 0) {
        return {
          timeframe,
          status: 'REAL' as const,
          predictionTarget,
          providers: nativeProviders,
          sourceTimeframe: timeframe,
        };
      }

      if (predictionTarget !== timeframe) {
        const baseProviders = [...providerTimeframes.entries()]
          .filter(([, timeframes]) => timeframes.includes(predictionTarget))
          .map(([name]) => name);
        if (baseProviders.length > 0) {
          return {
            timeframe,
            status: 'DERIVED' as const,
            predictionTarget,
            providers: baseProviders,
            sourceTimeframe: predictionTarget,
          };
        }
      }

      return {
        timeframe,
        status: 'UNAVAILABLE' as const,
        predictionTarget,
        providers: [],
        sourceTimeframe: null,
      };
    });
  }

  getProviderByName(name: string): IUnifiedMarketDataProvider | undefined {
    return this.providers.find((p) => p.name === name);
  }

  getProviderDiagnostics(): Record<string, ProviderDiagnostics> {
    const result: Record<string, ProviderDiagnostics> = {};
    for (const provider of this.providers) {
      const diag = (provider as unknown as { getDiagnostics?: () => ProviderDiagnostics }).getDiagnostics?.();
      result[provider.name] =
        diag ?? {
          lastErrorCategory: null,
          lastErrorMessage: null,
          lastErrorTime: null,
          lastSuccessTime: null,
        };
    }
    return result;
  }

  async fetchTcmbInterestDecisions(): Promise<TCMBInterestDecision[]> {
    const tcmb = this.providers.find((p) => p.name === 'tcmb') as TCMBAdapter | undefined;
    if (!tcmb || !this.isProviderEnabled('tcmb')) return [];

    const cached = this.cacheService.get<TCMBInterestDecision[]>('tcmb', 'interestDecisions', 'all');
    if (cached !== undefined) return cached;

    if (this.circuitBreaker.isCircuitOpen('tcmb')) return [];

    try {
      const decisions = await tcmb.getInterestDecisionDates();
      this.cacheService.set('tcmb', 'interestDecisions', 'all', decisions, this.config.cache.tcmbTtlMs);
      return decisions;
    } catch {
      this.circuitBreaker.recordFailure('tcmb');
      return [];
    }
  }

  getAvailableProviders(): string[] {
    return this.getSortedProviders()
      .filter((p) => this.isProviderEnabled(p.name))
      .map((p) => p.name);
  }

  /**
   * Writes a cache entry under BOTH the provider-namespaced key (used by
   * per-provider cache statistics/dashboards) and the provider-agnostic 'any'
   * key that all cache reads use, so cache hits actually occur after a provider
   * fetch instead of only during the same deduplication window.
   */
  private cacheStore(provider: string, type: string, key: string, data: unknown, ttlMs: number): void {
    this.cacheService.set('any', type, key, data, ttlMs);
    this.cacheService.set(provider, type, key, data, ttlMs);
  }

  async fetchLatestPrice(symbol: string, forceRefresh = false): Promise<MarketDataResult<MarketDataPoint | null> | null> {
    const normalized = this.normalizeSymbol(symbol);
    return this.dedupe(`latest:${normalized}`, () =>
      forceRefresh
        ? this.doFetchLatestPrice(normalized, true)
        : this.doFetchLatestPrice(normalized, false),
    );
  }

  private async doFetchLatestPrice(
    symbol: string,
    bypassCache: boolean,
  ): Promise<MarketDataResult<MarketDataPoint | null> | null> {
    if (!bypassCache) {
      const cached = this.cacheService.get<MarketDataPoint | null>('any', 'latestPrice', symbol);
      if (cached !== undefined) {
        return {
          data: cached,
          provider: 'cache',
          cached: true,
          timestamp: new Date().toISOString(),
        };
      }
    }

    const attemptedProviders: string[] = [];

    for (const provider of this.getSortedProviders()) {
      if (!this.isProviderEnabled(provider.name)) continue;
      if (this.circuitBreaker.isCircuitOpen(provider.name)) {
        this.logger.debug(`Skipping ${provider.name} (circuit open)`);
        continue;
      }

      const budget = this.getProviderBudget(provider.name, 'latestPrice');
      if (budget && budget.remaining <= 0) {
        this.logger.debug(`Skipping ${provider.name} (latestPrice budget exhausted)`);
        continue;
      }

      attemptedProviders.push(provider.name);

      try {
        const point = await provider.getLatestPrice(symbol);
        if (point) {
          const validated = this.validationService
            ? this.validationService.validateDataPoints([point])[0]
            : point;
          if (!validated || validated.validationStatus === 'invalid') continue;

          const dataQuality: DataQuality =
            validated.validationStatus === 'partial' ? 'PARTIAL' : 'VALID';
          this.cacheStore(provider.name, 'latestPrice', symbol, validated, this.config.cache.historicalTtlMs);
          const actualProvider = provider.name;
          const fallbackUsed = attemptedProviders.length > 1;
          const providerAttempts = attemptedProviders.length;
          return {
            data: validated,
            provider: provider.name,
            cached: false,
            timestamp: new Date().toISOString(),
            validated: !!this.validationService,
            dataQuality,
            attemptedProviders,
            fallbackUsed,
            actualProvider,
            providerAttempts,
            freshness: validated.timestamp ? 'fresh' : 'stale',
          };
        }
      } catch (error) {
        this.logger.warn(
          `Provider ${provider.name} failed for ${symbol} (latest): ${error instanceof Error ? error.message : String(error)}`,
        );
        this.recordProviderRequestBudget(provider.name, 'latestPrice', false);
        this.circuitBreaker.recordFailure(provider.name);
      }
    }

    this.logger.warn(`All providers failed for ${symbol} (latest price)`);
    return null;
  }

  async fetchHistoricalData(
    symbol: string,
    timeframe: string,
    options?: FetchOptions,
  ): Promise<MarketDataResult<MarketDataPoint[]> | null> {
    const normalized = this.normalizeSymbol(symbol);
    const cacheKey = `${normalized}|${timeframe}`;
    return this.dedupe(`history:${cacheKey}`, () => this.doFetchHistoricalData(normalized, timeframe, options, cacheKey));
  }

  async fetchHistoricalRange(
    symbol: string,
    timeframe: string,
    options?: FetchOptions,
  ): Promise<MarketDataResult<MarketDataPoint[]> | null> {
    const normalized = this.normalizeSymbol(symbol);
    const cacheKey = `${normalized}|${timeframe}`;
    const rangeKey = `range:${cacheKey}:${options?.startDate ?? ''}:${options?.endDate ?? ''}`;
    return this.dedupe(rangeKey, () => this.fetchHistoricalFromProviders(normalized, timeframe, options, cacheKey));
  }

  private async doFetchHistoricalData(
    symbol: string,
    timeframe: string,
    options: FetchOptions | undefined,
    cacheKey: string,
  ): Promise<MarketDataResult<MarketDataPoint[]> | null> {
    const cached = this.cacheService.get<MarketDataPoint[]>('any', 'historical', cacheKey);
    if (cached !== undefined) {
      return {
        data: cached,
        provider: 'cache',
        cached: true,
        timestamp: new Date().toISOString(),
      };
    }

    const result = await this.fetchHistoricalFromProviders(symbol, timeframe, options, cacheKey);
    if (result) {
      this.cacheStore(result.provider, 'historical', cacheKey, result.data, this.config.cache.historicalTtlMs);
    }
    return result;
  }

  private async fetchHistoricalFromProviders(
    symbol: string,
    timeframe: string,
    options: FetchOptions | undefined,
    _cacheKey: string,
  ): Promise<MarketDataResult<MarketDataPoint[]> | null> {
    const attemptedProviders: string[] = [];

    for (const provider of this.getSortedProviders()) {
      if (!this.isProviderEnabled(provider.name)) continue;
      if (this.circuitBreaker.isCircuitOpen(provider.name)) {
        this.logger.debug(`Skipping ${provider.name} (circuit open)`);
        continue;
      }

      const budget = this.getProviderBudget(provider.name, 'historicalData');
      if (budget && budget.remaining <= 0) {
        this.logger.debug(`Skipping ${provider.name} (historicalData budget exhausted)`);
        continue;
      }

      attemptedProviders.push(provider.name);

      try {
        const points = await provider.getHistoricalData(symbol, timeframe, options);
        if (points && points.length > 0) {
          const validated = this.validationService
            ? this.validationService.validateDataPoints(points).filter((p) => p.validationStatus !== 'invalid')
            : points;

          if (validated.length === 0) continue;

          const hasPartial = validated.some((p) => p.validationStatus === 'partial');
          const dataQuality: DataQuality = hasPartial ? 'PARTIAL' : 'VALID';
          this.recordProviderRequestBudget(provider.name, 'historicalData', true);
          const actualProvider = provider.name;
          const fallbackUsed = attemptedProviders.length > 1;
          const providerAttempts = attemptedProviders.length;
          return {
            data: validated,
            provider: provider.name,
            cached: false,
            timestamp: new Date().toISOString(),
            sourceTimeframe: timeframe,
            validated: !!this.validationService,
            dataQuality,
            attemptedProviders,
            fallbackUsed,
            actualProvider,
            providerAttempts,
            freshness: validated.some((p) => p.timestamp) ? 'fresh' : 'stale',
          };
        }
      } catch (error) {
        this.logger.warn(
          `Provider ${provider.name} failed for ${symbol} (${timeframe}): ${error instanceof Error ? error.message : String(error)}`,
        );
        this.recordProviderRequestBudget(provider.name, 'historicalData', false);
        this.circuitBreaker.recordFailure(provider.name);
      }
    }

    this.logger.warn(`All providers failed for ${symbol} (${timeframe})`);
    return null;
  }

  getSupportedTimeframes(): string[] {
    const provider = this.getSortedProviders().find((p) => p.getAvailableTimeframes().length > 0);
    if (provider) {
      return provider.getAvailableTimeframes();
    }
    return [...SUPPORTED_TIMEFRAMES];
  }

  async getProviderHealth(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};
    for (const provider of this.providers) {
      try {
        health[provider.name] = await provider.health();
      } catch {
        health[provider.name] = false;
      }
    }
    return health;
  }

  private async executeWithFallback<T>(
    symbol: string,
    type: string,
    fetcher: (provider: IUnifiedMarketDataProvider) => Promise<T | null>,
    cacheTtlMs: number,
  ): Promise<MarketDataResult<T> | null> {
    const normalized = this.normalizeSymbol(symbol);
    return this.dedupe(`${type}:${normalized}`, () =>
      this.doExecuteWithFallback(normalized, type, fetcher, cacheTtlMs),
    );
  }

  private async doExecuteWithFallback<T>(
    symbol: string,
    type: string,
    fetcher: (provider: IUnifiedMarketDataProvider) => Promise<T | null>,
    cacheTtlMs: number,
  ): Promise<MarketDataResult<T> | null> {
    const cached = this.cacheService.get<T>('any', type, symbol);
    if (cached !== undefined) {
      return {
        data: cached,
        provider: 'cache',
        cached: true,
        timestamp: new Date().toISOString(),
      };
    }

    const sortedProviders = this.getSortedProviders();
    const attemptedProviders: string[] = [];

    for (const provider of sortedProviders) {
      if (!this.isProviderEnabled(provider.name)) continue;
      if (this.circuitBreaker.isCircuitOpen(provider.name)) {
        this.logger.debug(`Skipping ${provider.name} (circuit open)`);
        continue;
      }

      const budget = this.getProviderBudget(provider.name, type);
      if (budget && budget.remaining <= 0) {
        this.logger.debug(`Skipping ${provider.name} (${type} budget exhausted)`);
        continue;
      }

      attemptedProviders.push(provider.name);

      try {
        const result = await fetcher(provider);
        if (result !== null) {
          this.recordProviderRequestBudget(provider.name, type, true);
          this.cacheStore(provider.name, type, symbol, result, cacheTtlMs);
          this.logger.debug(`Data fetched for ${symbol} (${type}) from ${provider.name}`);
          const actualProvider = provider.name;
          const fallbackUsed = attemptedProviders.length > 1;
          const providerAttempts = attemptedProviders.length;
          return {
            data: result,
            provider: provider.name,
            cached: false,
            timestamp: new Date().toISOString(),
            attemptedProviders,
            fallbackUsed,
            actualProvider,
            providerAttempts,
            freshness:
              typeof result === 'object' && result !== null && 'timestamp' in result
                ? 'fresh'
                : 'stale',
          };
        }
      } catch (error) {
        this.recordProviderRequestBudget(provider.name, type, false);
        this.logger.warn(
          `Provider ${provider.name} failed for ${symbol} (${type}): ${error instanceof Error ? error.message : String(error)}`,
        );
        this.circuitBreaker.recordFailure(provider.name);
      }
    }

    this.logger.warn(`All providers failed for ${symbol} (${type})`);
    return null;
  }

  private normalizeSymbol(symbol: string): string {
    return this.normalizer ? this.normalizer.normalize(symbol) : symbol;
  }

  private async dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
    return this.deduplicator ? this.deduplicator.execute(key, fn) : fn();
  }

  private getSortedProviders(): IUnifiedMarketDataProvider[] {
    return [...this.providers].sort((a, b) => {
      const configA = this.providerConfigs.get(a.name);
      const configB = this.providerConfigs.get(b.name);
      return (configA?.priority ?? 99) - (configB?.priority ?? 99);
    });
  }

  private isProviderEnabled(name: string): boolean {
    return this.providerConfigs.get(name)?.enabled ?? false;
  }

  private computeStatus(
    status: ProviderStatus,
    enabled: boolean,
    authConfigured: boolean,
  ): ProviderDashboardStatus {
    if (!enabled) return 'unconfigured';
    if (!authConfigured) return 'unconfigured';
    if (status.circuitState === 'OPEN') return 'down';
    if (status.failedRequests > 0 && status.totalRequests > 0) {
      const failureRate = status.failedRequests / status.totalRequests;
      if (failureRate > 0.5) return 'down';
      if (failureRate > 0.2) return 'degraded';
    }
    return status.lastHealthCheck ? 'healthy' : 'degraded';
  }

  private hasPublicEndpoint(name: string): boolean {
    return ['yahoo'].includes(name);
  }

  private baseUrlHost(baseUrl?: string): string {
    if (!baseUrl) return '';
    try {
      return new URL(baseUrl).host;
    } catch {
      const afterScheme = baseUrl.split('//')[1];
      return afterScheme ? afterScheme.split('/')[0] : '';
    }
  }

  private getProviderConfig(name: string): ProviderConfig {
    const providers = this.config.providers as Record<string, ProviderConfig>;
    return (
      providers[name] ?? {
        enabled: false,
        priority: 99,
        timeout: 15000,
        retries: 3,
        apiKey: '',
        baseUrl: '',
      }
    );
  }

  private getProviderBudget(provider: string, capability: string): ProviderBudgetEntry | null {
    const providerCaps = this.providerBudgets.get(provider);
    if (!providerCaps) return null;
    const budget = providerCaps.get(capability) ?? null;
    if (!budget) return null;
    if (budget.resetAt && Date.now() >= budget.resetAt) {
      budget.used = 0;
      budget.remaining = budget.limit;
      budget.cooldownUntil = null;
      budget.resetAt = null;
    }
    return budget;
  }

  private configuredBudgetEntry(provider: string, config?: ProviderConfig): ProviderBudgetEntry | null {
    const budgetCfg = config?.budget;
    if (!budgetCfg || !(budgetCfg.dailyLimit > 0)) return null;
    return {
      provider,
      capability: 'company',
      limit: budgetCfg.dailyLimit,
      used: 0,
      remaining: budgetCfg.dailyLimit,
      resetAt: budgetCfg.windowMs ? Date.now() + budgetCfg.windowMs : null,
      priority: config?.priority ?? 99,
      cooldownUntil: null,
    };
  }

  private recordProviderRequestBudget(provider: string, capability: string, success: boolean): void {
    let providerCaps = this.providerBudgets.get(provider);
    if (!providerCaps) {
      providerCaps = new Map<string, ProviderBudgetEntry>();
      this.providerBudgets.set(provider, providerCaps);
    }

    let budget = providerCaps.get(capability);
    if (!budget) {
      const config = this.getProviderConfig(provider);
      const budgetCfg = config?.budget;
      const limit = budgetCfg?.dailyLimit && budgetCfg.dailyLimit > 0 ? budgetCfg.dailyLimit : 1_000_000;
      budget = {
        provider,
        capability,
        limit,
        used: 0,
        remaining: limit,
        resetAt: budgetCfg?.windowMs ? Date.now() + budgetCfg.windowMs : null,
        priority: config?.priority ?? 99,
        cooldownUntil: null,
      };
      providerCaps.set(capability, budget);
    }

    if (success) {
      budget.used++;
      budget.remaining = Math.max(0, budget.limit - budget.used);
    } else {
      budget.used = Math.min(budget.limit, budget.used + 1);
      budget.remaining = Math.max(0, budget.limit - budget.used);
    }
  }

  private resetProviderBudget(provider: string, capability: string): void {
    const providerCaps = this.providerBudgets.get(provider);
    if (!providerCaps) return;
    const budget = providerCaps.get(capability);
    if (budget) {
      budget.used = 0;
      budget.remaining = budget.limit;
      budget.resetAt = Date.now();
      budget.cooldownUntil = null;
    }
  }

  private isInCooldown(provider: string, capability: string): boolean {
    const budget = this.getProviderBudget(provider, capability);
    if (!budget) return false;
    if (!budget.cooldownUntil) return false;
    return Date.now() < budget.cooldownUntil;
  }

  private markProviderInCooldown(provider: string, capability: string, durationMs: number): void {
    const budget = this.getProviderBudget(provider, capability);
    if (!budget) return;
    budget.cooldownUntil = Date.now() + durationMs;
  }
}
