import { Injectable } from '@nestjs/common';
import { IndicatorResult, OHLCV, Timeframe } from '../indicators/indicator.types';
import {
  AccumulationLevel,
  DistributionLevel,
  LiquidityLevel,
  MoneyFlowDirection,
  RiskLevel,
  SmartMoneyScoreResult,
  SmartMoneySignal,
} from './smart-money.types';
import { SmartMoneyResult } from './smart-money.types';
import {
  DEFAULT_SMART_MONEY_SCORE_CONFIG,
  SmartMoneyScoreConfig,
} from './smart-money.config';

export interface SmartMoneyScoreInput {
  ticker: string;
  timeframe: Timeframe;
  bars: OHLCV[];
  indicators: IndicatorResult[];
  smartMoney: SmartMoneyResult;
  verification: string | null;
  catalystScore: number | null;
}

@Injectable()
export class SmartMoneyScoreEngine {
  private readonly config: SmartMoneyScoreConfig;

  constructor() {
    this.config = DEFAULT_SMART_MONEY_SCORE_CONFIG;
  }

  score(input: SmartMoneyScoreInput): SmartMoneyScoreResult {
    const { ticker, timeframe, bars, indicators, smartMoney } = input;

    if (!smartMoney.isValid || bars.length === 0) {
      return this.emptyResult(ticker, timeframe, input);
    }

    const relativeVolume = this.relativeVolume(bars, indicators);
    const volumeSpike = this.volumeSpike(indicators);
    const volumeSmaTrend = this.volumeSmaTrend(bars);
    const avgDailyVolume = this.avgDailyVolume(bars);
    const { accumulationDays, distributionDays } = this.accumulationDistributionDays(bars);
    const breakoutVolume = this.isBreakoutVolume(bars);

    const volumeScore = this.volumeScore(relativeVolume, volumeSpike, volumeSmaTrend);
    const liquidityScore = this.liquidityScore(avgDailyVolume, bars);
    const moneyFlowScore = this.moneyFlowScore(indicators);
    const accumulationScore = this.clamp(smartMoney.accumulationScore * 100);
    const distributionScore = this.clamp(smartMoney.distributionScore * 100);
    const confidence = this.confidence(input, smartMoney);
    const smartMoneyScore = this.smartMoneyScore(
      accumulationScore,
      distributionScore,
      volumeScore,
      liquidityScore,
      moneyFlowScore,
      confidence,
    );
    const riskScore = this.riskScore(distributionScore, liquidityScore);

    return {
      ticker,
      timeframe,
      smartMoneyScore: Math.round(smartMoneyScore),
      liquidityScore: Math.round(liquidityScore),
      volumeScore: Math.round(volumeScore),
      accumulationScore: Math.round(accumulationScore),
      distributionScore: Math.round(distributionScore),
      relativeVolume,
      volumeSpike,
      volumeSmaTrend,
      moneyFlow: this.moneyFlowDirection(moneyFlowScore),
      moneyFlowScore: Math.round(moneyFlowScore),
      institutionalActivity: smartMoney.institutionalActivity,
      confidence: Math.round(confidence),
      risk: this.riskLabel(riskScore),
      riskScore: Math.round(riskScore),
      liquidity: this.liquidityLabel(liquidityScore),
      accumulationLevel: this.accumulationLevel(accumulationScore),
      distributionLevel: this.distributionLevel(distributionScore),
      avgDailyVolume: Math.round(avgDailyVolume),
      accumulationDays,
      distributionDays,
      breakoutVolume,
      signals: smartMoney.signals,
      verification: input.verification,
      catalystScore: input.catalystScore,
      metadata: {
        ...smartMoney.metadata,
        relativeVolumeRaw: relativeVolume,
        volumeSpikeRaw: volumeSpike,
        volumeSmaTrendRaw: volumeSmaTrend,
        averageDailyVolume: Math.round(avgDailyVolume),
        accumulationDays,
        distributionDays,
        breakoutVolume,
        moneyFlowScoreRaw: moneyFlowScore,
        liquidityScoreRaw: liquidityScore,
        volumeScoreRaw: volumeScore,
      },
      generatedAt: new Date().toISOString(),
      isValid: true,
    };
  }

  private relativeVolume(bars: OHLCV[], indicators: IndicatorResult[]): number {
    const ind = indicators.find((i) => i.indicator.toLowerCase() === 'relativevolume');
    if (ind && typeof ind.value === 'number' && Number.isFinite(ind.value)) {
      return this.round2(ind.value);
    }
    if (bars.length < 2) return 0;
    const volumes = bars.map((b) => b.volume);
    const period = Math.min(20, volumes.length);
    const sma = volumes.slice(-period - 1, -1).reduce((a, b) => a + b, 0) / period;
    if (sma === 0) return 0;
    return this.round2(volumes[volumes.length - 1] / sma);
  }

  private volumeSpike(indicators: IndicatorResult[]): number {
    const ind = indicators.find((i) => i.indicator.toLowerCase() === 'volumespike');
    if (ind && typeof ind.value === 'number' && Number.isFinite(ind.value)) {
      return this.round2(ind.value);
    }
    return 0;
  }

  private volumeSmaTrend(bars: OHLCV[]): number {
    if (bars.length < 21) return 0;
    const volumes = bars.map((b) => b.volume);
    const recent = volumes.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const prior = volumes.slice(-20, -10).reduce((a, b) => a + b, 0) / 10;
    if (prior === 0) return 0;
    return this.round2(recent / prior - 1);
  }

  private avgDailyVolume(bars: OHLCV[]): number {
    if (bars.length === 0) return 0;
    const window = Math.min(this.config.liquidity.consistencyWindow, bars.length);
    return bars.slice(-window).reduce((sum, b) => sum + b.volume, 0) / window;
  }

  private accumulationDistributionDays(bars: OHLCV[]): { accumulationDays: number; distributionDays: number } {
    if (bars.length < 2) return { accumulationDays: 0, distributionDays: 0 };
    const window = bars.slice(-Math.min(20, bars.length));
    const volumes = window.map((b) => b.volume);
    const avgVol = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    let accumulationDays = 0;
    let distributionDays = 0;
    for (const bar of window) {
      const direction = bar.close >= bar.open ? 1 : -1;
      const volumeBoost = bar.volume / (avgVol || 1);
      if (direction > 0 && volumeBoost >= 1.2) accumulationDays++;
      if (direction < 0 && volumeBoost >= 1.2) distributionDays++;
    }
    return { accumulationDays, distributionDays };
  }

  private isBreakoutVolume(bars: OHLCV[]): boolean {
    if (bars.length < 2) return false;
    const last = bars[bars.length - 1];
    const prior = bars.slice(0, -1);
    const avgVol = prior.reduce((sum, b) => sum + b.volume, 0) / prior.length;
    if (avgVol === 0) return false;
    const volRatio = last.volume / avgVol;
    const priceUp = last.close > last.open;
    return priceUp && volRatio >= this.config.volumeSpike.high;
  }

  private volumeScore(relativeVolume: number, spike: number, smaTrend: number): number {
    const relVolScore = this.clamp01(relativeVolume / this.config.relativeVolume.strong) * 100;
    const spikeScore = this.clamp01(spike / this.config.volumeSpike.strong) * 100;
    const trendScore = this.clamp01(0.5 + smaTrend) * 100;
    return this.clamp(0.4 * relVolScore + 0.35 * spikeScore + 0.25 * trendScore);
  }

  private liquidityScore(avgDailyVolume: number, bars: OHLCV[]): number {
    const { highVolumeThreshold, lowVolumeThreshold, consistencyWindow } = this.config.liquidity;
    let volumeScale = 0;
    if (avgDailyVolume >= highVolumeThreshold) {
      volumeScale = 100;
    } else if (avgDailyVolume <= lowVolumeThreshold) {
      volumeScale = 20 * (avgDailyVolume / lowVolumeThreshold);
    } else {
      volumeScale = 20 + ((avgDailyVolume - lowVolumeThreshold) / (highVolumeThreshold - lowVolumeThreshold)) * 80;
    }

    const window = bars.slice(-Math.min(consistencyWindow, bars.length));
    const volumes = window.map((b) => b.volume);
    const mean = volumes.reduce((a, b) => a + b, 0) / (volumes.length || 1);
    if (mean === 0) return 0;
    const variance = volumes.reduce((sum, v) => sum + (v - mean) ** 2, 0) / volumes.length;
    const cv = Math.sqrt(variance) / mean;
    const consistencyScore = this.clamp((1 - Math.min(1, cv)) * 100);

    return this.clamp(0.6 * volumeScale + 0.4 * consistencyScore);
  }

  private moneyFlowScore(indicators: IndicatorResult[]): number {
    let score = 0;
    let count = 0;

    const cmf = indicators.find((i) => i.indicator.toLowerCase() === 'cmf');
    if (cmf && typeof cmf.value === 'number' && Number.isFinite(cmf.value)) {
      score += 50 + this.clampRange(-1, 1, cmf.value / 0.1) * 50;
      count++;
    }
    const mfi = indicators.find((i) => i.indicator.toLowerCase() === 'mfi');
    if (mfi && typeof mfi.value === 'number' && Number.isFinite(mfi.value)) {
      score += mfi.value;
      count++;
    }

    const obv = indicators.find((i) => i.indicator.toLowerCase() === 'obv');
    if (obv) {
      const series = Array.isArray(obv.value)
        ? (obv.value as number[])
        : Array.isArray((obv.metadata as Record<string, unknown>)?.values)
          ? ((obv.metadata as Record<string, unknown>).values as number[])
          : [];
      if (series.length >= 6) {
        const recent = series.slice(-6);
        if (recent[recent.length - 1] > recent[0]) score += 75;
        else if (recent[recent.length - 1] < recent[0]) score += 25;
        else score += 50;
        count++;
      }
    }

    return count > 0 ? this.clamp(score / count) : 50;
  }

  private confidence(input: SmartMoneyScoreInput, smartMoney: SmartMoneyResult): number {
    let confidence = smartMoney.smartMoneyConfidence * 100;
    if (input.verification === 'TRUE') {
      confidence = confidence * 0.9 + 10;
    } else if (input.verification === 'FALSE') {
      confidence = confidence * 0.5;
    }
    if (input.catalystScore !== null && input.catalystScore !== undefined) {
      confidence = confidence * 0.9 + input.catalystScore * 0.1;
    }
    return this.clamp(confidence);
  }

  private smartMoneyScore(
    accumulationScore: number,
    distributionScore: number,
    volumeScore: number,
    liquidityScore: number,
    moneyFlowScore: number,
    confidence: number,
  ): number {
    const w = this.config.score;
    const distInverse = 100 - distributionScore;
    const raw =
      (accumulationScore / 100) * w.accumulationWeight +
      (distInverse / 100) * w.distributionWeight +
      (volumeScore / 100) * w.volumeWeight +
      (liquidityScore / 100) * w.liquidityWeight +
      (moneyFlowScore / 100) * w.moneyFlowWeight +
      (confidence / 100) * w.confidenceWeight;
    return this.clamp(raw * 100);
  }

  private riskScore(distributionScore: number, liquidityScore: number): number {
    const { distributionRiskWeight, liquidityRiskWeight } = this.config.risk;
    const liquidityRisk = 100 - liquidityScore;
    return this.clamp(distributionScore * distributionRiskWeight + liquidityRisk * liquidityRiskWeight);
  }

  private moneyFlowDirection(score: number): MoneyFlowDirection {
    if (score >= this.config.moneyFlow.strongPositive) return 'strong_positive';
    if (score >= this.config.moneyFlow.positive) return 'positive';
    if (score >= this.config.moneyFlow.negative) return 'neutral';
    if (score >= this.config.moneyFlow.strongNegative) return 'negative';
    return 'strong_negative';
  }

  private riskLabel(score: number): RiskLevel {
    if (score >= this.config.risk.highScoreThreshold) return 'high';
    if (score >= this.config.risk.mediumScoreThreshold) return 'medium';
    return 'low';
  }

  private liquidityLabel(score: number): LiquidityLevel {
    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  private accumulationLevel(score: number): AccumulationLevel {
    if (score >= 80) return 'very_strong';
    if (score >= 60) return 'strong';
    if (score >= 40) return 'moderate';
    if (score >= 20) return 'weak';
    return 'none';
  }

  private distributionLevel(score: number): DistributionLevel {
    if (score >= 80) return 'very_high';
    if (score >= 60) return 'high';
    if (score >= 40) return 'moderate';
    if (score >= 20) return 'low';
    return 'none';
  }

  private emptyResult(ticker: string, timeframe: Timeframe, input: SmartMoneyScoreInput): SmartMoneyScoreResult {
    return {
      ticker,
      timeframe,
      smartMoneyScore: 0,
      liquidityScore: 0,
      volumeScore: 0,
      accumulationScore: 0,
      distributionScore: 0,
      relativeVolume: 0,
      volumeSpike: 0,
      volumeSmaTrend: 0,
      moneyFlow: 'neutral',
      moneyFlowScore: 0,
      institutionalActivity: 'neutral',
      confidence: 0,
      risk: 'low',
      riskScore: 0,
      liquidity: 'low',
      accumulationLevel: 'none',
      distributionLevel: 'none',
      avgDailyVolume: 0,
      accumulationDays: 0,
      distributionDays: 0,
      breakoutVolume: false,
      signals: [],
      verification: input.verification,
      catalystScore: input.catalystScore,
      metadata: {},
      generatedAt: new Date().toISOString(),
      isValid: false,
    };
  }

  private clamp(value: number): number {
    return Math.max(0, Math.min(100, value));
  }

  private clampRange(min: number, max: number, value: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private clamp01(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
