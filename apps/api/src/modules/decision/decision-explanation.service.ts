import { Injectable } from '@nestjs/common';
import { DecisionRule } from './decision-rules';
import {
  DecisionDimensionScores,
  DecisionInput,
  DecisionOverview,
  OverviewStarDimension,
  OverviewStarRating,
} from './decision.types';

export const MAX_STARS = 5;
export const FULL_STAR = '★';
export const EMPTY_STAR = '☆';

const DECISION_BASE_REASONS: Record<string, string> = {
  GUCLU_AL: 'Tüm göstergeler güçlü alım yönünde hizalanıyor',
  GUCLU_SAT: 'Göstergeler güçlü satış sinyali veriyor',
  RISKLI: 'Yüksek risk profili tespit edildi, temkinli olunmalı',
  AL: 'Genel görünüm alım yönünde',
  SAT: 'Zayıf göstergeler satış baskısına işaret ediyor',
  IZLE: 'Piyasa gelişmeleri yakından izlenmeli',
  BEKLE: 'Net sinyal bulunamadı, beklemek en doğrusu',
};

export function scoreToStars(score: number | null): number {
  if (score == null) {
    return 1;
  }
  if (score >= 80) {
    return 5;
  }
  if (score >= 60) {
    return 4;
  }
  if (score >= 40) {
    return 3;
  }
  if (score >= 20) {
    return 2;
  }
  return 1;
}

export function buildStarString(stars: number): string {
  const clamped = Math.max(1, Math.min(MAX_STARS, stars));
  return FULL_STAR.repeat(clamped) + EMPTY_STAR.repeat(MAX_STARS - clamped);
}

const STAR_DIMENSION_LABELS: Record<OverviewStarDimension, string> = {
  trend: 'Trend',
  momentum: 'Momentum',
  risk: 'Risk',
  verification: 'Doğrulama',
  catalyst: 'Katalizör',
  liquidity: 'Likidite',
  quality: 'Kalite',
};

const DIMENSION_POSITIVE: Array<[keyof DecisionDimensionScores, string]> = [
  ['technical', 'Güçlü teknik görünüm'],
  ['fundamental', 'Güçlü temel göstergeler'],
  ['momentum', 'Güçlü momentum'],
  ['trend', 'Güçlü trend'],
  ['liquidity', 'Yüksek likidite'],
  ['quality', 'Yüksek kalite'],
  ['verification', 'Güçlü doğrulama'],
  ['catalyst', 'Güçlü katalizör desteği'],
  ['volume', 'Hacim desteği güçlü'],
];

const DIMENSION_NEGATIVE: Array<[keyof DecisionDimensionScores, string]> = [
  ['technical', 'Zayıf teknik görünüm'],
  ['fundamental', 'Zayıf temel göstergeler'],
  ['momentum', 'Zayıf momentum'],
  ['trend', 'Zayıf trend'],
  ['liquidity', 'Zayıf likidite'],
  ['quality', 'Düşük kalite'],
  ['verification', 'Zayıf doğrulama'],
  ['catalyst', 'Katalizör desteği zayıf'],
  ['volume', 'Hacim desteği zayıf'],
];

function conditionReason(ruleId: string, field: string, value: number): string {
  switch (ruleId) {
    case 'GUCLU_AL':
      if (field === 'aiScore') return `AI skoru çok güçlü (${value})`;
      if (field === 'aiConfidence') return `Yüksek model güveni (${value}%)`;
      if (field === 'verification') return `Doğrulama puanı güçlü (${value})`;
      if (field === 'catalyst') return `Katalizör desteği mevcut (${value})`;
      break;
    case 'GUCLU_SAT':
      if (field === 'aiScore') return `AI skoru çok zayıf (${value})`;
      break;
    case 'RISKLI':
      if (field === 'risk') return `Risk puanı düşük (${value}), yüksek risk profili`;
      break;
    case 'AL':
      if (field === 'aiScore') return `AI skoru güçlü (${value})`;
      if (field === 'aiConfidence') return `Model güveni yeterli (${value}%)`;
      break;
    case 'SAT':
      if (field === 'aiScore') return `AI skoru zayıf (${value})`;
      break;
    case 'IZLE':
      if (field === 'aiScore') return `AI skoru orta seviyede (${value})`;
      break;
    default:
      break;
  }
  return '';
}

@Injectable()
export class DecisionExplanationService {
  buildReasons(rule: DecisionRule, input: DecisionInput): string[] {
    const reasons: string[] = [];
    const base = DECISION_BASE_REASONS[rule.id];
    if (base) {
      reasons.push(base);
    }
    for (const condition of rule.conditions ?? []) {
      const value = this.getFieldValue(input, condition.field);
      if (value == null) {
        continue;
      }
      const text = conditionReason(rule.id, condition.field, value);
      if (text && !reasons.includes(text)) {
        reasons.push(text);
      }
    }
    return reasons;
  }

  buildWarnings(input: DecisionInput): string[] {
    const warnings: string[] = [];
    const d = input.dimensions;

    const nullCount = Object.values(d).filter((v) => v == null).length;
    if (nullCount > 0) {
      warnings.push(
        `Veri eksikliği: ${nullCount} boyut hesaplanamadı, karar güveni etkilenebilir`,
      );
    }
    if (d.risk != null && d.risk <= 30) {
      warnings.push(`Yüksek risk profili (risk puanı ${d.risk})`);
    }
    if (d.liquidity != null && d.liquidity <= 30) {
      warnings.push(
        `Likidite zayıf (likidite puanı ${d.liquidity}), pozisyon yönetimi zorlaşabilir`,
      );
    }
    if (d.quality != null && d.quality <= 40) {
      warnings.push(`Şirket kalite puanı düşük (${d.quality})`);
    }
    if (d.verification != null && d.verification < 50) {
      warnings.push('Doğrulama zayıf, haber verileri sınırlı');
    }
    if (d.fundamental != null && d.fundamental <= 30) {
      warnings.push(`Temel göstergeler zayıf (${d.fundamental})`);
    }
    if (input.aiConfidence != null && input.aiConfidence < 50) {
      warnings.push(`Model güveni düşük (${input.aiConfidence}%)`);
    }
    return warnings;
  }

  buildPositiveSignals(input: DecisionInput): string[] {
    const signals: string[] = [];
    const d = input.dimensions;
    for (const [key, label] of DIMENSION_POSITIVE) {
      const value = d[key];
      if (value != null && value >= 70) {
        signals.push(label);
      }
    }
    if (d.risk != null && d.risk >= 70) {
      signals.push('Düşük risk profili');
    }
    return signals;
  }

  buildNegativeSignals(input: DecisionInput): string[] {
    const signals: string[] = [];
    const d = input.dimensions;
    for (const [key, label] of DIMENSION_NEGATIVE) {
      const value = d[key];
      if (value != null && value <= 40) {
        signals.push(label);
      }
    }
    if (d.risk != null && d.risk <= 40) {
      signals.push('Yüksek risk profili');
    }
    return signals;
  }

  buildOverview(input: DecisionInput): DecisionOverview {
    const ratings: OverviewStarRating[] = [];
    for (const dimension of this.starDimensions()) {
      const score = this.getDimensionScore(input, dimension);
      const stars = scoreToStars(score);
      ratings.push({
        dimension,
        label: STAR_DIMENSION_LABELS[dimension],
        stars,
        starString: buildStarString(stars),
      });
    }
    const totalStars = ratings.reduce((sum, r) => sum + r.stars, 0);
    const maxStars = ratings.length * MAX_STARS;
    return { ratings, totalStars, maxStars };
  }

  private starDimensions(): OverviewStarDimension[] {
    return ['trend', 'momentum', 'risk', 'verification', 'catalyst', 'liquidity', 'quality'];
  }

  private getDimensionScore(
    input: DecisionInput,
    dimension: OverviewStarDimension,
  ): number | null {
    const d = input.dimensions;
    switch (dimension) {
      case 'trend':
        return d.trend;
      case 'momentum':
        return d.momentum;
      case 'risk':
        return d.risk;
      case 'verification':
        return d.verification;
      case 'catalyst':
        return d.catalyst;
      case 'liquidity':
        return d.liquidity;
      case 'quality':
        return d.quality;
      default:
        return null;
    }
  }

  private getFieldValue(input: DecisionInput, field: string): number | null {
    const d = input.dimensions;
    switch (field) {
      case 'aiScore':
        return input.aiScore;
      case 'aiConfidence':
        return input.aiConfidence;
      case 'strategyScore':
        return input.strategyScore;
      case 'strategyConfidence':
        return input.strategyConfidence;
      case 'technical':
        return d.technical;
      case 'fundamental':
        return d.fundamental;
      case 'momentum':
        return d.momentum;
      case 'trend':
        return d.trend;
      case 'liquidity':
        return d.liquidity;
      case 'risk':
        return d.risk;
      case 'volume':
        return d.volume;
      case 'quality':
        return d.quality;
      case 'verification':
        return d.verification;
      case 'catalyst':
        return d.catalyst;
      default:
        return null;
    }
  }
}
