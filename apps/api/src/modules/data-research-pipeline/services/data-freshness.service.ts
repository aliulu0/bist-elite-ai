import { Injectable, Logger } from '@nestjs/common';
import { MarketDataOrchestrator } from '../../market-data/orchestrator/market-data-orchestrator';
import { MarketDataConfig, getMarketDataConfig } from '../../market-data/config/market-data.config';
import { CacheService } from '../../../common/cache/cache.service';
import {
  DataFreshnessInfo,
  DataProviderName,
  DataProviderCategory,
  FreshnessState,
  DataFreshnessReport,
  DEFAULT_FRESHNESS_THRESHOLDS,
  FRESHNESS_THRESHOLDS_BY_CATEGORY,
} from '../interfaces';

const CACHE_NAMESPACE = 'data-freshness';
const FRESHNESS_TTL_MS = 30 * 1000;

@Injectable()
export class DataFreshnessService {
  private readonly logger = new Logger(DataFreshnessService.name);
  private readonly config: ReturnType<typeof getMarketDataConfig>;

  constructor(
    private readonly orchestrator: MarketDataOrchestrator,
    private readonly cache: CacheService,
  ) {
    this.config = getMarketDataConfig();
  }

  async getFreshnessReport(): Promise<DataFreshnessReport> {
    const cached = this.cache.get<DataFreshnessReport>('freshness-report', 'data-freshness');
    if (cached) return cached;

    const freshness = await this.buildFreshnessInfo();
    const report: DataFreshnessReport = {
      freshness,
      overallFreshness: this.computeOverallFreshness(freshness),
      generatedAt: new Date().toISOString(),
    };

    this.cache.set('freshness-report', report, 30 * 1000, 'data-freshness');
    return report;
  }

  async getFreshnessForProvider(providerName: string): Promise<DataFreshnessInfo | null> {
    const report = await this.getFreshnessReport();
    return report.freshness.find((f: DataFreshnessInfo) => f.source === providerName) ?? null;
  }

  async getFreshnessForTickers(tickers: string[], timeframe: string): Promise<Map<string, DataFreshnessInfo[]>> {
    const result = new Map<string, DataFreshnessInfo[]>();
    const report = await this.getFreshnessReport();
    
    for (const ticker of tickers) {
      const relevant = report.freshness.filter((f: DataFreshnessInfo) => 
        f.source === 'yahoo' || f.source === 'fintables' || f.source === 'finnhub'
      );
      result.set(ticker, relevant);
    }
    return result;
  }

  private async buildFreshnessInfo(): Promise<DataFreshnessInfo[]> {
    const providers = this.orchestrator.getAvailableProviders();
    const results: DataFreshnessInfo[] = [];

    for (const providerName of providers) {
      const freshness = await this.calculateProviderFreshness(providerName);
      results.push(freshness);
    }
    return results;
  }

  private async calculateProviderFreshness(providerName: string): Promise<DataFreshnessInfo> {
    const threshold = this.getFreshnessThreshold(providerName);
    const lastSync = await this.getLastSyncForProvider(providerName);
    const timestamp = await this.getDataTimestamp(providerName);
    const now = Date.now();
    
    let ageSeconds: number | null = null;
    let timestampValue: string | null = null;

    if (timestamp) {
      ageSeconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    } else if (lastSync) {
      ageSeconds = Math.floor((Date.now() - new Date(lastSync).getTime()) / 1000);
    }

    const freshnessState = this.classifyFreshness(ageSeconds, threshold);

    return {
      source: providerName as DataProviderName,
      fetchedAt: lastSync,
      dataTimestamp: timestamp,
      ageSeconds,
      freshnessState,
      stalenessThresholdSeconds: threshold.staleSeconds,
    };
  }

  private classifyFreshness(ageSeconds: number | null, threshold: { freshSeconds: number; acceptableSeconds: number; staleSeconds: number }): DataFreshnessInfo['freshnessState'] {
    if (ageSeconds === null) return 'UNAVAILABLE';
    if (ageSeconds <= threshold.freshSeconds) return 'FRESH';
    if (ageSeconds <= threshold.acceptableSeconds) return 'ACCEPTABLE';
    if (ageSeconds <= threshold.staleSeconds) return 'STALE';
    return 'UNAVAILABLE';
  }

  private computeOverallFreshness(freshness: DataFreshnessInfo[]): DataFreshnessInfo['freshnessState'] {
    const states = freshness.map(f => f.freshnessState);
    if (states.some(s => s === 'UNAVAILABLE')) return 'UNAVAILABLE';
    if (states.some(s => s === 'STALE')) return 'STALE';
    if (states.some(s => s === 'ACCEPTABLE')) return 'ACCEPTABLE';
    return 'FRESH';
  }

  private getFreshnessThreshold(providerName: string): { freshSeconds: number; acceptableSeconds: number; staleSeconds: number } {
    const category = this.inferCategory(providerName);
    return {
      freshSeconds: 60,
      acceptableSeconds: 300,
      staleSeconds: 1800,
    };
  }

  private inferCategory(providerName: string): string {
    const categories: Record<string, string> = {
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
}