import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../../../common/cache/cache.service';
import {
  SourceQualityEntry,
  SourceQualityTier,
  DataProviderName,
  SourceQualityReport,
  DEFAULT_SOURCE_QUALITY_TIERS,
} from '../interfaces';

const CACHE_NAMESPACE = 'source-quality';
const SOURCE_QUALITY_TTL_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class SourceQualityService {
  private readonly logger = new Logger(SourceQualityService.name);

  constructor(private readonly cache: CacheService) {}

  async getSourceQualityReport(): Promise<SourceQualityReport> {
    const cached = this.cache.get<SourceQualityReport>('source-quality-report', 'source-quality');
    if (cached) return cached;

    const sources = this.buildSourceQualityEntries();
    const report: SourceQualityReport = {
      sources,
      generatedAt: new Date().toISOString(),
    };

    this.cache.set('source-quality-report', report, 60 * 60 * 1000, 'source-quality');
    return report;
  }

  async getSourceQualityForProvider(providerName: string): Promise<SourceQualityEntry | null> {
    const report = await this.getSourceQualityReport();
    return report.sources.find(s => s.provider === providerName) ?? null;
  }

  async getProvidersByTier(tier: SourceQualityTier): Promise<SourceQualityEntry[]> {
    const report = await this.getSourceQualityReport();
    return report.sources.filter(s => s.tier === tier);
  }

  private buildSourceQualityEntries(): SourceQualityEntry[] {
    const providers: DataProviderName[] = [
      'fintables', 'finnhub', 'alpha-vantage', 'yahoo', 'kap', 'tcmb', 'mkk',
      'serpapi', 'google-news', 'google-search', 'finnhub-news', 'agent-reach',
      'yahoo-finance', 'chatgpt', 'gemini', 'perplexity', 'grok'
    ];

    return providers.map(provider => ({
      provider,
      tier: DEFAULT_SOURCE_QUALITY_TIERS[provider] ?? 'UNKNOWN',
      description: this.getTierDescription(DEFAULT_SOURCE_QUALITY_TIERS[provider] ?? 'UNKNOWN'),
      isOfficial: (DEFAULT_SOURCE_QUALITY_TIERS[provider] ?? 'UNKNOWN') === 'TIER_1',
      reliabilityScore: this.getReliabilityScore(DEFAULT_SOURCE_QUALITY_TIERS[provider] ?? 'UNKNOWN'),
      lastVerified: new Date().toISOString(),
    }));
  }

  private getTierDescription(tier: SourceQualityTier): string {
    const descriptions: Record<string, string> = {
      'TIER_1': 'Official, authoritative sources (regulatory filings, central bank data, exchange data)',
      'TIER_2': 'Established financial data vendors with verified data',
      'TIER_3': 'Third-party aggregators, search APIs, web-scraped sources',
      'UNKNOWN': 'Unclassified source',
    };
    return descriptions[tier] ?? 'Unknown tier';
  }

  private getReliabilityScore(tier: SourceQualityTier): number {
    const scores: Record<string, number> = {
      'TIER_1': 0.95,
      'TIER_2': 0.8,
      'TIER_3': 0.6,
      'UNKNOWN': 0.5,
    };
    return scores[tier] ?? 0.5;
  }

  getTierForProvider(providerName: string): SourceQualityTier {
    return DEFAULT_SOURCE_QUALITY_TIERS[providerName as DataProviderName] ?? 'UNKNOWN';
  }
}