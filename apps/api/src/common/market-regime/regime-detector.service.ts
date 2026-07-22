import { Injectable } from '@nestjs/common';
import {
  MarketRegimeType,
  RegimeInput,
  RegimeIndicator,
  RegimeClassification,
  RegimeFactor,
  RegimeTimeframe,
  MARKET_REGIME_CONFIG_DEFAULTS,
  MarketRegimeConfig,
  createRegimeClassification,
} from './types';

@Injectable()
export class RegimeDetectorService {
  private config: MarketRegimeConfig = { ...MARKET_REGIME_CONFIG_DEFAULTS };

  classifyRegime(input: RegimeInput): RegimeClassification {
    const { regimeType, scores } = this.determineRegimeType(input);
    const confidence = this.calculateConfidence(input.indicators || []);
    const agreementScore = this.calculateAgreement(input.indicators || []);
    const conflictScore = this.calculateConflict(input.indicators || []);
    const stabilityScore = input.breadthScore !== undefined
      ? this.calculateStability([input.trendScore, input.momentumScore, input.volumeScore, input.volatilityScore, input.breadthScore])
      : this.calculateStability([input.trendScore, input.momentumScore, input.volumeScore, input.volatilityScore]);
    const factors = this.buildFactors(input, scores);

    return createRegimeClassification(
      regimeType,
      confidence,
      agreementScore,
      conflictScore,
      stabilityScore,
      factors,
    );
  }

  calculateConfidence(indicators: RegimeIndicator[]): number {
    if (indicators.length === 0) return 0.5;

    const totalWeight = indicators.reduce((sum, ind) => sum + ind.weight, 0);
    if (totalWeight === 0) return 0.5;

    const signalCounts: Record<string, number> = {};
    let weightedSignalCounts: Record<string, number> = {};

    for (const ind of indicators) {
      signalCounts[ind.signal] = (signalCounts[ind.signal] || 0) + 1;
      weightedSignalCounts[ind.signal] =
        (weightedSignalCounts[ind.signal] || 0) + ind.weight;
    }

    const maxWeightedSignal = Math.max(...Object.values(weightedSignalCounts));
    const agreement = maxWeightedSignal / totalWeight;

    return Math.min(1, Math.max(0, agreement));
  }

  calculateAgreement(indicators: RegimeIndicator[]): number {
    if (indicators.length === 0) return 0;

    const signalCounts: Record<string, number> = {};
    for (const ind of indicators) {
      signalCounts[ind.signal] = (signalCounts[ind.signal] || 0) + 1;
    }

    const maxCount = Math.max(...Object.values(signalCounts));
    return maxCount / indicators.length;
  }

  calculateConflict(indicators: RegimeIndicator[]): number {
    if (indicators.length === 0) return 0;

    const signalCounts: Record<string, number> = {};
    for (const ind of indicators) {
      signalCounts[ind.signal] = (signalCounts[ind.signal] || 0) + 1;
    }

    const signals = Object.keys(signalCounts);
    if (signals.length <= 1) return 0;

    const counts = Object.values(signalCounts).sort((a, b) => b - a);
    const maxCount = counts[0];
    const conflictingCount = counts.slice(1).reduce((sum, c) => sum + c, 0);

    return conflictingCount / indicators.length;
  }

  calculateStability(values: number[]): number {
    if (values.length < 2) return 1;

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return Math.max(0, 1 - stdDev);
  }

  determineRegimeType(input: RegimeInput): {
    regimeType: MarketRegimeType;
    scores: Record<string, number>;
  } {
    const weights = this.config.weights;
    const compositeScore =
      input.trendScore * weights.trend +
      input.momentumScore * weights.momentum +
      input.volumeScore * weights.volume +
      input.volatilityScore * weights.volatility +
      (input.breadthScore || 0.5) * weights.breadth;

    const volThreshold = this.config.regimeThresholds;

    if (input.volatilityScore >= volThreshold.highVolatility) {
      if (compositeScore > 0.3) return { regimeType: MarketRegimeType.HIGH_VOLATILITY, scores: { composite: compositeScore, volatility: input.volatilityScore } };
      if (compositeScore < -0.3) return { regimeType: MarketRegimeType.HIGH_VOLATILITY, scores: { composite: compositeScore, volatility: input.volatilityScore } };
      return { regimeType: MarketRegimeType.HIGH_VOLATILITY, scores: { composite: compositeScore, volatility: input.volatilityScore } };
    }

    if (input.volatilityScore <= volThreshold.lowVolatility) {
      return { regimeType: MarketRegimeType.LOW_VOLATILITY, scores: { composite: compositeScore, volatility: input.volatilityScore } };
    }

    if (compositeScore >= volThreshold.strongBull) {
      return { regimeType: MarketRegimeType.STRONG_BULL, scores: { composite: compositeScore } };
    }
    if (compositeScore >= volThreshold.bull) {
      return { regimeType: MarketRegimeType.BULL, scores: { composite: compositeScore } };
    }
    if (compositeScore >= volThreshold.weakBull) {
      return { regimeType: MarketRegimeType.WEAK_BULL, scores: { composite: compositeScore } };
    }
    if (compositeScore <= volThreshold.strongBear) {
      return { regimeType: MarketRegimeType.STRONG_BEAR, scores: { composite: compositeScore } };
    }
    if (compositeScore <= volThreshold.bear) {
      return { regimeType: MarketRegimeType.BEAR, scores: { composite: compositeScore } };
    }
    if (compositeScore <= volThreshold.weakBear) {
      return { regimeType: MarketRegimeType.WEAK_BEAR, scores: { composite: compositeScore } };
    }

    return { regimeType: MarketRegimeType.SIDEWAYS, scores: { composite: compositeScore } };
  }

  private buildFactors(input: RegimeInput, scores: Record<string, number>): RegimeFactor[] {
    const weights = this.config.weights;
    const factors: RegimeFactor[] = [
      {
        factor: 'Trend',
        value: input.trendScore,
        weight: weights.trend,
        contribution: input.trendScore * weights.trend,
        description: input.trendScore > 0.5 ? 'Guclu yukari trend' : input.trendScore < -0.5 ? 'Guclu asagi trend' : 'Zayif trend',
      },
      {
        factor: 'Momentum',
        value: input.momentumScore,
        weight: weights.momentum,
        contribution: input.momentumScore * weights.momentum,
        description: input.momentumScore > 0.5 ? 'Yuksek momentum' : input.momentumScore < -0.5 ? 'Dusuk momentum' : 'Normal momentum',
      },
      {
        factor: 'Hacim',
        value: input.volumeScore,
        weight: weights.volume,
        contribution: input.volumeScore * weights.volume,
        description: input.volumeScore > 0.5 ? 'Yuksek islem hacmi' : input.volumeScore < -0.5 ? 'Dusuk islem hacmi' : 'Normal hacim',
      },
      {
        factor: 'Volatilite',
        value: input.volatilityScore,
        weight: weights.volatility,
        contribution: input.volatilityScore * weights.volatility,
        description: input.volatilityScore > 0.7 ? 'Cok yuksek volatilite' : input.volatilityScore < 0.3 ? 'Cok dusuk volatilite' : 'Normal volatilite',
      },
    ];

    if (input.breadthScore !== undefined) {
      factors.push({
        factor: 'Genislik',
        value: input.breadthScore,
        weight: weights.breadth,
        contribution: input.breadthScore * weights.breadth,
        description: input.breadthScore > 0.5 ? 'Genis piyasa destegi' : input.breadthScore < 0.5 ? 'Dar piyasa destegi' : 'Normal genislik',
      });
    }

    return factors;
  }
}
