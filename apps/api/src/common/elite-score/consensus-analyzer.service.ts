import { Injectable } from '@nestjs/common';
import {
  ConsensusInput,
  ConsensusOutput,
  TrendDirection,
  Timeframe,
  IndicatorData,
} from './types';

@Injectable()
export class ConsensusAnalyzer {
  analyze(input: ConsensusInput): ConsensusOutput {
    const indicatorAgreement = this.calculateIndicatorAgreement(input.indicators);
    const strategyAgreement = this.calculateStrategyAgreement(input.indicators);
    const timeframeAgreement = this.calculateTimeframeAgreement(input.timeframeScores);
    const trendConsistency = this.calculateTrendConsistency(input.timeframeScores);
    const signalStrength = this.calculateSignalStrength(input.indicators);
    const conflictCount = this.countConflicts(input.timeframeScores, input.indicators);
    const dominantDirection = this.determineDominantDirection(input.timeframeScores);

    const overallConsensus =
      indicatorAgreement * 0.30 +
      strategyAgreement * 0.20 +
      timeframeAgreement * 0.25 +
      trendConsistency * 0.15 +
      signalStrength * 0.10;

    return {
      indicatorAgreement,
      strategyAgreement,
      timeframeAgreement,
      trendConsistency,
      signalStrength,
      overallConsensus: this.clamp(overallConsensus),
      conflictCount,
      dominantDirection,
    };
  }

  private calculateIndicatorAgreement(indicators: IndicatorData[]): number {
    if (indicators.length === 0) return 0.5;

    const positiveCount = indicators.filter(i => i.isPositive).length;
    const total = indicators.length;
    const agreement = Math.abs(positiveCount - (total - positiveCount)) / total;

    return this.clamp(agreement);
  }

  private calculateStrategyAgreement(indicators: IndicatorData[]): number {
    if (indicators.length === 0) return 0.5;

    const trendIndicators = indicators.filter(i =>
      ['EMA', 'SMA', 'ADX', 'Ichimoku'].includes(i.name),
    );
    const momentumIndicators = indicators.filter(i =>
      ['RSI', 'MACD', 'Stochastic'].includes(i.name),
    );

    if (trendIndicators.length === 0 || momentumIndicators.length === 0) {
      return 0.5;
    }

    const trendDirection = this.getDominantDirection(trendIndicators);
    const momentumDirection = this.getDominantDirection(momentumIndicators);

    if (trendDirection === momentumDirection) return 0.8;
    if (trendDirection === 'neutral' || momentumDirection === 'neutral') return 0.6;
    return 0.3;
  }

  private calculateTimeframeAgreement(timeframeScores: any[]): number {
    if (timeframeScores.length < 2) return 0.5;

    const directions = timeframeScores.map(ts => this.getTimeframeDirection(ts));
    const uniqueDirections = new Set(directions);

    if (uniqueDirections.size === 1) return 1.0;
    if (uniqueDirections.size === 2) return 0.6;
    return 0.3;
  }

  private calculateTrendConsistency(timeframeScores: any[]): number {
    if (timeframeScores.length === 0) return 0.5;

    const scores = timeframeScores
      .filter(ts => ts.trendScore !== undefined)
      .map(ts => ts.trendScore);

    if (scores.length < 2) return 0.5;

    const variance = this.calculateVariance(scores);
    if (variance < 100) return 0.9;
    if (variance < 300) return 0.7;
    if (variance < 600) return 0.5;
    return 0.3;
  }

  private calculateSignalStrength(indicators: IndicatorData[]): number {
    if (indicators.length === 0) return 0.5;

    const totalWeight = indicators.reduce((sum, i) => sum + i.weight, 0);
    if (totalWeight === 0) return 0.5;

    const weightedAgreement = indicators.reduce((sum, i) => {
      return sum + (i.isPositive ? i.weight : -i.weight);
    }, 0);

    const normalizedStrength = Math.abs(weightedAgreement) / totalWeight;
    return this.clamp(normalizedStrength);
  }

  private countConflicts(timeframeScores: any[], indicators: IndicatorData[]): number {
    let conflicts = 0;

    const directions = timeframeScores.map(ts => this.getTimeframeDirection(ts));
    const uniqueDirections = new Set(directions);
    if (uniqueDirections.size > 1) conflicts += uniqueDirections.size - 1;

    const indicatorDirections = indicators.map(i => i.isPositive ? 'positive' : 'negative');
    const uniqueIndicatorDirs = new Set(indicatorDirections);
    if (uniqueIndicatorDirs.size > 1) conflicts += 1;

    return conflicts;
  }

  private determineDominantDirection(timeframeScores: any[]): TrendDirection {
    if (timeframeScores.length === 0) return TrendDirection.SIDEWAYS;

    const directions: TrendDirection[] = timeframeScores
      .map(ts => ts.trend)
      .filter((d): d is TrendDirection => d !== undefined);

    if (directions.length === 0) return TrendDirection.SIDEWAYS;

    const counts = new Map<TrendDirection, number>();
    for (const dir of directions) {
      counts.set(dir, (counts.get(dir) ?? 0) + 1);
    }

    let maxCount = 0;
    let dominant = TrendDirection.SIDEWAYS;
    for (const [dir, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        dominant = dir;
      }
    }

    return dominant;
  }

  private getDominantDirection(indicators: IndicatorData[]): 'positive' | 'negative' | 'neutral' {
    if (indicators.length === 0) return 'neutral';

    const positive = indicators.filter(i => i.isPositive).length;
    const negative = indicators.length - positive;

    if (positive > negative) return 'positive';
    if (negative > positive) return 'negative';
    return 'neutral';
  }

  private getTimeframeDirection(ts: any): 'bullish' | 'bearish' | 'neutral' {
    if (ts.trend !== undefined) {
      return ts.trend >= 60 ? 'bullish' : ts.trend <= 40 ? 'bearish' : 'neutral';
    }
    if (ts.trendScore !== undefined) {
      return ts.trendScore >= 60 ? 'bullish' : ts.trendScore <= 40 ? 'bearish' : 'neutral';
    }
    return 'neutral';
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }

  private clamp(value: number, min = 0, max = 1): number {
    return Math.max(min, Math.min(max, value));
  }
}
