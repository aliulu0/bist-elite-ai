import { Injectable } from '@nestjs/common';
import { ModuleResult } from './ai-analysis.types';
import { ModuleWeightConfig, DEFAULT_WEIGHTS } from './config/ai-analysis.config';

@Injectable()
export class ScoreAggregator {
  calculateOverallScore(moduleResults: ModuleResult[], weights: ModuleWeightConfig = DEFAULT_WEIGHTS): number {
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

  getModuleContributions(moduleResults: ModuleResult[], weights: ModuleWeightConfig): Array<{ module: string; score: number; weight: number; contribution: number }> {
    const weightMap = this.buildWeightMap(weights);
    let totalWeight = 0;

    for (const result of moduleResults) {
      const weight = weightMap[result.module] ?? 0;
      totalWeight += weight;
    }

    if (totalWeight === 0) return [];

    return moduleResults.map((result) => {
      const weight = weightMap[result.module] ?? 0;
      const contribution = totalWeight > 0 ? (result.score * weight) / totalWeight : 0;
      return {
        module: result.module,
        score: result.score,
        weight,
        contribution: Math.round(contribution * 100) / 100,
      };
    });
  }

  private buildWeightMap(weights: ModuleWeightConfig): Record<string, number> {
    return {
      technical: weights.technical,
      fundamental: weights.fundamental,
      financialHealth: weights.financialHealth,
      growth: weights.growth,
      momentum: weights.momentum,
      risk: weights.risk,
      liquidity: weights.liquidity,
      volatility: weights.volatility,
      trend: weights.trend,
      valuation: weights.valuation,
    };
  }
}
