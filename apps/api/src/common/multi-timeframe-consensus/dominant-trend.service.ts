import { Injectable } from '@nestjs/common';
import {
  TimeframeData,
  Timeframe,
  TrendInfo,
  TrendDirection,
  ConsensusConfig,
  getConsensusConfig,
} from './types';
import { TREND_DIRECTION_TR, getTimeframeLabel, getStrengthLabel } from './turkish-terms';

@Injectable()
export class DominantTrendService {
  private readonly config: ConsensusConfig;

  constructor() {
    this.config = getConsensusConfig();
  }

  analyze(timeframes: TimeframeData[]): {
    dominant: TrendInfo;
    secondary: TrendInfo;
    shortTerm: TrendDirection;
    mediumTerm: TrendDirection;
    longTerm: TrendDirection;
    trendStrength: number;
  } {
    const trendDistribution = this.buildTrendDistribution(timeframes);
    const dominantDirection = this.findDominantDirection(trendDistribution);
    const secondaryDirection = this.findSecondaryDirection(trendDistribution, dominantDirection);

    const dominant = this.buildTrendInfo(dominantDirection, timeframes, 'dominant');
    const secondary = this.buildTrendInfo(secondaryDirection, timeframes, 'secondary');

    const shortTerm = this.resolveTermDirection(timeframes, [Timeframe.M4, Timeframe.D1]);
    const mediumTerm = this.resolveTermDirection(timeframes, [Timeframe.D1, Timeframe.W1]);
    const longTerm = this.resolveTermDirection(timeframes, [Timeframe.W1, Timeframe.M1]);

    const trendStrength = this.calculateTrendStrength(timeframes, dominantDirection);

    return {
      dominant,
      secondary,
      shortTerm,
      mediumTerm,
      longTerm,
      trendStrength,
    };
  }

  private buildTrendDistribution(timeframes: TimeframeData[]): Map<TrendDirection, number> {
    const distribution = new Map<TrendDirection, number>();

    for (const tf of timeframes) {
      if (!tf.trend) continue;
      const weight = this.config.timeframeWeights[tf.timeframe] || 0.25;
      distribution.set(tf.trend, (distribution.get(tf.trend) || 0) + weight);
    }

    return distribution;
  }

  private findDominantDirection(distribution: Map<TrendDirection, number>): TrendDirection {
    let maxWeight = 0;
    let dominant = TrendDirection.SIDEWAYS;

    for (const [direction, weight] of distribution) {
      if (weight > maxWeight) {
        maxWeight = weight;
        dominant = direction;
      }
    }

    return dominant;
  }

  private findSecondaryDirection(
    distribution: Map<TrendDirection, number>,
    exclude: TrendDirection,
  ): TrendDirection {
    let maxWeight = 0;
    let secondary = TrendDirection.SIDEWAYS;

    for (const [direction, weight] of distribution) {
      if (direction === exclude) continue;
      if (weight > maxWeight) {
        maxWeight = weight;
        secondary = direction;
      }
    }

    return secondary;
  }

  private buildTrendInfo(
    direction: TrendDirection,
    timeframes: TimeframeData[],
    type: 'dominant' | 'secondary',
  ): TrendInfo {
    const supportingTimeframes = timeframes.filter((tf) => tf.trend === direction);
    const strength = this.calculateDirectionStrength(direction, supportingTimeframes);
    const confidence = this.calculateDirectionConfidence(direction, timeframes);
    const indicators = this.extractSupportingIndicators(supportingTimeframes);

    return {
      direction,
      strength,
      confidence,
      timeframe: supportingTimeframes[0]?.timeframe || Timeframe.D1,
      description: `${TREND_DIRECTION_TR[direction]} (${getStrengthLabel(strength)}) - ${type === 'dominant' ? 'Birincil' : 'Ikincil'} trend`,
      indicators,
    };
  }

  private calculateDirectionStrength(
    direction: TrendDirection,
    supportingTfs: TimeframeData[],
  ): number {
    if (supportingTfs.length === 0) return 0;

    let totalStrength = 0;
    let count = 0;

    for (const tf of supportingTfs) {
      if (tf.trendScore !== undefined) {
        totalStrength += tf.trendScore;
        count++;
      }
    }

    const baseStrength = count > 0 ? totalStrength / count : 50;
    const tfBonus = Math.min(20, supportingTfs.length * 5);

    return Math.min(100, baseStrength + tfBonus);
  }

  private calculateDirectionConfidence(
    direction: TrendDirection,
    allTimeframes: TimeframeData[],
  ): number {
    const total = allTimeframes.filter((tf) => tf.trend).length;
    if (total === 0) return 0;

    const supporting = allTimeframes.filter((tf) => tf.trend === direction).length;
    const alignment = supporting / total;

    let strengthBonus = 0;
    if (
      direction === TrendDirection.STRONG_UPTREND ||
      direction === TrendDirection.STRONG_DOWNTREND
    ) {
      strengthBonus = 0.1;
    }

    return Math.min(1, alignment * 0.7 + strengthBonus + 0.15);
  }

  private extractSupportingIndicators(timeframes: TimeframeData[]): string[] {
    const indicators = new Set<string>();

    for (const tf of timeframes) {
      if (tf.indicators) {
        for (const ind of tf.indicators) {
          indicators.add(ind.name);
        }
      }
      if (tf.trend) indicators.add('Trend');
      if (tf.momentum) indicators.add('Momentum');
      if (tf.volume) indicators.add('Volume');
    }

    return Array.from(indicators);
  }

  private resolveTermDirection(
    timeframes: TimeframeData[],
    preferredTimeframes: Timeframe[],
  ): TrendDirection {
    for (const preferred of preferredTimeframes) {
      const tf = timeframes.find((t) => t.timeframe === preferred);
      if (tf?.trend) return tf.trend;
    }

    const available = timeframes.filter((tf) => tf.trend);
    if (available.length === 0) return TrendDirection.SIDEWAYS;

    return available[0].trend!;
  }

  private calculateTrendStrength(
    timeframes: TimeframeData[],
    dominantDirection: TrendDirection,
  ): number {
    const alignedTimeframes = timeframes.filter((tf) => tf.trend === dominantDirection);
    if (alignedTimeframes.length === 0) return 0;

    let strengthSum = 0;
    let count = 0;

    for (const tf of alignedTimeframes) {
      if (tf.trendScore !== undefined) {
        strengthSum += tf.trendScore;
        count++;
      }
    }

    const baseScore = count > 0 ? strengthSum / count : 50;
    const alignmentBonus = (alignedTimeframes.length / Math.max(1, timeframes.length)) * 30;

    return Math.min(100, baseScore + alignmentBonus);
  }
}
