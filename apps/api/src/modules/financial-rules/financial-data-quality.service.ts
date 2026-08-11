import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../../common/cache/cache.service';
import {
  DataQualityContext,
  FinancialDataQualityReport,
  DataQualityStatus,
  FreshnessStatus,
  ProviderConsistencyStatus,
  MarketIntegrityReport,
  FundamentalQualityReport,
  ProviderSummary,
  FreshnessReport,
} from './financial-data-quality.types';
import { MarketDataPoint } from '../market-data/interfaces/market-data.types';
import { AIConsensus } from '../ai-research/ai-research.types';
import { FundamentalBundle } from './fundamental-integration.service';

const CACHE_NAMESPACE = 'financialDataQuality';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const FRESHNESS_THRESHOLDS = {
  price: {
    fresh: 5 * 60 * 1000, // 5 minutes
    stale: 60 * 60 * 1000, // 1 hour
  },
  fundamental: {
    fresh: 24 * 60 * 60 * 1000, // 24 hours
    stale: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  research: {
    fresh: 60 * 60 * 1000, // 1 hour
    stale: 24 * 60 * 60 * 1000, // 24 hours
  },
};

const WEIGHTS = {
  freshness: 0.2,
  marketIntegrity: 0.2,
  fundamentalIntegrity: 0.2,
  providerConsistency: 0.15,
  completeness: 0.15,
  internalConsistency: 0.1,
};

const STATUS_THRESHOLDS = {
  VERIFIED: 80,
  ACCEPTABLE: 60,
  WARNING: 40,
};

@Injectable()
export class FinancialDataQualityService {
  private readonly logger = new Logger(FinancialDataQualityService.name);

  constructor(private readonly cache: CacheService) {}

  async assess(context: DataQualityContext): Promise<FinancialDataQualityReport> {
    const cacheKey = `quality:${context.price?.symbol ?? 'unknown'}`;
    const cached = this.cache.get<FinancialDataQualityReport>(cacheKey, CACHE_NAMESPACE);
    if (cached) {
      this.logger.debug(`Cache hit for data quality: ${cacheKey}`);
      return cached;
    }

    const report = this.computeQuality(context);
    this.cache.set(cacheKey, report, CACHE_TTL_MS, CACHE_NAMESPACE);
    return report;
  }

  private computeQuality(context: DataQualityContext): FinancialDataQualityReport {
    const now = context.now ?? Date.now();
    const ticker = context.price?.symbol ?? 'UNKNOWN';

    // 1. Freshness
    const freshness = this.computeFreshness(context, now);
    const freshnessScore = this.scoreFreshness(freshness);

    // 2. Market Data Integrity
    const marketIntegrity = this.computeMarketIntegrity(context);
    const marketDataScore = this.scoreMarketIntegrity(marketIntegrity);

    // 3. Fundamental Integrity
    const fundamental = this.computeFundamentalQuality(context);
    const fundamentalDataScore = this.scoreFundamentalQuality(fundamental);

    // 4. Provider Consistency
    const providers = this.computeProviderSummary(context);
    const { providerConsistencyScore, providerConsistencyStatus, conflicts } = this.computeProviderConsistency(providers, context);

    // 5. Completeness
    const { completenessScore, missingFields } = this.computeCompleteness(context, fundamental);

    // 6. Internal Consistency
    const integrityScore = this.computeInternalConsistency(context, marketIntegrity, fundamental);

    // Overall quality score (weighted)
    const qualityScore = Math.round(
      freshnessScore * WEIGHTS.freshness +
      marketDataScore * WEIGHTS.marketIntegrity +
      fundamentalDataScore * WEIGHTS.fundamentalIntegrity +
      providerConsistencyScore * WEIGHTS.providerConsistency +
      completenessScore * WEIGHTS.completeness +
      integrityScore * WEIGHTS.internalConsistency
    );

    // Determine status
    let status: DataQualityStatus;
    if (qualityScore >= STATUS_THRESHOLDS.VERIFIED) status = 'DATA_VERIFIED';
    else if (qualityScore >= STATUS_THRESHOLDS.ACCEPTABLE) status = 'DATA_ACCEPTABLE';
    else if (qualityScore >= STATUS_THRESHOLDS.WARNING) status = 'DATA_WARNING';
    else status = 'DATA_INSUFFICIENT';

    // Collect warnings and errors
    const warnings = [...marketIntegrity.warnings, ...(fundamental?.status === 'WATCH' ? ['Temel analiz: izleme'] : [])];
    const errors = [...marketIntegrity.errors];

    return {
      ticker,
      qualityScore,
      status,
      freshness,
      freshnessScore,
      marketDataScore,
      marketIntegrity,
      fundamental,
      fundamentalDataScore,
      providers,
      providerConsistencyScore,
      providerConsistencyStatus,
      conflicts,
      completenessScore,
      missingFields,
      integrityScore,
      warnings,
      errors,
      timestamp: new Date().toISOString(),
    };
  }

  private computeFreshness(context: DataQualityContext, now: number): FreshnessReport {
    const priceFreshness = this.getFreshnessStatus(
      context.priceTimestamp ? new Date(context.priceTimestamp).getTime() : null,
      FRESHNESS_THRESHOLDS.price.fresh,
      FRESHNESS_THRESHOLDS.price.stale
    );

    const fundamentalFreshness = context.fundamental?.report
      ? this.getFreshnessStatus(
          context.fundamental.report.timestamp ? new Date(context.fundamental.report.timestamp).getTime() : null,
          FRESHNESS_THRESHOLDS.fundamental.fresh,
          FRESHNESS_THRESHOLDS.fundamental.stale
        )
      : 'unknown';

    const researchFreshness = context.consensus?.timestamp
      ? this.getFreshnessStatus(
          new Date(context.consensus.timestamp).getTime(),
          FRESHNESS_THRESHOLDS.research.fresh,
          FRESHNESS_THRESHOLDS.research.stale
        )
      : 'unknown';

    const overall = [priceFreshness, fundamentalFreshness, researchFreshness].includes('unknown')
      ? 'unknown'
      : [priceFreshness, fundamentalFreshness, researchFreshness].includes('stale')
        ? 'stale'
        : 'fresh';

    return {
      price: priceFreshness,
      fundamental: fundamentalFreshness,
      research: researchFreshness,
      overall,
    };
  }

  private getFreshnessStatus(timestamp: number | null, freshMs: number, staleMs: number): FreshnessStatus {
    if (!timestamp) return 'unknown';
    const age = Date.now() - timestamp;
    if (age <= freshMs) return 'fresh';
    if (age <= staleMs) return 'stale';
    return 'unknown';
  }

  private scoreFreshness(freshness: FreshnessReport): number {
    const scores = { fresh: 100, stale: 50, unknown: 20 };
    return Math.round(
      (scores[freshness.price] + scores[freshness.fundamental] + scores[freshness.research]) / 3
    );
  }

  private computeMarketIntegrity(context: DataQualityContext): MarketIntegrityReport {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!context.price) {
      errors.push('Fiyat verisi yok');
      return { valid: false, errors, warnings };
    }

    const price = context.price;
    const history = context.history;

    // OHLC relationships
    if (price.high < price.low) errors.push('High < Low');
    if (price.high < price.open) errors.push('High < Open');
    if (price.high < price.close) errors.push('High < Close');
    if (price.low > price.open) warnings.push('Low > Open');
    if (price.low > price.close) warnings.push('Low > Close');

    // Volume and price checks
    if (price.volume < 0) errors.push('Negatif hacim');
    if (price.volume === 0) warnings.push('Hacim sıfır');
    if (price.close <= 0) errors.push('Kapanış fiyatı sıfır veya negatif');

    // Timestamp ordering (for history)
    if (history.length > 1) {
      for (let i = 1; i < history.length; i++) {
        const prev = new Date(history[i - 1].timestamp).getTime();
        const curr = new Date(history[i].timestamp).getTime();
        if (curr <= prev) {
          warnings.push('Zaman damgası sıralaması bozuk');
          break;
        }
      }

      // Duplicate candles
      const seen = new Set<string>();
      for (const point of history) {
        const key = `${point.timestamp}|${point.open}|${point.high}|${point.low}|${point.close}`;
        if (seen.has(key)) {
          warnings.push('Tekrarlayan mum verisi');
          break;
        }
        seen.add(key);
      }
    }

    // Missing candles detection (gaps > expected interval)
    if (history.length > 2) {
      const intervals: number[] = [];
      for (let i = 1; i < history.length; i++) {
        const diff = new Date(history[i].timestamp).getTime() - new Date(history[i - 1].timestamp).getTime();
        intervals.push(diff);
      }
      const median = intervals.sort((a, b) => a - b)[Math.floor(intervals.length / 2)];
      for (const interval of intervals) {
        if (interval > median * 3) {
          warnings.push('Mum verilerinde boşluk tespit edildi');
          break;
        }
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  private scoreMarketIntegrity(report: MarketIntegrityReport): number {
    if (!report.valid) return 0;
    if (report.warnings.length > 0) return 70;
    return 100;
  }

  private computeFundamentalQuality(context: DataQualityContext): FundamentalQualityReport | null {
    if (!context.fundamental?.report) return null;

    const report = context.fundamental.report;
    return {
      status: report.overallStatus,
      score: report.score,
      dataQuality: context.fundamental.dataQuality,
    };
  }

  private scoreFundamentalQuality(report: FundamentalQualityReport | null): number {
    if (!report) return 0;
    if (report.status === 'PASS') return 100;
    if (report.status === 'WATCH') return 60;
    if (report.status === 'FAIL') return 20;
    return 30; // UNKNOWN
  }

  private computeProviderSummary(context: DataQualityContext): ProviderSummary {
    const researchProviders = context.consensus?.providerSummaries
      ? Object.keys(context.consensus.providerSummaries)
      : [];

    const attemptedAt = [
      ...(context.priceProvider ? [context.priceProvider] : []),
      ...(context.fundamental?.report ? ['fundamental'] : []),
      ...researchProviders,
    ];

    return {
      price: context.priceProvider,
      fundamental: context.fundamental?.report ? 'fundamental' : undefined,
      research: researchProviders,
      fallbackUsed: context.priceFallbackUsed ?? false,
      attemptedAt,
    };
  }

  private computeProviderConsistency(
    providers: ProviderSummary,
    context: DataQualityContext
  ): { providerConsistencyScore: number; providerConsistencyStatus: ProviderConsistencyStatus; conflicts: string[] } {
    const conflicts: string[] = [];
    let score = 100;
    let status: ProviderConsistencyStatus = 'consistent';

    // Check if fallback was used for price
    if (providers.fallbackUsed) {
      conflicts.push('Fiyat verisinde fallback sağlayıcı kullanıldı');
      score -= 20;
      status = 'partial';
    }

    // Check research provider conflicts
    if (context.consensus?.conflicts && context.consensus.conflicts.length > 0) {
      for (const conflict of context.consensus.conflicts) {
        conflicts.push(`Araştırma çatışması: ${conflict.topic} (${conflict.providers.join(', ')})`);
      }
      score -= context.consensus.conflicts.length * 15;
      status = 'conflicting';
    }

    // Check provider diversity
    const uniqueProviders = new Set([
      ...(providers.price ? [providers.price] : []),
      ...(providers.fundamental ? [providers.fundamental] : []),
      ...providers.research,
    ]);

    if (uniqueProviders.size === 1 && providers.research.length === 0) {
      conflicts.push('Tek sağlayıcıdan veri');
      score -= 15;
      status = 'partial';
    }

    if (score < 50) status = 'conflicting';
    else if (score < 80) status = 'partial';

    return { providerConsistencyScore: Math.max(0, score), providerConsistencyStatus: status, conflicts };
  }

  private computeCompleteness(
    context: DataQualityContext,
    fundamental: FundamentalQualityReport | null
  ): { completenessScore: number; missingFields: string[] } {
    const missingFields: string[] = [];

    if (!context.price) missingFields.push('price');
    if (!context.history || context.history.length === 0) missingFields.push('history');
    if (!fundamental) missingFields.push('fundamental');
    if (!context.consensus) missingFields.push('research');

    const totalFields = 4;
    const presentFields = totalFields - missingFields.length;
    const completenessScore = Math.round((presentFields / totalFields) * 100);

    return { completenessScore, missingFields };
  }

  private computeInternalConsistency(
    context: DataQualityContext,
    marketIntegrity: MarketIntegrityReport,
    fundamental: FundamentalQualityReport | null
  ): number {
    let score = 100;

    // Market integrity issues reduce consistency
    if (!marketIntegrity.valid) score -= 30;
    else if (marketIntegrity.warnings.length > 0) score -= 10;

    // Fundamental issues reduce consistency
    if (fundamental) {
      if (fundamental.status === 'FAIL') score -= 20;
      else if (fundamental.status === 'WATCH') score -= 10;
    }

    // Price vs fundamental consistency (if both exist)
    if (context.price && fundamental && fundamental.status === 'PASS') {
      // Could add more checks here (e.g., P/E ratio sanity)
    }

    return Math.max(0, score);
  }

  // Turkish explanation generation
  explain(report: FinancialDataQualityReport): string {
    const parts: string[] = [];

    const statusLabels: Record<DataQualityStatus, string> = {
      DATA_VERIFIED: 'yüksek',
      DATA_ACCEPTABLE: 'kabul edilebilir',
      DATA_WARNING: 'uyarı',
      DATA_INSUFFICIENT: 'yetersiz',
    };

    parts.push(`Veri kalitesi ${statusLabels[report.status]} (${report.qualityScore}/100).`);

    if (report.freshness.overall === 'fresh') {
      parts.push('Fiyat, temel ve araştırma verileri güncel.');
    } else if (report.freshness.overall === 'stale') {
      parts.push('Bazı veriler eski, dikkatli değerlendirme önerilir.');
    } else {
      parts.push('Veri güncelliği belirlenemedi.');
    }

    if (report.marketIntegrity.valid && report.marketIntegrity.warnings.length === 0) {
      parts.push('Piyasa verisi bütünlüğü sağlandı.');
    } else if (!report.marketIntegrity.valid) {
      parts.push(`Piyasa verisi hatası: ${report.marketIntegrity.errors.join(', ')}.`);
    } else {
      parts.push(`Piyasa verisi uyarısı: ${report.marketIntegrity.warnings.join(', ')}.`);
    }

    if (report.fundamental) {
      const fundLabels: Record<string, string> = {
        PASS: 'uygun',
        WATCH: 'izlemeye değer',
        FAIL: 'zayıf',
        UNKNOWN: 'belirsiz',
      };
      const status = report.fundamental.status ?? 'UNKNOWN';
      parts.push(`Temel analiz: ${fundLabels[status] || 'belirsiz'} (${report.fundamental.score}/100).`);
    } else {
      parts.push('Temel analiz verisi yok.');
    }

    if (report.providerConsistencyStatus === 'conflicting') {
      parts.push(`Sağlayıcı uyuşmazlığı: ${report.conflicts.join('; ')}.`);
    } else if (report.providerConsistencyStatus === 'partial') {
      parts.push('Sağlayıcı verilerinde kısmi uyuşmazlık var.');
    } else {
      parts.push('Sağlayıcı verileri tutarlı.');
    }

    if (report.missingFields.length > 0) {
      parts.push(`Eksik alanlar: ${report.missingFields.join(', ')}.`);
    }

    return parts.join(' ');
  }
}