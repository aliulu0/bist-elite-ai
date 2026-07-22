import { Injectable } from '@nestjs/common';
import {
  TechnicalScoreInput,
  TechnicalScoreOutput,
  IndicatorData,
  Timeframe,
} from './types';

@Injectable()
export class TechnicalScorer {
  private readonly INDICATOR_DEFAULTS: Record<string, number> = {
    RSI: 50,
    MACD: 0,
    ADX: 20,
    ATR: 0,
    'Bollinger Bands': 50,
    EMA: 0,
    SMA: 0,
    VWAP: 0,
    Stochastic: 50,
    Ichimoku: 50,
  };

  calculate(inputs: TechnicalScoreInput[]): TechnicalScoreOutput {
    if (!inputs || inputs.length === 0) {
      return this.emptyScore();
    }

    const aggregated = this.aggregateInputs(inputs);
    const indicators = inputs.flatMap(i => i.indicators ?? []);
    const positiveSignals = indicators.filter(i => i.isPositive).length;
    const negativeSignals = indicators.filter(i => !i.isPositive).length;

    return {
      composite: aggregated.composite,
      trend: aggregated.trend,
      momentum: aggregated.momentum,
      volume: aggregated.volume,
      volatility: aggregated.volatility,
      signalCount: indicators.length,
      positiveSignals,
      negativeSignals,
    };
  }

  private aggregateInputs(inputs: TechnicalScoreInput[]): {
    composite: number;
    trend: number;
    momentum: number;
    volume: number;
    volatility: number;
  } {
    let trendSum = 0;
    let momentumSum = 0;
    let volumeSum = 0;
    let volatilitySum = 0;
    let count = 0;

    for (const input of inputs) {
      if (input.trend !== undefined) { trendSum += input.trend; count++; }
      if (input.momentum !== undefined) momentumSum += input.momentum;
      if (input.volume !== undefined) volumeSum += input.volume;
      if (input.volatility !== undefined) volatilitySum += input.volatility;
    }

    const trend = count > 0 ? trendSum / count : 50;
    const momentum = inputs.some(i => i.momentum !== undefined)
      ? inputs.reduce((s, i) => s + (i.momentum ?? 50), 0) / inputs.length
      : 50;
    const volume = inputs.some(i => i.volume !== undefined)
      ? inputs.reduce((s, i) => s + (i.volume ?? 50), 0) / inputs.length
      : 50;
    const volatility = inputs.some(i => i.volatility !== undefined)
      ? inputs.reduce((s, i) => s + (i.volatility ?? 50), 0) / inputs.length
      : 50;

    const composite = (trend * 0.30 + momentum * 0.25 + volume * 0.20 + volatility * 0.25);

    return {
      composite: this.clamp(composite),
      trend: this.clamp(trend),
      momentum: this.clamp(momentum),
      volume: this.clamp(volume),
      volatility: this.clamp(volatility),
    };
  }

  calculateFromIndicators(indicators: IndicatorData[]): TechnicalScoreOutput {
    if (!indicators || indicators.length === 0) {
      return this.emptyScore();
    }

    const trendScore = this.computeIndicatorScore(indicators, ['EMA', 'SMA', 'ADX', 'Ichimoku']);
    const momentumScore = this.computeIndicatorScore(indicators, ['RSI', 'MACD', 'Stochastic']);
    const volumeScore = this.computeIndicatorScore(indicators, ['VWAP', 'OBV']);
    const volatilityScore = this.computeVolatilityScore(indicators);

    const positiveSignals = indicators.filter(i => i.isPositive).length;
    const negativeSignals = indicators.filter(i => !i.isPositive).length;

    const composite = (trendScore * 0.30 + momentumScore * 0.25 + volumeScore * 0.20 + volatilityScore * 0.25);

    return {
      composite: this.clamp(composite),
      trend: this.clamp(trendScore),
      momentum: this.clamp(momentumScore),
      volume: this.clamp(volumeScore),
      volatility: this.clamp(volatilityScore),
      signalCount: indicators.length,
      positiveSignals,
      negativeSignals,
    };
  }

  private computeIndicatorScore(indicators: IndicatorData[], names: string[]): number {
    const matching = indicators.filter(i => names.includes(i.name));
    if (matching.length === 0) return 50;

    let totalWeight = 0;
    let weightedSum = 0;

    for (const ind of matching) {
      const normalized = this.normalizeIndicatorValue(ind);
      weightedSum += normalized * ind.weight;
      totalWeight += ind.weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 50;
  }

  private computeVolatilityScore(indicators: IndicatorData[]): number {
    const atrIndicator = indicators.find(i => i.name === 'ATR');
    if (!atrIndicator) return 50;

    const volatilityRatio = atrIndicator.value / (atrIndicator.weight || 1);
    if (volatilityRatio < 0.5) return 70;
    if (volatilityRatio < 1.0) return 60;
    if (volatilityRatio < 1.5) return 50;
    if (volatilityRatio < 2.0) return 40;
    return 30;
  }

  private normalizeIndicatorValue(indicator: IndicatorData): number {
    const name = indicator.name;

    if (name === 'RSI') {
      return Math.max(0, Math.min(100, indicator.value));
    }

    if (name === 'MACD') {
      const normalized = (indicator.value + 100) / 2;
      return Math.max(0, Math.min(100, normalized));
    }

    if (name === 'ADX') {
      return Math.max(0, Math.min(100, indicator.value * 2));
    }

    return Math.max(0, Math.min(100, indicator.value));
  }

  private clamp(value: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, value));
  }

  private emptyScore(): TechnicalScoreOutput {
    return {
      composite: 50,
      trend: 50,
      momentum: 50,
      volume: 50,
      volatility: 50,
      signalCount: 0,
      positiveSignals: 0,
      negativeSignals: 0,
    };
  }
}
