import { Injectable } from '@nestjs/common';
import {
  TimeframeData,
  Timeframe,
  EarlyAlignment,
  ConsensusConfig,
  TrendDirection,
  getConsensusConfig,
} from './types';
import { getEarlyAlignmentDescription, getFalseConfirmWarning } from './turkish-terms';

@Injectable()
export class EarlyAlignmentService {
  private readonly config: ConsensusConfig;

  constructor() {
    this.config = getConsensusConfig();
  }

  detect(timeframes: TimeframeData[]): EarlyAlignment[] {
    const alignments: EarlyAlignment[] = [];

    for (const tf of timeframes) {
      const alignment = this.analyzeTimeframe(tf, timeframes);
      if (alignment) {
        alignments.push(alignment);
      }
    }

    return alignments.sort((a, b) => b.alignmentScore - a.alignmentScore);
  }

  private analyzeTimeframe(
    current: TimeframeData,
    allTimeframes: TimeframeData[],
  ): EarlyAlignment | null {
    const alignmentScore = this.calculateAlignmentScore(current, allTimeframes);
    const confirmationLevel = this.calculateConfirmationLevel(current, allTimeframes);
    const isLeading = this.isLeadingTimeframe(current, allTimeframes);
    const emergingIndicators = this.findEmergingIndicators(current, allTimeframes);
    const potentialFalseConfirm = this.checkFalseConfirmRisk(current, allTimeframes);

    if (alignmentScore < this.config.earlyAlignment.minAlignmentScore * 0.5) {
      return null;
    }

    const description = getEarlyAlignmentDescription(current.timeframe, alignmentScore, isLeading);

    return {
      timeframe: current.timeframe,
      alignmentScore,
      confirmationLevel,
      isLeading,
      emergingIndicators,
      potentialFalseConfirm,
      description,
      descriptionTr: description,
    };
  }

  private calculateAlignmentScore(current: TimeframeData, allTimeframes: TimeframeData[]): number {
    let score = 0;
    let factors = 0;

    if (current.trend !== undefined) {
      const trendAligned = allTimeframes
        .filter((tf) => tf.timeframe !== current.timeframe && tf.trend !== undefined)
        .filter((tf) => this.areTrendsAligned(current.trend!, tf.trend!)).length;

      const totalOthers = allTimeframes.filter(
        (tf) => tf.timeframe !== current.timeframe && tf.trend !== undefined,
      ).length;

      if (totalOthers > 0) {
        score += (trendAligned / totalOthers) * 30;
      }
      factors++;
    }

    if (current.momentumScore !== undefined) {
      const momentumAligned = allTimeframes
        .filter((tf) => tf.timeframe !== current.timeframe && tf.momentumScore !== undefined)
        .filter((tf) => {
          const diff = Math.abs(current.momentumScore! - tf.momentumScore!);
          return diff < 25;
        }).length;

      const totalMomentum = allTimeframes.filter(
        (tf) => tf.timeframe !== current.timeframe && tf.momentumScore !== undefined,
      ).length;

      if (totalMomentum > 0) {
        score += (momentumAligned / totalMomentum) * 25;
      }
      factors++;
    }

    if (current.indicators && current.indicators.length > 0) {
      const positiveRatio =
        current.indicators.filter((i) => i.isPositive).length / current.indicators.length;
      score += positiveRatio * 20;
      factors++;
    }

    if (current.strategySignal && current.strategyConfidence !== undefined) {
      score += current.strategyConfidence * 15;
      factors++;
    }

    if (current.volume) {
      const isPositiveVolume = current.volume === 'high_volume' || current.volume === 'increasing';
      score += isPositiveVolume ? 10 : 3;
      factors++;
    }

    return factors > 0 ? Math.min(100, score) : 0;
  }

  private calculateConfirmationLevel(
    current: TimeframeData,
    allTimeframes: TimeframeData[],
  ): number {
    let confirmations = 0;
    let totalChecks = 0;

    if (current.trend) {
      for (const tf of allTimeframes) {
        if (tf.timeframe === current.timeframe || !tf.trend) continue;
        totalChecks++;
        if (this.areTrendsAligned(current.trend, tf.trend)) {
          confirmations++;
        }
      }
    }

    if (current.strategySignal) {
      for (const tf of allTimeframes) {
        if (tf.timeframe === current.timeframe || !tf.strategySignal) continue;
        totalChecks++;
        if (tf.strategySignal === current.strategySignal) {
          confirmations++;
        }
      }
    }

    return totalChecks > 0 ? confirmations / totalChecks : 0.5;
  }

  private isLeadingTimeframe(current: TimeframeData, allTimeframes: TimeframeData[]): boolean {
    const tfOrder = this.getTimeframeOrder(current.timeframe);
    const shorterTimeframes = allTimeframes.filter(
      (tf) => this.getTimeframeOrder(tf.timeframe) < tfOrder,
    );

    if (shorterTimeframes.length === 0) return false;

    const hasEarlySignal = current.trend !== undefined && current.trend !== TrendDirection.SIDEWAYS;
    const shorterAligned = shorterTimeframes.filter(
      (tf) => tf.trend && this.areTrendsAligned(current.trend!, tf.trend),
    ).length;

    return hasEarlySignal && shorterAligned >= Math.ceil(shorterTimeframes.length / 2);
  }

  private findEmergingIndicators(current: TimeframeData, allTimeframes: TimeframeData[]): string[] {
    const emerging: string[] = [];

    if (current.indicators) {
      for (const ind of current.indicators) {
        if (ind.value > 70 || ind.value < 30) {
          const otherTFsWithIndicator = allTimeframes
            .filter((tf) => tf.timeframe !== current.timeframe && tf.indicators)
            .flatMap((tf) => tf.indicators!.filter((i) => i.name === ind.name));

          const notYetConfirmed = otherTFsWithIndicator.every(
            (i) => Math.abs(i.value - ind.value) > 15,
          );

          if (notYetConfirmed && otherTFsWithIndicator.length > 0) {
            emerging.push(ind.name);
          }
        }
      }
    }

    if (current.momentumScore !== undefined) {
      const isExtreme = current.momentumScore > 75 || current.momentumScore < 25;
      if (isExtreme) {
        const otherMomentum = allTimeframes
          .filter((tf) => tf.timeframe !== current.timeframe && tf.momentumScore !== undefined)
          .map((tf) => tf.momentumScore!);

        const notYetInExtreme = otherMomentum.every(
          (m) => Math.abs(m - current.momentumScore!) > 20,
        );
        if (notYetInExtreme && otherMomentum.length > 0) {
          emerging.push('Momentum');
        }
      }
    }

    return emerging;
  }

  private checkFalseConfirmRisk(current: TimeframeData, allTimeframes: TimeframeData[]): boolean {
    let riskFactors = 0;

    if (current.trendScore !== undefined && current.trendScore < 40) {
      riskFactors++;
    }

    if (current.volume === 'low_volume' || current.volume === 'declining') {
      riskFactors++;
    }

    if (current.riskScore !== undefined && current.riskScore > 60) {
      riskFactors++;
    }

    if (current.indicators) {
      const positive = current.indicators.filter((i) => i.isPositive).length;
      const total = current.indicators.length;
      if (total > 0 && positive / total < 0.5) {
        riskFactors++;
      }
    }

    const shorterTimeframes = allTimeframes.filter(
      (tf) => this.getTimeframeOrder(tf.timeframe) < this.getTimeframeOrder(current.timeframe),
    );

    if (shorterTimeframes.length > 0) {
      const shorterAgreeing = shorterTimeframes.filter(
        (tf) => tf.trend && current.trend && this.areTrendsAligned(tf.trend, current.trend),
      ).length;

      if (shorterAgreeing === 0) {
        riskFactors++;
      }
    }

    return riskFactors >= 3;
  }

  private areTrendsAligned(a: TrendDirection, b: TrendDirection): boolean {
    const aDir = this.getTrendValue(a);
    const bDir = this.getTrendValue(b);
    return aDir === bDir;
  }

  private getTrendValue(trend: TrendDirection): number {
    if (
      [TrendDirection.STRONG_UPTREND, TrendDirection.UPTREND, TrendDirection.WEAK_UPTREND].includes(
        trend,
      )
    )
      return 1;
    if (
      [
        TrendDirection.STRONG_DOWNTREND,
        TrendDirection.DOWNTREND,
        TrendDirection.WEAK_DOWNTREND,
      ].includes(trend)
    )
      return -1;
    return 0;
  }

  private getTimeframeOrder(timeframe: Timeframe): number {
    const order: Record<Timeframe, number> = {
      [Timeframe.M4]: 0,
      [Timeframe.D1]: 1,
      [Timeframe.W1]: 2,
      [Timeframe.M1]: 3,
    };
    return order[timeframe] ?? 0;
  }
}
