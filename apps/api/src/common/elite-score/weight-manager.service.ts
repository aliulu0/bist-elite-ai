import { Injectable } from '@nestjs/common';
import {
  ScoringProfile,
  ScoreComponentWeights,
  ScoringConfig,
  Timeframe,
  getScoringConfig,
} from './types';

@Injectable()
export class WeightManager {
  private readonly config: ScoringConfig;

  constructor(configOverrides?: Partial<ScoringConfig>) {
    this.config = getScoringConfig(configOverrides);
  }

  getConfig(): ScoringConfig {
    return { ...this.config };
  }

  getWeights(profile: ScoringProfile): ScoreComponentWeights {
    return { ...this.config.profiles[profile] };
  }

  getTimeframeWeights(): Record<Timeframe, number> {
    return { ...this.config.timeframeWeights };
  }

  getTimeframeWeight(timeframe: Timeframe): number {
    return this.config.timeframeWeights[timeframe] ?? 0.25;
  }

  applyRiskAdjustment(score: number, adjustmentFactor: number): number {
    const adjusted = score * adjustmentFactor;
    return Math.max(
      this.config.scoreRange.min,
      Math.min(this.config.scoreRange.max, adjusted),
    );
  }

  normalizeScore(raw: number): number {
    const { method, center, steepness } = this.config.normalization;
    const { min, max } = this.config.scoreRange;

    switch (method) {
      case 'sigmoid': {
        const sigmoid = 1 / (1 + Math.exp(-steepness * (raw - center)));
        return min + sigmoid * (max - min);
      }
      case 'logistic': {
        const logistic = max / (1 + Math.exp(-0.1 * (raw - center)));
        return Math.max(min, Math.min(max, logistic));
      }
      case 'linear':
      default: {
        return Math.max(min, Math.min(max, raw));
      }
    }
  }

  computeWeightedScore(scores: Record<string, number>, weights: ScoreComponentWeights): number {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const [component, weight] of Object.entries(weights) as Array<[string, number]>) {
      const score = scores[component];
      if (score !== undefined && !isNaN(score)) {
        weightedSum += score * weight;
        totalWeight += weight;
      }
    }

    if (totalWeight === 0) return 0;
    return weightedSum / totalWeight;
  }
}
