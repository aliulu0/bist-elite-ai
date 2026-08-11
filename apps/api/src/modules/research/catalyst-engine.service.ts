import { Injectable } from '@nestjs/common';
import {
  VerificationResult,
  CatalystResultDto,
  CatalystDashboardDto,
  CatalystDirection,
  CatalystType,
  CatalystStrength,
  VerificationEvidence,
  VerificationStatusEnum,
} from './interfaces/verification.types';
import { normalizeTurkish } from './turkish-text.util';

interface CatalystPattern {
  type: CatalystType;
  direction: CatalystDirection;
  keywords: string[];
}

const CATALYST_PATTERNS: CatalystPattern[] = [
  { type: 'new_investment', direction: 'Bullish', keywords: ['yeni yatırım', 'new investment', 'yatırım planı'] },
  { type: 'government_tender', direction: 'Bullish', keywords: ['ihale', 'tender', 'sözleşme imzalandı'] },
  { type: 'export_contract', direction: 'Bullish', keywords: ['ihracat anlaşması', 'export contract', 'yurtdışı satış'] },
  { type: 'import_contract', direction: 'Neutral', keywords: ['ithalat anlaşması', 'import contract'] },
  { type: 'capacity_increase', direction: 'Bullish', keywords: ['kapasite artışı', 'capacity increase'] },
  { type: 'factory_opening', direction: 'Bullish', keywords: ['fabrika açılışı', 'factory opening', 'üretime başladı'] },
  { type: 'patent', direction: 'Bullish', keywords: ['patent', 'tescil'] },
  { type: 'rnd', direction: 'Neutral', keywords: ['ar-ge', 'r&d', 'araştırma geliştirme'] },
  { type: 'strategic_partnership', direction: 'Bullish', keywords: ['stratejik ortaklık', 'strategic partnership', 'iş birliği'] },
  { type: 'acquisition', direction: 'Bullish', keywords: ['satın alma', 'acquisition', 'devralma'] },
  { type: 'merger', direction: 'Neutral', keywords: ['birleşme', 'merger'] },
  { type: 'ceo_change', direction: 'Neutral', keywords: ['genel müdür ataması', 'ceo değişikliği', 'yönetim değişikliği'] },
  { type: 'board_change', direction: 'Neutral', keywords: ['yönetim kurulu değişikliği', 'board change'] },
  { type: 'dividend', direction: 'Bullish', keywords: ['temettü', 'dividend', 'kar payı'] },
  { type: 'bonus_issue', direction: 'Bullish', keywords: ['bedelsiz sermaye', 'bonus issue'] },
  { type: 'capital_increase', direction: 'Neutral', keywords: ['sermaye artırımı', 'capital increase', 'bedelli'] },
  { type: 'share_buyback', direction: 'Bullish', keywords: ['geri alım', 'buyback', 'hisse geri alımı'] },
  { type: 'spk_decision', direction: 'Neutral', keywords: ['spk kararı', 'sermaye piyasası kurulu'] },
  { type: 'credit_rating', direction: 'Bullish', keywords: ['kredi notu', 'credit rating', 'derecelendirme'] },
  { type: 'foreign_investment', direction: 'Bullish', keywords: ['yabancı yatırım', 'foreign investment'] },
  { type: 'legal_decision', direction: 'Unknown', keywords: ['mahkeme kararı', 'court decision', 'yargı'] },
  { type: 'tax_incentive', direction: 'Bullish', keywords: ['vergi teşviki', 'tax incentive'] },
  { type: 'sector_incentive', direction: 'Bullish', keywords: ['sektör teşviki', 'sector incentive'] },
  { type: 'government_support', direction: 'Bullish', keywords: ['devlet desteği', 'government support'] },
  { type: 'large_customer', direction: 'Bullish', keywords: ['büyük müşteri', 'major customer'] },
  { type: 'major_order', direction: 'Bullish', keywords: ['büyük sipariş', 'major order'] },
  { type: 'cancellation', direction: 'Bearish', keywords: ['iptal', 'cancellation', 'sözleşme feshi'] },
  { type: 'production_start', direction: 'Bullish', keywords: ['üretime başlama', 'production start'] },
  { type: 'production_stop', direction: 'Bearish', keywords: ['üretim durdurma', 'production stop'] },
  { type: 'raw_material_risk', direction: 'Bearish', keywords: ['hammadde riski', 'raw material'] },
  { type: 'currency_risk', direction: 'Bearish', keywords: ['kur riski', 'currency risk', 'döviz kuru riski'] },
];

@Injectable()
export class CatalystEngineService {
  verify(verificationResult: VerificationResult): CatalystResultDto[] {
    const now = new Date().toISOString();
    const results: CatalystResultDto[] = [];

    for (const entry of verificationResult.evidence) {
      const seen = new Set<CatalystType>();

      for (const source of entry.sources) {
        const text = normalizeTurkish(`${source.title} ${source.snippet ?? ''}`);

        for (const pattern of CATALYST_PATTERNS) {
          if (seen.has(pattern.type)) continue;
          if (!pattern.keywords.some((keyword) => text.includes(normalizeTurkish(keyword)))) continue;

          seen.add(pattern.type);
          results.push(this.toCatalyst(verificationResult, entry.id, source, pattern, now, entry.verifiedAt));
        }
      }
    }

    return results;
  }

  buildDashboard(catalysts: CatalystResultDto[]): CatalystDashboardDto {
    const bullish = catalysts.filter((c) => c.direction === 'Bullish').length;
    const bearish = catalysts.filter((c) => c.direction === 'Bearish').length;
    const neutral = catalysts.filter((c) => c.direction === 'Neutral').length;
    const unknown = catalysts.filter((c) => c.direction === 'Unknown').length;
    const averageStrength =
      catalysts.length > 0
        ? catalysts.reduce((sum, c) => sum + c.strength.score, 0) / catalysts.length
        : 0;
    const verifiedCatalysts = catalysts.filter(
      (c) => c.strength.verificationScore >= 0.7,
    ).length;

    return {
      totalCatalysts: catalysts.length,
      bullishCount: bullish,
      bearishCount: bearish,
      neutralCount: neutral,
      unknownCount: unknown,
      averageStrength,
      verifiedCatalysts,
      unverifiedCatalysts: catalysts.length - verifiedCatalysts,
      coverage: catalysts.length > 0 ? 1 : 0,
      lastDetectionDate: catalysts.length > 0 ? catalysts[catalysts.length - 1].detectedAt : '',
      catalysts,
    };
  }

  private toCatalyst(
    verificationResult: VerificationResult,
    entryId: string,
    source: VerificationEvidence,
    pattern: CatalystPattern,
    now: string,
    verifiedAt: string,
  ): CatalystResultDto {
    const direction = this.direction(pattern.direction, source.status);

    return {
      id: `cat-${verificationResult.ticker}-${pattern.type}-${this.hashId(source.url ?? entryId)}`,
      ticker: verificationResult.ticker,
      companyName: verificationResult.companyName,
      type: pattern.type,
      direction,
      strength: this.computeStrength(source),
      title: source.title,
      statement: source.snippet ?? `${pattern.type} detected for ${verificationResult.ticker}`,
      url: source.url,
      source: source.source,
      sourceType: source.sourceType,
      detectedAt: now,
      verifiedAt,
      verifiedBy: 'catalyst-engine',
    };
  }

  private direction(base: CatalystDirection, status: string): CatalystDirection {
    if (status === VerificationStatusEnum.False) return 'Bearish';
    if (status === VerificationStatusEnum.Unverified || status === VerificationStatusEnum.Conflicting) {
      return 'Unknown';
    }
    return base;
  }

  private computeStrength(source: VerificationEvidence): CatalystStrength {
    const verificationScore = source.status === VerificationStatusEnum.Verified ? 1 : source.confidence;
    const freshnessDays = source.publishedAt
      ? Math.max(0, (Date.now() - new Date(source.publishedAt).getTime()) / 86_400_000)
      : 7;
    const officialSource = source.status === VerificationStatusEnum.Verified;
    const score = Math.min(
      1,
      verificationScore * 0.5 +
        (officialSource ? 0.2 : 0) +
        Math.max(0, 0.3 - freshnessDays / 100),
    );

    return {
      score,
      officialSource,
      verificationScore,
      freshnessDays,
      multipleConfirmation: false,
      historicalImportance: source.priority > 0 ? (11 - source.priority) / 10 : 0.5,
    };
  }

  private hashId(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }
}
