import { Injectable, Logger } from '@nestjs/common';
import { IndicatorResult, OHLCV, Timeframe } from '../indicators/indicator.types';
import { MarketStructureResult } from '../market-structure/market-structure.types';
import { CatalystResult } from '../catalyst/catalyst.types';
import { VerificationResult } from '../verification-ai/verification-ai.types';
import { SmartMoneyScoreResult } from '../smart-money/smart-money.types';
import {
  DEFAULT_PREDICTION_CONFIG,
  PredictionConfig,
} from './prediction.config';
import {
  LiquidityQuality,
  MomentumLabel,
  PredictionFeatures,
  PredictionSignal,
  PredictionTimeframe,
  RiskLevel,
  TrendDirectionLabel,
  TrendStrengthLabel,
} from './prediction.types';

export interface PredictionEngineInput {
  ticker: string;
  timeframe: PredictionTimeframe;
  dataTimeframe: Timeframe;
  bars: OHLCV[];
  indicators: IndicatorResult[];
  structure: MarketStructureResult;
  smartMoney: SmartMoneyScoreResult;
  catalyst: CatalystResult | null;
  verification: VerificationResult | null;
}

@Injectable()
export class PredictionEngine {
  private readonly logger = new Logger(PredictionEngine.name);
  private readonly config: PredictionConfig;

  constructor() {
    this.config = DEFAULT_PREDICTION_CONFIG;
  }

  evaluate(input: PredictionEngineInput): PredictionFeatures {
    const { indicators, structure, smartMoney } = input;

    if (!structure.isValid || indicators.length === 0 || input.bars.length === 0) {
      return this.emptyFeatures();
    }

    const price = this.lastPrice(input.bars);

    const trendScore = this.trendScore(indicators, structure, price);
    const momentumScore = this.momentumScore(indicators);
    const moneyFlowScore = this.moneyFlowScore(smartMoney);
    const catalystScore = this.catalystFeature(input.catalyst);
    const verificationScore = this.verificationFeature(input.verification);
    const meanReversionScore = this.meanReversionScore(indicators, price);

    const w = this.config.weights;
    const bullishRaw =
      trendScore * w.trend +
      momentumScore * w.momentum +
      moneyFlowScore * w.moneyFlow +
      catalystScore * w.catalyst +
      verificationScore * w.verification;

    const bearishRaw = Math.max(0, Math.min(100, 100 - bullishRaw));

    const neutralShare = Math.min(0.5, meanReversionScore * 0.5);
    const bullishProbability = Math.round(bullishRaw * (1 - neutralShare));
    const bearishProbability = Math.round(bearishRaw * (1 - neutralShare));
    const neutralProbability = Math.max(
      0,
      100 - bullishProbability - bearishProbability,
    );

    const expectedVolatility = this.expectedVolatility(input, price);
    const expectedReturn = this.round2(
      ((bullishProbability - bearishProbability) / 100) * expectedVolatility,
    );

    const { riskScore, risk } = this.riskAssessment(input, smartMoney, price);
    const liquidityQuality = this.liquidityQuality(input, smartMoney);
    const trendStrength = this.trendStrength(indicators);
    const trendDirection = this.trendDirection(structure.trend);
    const momentum = this.momentumLabel(momentumScore);

    const signals = this.buildSignals({
      trendScore,
      momentumScore,
      moneyFlowScore,
      catalystScore,
      verificationScore,
      meanReversionScore,
      trendStrength,
      momentum,
    });

    this.logger.debug(
      `Prediction (${input.timeframe}): bullish=${bullishProbability}%, bearish=${bearishProbability}%, neutral=${neutralProbability}%`,
    );

    return {
      bullishProbability,
      bearishProbability,
      neutralProbability,
      trendStrength,
      trendDirection,
      momentum,
      expectedVolatility,
      expectedReturn,
      liquidityQuality,
      risk,
      riskScore: Math.round(riskScore),
      signals,
      metadata: {
        trendScore: this.round2(trendScore),
        momentumScore: this.round2(momentumScore),
        moneyFlowScore: this.round2(moneyFlowScore),
        catalystScore: this.round2(catalystScore),
        verificationScore: this.round2(verificationScore),
        meanReversionScore: this.round2(meanReversionScore),
        bullishRaw: this.round2(bullishRaw),
        bearishRaw: this.round2(bearishRaw),
        neutralShare: this.round2(neutralShare),
        expectedVolatilityRaw: expectedVolatility,
        expectedReturnRaw: expectedReturn,
        riskScoreRaw: Math.round(riskScore),
      },
      isValid: true,
    };
  }

  private trendScore(indicators: IndicatorResult[], structure: MarketStructureResult, price: number | null): number {
    let score = 50;

    if (structure.trend === 'uptrend') score += 18;
    else if (structure.trend === 'downtrend') score -= 18;

    const adx = this.findIndicator(indicators, 'ADX');
    const adxVal = this.adxValue(adx);
    if (adxVal !== null) {
      if (adxVal >= 25) score += structure.trend === 'downtrend' ? -5 : 5;
      else if (adxVal >= 18) score += structure.trend === 'downtrend' ? -3 : 3;
    }

    const sma20 = this.numValue(this.findIndicator(indicators, 'SMA_20'));
    const sma50 = this.numValue(this.findIndicator(indicators, 'SMA_50'));
    const sma200 = this.numValue(this.findIndicator(indicators, 'SMA_200'));
    const ema20 = this.numValue(this.findIndicator(indicators, 'EMA_20'));
    const ema50 = this.numValue(this.findIndicator(indicators, 'EMA_50'));

    if (sma20 !== null && sma50 !== null) score += sma20 > sma50 ? 8 : -8;
    if (price !== null && sma20 !== null) score += price > sma20 ? 6 : -6;
    if (ema20 !== null && ema50 !== null) score += ema20 > ema50 ? 5 : -5;
    if (price !== null && sma200 !== null) score += price > sma200 ? 5 : -5;

    return this.clamp(score);
  }

  private momentumScore(indicators: IndicatorResult[]): number {
    let score = 50;

    const rsi = this.numValue(this.findIndicator(indicators, 'RSI'));
    if (rsi !== null) {
      if (rsi < 30) score -= 18;
      else if (rsi < 40) score -= 8;
      else if (rsi < 55) score += 0;
      else if (rsi < 65) score += 8;
      else if (rsi < 75) score += 12;
      else if (rsi < 85) score += 8;
      else score += 3;
    }

    const macd = this.findIndicator(indicators, 'MACD');
    if (macd && macd.value && typeof macd.value === 'object') {
      const macdVal = macd.value as Record<string, number>;
      if (typeof macdVal.macd === 'number' && typeof macdVal.signal === 'number') {
        score += macdVal.macd > macdVal.signal ? 8 : -8;
      }
      if (typeof macdVal.histogram === 'number') {
        score += macdVal.histogram > 0 ? 4 : -4;
      }
    }

    const roc = this.numValue(this.findIndicator(indicators, 'ROC'));
    if (roc !== null) {
      const scale = Math.min(1, Math.abs(roc) / 3);
      score += roc > 0 ? 6 * scale : -6 * scale;
    }

    return this.clamp(score);
  }

  private moneyFlowScore(smartMoney: SmartMoneyScoreResult): number {
    if (!smartMoney.isValid) return 50;
    return this.clamp(smartMoney.moneyFlowScore * 0.6 + smartMoney.smartMoneyScore * 0.4);
  }

  private catalystFeature(catalyst: CatalystResult | null): number {
    if (!catalyst) return 50;
    const base = this.clamp(catalyst.catalystScore);
    switch (catalyst.expectedImpact) {
      case 'very_bullish':
        return this.clamp(base + 10);
      case 'bullish':
        return this.clamp(base + 5);
      case 'neutral':
        return this.clamp(50 + (base - 50) * 0.3);
      case 'bearish':
        return this.clamp(100 - base);
      case 'very_bearish':
        return this.clamp(100 - base - 5);
      default:
        return base;
    }
  }

  private verificationFeature(verification: VerificationResult | null): number {
    if (!verification) return 50;
    const baseByVerdict: Record<string, number> = {
      TRUE: 75,
      PARTIAL: 55,
      UNVERIFIED: 45,
      FALSE: 25,
    };
    const base = baseByVerdict[verification.verified] ?? 50;
    const scale = 0.6 + 0.4 * (this.clamp(verification.verificationScore) / 100);
    return this.clamp(base * scale);
  }

  private meanReversionScore(indicators: IndicatorResult[], price: number | null): number {
    let score = 0;

    const rsi = this.numValue(this.findIndicator(indicators, 'RSI'));
    if (rsi !== null && rsi >= 40 && rsi <= 60) score += 0.4;

    const sma20 = this.numValue(this.findIndicator(indicators, 'SMA_20'));
    const atr = this.numValue(this.findIndicator(indicators, 'ATR'));
    if (price !== null && sma20 !== null && atr !== null && atr > 0) {
      if (Math.abs(price - sma20) <= 0.5 * atr) score += 0.3;
    }

    const bb = this.findIndicator(indicators, 'BollingerBands');
    if (bb && bb.value && typeof bb.value === 'object') {
      const bbVal = bb.value as Record<string, number>;
      if (
        typeof bbVal.upper === 'number' &&
        typeof bbVal.lower === 'number' &&
        bbVal.upper > bbVal.lower &&
        price !== null
      ) {
        const pctB = (price - bbVal.lower) / (bbVal.upper - bbVal.lower);
        if (pctB >= 0.3 && pctB <= 0.7) score += 0.2;
      }
    }

    const adx = this.adxValue(this.findIndicator(indicators, 'ADX'));
    if (adx !== null) {
      if (adx < 20) score += 0.3;
      else if (adx < 25) score += 0.1;
    }

    return Math.min(1, score);
  }

  private expectedVolatility(input: PredictionEngineInput, price: number | null): number {
    const atr = this.numValue(this.findIndicator(input.indicators, 'ATR'));
    if (atr === null || atr <= 0 || price === null || price <= 0) return 0;
    const atrPct = (atr / price) * 100;
    const holdingBars = this.config.timeframeData[input.timeframe].holdingBars;
    return this.round2(atrPct * Math.sqrt(Math.max(1, holdingBars)));
  }

  private riskAssessment(
    input: PredictionEngineInput,
    smartMoney: SmartMoneyScoreResult,
    price: number | null,
  ): { riskScore: number; risk: RiskLevel } {
    const atr = this.numValue(this.findIndicator(input.indicators, 'ATR'));
    const atrPct = atr !== null && price !== null && price > 0 ? (atr / price) * 100 : 0;
    const volatilityScore = this.clamp(atrPct * 10);

    const distributionScore = smartMoney.isValid ? smartMoney.distributionScore : 30;
    const liquidityRisk = smartMoney.isValid ? 100 - smartMoney.liquidityScore : 50;

    const c = this.config.risk;
    const riskScore = this.clamp(
      volatilityScore * c.volatilityWeight +
        distributionScore * c.distributionWeight +
        liquidityRisk * c.liquidityWeight,
    );

    const risk =
      riskScore >= c.highScoreThreshold
        ? 'high'
        : riskScore >= c.mediumScoreThreshold
          ? 'medium'
          : 'low';

    return { riskScore, risk };
  }

  private liquidityQuality(
    input: PredictionEngineInput,
    smartMoney: SmartMoneyScoreResult,
  ): LiquidityQuality {
    if (smartMoney.isValid && smartMoney.liquidity) {
      return smartMoney.liquidity as LiquidityQuality;
    }
    const volumes = input.bars.map((b) => b.volume);
    if (volumes.length === 0) return 'low';
    const window = Math.min(20, volumes.length);
    const avgVolume = volumes.slice(-window).reduce((a, b) => a + b, 0) / window;
    if (avgVolume >= this.config.liquidity.highVolumeThreshold) return 'high';
    if (avgVolume >= this.config.liquidity.lowVolumeThreshold) return 'medium';
    return 'low';
  }

  private trendStrength(indicators: IndicatorResult[]): TrendStrengthLabel {
    const adx = this.adxValue(this.findIndicator(indicators, 'ADX'));
    if (adx === null) return 'weak';
    if (adx >= 25) return 'strong';
    if (adx >= 18) return 'moderate';
    return 'weak';
  }

  private trendDirection(trend: MarketStructureResult['trend']): TrendDirectionLabel {
    if (trend === 'uptrend') return 'up';
    if (trend === 'downtrend') return 'down';
    return 'sideways';
  }

  private momentumLabel(score: number): MomentumLabel {
    if (score >= 70) return 'strong_bullish';
    if (score >= 55) return 'bullish';
    if (score > 45) return 'neutral';
    if (score > 30) return 'bearish';
    return 'strong_bearish';
  }

  private buildSignals(params: {
    trendScore: number;
    momentumScore: number;
    moneyFlowScore: number;
    catalystScore: number;
    verificationScore: number;
    meanReversionScore: number;
    trendStrength: TrendStrengthLabel;
    momentum: MomentumLabel;
  }): PredictionSignal[] {
    const signals: PredictionSignal[] = [];

    if (params.trendScore > 60) {
      signals.push({
        type: 'trend_bullish',
        strength: this.round2(params.trendScore),
        description: 'Fiyat yapısı yükseliş eğiliminde',
      });
    } else if (params.trendScore < 40) {
      signals.push({
        type: 'trend_bearish',
        strength: this.round2(100 - params.trendScore),
        description: 'Fiyat yapısı düşüş eğiliminde',
      });
    }

    if (params.momentumScore > 60) {
      signals.push({
        type: 'momentum_bullish',
        strength: this.round2(params.momentumScore),
        description: 'Momentum göstergeleri pozitif',
      });
    } else if (params.momentumScore < 40) {
      signals.push({
        type: 'momentum_bearish',
        strength: this.round2(100 - params.momentumScore),
        description: 'Momentum göstergeleri negatif',
      });
    }

    if (params.moneyFlowScore > 60) {
      signals.push({
        type: 'money_flow_bullish',
        strength: this.round2(params.moneyFlowScore),
        description: 'Akıllı para akışı yönü pozitif',
      });
    } else if (params.moneyFlowScore < 40) {
      signals.push({
        type: 'money_flow_bearish',
        strength: this.round2(100 - params.moneyFlowScore),
        description: 'Akıllı para akışı yönü negatif',
      });
    }

    if (params.catalystScore > 60) {
      signals.push({
        type: 'catalyst_bullish',
        strength: this.round2(params.catalystScore),
        description: 'Kurumsal katalizör skoru yükselişi destekliyor',
      });
    } else if (params.catalystScore < 40) {
      signals.push({
        type: 'catalyst_bearish',
        strength: this.round2(100 - params.catalystScore),
        description: 'Kurumsal katalizör skoru düşüşü destekliyor',
      });
    }

    if (params.verificationScore > 60) {
      signals.push({
        type: 'verification_bullish',
        strength: this.round2(params.verificationScore),
        description: 'Haber doğrulaması olumlu',
      });
    } else if (params.verificationScore < 40) {
      signals.push({
        type: 'verification_bearish',
        strength: this.round2(100 - params.verificationScore),
        description: 'Haber doğrulaması olumsuz',
      });
    }

    if (params.meanReversionScore > 0.5) {
      signals.push({
        type: 'mean_reversion',
        strength: this.round2(params.meanReversionScore * 100),
        description: 'Fiyat bant içinde — konsolidasyon olasılığı yüksek',
      });
    }

    if (params.trendStrength === 'strong') {
      signals.push({
        type: 'trend_strength_high',
        strength: 100,
        description: 'Trend gücü yüksek (ADX güçlü)',
      });
    }

    return signals;
  }

  private adxValue(ind: IndicatorResult | undefined): number | null {
    if (!ind || ind.value === null || typeof ind.value !== 'object') return null;
    const val = ind.value as Record<string, number>;
    return typeof val.adx === 'number' && Number.isFinite(val.adx) ? val.adx : null;
  }

  private numValue(ind: IndicatorResult | undefined): number | null {
    if (!ind) return null;
    if (typeof ind.value === 'number' && Number.isFinite(ind.value)) return ind.value;
    return null;
  }

  private lastPrice(bars: OHLCV[]): number | null {
    if (bars.length === 0) return null;
    const close = bars[bars.length - 1].close;
    return typeof close === 'number' && Number.isFinite(close) && close > 0 ? close : null;
  }

  private findIndicator(
    indicators: IndicatorResult[],
    name: string,
  ): IndicatorResult | undefined {
    const normalized = name.toLowerCase();
    return indicators.find((ind) => ind.indicator.toLowerCase() === normalized);
  }

  private emptyFeatures(): PredictionFeatures {
    return {
      bullishProbability: 0,
      bearishProbability: 0,
      neutralProbability: 0,
      trendStrength: 'weak',
      trendDirection: 'sideways',
      momentum: 'neutral',
      expectedVolatility: 0,
      expectedReturn: 0,
      liquidityQuality: 'low',
      risk: 'low',
      riskScore: 0,
      signals: [],
      metadata: {},
      isValid: false,
    };
  }

  private clamp(value: number): number {
    return Math.max(0, Math.min(100, value));
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
