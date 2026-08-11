import { Injectable, Logger, Optional } from '@nestjs/common';
import { MarketDataOrchestrator } from '../orchestrator/market-data-orchestrator';
import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';
import { MarketDataCacheService } from '../cache/market-data-cache.service';
import { getMarketDataConfig, ProviderConfig } from '../config/market-data.config';
import { QualityScorer } from './quality-scorer.service';
import { ConflictResolver } from './conflict-resolver.service';
import { DataValidator } from './data-validator.service';
import {
  AggregatedResult,
  AggregationMetadata,
  ProviderContribution,
  ConflictRecord,
  ValidationWarning,
  AggregationConfig,
} from './aggregation.types';
import {
  Company,
  FinancialStatement,
  UnifiedBalanceSheet,
  UnifiedIncomeStatement,
  CashFlow,
  Sector,
  Disclosure,
} from '../interfaces/unified-domain.types';

const DEFAULT_CONFIG: AggregationConfig = {
  strategy: 'merge',
  stalenessThresholdMs: 24 * 60 * 60 * 1000,
  minProvidersForAverage: 2,
  weightByPriority: true,
  weightByHealth: true,
};

@Injectable()
export class AggregationEngine {
  private readonly logger = new Logger(AggregationEngine.name);
  private readonly config: AggregationConfig;

  constructor(
    private readonly orchestrator: MarketDataOrchestrator,
    private readonly circuitBreaker: CircuitBreakerService,
    private readonly cacheService: MarketDataCacheService,
    private readonly qualityScorer: QualityScorer,
    private readonly conflictResolver: ConflictResolver,
    private readonly dataValidator: DataValidator,
    @Optional() config?: Partial<AggregationConfig>,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async aggregateCompany(symbol: string): Promise<AggregatedResult<Company> | null> {
    return this.fetchAndAggregate<Company>(
      symbol,
      'company',
      (s) => this.orchestrator.fetchCompany(s),
      (data, provider) => this.dataValidator.validateCompany(data as unknown as Record<string, unknown>, provider),
      (data) => this.buildContribution(data, ['symbol', 'name', 'sector', 'marketCap', 'sharesOutstanding', 'currency', 'exchange']),
    );
  }

  async aggregateFinancials(symbol: string): Promise<AggregatedResult<FinancialStatement> | null> {
    return this.fetchAndAggregate<FinancialStatement>(
      symbol,
      'financials',
      (s) => this.orchestrator.fetchFinancials(s),
      (data, provider) => this.dataValidator.validateFinancialStatement(data as unknown as Record<string, unknown>, provider),
      (data) => this.buildContribution(data, ['symbol', 'period', 'revenue', 'netIncome', 'ebitda', 'grossProfit', 'operatingIncome', 'costOfRevenue']),
    );
  }

  async aggregateBalanceSheet(symbol: string): Promise<AggregatedResult<UnifiedBalanceSheet> | null> {
    return this.fetchAndAggregate<UnifiedBalanceSheet>(
      symbol,
      'balanceSheet',
      (s) => this.orchestrator.fetchBalanceSheet(s),
      (data, provider) => this.dataValidator.validateBalanceSheet(data as unknown as Record<string, unknown>, provider),
      (data) => this.buildContribution(data, ['symbol', 'period', 'equity', 'totalDebt', 'totalAssets', 'totalLiabilities', 'sharesOutstanding', 'currentAssets', 'currentLiabilities']),
    );
  }

  async aggregateIncomeStatement(symbol: string): Promise<AggregatedResult<UnifiedIncomeStatement> | null> {
    return this.fetchAndAggregate<UnifiedIncomeStatement>(
      symbol,
      'incomeStatement',
      (s) => this.orchestrator.fetchIncomeStatement(s),
      (data, provider) => this.dataValidator.validateIncomeStatement(data as unknown as Record<string, unknown>, provider),
      (data) => this.buildContribution(data, ['symbol', 'period', 'revenue', 'netProfit', 'operatingIncome', 'ebitda', 'grossProfit', 'costOfRevenue']),
    );
  }

  async aggregateCashFlow(symbol: string): Promise<AggregatedResult<CashFlow> | null> {
    return this.fetchAndAggregate<CashFlow>(
      symbol,
      'cashFlow',
      (s) => this.orchestrator.fetchCashFlow(s),
      (data, provider) => this.dataValidator.validateCashFlow(data as unknown as Record<string, unknown>, provider),
      (data) => this.buildContribution(data, ['symbol', 'period', 'operatingCashFlow', 'investingCashFlow', 'financingCashFlow', 'freeCashFlow']),
    );
  }

  async aggregateSector(symbol: string): Promise<AggregatedResult<Sector> | null> {
    return this.fetchAndAggregate<Sector>(
      symbol,
      'sector',
      (s) => this.orchestrator.fetchSector(s),
      (data, provider) => this.dataValidator.validateSector(data as unknown as Record<string, unknown>, provider),
      (data) => this.buildContribution(data, ['symbol', 'sector', 'subSector']),
    );
  }

  async aggregateDisclosures(symbol: string): Promise<AggregatedResult<Disclosure[]> | null> {
    const cached = this.cacheService.get<AggregatedResult<Disclosure[]>>('aggregated', 'disclosures', symbol);
    if (cached) {
      return { ...cached, metadata: { ...cached.metadata, cacheStatus: 'hit' } };
    }

    const startTime = Date.now();
    const providers = this.orchestrator.getAvailableProviders();
    const allDisclosures: Disclosure[] = [];
    const failed: string[] = [];

    const fetchPromises = providers.map(async (providerName) => {
      try {
        const result = await this.orchestrator.fetchDisclosures(symbol);
        if (result && result.data && result.data.length > 0) {
          allDisclosures.push(...result.data);
        }
      } catch {
        failed.push(providerName);
      }
    });

    await Promise.allSettled(fetchPromises);

    const deduplicated = this.dataValidator.deduplicateDisclosures(
      allDisclosures.map((d) => ({ title: d.title, date: d.date, source: d.source })),
    );

    const metadata: AggregationMetadata = {
      providersQueried: providers,
      providersUsed: providers.filter((p) => !failed.includes(p)),
      providersFailed: failed,
      providerConfidence: {},
      qualityScore: 0,
      lastUpdated: new Date().toISOString(),
      cacheStatus: 'miss',
      aggregationDurationMs: Date.now() - startTime,
      validationWarnings: [],
      conflictCount: 0,
      conflicts: [],
    };

    const contributions: ProviderContribution[] = providers
      .filter((p) => !failed.includes(p))
      .map((p) => ({
        provider: p,
        priority: this.getProviderPriority(p),
        healthy: !this.circuitBreaker.isCircuitOpen(p),
        latencyMs: 0,
        fieldsReturned: 1,
        fieldsExpected: 1,
      }));

    metadata.qualityScore = this.qualityScorer.calculate(contributions, metadata);

    const result: AggregatedResult<Disclosure[]> = {
      data: deduplicated as Disclosure[],
      metadata,
    };

    this.cacheService.set('aggregated', 'disclosures', symbol, result, 15 * 60 * 1000);
    return result;
  }

  private async fetchAndAggregate<T>(
    symbol: string,
    type: string,
    fetcher: (symbol: string) => Promise<{ data: T | null; provider: string; cached: boolean } | null>,
    validator: (data: T, provider: string) => ValidationWarning[],
    contributionBuilder: (data: T) => { fieldsReturned: number; fieldsExpected: number },
  ): Promise<AggregatedResult<T> | null> {
    const cached = this.cacheService.get<AggregatedResult<T>>('aggregated', type, symbol);
    if (cached) {
      return { ...cached, metadata: { ...cached.metadata, cacheStatus: 'hit' } };
    }

    const startTime = Date.now();
    const providers = this.orchestrator.getAvailableProviders();
    const responses: Array<{ provider: string; data: T | null; priority: number; healthy: boolean; latencyMs: number }> = [];

    const fetchPromises = providers.map(async (providerName) => {
      const fetchStart = Date.now();
      try {
        const result = await fetcher(symbol);
        const latencyMs = Date.now() - fetchStart;
        responses.push({
          provider: providerName,
          data: result?.data ?? null,
          priority: this.getProviderPriority(providerName),
          healthy: !this.circuitBreaker.isCircuitOpen(providerName),
          latencyMs,
        });
      } catch (error) {
        const latencyMs = Date.now() - fetchStart;
        responses.push({
          provider: providerName,
          data: null,
          priority: this.getProviderPriority(providerName),
          healthy: false,
          latencyMs,
        });
      }
    });

    await Promise.allSettled(fetchPromises);

    const validResponses = responses.filter((r) => r.data !== null);
    if (validResponses.length === 0) {
      this.logger.warn(`No valid responses for ${symbol} (${type})`);
      return null;
    }

    const warnings: ValidationWarning[] = [];
    const conflicts: ConflictRecord[] = [];

    for (const response of validResponses) {
      const dataWarnings = validator(response.data as T, response.provider);
      warnings.push(...dataWarnings);
    }

    const mergedData = this.mergeResponses(validResponses, conflicts);

    const contributions: ProviderContribution[] = validResponses.map((r) => {
      const contribution = contributionBuilder(r.data as T);
      return {
        provider: r.provider,
        priority: r.priority,
        healthy: r.healthy,
        latencyMs: r.latencyMs,
        fieldsReturned: contribution.fieldsReturned,
        fieldsExpected: contribution.fieldsExpected,
      };
    });

    const metadata: AggregationMetadata = {
      providersQueried: providers,
      providersUsed: validResponses.map((r) => r.provider),
      providersFailed: responses.filter((r) => r.data === null).map((r) => r.provider),
      providerConfidence: this.buildProviderConfidence(validResponses),
      qualityScore: 0,
      lastUpdated: new Date().toISOString(),
      cacheStatus: 'miss',
      aggregationDurationMs: Date.now() - startTime,
      validationWarnings: warnings,
      conflictCount: conflicts.length,
      conflicts,
    };

    metadata.qualityScore = this.qualityScorer.calculate(contributions, metadata);

    const result: AggregatedResult<T> = {
      data: mergedData,
      metadata,
    };

    this.cacheService.set('aggregated', type, symbol, result, this.getTtlForType(type));
    return result;
  }

  private mergeResponses<T>(
    responses: Array<{ provider: string; data: T | null; priority: number; healthy: boolean; latencyMs: number }>,
    conflicts: ConflictRecord[],
  ): T {
    if (responses.length === 1) return responses[0].data as T;

    const sorted = [...responses].sort((a, b) => a.priority - b.priority);
    const base = { ...sorted[0].data } as Record<string, unknown>;

    for (let i = 1; i < sorted.length; i++) {
      const other = sorted[i].data as unknown as Record<string, unknown>;
      for (const key of Object.keys(other)) {
        if (key === 'source' || key === 'lastUpdated') continue;

        const currentVal = base[key];
        const otherVal = other[key];

        if (currentVal === undefined || currentVal === null) {
          base[key] = otherVal;
          continue;
        }

        if (otherVal === undefined || otherVal === null) continue;

        if (JSON.stringify(currentVal) !== JSON.stringify(otherVal)) {
          const sources = sorted.map((r) => ({
            provider: r.provider,
            value: (r.data as unknown as Record<string, unknown>)?.[key],
            priority: r.priority,
            timestamp: ((r.data as unknown as Record<string, unknown>)?.lastUpdated as string) || new Date().toISOString(),
          }));

          const validSources = sources.filter((s) => s.value !== null && s.value !== undefined);
          if (validSources.length === 0) continue;

          const isNumeric = typeof currentVal === 'number' || typeof otherVal === 'number';
          let resolved;

          if (isNumeric) {
            resolved = this.conflictResolver.resolveNumeric(key, validSources);
          } else {
            resolved = this.conflictResolver.resolve(key, validSources);
          }

          if (resolved) {
            base[key] = resolved.value;
            conflicts.push(
              this.conflictResolver.buildConflictRecord(key, validSources, resolved.value, resolved.resolution),
            );
          }
        }
      }
    }

    return base as T;
  }

  private getProviderPriority(name: string): number {
    const config = getMarketDataConfig();
    const providers = config.providers as Record<string, ProviderConfig>;
    const entry = providers[name];
    return entry ? entry.priority : 99;
  }

  private buildProviderConfidence(
    responses: Array<{ provider: string; healthy: boolean; latencyMs: number; priority: number }>,
  ): Record<string, number> {
    const confidence: Record<string, number> = {};
    for (const r of responses) {
      let score = 50;
      if (r.healthy) score += 25;
      if (r.latencyMs < 1000) score += 15;
      else if (r.latencyMs < 5000) score += 5;
      if (r.priority <= 2) score += 10;
      confidence[r.provider] = Math.min(100, score);
    }
    return confidence;
  }

  private buildContribution(data: unknown, fields: string[]): { fieldsReturned: number; fieldsExpected: number } {
    const record = data as Record<string, unknown>;
    const returned = fields.filter((f) => record[f] != null).length;
    return { fieldsReturned: returned, fieldsExpected: fields.length };
  }

  private getTtlForType(type: string): number {
    switch (type) {
      case 'company':
        return 12 * 60 * 60 * 1000;
      case 'disclosures':
        return 15 * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000;
    }
  }
}
