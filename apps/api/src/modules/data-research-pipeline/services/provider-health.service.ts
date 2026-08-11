import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MarketDataOrchestrator } from '../../market-data/orchestrator/market-data-orchestrator';
import { MarketDataConfig, getMarketDataConfig } from '../../market-data/config/market-data.config';
import { CacheService } from '../../../common/cache/cache.service';
import {
  ProviderHealthEntry,
  DataFreshnessInfo,
  DataProviderName,
  DataProviderCategory,
  FreshnessState,
  DataHealthReport,
  DataFreshnessReport,
  SourceQualityReport,
  DEFAULT_SOURCE_QUALITY_TIERS,
  FRESHNESS_THRESHOLDS_BY_CATEGORY,
  DEFAULT_FRESHNESS_THRESHOLDS,
} from '../interfaces';

const CACHE_NAMESPACE = 'data-health';
const PROVIDER_HEALTH_TTL_MS = 60 * 1000; // 1 minute
const FRESHNESS_TTL_MS = 30 * 1000; // 30 seconds

@Injectable()
export class ProviderHealthService {
  private readonly logger = new Logger(ProviderHealthService.name);
  private readonly config = getMarketDataConfig();

  constructor(
    private readonly orchestrator: MarketDataOrchestrator,
    private readonly cache: CacheService,
  ) {
    this.config = getMarketDataConfig();
  }

  async getProviderHealth(): Promise<ProviderHealthEntry[]> {
    const cached = this.cache.get<ProviderHealthEntry[]>('provider-health', CACHE_NAMESPACE);
    if (cached) return cached;

    const entries = await this.buildProviderHealthEntries();
    this.cache.set('provider-health', entries, PROVIDER_HEALTH_TTL_MS, CACHE_NAMESPACE);
    return entries;
  }

  async getDataHealthReport(): Promise<DataHealthReport> {
    const providers = await this.getProviderHealth();
    const healthy = providers.filter(p => p.enabled && p.configured && p.circuitState === 'CLOSED' && p.dataFreshness.freshnessState === 'FRESH').length;
    const degraded = providers.filter(p => p.enabled && p.configured && (p.circuitState === 'HALF_OPEN' || p.dataFreshness.freshnessState === 'ACCEPTABLE')).length;
    const unavailable = providers.filter(p => !p.enabled || !p.configured || p.circuitState === 'OPEN' || p.dataFreshness.freshnessState === 'UNAVAILABLE').length;
    const missingApiKeys = providers.filter(p => p.enabled && !p.configured).length;

    const overallHealth: DataHealthReport['overallHealth'] = unavailable > 0 ? 'CRITICAL' : degraded > 0 ? 'DEGRADED' : 'HEALTHY';

    return {
      providers,
      overallHealth,
      generatedAt: new Date().toISOString(),
      summary: {
        totalProviders: providers.length,
        healthyProviders: healthy,
        degradedProviders: degraded,
        unavailableProviders: unavailable,
        missingApiKeys,
      },
    };
  }

  async getProviderFreshness(providerName?: DataProviderName): Promise<DataFreshnessReport> {
    const cached = this.cache.get<DataFreshnessReport>('freshness-report', CACHE_NAMESPACE);
    if (cached && (!providerName || cached.freshness.some(f => f.source === providerName))) {
      return cached;
    }

    const freshness = await this.buildFreshnessInfo();
    const report: DataFreshnessReport = {
      freshness,
      overallFreshness: this.computeOverallFreshness(freshness),
      generatedAt: new Date().toISOString(),
    };

    this.cache.set('freshness-report', report, FRESHNESS_TTL_MS, CACHE_NAMESPACE);
    return report;
  }

  async getSourceQualityReport(): Promise<SourceQualityReport> {
    const cached = this.cache.get<SourceQualityReport>('source-quality', CACHE_NAMESPACE);
    if (cached) return cached;

    const sources = this.buildSourceQualityEntries();
    const report: SourceQualityReport = {
      sources,
      generatedAt: new Date().toISOString(),
    };

    this.cache.set('source-quality', report, 60 * 60 * 1000, CACHE_NAMESPACE); // 1 hour cache
    return report;
  }

  private async buildProviderHealthEntries(): Promise<ProviderHealthEntry[]> {
    const dashboardEntries = this.orchestrator.getProviderDashboard();
    const providerStatuses = await this.orchestrator.getProviderStatus();
    const freshnessMap = await this.buildFreshnessMap();

    return dashboardEntries.map(entry => {
      const status = providerStatuses.find(s => s.name === entry.name);
      const freshness = freshnessMap.get(entry.name);

      return {
        name: entry.name as DataProviderName,
        category: this.inferCategory(entry.name),
        enabled: entry.enabled,
        configured: entry.authConfigured,
        lastSuccessfulRequest: entry.lastSync,
        lastError: entry.failedRequests > 0 ? `Failed ${entry.failedRequests} times` : null,
        requestCount: entry.totalRequests,
        errorCount: entry.failedRequests,
        avgLatencyMs: entry.latencyMs,
        lastSync: entry.lastSync,
        dataFreshness: freshness || this.createEmptyFreshness(entry.name),
        circuitState: entry.circuitState,
        authConfigured: entry.authConfigured,
      };
    });
  }

  private async buildFreshnessMap(): Promise<Map<string, DataFreshnessInfo>> {
    const map = new Map<string, DataFreshnessInfo>();
    const freshnessList = await this.buildFreshnessInfo();
    for (const f of freshnessList) {
      map.set(f.source, f);
    }
    return map;
  }

  private async buildFreshnessInfo(): Promise<DataFreshnessInfo[]> {
    const providers = this.orchestrator.getAvailableProviders();
    const results: DataFreshnessInfo[] = [];

    for (const providerName of providers) {
      const config = this.getProviderConfig(providerName);
      const threshold = this.getFreshnessThreshold(providerName);
      const freshness = await this.calculateFreshness(providerName, config, threshold);
      results.push(freshness);
    }

    return results;
  }

  private async calculateFreshness(providerName: string, config: any, threshold: { freshSeconds: number; acceptableSeconds: number; staleSeconds: number }): Promise<DataFreshnessInfo> {
    const lastSync = await this.getLastSyncForProvider(providerName);
    const timestamp = await this.getDataTimestamp(providerName);
    const now = Date.now();
    let ageSeconds: number | null = null;
    let timestampValue: string | null = null;

    if (timestamp) {
      ageSeconds = Math.floor((now - new Date(timestamp).getTime()) / 1000);
    } else if (lastSync) {
      ageSeconds = Math.floor((now - new Date(lastSync).getTime()) / 1000);
      timestampValue = lastSync;
    }

    const freshnessState = this.classifyFreshness(ageSeconds, threshold);

    return {
      source: providerName as DataProviderName,
      fetchedAt: lastSync,
      dataTimestamp: timestampValue,
      ageSeconds,
      freshnessState,
      stalenessThresholdSeconds: threshold.staleSeconds,
    };
  }

  private classifyFreshness(ageSeconds: number | null, threshold: { freshSeconds: number; acceptableSeconds: number; staleSeconds: number }): FreshnessState {
    if (ageSeconds === null) return 'UNAVAILABLE';
    if (ageSeconds <= threshold.freshSeconds) return 'FRESH';
    if (ageSeconds <= threshold.acceptableSeconds) return 'ACCEPTABLE';
    if (ageSeconds <= threshold.staleSeconds) return 'STALE';
    return 'UNAVAILABLE';
  }

  private computeOverallFreshness(freshness: DataFreshnessInfo[]): FreshnessState {
    const states = freshness.map(f => f.freshnessState);
    if (states.some(s => s === 'UNAVAILABLE')) return 'UNAVAILABLE';
    if (states.some(s => s === 'STALE')) return 'STALE';
    if (states.some(s => s === 'ACCEPTABLE')) return 'ACCEPTABLE';
    return 'FRESH';
  }

  private createEmptyFreshness(providerName: string): DataFreshnessInfo {
    return {
      source: providerName as DataProviderName,
      fetchedAt: null,
      dataTimestamp: null,
      ageSeconds: null,
      freshnessState: 'UNAVAILABLE',
      stalenessThresholdSeconds: DEFAULT_FRESHNESS_THRESHOLDS.STALE_SECONDS,
    };
  }

  private getProviderConfig(providerName: string): any {
    return (this.config.providers as Record<string, any>)[providerName] ?? {};
  }

  private getFreshnessThreshold(providerName: string): { freshSeconds: number; acceptableSeconds: number; staleSeconds: number } {
    const category = this.inferCategory(providerName);
    return FRESHNESS_THRESHOLDS_BY_CATEGORY[category] ?? DEFAULT_FRESHNESS_THRESHOLDS;
  }

  private inferCategory(providerName: string): DataProviderCategory {
    const categories: Record<string, DataProviderCategory> = {
      'fintables': 'fundamental',
      'finnhub': 'market-data',
      'alpha-vantage': 'fundamental',
      'yahoo': 'market-data',
      'kap': 'regulatory',
      'tcmb': 'macro',
      'mkk': 'fundamental',
      'serpapi': 'search',
      'google-news': 'news',
      'google-search': 'search',
      'finnhub-news': 'news',
      'agent-reach': 'research',
      'yahoo-finance': 'market-data',
      'chatgpt': 'research',
      'gemini': 'research',
      'perplexity': 'research',
      'grok': 'research',
    };
    return categories[providerName] ?? 'market-data';
  }

  private async getLastSyncForProvider(providerName: string): Promise<string | null> {
    const statuses = await this.orchestrator.getProviderStatus();
    const status = statuses.find((s: { name: string; lastHealthCheck: string | null }) => s.name === providerName);
    return status?.lastHealthCheck ?? null;
  }

  private async getDataTimestamp(providerName: string): Promise<string | null> {
    return null;
  }

  private buildSourceQualityEntries() {
    const entries = Object.entries(DEFAULT_SOURCE_QUALITY_TIERS).map(([provider, tier]) => ({
      provider: provider as DataProviderName,
      tier,
      description: this.getTierDescription(tier),
      isOfficial: tier === 'TIER_1',
      reliabilityScore: tier === 'TIER_1' ? 0.95 : tier === 'TIER_2' ? 0.8 : 0.6,
      lastVerified: new Date().toISOString(),
    }));
    return entries;
  }

  private getTierDescription(tier: string): string {
    const descriptions: Record<string, string> = {
      'TIER_1': 'Official, authoritative sources (regulatory filings, central bank data, exchange data)',
      'TIER_2': 'Established financial data vendors with verified data',
      'TIER_3': 'Third-party aggregators, search APIs, web-scraped sources',
      'UNKNOWN': 'Unclassified source',
    };
    return descriptions[tier] ?? 'Unknown tier';
  }

}