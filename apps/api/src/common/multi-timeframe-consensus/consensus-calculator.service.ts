import { Injectable } from '@nestjs/common';
import {
  TimeframeData,
  Timeframe,
  TimeframeConsensusScore,
  ConsensusConfig,
  TrendDirection,
  VolumeState,
  getConsensusConfig,
} from './types';

@Injectable()
export class ConsensusCalculator {
  private readonly config: ConsensusConfig;

  constructor() {
    this.config = getConsensusConfig();
  }

  calculate(timeframes: TimeframeData[]): TimeframeConsensusScore[] {
    return timeframes.map((tf) => this.calculateTimeframeScore(tf, timeframes));
  }

  private calculateTimeframeScore(
    current: TimeframeData,
    allTimeframes: TimeframeData[],
  ): TimeframeConsensusScore {
    const trendAgreement = this.calculateTrendAgreement(current, allTimeframes);
    const momentumAgreement = this.calculateMomentumAgreement(current, allTimeframes);
    const volumeConfirmation = this.calculateVolumeConfirmation(current, allTimeframes);
    const riskAgreement = this.calculateRiskAgreement(current, allTimeframes);
    const indicatorAgreement = this.calculateIndicatorAgreement(current, allTimeframes);
    const strategyAgreement = this.calculateStrategyAgreement(current, allTimeframes);
    const srAlignment = this.calculateSRAlignment(current, allTimeframes);
    const signalTiming = this.calculateSignalTiming(current, allTimeframes);

    const rawScore =
      trendAgreement * 0.2 +
      momentumAgreement * 0.15 +
      volumeConfirmation * 0.15 +
      riskAgreement * 0.1 +
      indicatorAgreement * 0.15 +
      strategyAgreement * 0.1 +
      srAlignment * 0.08 +
      signalTiming * 0.07;

    const score = this.normalizeScore(rawScore * 100);
    const weight = this.config.timeframeWeights[current.timeframe] || 0.25;
    const confidence = this.calculateConfidence(current, allTimeframes);

    return {
      timeframe: current.timeframe,
      score,
      trendAgreement,
      momentumAgreement,
      volumeConfirmation,
      riskAgreement,
      indicatorAgreement,
      strategyAgreement,
      srAlignment,
      signalTiming,
      weightedContribution: score * weight,
      confidence,
    };
  }

  private calculateTrendAgreement(current: TimeframeData, allTimeframes: TimeframeData[]): number {
    const currentTrend = current.trend;
    if (!currentTrend) return 0.5;

    let agreementCount = 0;
    let totalWeight = 0;

    for (const tf of allTimeframes) {
      if (tf.timeframe === current.timeframe || !tf.trend) continue;
      const weight = this.config.timeframeWeights[tf.timeframe] || 0.25;
      totalWeight += weight;

      if (this.areTrendsAligned(currentTrend, tf.trend)) {
        agreementCount += weight;
      } else if (this.areTrendsOpposed(currentTrend, tf.trend)) {
        agreementCount -= weight * 0.5;
      }
    }

    if (totalWeight === 0) return 0.5;
    const rawAgreement = (agreementCount / totalWeight + 1) / 2;
    return Math.max(0, Math.min(1, rawAgreement));
  }

  private calculateMomentumAgreement(
    current: TimeframeData,
    allTimeframes: TimeframeData[],
  ): number {
    const currentMomentum = current.momentumScore;
    if (currentMomentum === undefined) return 0.5;

    let agreementSum = 0;
    let count = 0;

    for (const tf of allTimeframes) {
      if (tf.timeframe === current.timeframe || tf.momentumScore === undefined) continue;
      const diff = Math.abs(currentMomentum - tf.momentumScore);
      const agreement = Math.max(0, 1 - diff / 100);
      agreementSum += agreement;
      count++;
    }

    return count > 0 ? agreementSum / count : 0.5;
  }

  private calculateVolumeConfirmation(
    current: TimeframeData,
    allTimeframes: TimeframeData[],
  ): number {
    if (!current.volume) return 0.5;

    const isPositiveVolume = this.isPositiveVolumeState(current.volume);
    let confirmCount = 0;
    let count = 0;

    for (const tf of allTimeframes) {
      if (tf.timeframe === current.timeframe || !tf.volume) continue;
      count++;
      if (this.isPositiveVolumeState(tf.volume) === isPositiveVolume) {
        confirmCount++;
      }
    }

    return count > 0 ? confirmCount / count : 0.5;
  }

  private calculateRiskAgreement(current: TimeframeData, allTimeframes: TimeframeData[]): number {
    const currentRisk = current.riskScore;
    if (currentRisk === undefined) return 0.5;

    let agreementSum = 0;
    let count = 0;

    for (const tf of allTimeframes) {
      if (tf.timeframe === current.timeframe || tf.riskScore === undefined) continue;
      const diff = Math.abs(currentRisk - tf.riskScore);
      const agreement = Math.max(0, 1 - diff / 100);
      agreementSum += agreement;
      count++;
    }

    return count > 0 ? agreementSum / count : 0.5;
  }

  private calculateIndicatorAgreement(
    current: TimeframeData,
    allTimeframes: TimeframeData[],
  ): number {
    if (!current.indicators || current.indicators.length === 0) return 0.5;

    let positiveCount = 0;
    let negativeCount = 0;

    for (const ind of current.indicators) {
      if (ind.isPositive) positiveCount++;
      else negativeCount++;
    }

    const currentBias = positiveCount > negativeCount ? 1 : negativeCount > positiveCount ? -1 : 0;
    let agreementSum = 0;
    let count = 0;

    for (const tf of allTimeframes) {
      if (tf.timeframe === current.timeframe || !tf.indicators || tf.indicators.length === 0)
        continue;

      let tfPositive = 0;
      let tfNegative = 0;
      for (const ind of tf.indicators) {
        if (ind.isPositive) tfPositive++;
        else tfNegative++;
      }

      const tfBias = tfPositive > tfNegative ? 1 : tfNegative > tfPositive ? -1 : 0;
      count++;

      if (currentBias === tfBias) {
        agreementSum += 1;
      } else if (currentBias === 0 || tfBias === 0) {
        agreementSum += 0.5;
      }
    }

    return count > 0 ? agreementSum / count : 0.5;
  }

  private calculateStrategyAgreement(
    current: TimeframeData,
    allTimeframes: TimeframeData[],
  ): number {
    if (!current.strategySignal) return 0.5;

    const currentSignal = current.strategySignal;
    let agreementCount = 0;
    let count = 0;

    for (const tf of allTimeframes) {
      if (tf.timeframe === current.timeframe || !tf.strategySignal) continue;
      count++;
      if (tf.strategySignal === currentSignal) {
        agreementCount++;
      }
    }

    return count > 0 ? agreementCount / count : 0.5;
  }

  private calculateSRAlignment(current: TimeframeData, allTimeframes: TimeframeData[]): number {
    if (current.support === undefined || current.resistance === undefined) return 0.5;
    if (current.price === undefined) return 0.5;

    const range = current.resistance - current.support;
    if (range <= 0) return 0.5;

    const currentPosition = (current.price - current.support) / range;

    let alignmentSum = 0;
    let count = 0;

    for (const tf of allTimeframes) {
      if (tf.timeframe === current.timeframe) continue;
      if (tf.support === undefined || tf.resistance === undefined) continue;

      const tfRange = tf.resistance - tf.support;
      if (tfRange <= 0) continue;

      const tfPosition = (current.price - tf.support) / tfRange;
      const positionDiff = Math.abs(currentPosition - tfPosition);
      alignmentSum += Math.max(0, 1 - positionDiff);
      count++;
    }

    return count > 0 ? alignmentSum / count : 0.5;
  }

  private calculateSignalTiming(current: TimeframeData, allTimeframes: TimeframeData[]): number {
    if (!current.strategySignal || current.strategyConfidence === undefined) return 0.5;

    const currentConfidence = current.strategyConfidence;
    let timingScore = currentConfidence;

    const shorterTimeframes = allTimeframes.filter(
      (tf) => this.getTimeframeOrder(tf.timeframe) < this.getTimeframeOrder(current.timeframe),
    );

    const longerTimeframes = allTimeframes.filter(
      (tf) => this.getTimeframeOrder(tf.timeframe) > this.getTimeframeOrder(current.timeframe),
    );

    if (shorterTimeframes.length > 0) {
      const shorterSignals = shorterTimeframes.filter(
        (tf) => tf.strategySignal === current.strategySignal,
      );
      if (shorterSignals.length > 0) {
        timingScore += 0.15;
      }
    }

    if (longerTimeframes.length > 0) {
      const longerSignals = longerTimeframes.filter(
        (tf) => tf.strategySignal === current.strategySignal,
      );
      if (longerSignals.length > 0) {
        timingScore += 0.1;
      }
    }

    return Math.min(1, timingScore);
  }

  private calculateConfidence(current: TimeframeData, allTimeframes: TimeframeData[]): number {
    let dataCompleteness = 0;
    let totalFields = 6;
    let filledFields = 0;

    if (current.trend !== undefined) filledFields++;
    if (current.momentumScore !== undefined) filledFields++;
    if (current.volume !== undefined) filledFields++;
    if (current.riskScore !== undefined) filledFields++;
    if (current.indicators && current.indicators.length > 0) filledFields++;
    if (current.strategySignal !== undefined) filledFields++;

    dataCompleteness = filledFields / totalFields;

    let crossTimeframeSupport = 0;
    const supportingTimeframes = allTimeframes.filter(
      (tf) => tf.timeframe !== current.timeframe && tf.trend !== undefined,
    );
    if (supportingTimeframes.length > 0) {
      const alignedCount = supportingTimeframes.filter((tf) =>
        this.areTrendsAligned(current.trend!, tf.trend!),
      ).length;
      crossTimeframeSupport = alignedCount / supportingTimeframes.length;
    }

    return dataCompleteness * 0.5 + crossTimeframeSupport * 0.5;
  }

  private areTrendsAligned(a: TrendDirection, b: TrendDirection): boolean {
    const aDirection = this.getTrendDirection(a);
    const bDirection = this.getTrendDirection(b);
    return aDirection === bDirection;
  }

  private areTrendsOpposed(a: TrendDirection, b: TrendDirection): boolean {
    const aDirection = this.getTrendDirection(a);
    const bDirection = this.getTrendDirection(b);
    return (aDirection === 1 && bDirection === -1) || (aDirection === -1 && bDirection === 1);
  }

  private getTrendDirection(trend: TrendDirection): number {
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

  private isPositiveVolumeState(volume: VolumeState): boolean {
    return volume === VolumeState.HIGH_VOLUME || volume === VolumeState.INCREASING;
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

  private normalizeScore(raw: number): number {
    const { method, center, steepness } = this.config.normalization;
    switch (method) {
      case 'sigmoid': {
        const sigmoid = 1 / (1 + Math.exp(-steepness * (raw - center)));
        return sigmoid * 100;
      }
      case 'logistic': {
        const logistic = 100 / (1 + Math.exp(-0.1 * (raw - center)));
        return Math.max(0, Math.min(100, logistic));
      }
      case 'linear':
      default:
        return Math.max(0, Math.min(100, raw));
    }
  }
}
