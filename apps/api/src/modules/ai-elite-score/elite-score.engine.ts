import { Injectable } from '@nestjs/common';
import { OpportunityResult } from '../ai-opportunity/opportunity.types';
import {
  DIMENSION_LABELS,
  ELITE_SCORE_DIMENSIONS,
  HORIZON_META,
  HORIZON_WEIGHTS,
  EliteScoreDimension,
} from './elite-score.config';
import {
  EliteScoreHorizon,
  EliteScoreHorizonResult,
  EliteScoreResult,
  ELITE_SCORE_HORIZONS,
} from './elite-score.types';

interface Contribution {
  dimension: EliteScoreDimension;
  label: string;
  value: number;
}

@Injectable()
export class EliteScoreEngine {
  evaluate(result: OpportunityResult): EliteScoreResult {
    const horizons = ELITE_SCORE_HORIZONS.map((h) => this.evaluateHorizon(h, result));
    return {
      ticker: result.ticker,
      company: result.company,
      horizons,
      dominantStrategyId: result.strategyId,
      dominantStrategyName: result.strategyName,
      dominantSignals: this.buildDominantSignals(result),
      decision: result.decision,
      decisionLabel: result.decisionLabel,
      opportunityLevel: result.level,
      evaluatedAt: new Date().toISOString(),
    };
  }

  private evaluateHorizon(
    horizon: EliteScoreHorizon,
    result: OpportunityResult,
  ): EliteScoreHorizonResult {
    const weights = HORIZON_WEIGHTS[horizon];
    let numerator = 0;
    let denominator = 0;
    const contributions: Contribution[] = [];

    for (const dimension of ELITE_SCORE_DIMENSIONS) {
      const value = this.dimensionValue(result, dimension);
      const weight = weights[dimension];
      if (value != null && weight > 0) {
        numerator += value * weight;
        denominator += weight;
        contributions.push({
          dimension,
          label: DIMENSION_LABELS[dimension],
          value,
        });
      }
    }

    const skor = denominator > 0 ? Math.round(numerator / denominator) : 0;
    const confidence = this.horizonConfidence(result);

    return {
      horizon,
      etiket: HORIZON_META[horizon].etiket,
      skor,
      confidence,
      reasons: this.buildReasons(horizon, skor, result, contributions),
      warnings: this.buildWarnings(result),
    };
  }

  private buildReasons(
    horizon: EliteScoreHorizon,
    skor: number,
    result: OpportunityResult,
    contributions: Contribution[],
  ): string[] {
    const reasons: string[] = [];
    reasons.push(`${HORIZON_META[horizon].etiket} Elite Skor: ${skor}/100`);
    reasons.push(`Karar: ${result.decisionLabel}`);
    reasons.push(`Fırsat: ${result.levelLabel}`);
    const top = [...contributions]
      .sort((a, b) => b.value - a.value)
      .slice(0, 2);
    for (const c of top) {
      reasons.push(`${c.label} katkısı güçlü (${c.value})`);
    }
    return reasons;
  }

  private buildWarnings(result: OpportunityResult): string[] {
    const warnings = [...(result.warnings ?? [])];
    const dims = [
      result.verification,
      result.catalyst,
      result.momentum,
      result.trend,
      result.liquidity,
      result.quality,
      result.technical,
      result.fundamental,
      result.risk,
    ];
    const nullCount = dims.filter((v) => v == null).length;
    if (nullCount > 0) {
      warnings.push(
        `Veri eksikliği: ${nullCount} boyut hesaplanamadı, Elite skor etkilenebilir`,
      );
    }
    return warnings;
  }

  private horizonConfidence(result: OpportunityResult): number {
    const present = [
      result.aiConfidence,
      result.decisionConfidence,
      result.confidence,
    ].filter((v): v is number => v != null);
    if (present.length === 0) {
      return 0;
    }
    return Math.round(present.reduce((a, b) => a + b, 0) / present.length);
  }

  private buildDominantSignals(result: OpportunityResult): string[] {
    const signals: string[] = [];
    for (const dimension of ELITE_SCORE_DIMENSIONS) {
      const value = this.dimensionValue(result, dimension);
      if (value != null && value >= 70) {
        signals.push(`${DIMENSION_LABELS[dimension]} güçlü (${value})`);
      }
    }
    for (const signal of result.positiveSignals ?? []) {
      if (signals.length >= 5) {
        break;
      }
      if (!signals.includes(signal)) {
        signals.push(signal);
      }
    }
    return signals.slice(0, 5);
  }

  private dimensionValue(
    result: OpportunityResult,
    dimension: EliteScoreDimension,
  ): number | null {
    switch (dimension) {
      case 'aiScore':
        return result.aiScore;
      case 'decisionScore':
        return result.decisionScore;
      case 'opportunityScore':
        return result.opportunityScore;
      case 'strategyScore':
        return result.strategyScore;
      case 'verification':
        return result.verification;
      case 'catalyst':
        return result.catalyst;
      case 'technical':
        return result.technical;
      case 'fundamental':
        return result.fundamental;
      case 'momentum':
        return result.momentum;
      case 'trend':
        return result.trend;
      case 'liquidity':
        return result.liquidity;
      case 'quality':
        return result.quality;
      case 'risk':
        return result.risk;
      default:
        return null;
    }
  }
}
