import { Injectable } from '@nestjs/common';
import {
  HistoricalReliabilityInput,
  HistoricalReliabilityOutput,
  ScoringConfig,
  getScoringConfig,
} from './types';

@Injectable()
export class HistoricalReliabilityAnalyzer {
  private readonly config: ScoringConfig['historicalReliability'];

  constructor(configOverrides?: Partial<ScoringConfig>) {
    const config = getScoringConfig(configOverrides);
    this.config = config.historicalReliability;
  }

  analyze(input: HistoricalReliabilityInput): HistoricalReliabilityOutput {
    const winRateScore = this.scoreWinRate(input.winRate);
    const drawdownScore = this.scoreDrawdown(input.maxDrawdown);
    const returnScore = this.scoreReturn(input.avgReturn);
    const consistencyScore = this.scoreConsistency(input.sharpeRatio, input.sortinoRatio);
    const precisionScore = this.scorePrecision(input.precision);
    const recallScore = this.scoreRecall(input.recall);
    const profitFactorScore = this.scoreProfitFactor(input.profitFactor);

    const weighted =
      winRateScore * this.config.winRateWeight +
      drawdownScore * this.config.drawdownWeight +
      returnScore * this.config.returnWeight +
      consistencyScore * this.config.consistencyWeight +
      precisionScore * this.config.precisionWeight +
      recallScore * this.config.recallWeight +
      profitFactorScore * this.config.profitFactorWeight;

    const score = this.clamp(weighted);
    const overallReliability = this.getReliabilityLabel(score);

    return {
      score,
      winRateScore,
      drawdownScore,
      returnScore,
      consistencyScore,
      precisionScore,
      recallScore,
      profitFactorScore,
      overallReliability,
    };
  }

  private scoreWinRate(winRate?: number): number {
    if (winRate === undefined) return 50;
    if (winRate >= 70) return 90;
    if (winRate >= 60) return 75;
    if (winRate >= 50) return 60;
    if (winRate >= 40) return 45;
    return 30;
  }

  private scoreDrawdown(maxDrawdown?: number): number {
    if (maxDrawdown === undefined) return 50;
    if (maxDrawdown <= 5) return 90;
    if (maxDrawdown <= 10) return 75;
    if (maxDrawdown <= 20) return 60;
    if (maxDrawdown <= 30) return 45;
    return 30;
  }

  private scoreReturn(avgReturn?: number): number {
    if (avgReturn === undefined) return 50;
    if (avgReturn >= 20) return 90;
    if (avgReturn >= 10) return 75;
    if (avgReturn >= 5) return 60;
    if (avgReturn >= 0) return 50;
    if (avgReturn >= -5) return 40;
    return 25;
  }

  private scoreConsistency(sharpe?: number, sortino?: number): number {
    let score = 50;
    if (sharpe !== undefined) {
      if (sharpe >= 2.0) score += 20;
      else if (sharpe >= 1.0) score += 10;
      else if (sharpe < 0) score -= 15;
    }
    if (sortino !== undefined) {
      if (sortino >= 2.5) score += 15;
      else if (sortino >= 1.5) score += 8;
      else if (sortino < 0) score -= 10;
    }
    return this.clamp(score);
  }

  private scorePrecision(precision?: number): number {
    if (precision === undefined) return 50;
    return this.clamp(precision * 100);
  }

  private scoreRecall(recall?: number): number {
    if (recall === undefined) return 50;
    return this.clamp(recall * 100);
  }

  private scoreProfitFactor(profitFactor?: number): number {
    if (profitFactor === undefined) return 50;
    if (profitFactor >= 3.0) return 90;
    if (profitFactor >= 2.0) return 75;
    if (profitFactor >= 1.5) return 65;
    if (profitFactor >= 1.0) return 55;
    if (profitFactor >= 0.7) return 40;
    return 25;
  }

  private getReliabilityLabel(score: number): string {
    if (score >= 80) return 'Çok Yüksek Güvenilirlik';
    if (score >= 65) return 'Yüksek Güvenilirlik';
    if (score >= 50) return 'Orta Güvenilirlik';
    if (score >= 35) return 'Düşük Güvenilirlik';
    return 'Çok Düşük Güvenilirlik';
  }

  private clamp(value: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, value));
  }
}
