import { Injectable } from '@nestjs/common';
import { DetectionModuleResult, PenaltyRecord } from '../opportunity-detection.types';
import { DetectionModuleWeights, PenaltyConfig } from '../opportunity-detection.config';

@Injectable()
export class ScoreCalculator {
  calculateWeightedScore(
    moduleResults: DetectionModuleResult[],
    weights: DetectionModuleWeights,
  ): number {
    const weightMap = this.buildWeightMap(weights);
    let totalWeight = 0;
    let weightedSum = 0;

    for (const result of moduleResults) {
      const weight = weightMap[result.module] ?? 0;
      if (weight > 0) {
        weightedSum += result.score * weight;
        totalWeight += weight;
      }
    }

    if (totalWeight === 0) return 0;
    return Math.round((weightedSum / totalWeight) * 100) / 100;
  }

  applyPenalties(score: number, penalties: PenaltyRecord[]): number {
    let adjusted = score;
    for (const penalty of penalties) {
      adjusted -= penalty.amount;
    }
    return Math.max(0, Math.min(100, adjusted));
  }

  private buildWeightMap(weights: DetectionModuleWeights): Record<string, number> {
    return {
      priceStructure: weights.priceStructure,
      volumeBehaviour: weights.volumeBehaviour,
      momentumShift: weights.momentumShift,
      trendTransition: weights.trendTransition,
      movingAverageStructure: weights.movingAverageStructure,
      rsiBehaviour: weights.rsiBehaviour,
      macdBehaviour: weights.macdBehaviour,
      atrExpansion: weights.atrExpansion,
      volatilityCompression: weights.volatilityCompression,
      liquidityImprovement: weights.liquidityImprovement,
      relativeStrength: weights.relativeStrength,
      sectorStrength: weights.sectorStrength,
      fundamentalChange: weights.fundamentalChange,
      valuationDiscount: weights.valuationDiscount,
      financialQuality: weights.financialQuality,
      cashFlowImprovement: weights.cashFlowImprovement,
      debtImprovement: weights.debtImprovement,
      growthAcceleration: weights.growthAcceleration,
      institutionalInterest: weights.institutionalInterest,
      compositeOpportunity: weights.compositeOpportunity,
    };
  }
}
