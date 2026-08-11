import { Injectable, Logger } from '@nestjs/common';
import { IndicatorResult, Timeframe } from '../indicators/indicator.types';
import { MarketStructureResult } from '../market-structure/market-structure.types';
import {
  SmartMoneyConfig,
  DEFAULT_SMART_MONEY_CONFIG,
} from './smart-money.config';
import {
  SmartMoneyResult,
  SmartMoneySignal,
} from './smart-money.types';

@Injectable()
export class SmartMoneyEngine {
  private readonly logger = new Logger(SmartMoneyEngine.name);
  private readonly config: SmartMoneyConfig;

  constructor() {
    this.config = DEFAULT_SMART_MONEY_CONFIG;
  }

  evaluate(
    indicators: IndicatorResult[],
    structure: MarketStructureResult,
    timeframe: Timeframe,
  ): SmartMoneyResult {
    if (!structure.isValid || indicators.length === 0) {
      return this.emptyResult(timeframe);
    }

    const rsi = this.findIndicator(indicators, 'RSI');
    const mfi = this.findIndicator(indicators, 'MFI');
    const cmf = this.findIndicator(indicators, 'CMF');
    const obv = this.findIndicator(indicators, 'OBV');
    const relVol = this.findIndicator(indicators, 'RELATIVE_VOLUME');
    const volSpike = this.findIndicator(indicators, 'VOLUME_SPIKE');
    const adx = this.findIndicator(indicators, 'ADX');
    const compression = this.findIndicator(indicators, 'COMPRESSION');
    const macd = this.findIndicator(indicators, 'MACD');

    const accScore = this.evaluateAccumulation(rsi, mfi, cmf, obv, structure);
    const distScore = this.evaluateDistribution(rsi, mfi, cmf, obv, structure);
    const volConf = this.evaluateVolumeConfirmation(relVol, volSpike, obv);
    const trendConf = this.evaluateTrendConfirmation(adx, structure);
    const mfConf = this.evaluateMoneyFlowConfirmation(mfi, cmf, adx);
    const compReady = this.evaluateCompressionBreakout(compression, relVol, volSpike);
    const instPart = this.evaluateInstitutionalParticipation(
      accScore,
      distScore,
      volConf,
      trendConf,
      mfConf,
      adx,
    );

    const signals = this.buildSignals(
      accScore,
      distScore,
      volConf,
      trendConf,
      mfConf,
      compReady,
      instPart,
    );

    const accumulationScore = this.normalizeScore(accScore);
    const distributionScore = this.normalizeScore(distScore);
    const institutionalActivity = this.classifyActivity(accumulationScore, distributionScore);
    const smartMoneyConfidence = this.computeConfidence(
      accumulationScore,
      distributionScore,
      volConf,
      trendConf,
      mfConf,
      compReady,
      instPart,
    );

    this.logger.debug(
      `Smart Money (${timeframe}): activity=${institutionalActivity}, confidence=${smartMoneyConfidence.toFixed(2)}`,
    );

    return {
      timeframe,
      accumulationScore,
      distributionScore,
      institutionalActivity,
      smartMoneyConfidence,
      trendAlignment: structure.trend,
      signals,
      metadata: {
        accumulationRaw: accScore,
        distributionRaw: distScore,
        volumeConfirmation: volConf,
        trendConfirmation: trendConf,
        moneyFlowConfirmation: mfConf,
        compressionBreakout: compReady,
        institutionalParticipation: instPart,
      },
      isValid: true,
    };
  }

  private obvSeries(obv: IndicatorResult | undefined): number[] {
    if (!obv) return [];
    if (Array.isArray(obv.value)) return obv.value as number[];
    const values = (obv.metadata as Record<string, unknown>)?.values;
    return Array.isArray(values) ? (values as number[]) : [];
  }

  private evaluateAccumulation(
    rsi: IndicatorResult | undefined,
    mfi: IndicatorResult | undefined,
    cmf: IndicatorResult | undefined,
    obv: IndicatorResult | undefined,
    structure: MarketStructureResult,
  ): number {
    let score = 0;
    let count = 0;

    if (rsi && typeof rsi.value === 'number') {
      const { accumulationLow, accumulationHigh } = this.config.rsi;
      if (rsi.value >= accumulationLow && rsi.value <= accumulationHigh) {
        score += 1;
      } else if (rsi.value < accumulationLow) {
        score += 0.5;
      }
      count++;
    }

    if (mfi && typeof mfi.value === 'number') {
      if (mfi.value <= this.config.moneyFlow.mfiAccumulation) {
        score += 1;
      } else if (mfi.value <= 40) {
        score += 0.5;
      }
      count++;
    }

    if (cmf && typeof cmf.value === 'number') {
      if (cmf.value >= this.config.moneyFlow.cmfAccumulation) {
        score += 1;
      } else if (cmf.value >= 0) {
        score += 0.5;
      }
      count++;
    }

    if (obv) {
      const obvArr = this.obvSeries(obv);
      if (obvArr.length >= 5) {
        const recent = obvArr.slice(-5);
        const isRising = recent[recent.length - 1] > recent[0];
        if (isRising) score += 1;
        count++;
      }
    }

    if (structure.trend === 'uptrend' || structure.changeOfCharacter.length > 0) {
      score += 0.5;
    }
    count++;

    return count > 0 ? score / count : 0;
  }

  private evaluateDistribution(
    rsi: IndicatorResult | undefined,
    mfi: IndicatorResult | undefined,
    cmf: IndicatorResult | undefined,
    obv: IndicatorResult | undefined,
    structure: MarketStructureResult,
  ): number {
    let score = 0;
    let count = 0;

    if (rsi && typeof rsi.value === 'number') {
      const { distributionLow, distributionHigh } = this.config.rsi;
      if (rsi.value >= distributionLow && rsi.value <= distributionHigh) {
        score += 1;
      } else if (rsi.value > distributionHigh) {
        score += 0.5;
      }
      count++;
    }

    if (mfi && typeof mfi.value === 'number') {
      if (mfi.value >= this.config.moneyFlow.mfiDistribution) {
        score += 1;
      } else if (mfi.value >= 60) {
        score += 0.5;
      }
      count++;
    }

    if (cmf && typeof cmf.value === 'number') {
      if (cmf.value <= this.config.moneyFlow.cmfDistribution) {
        score += 1;
      } else if (cmf.value <= 0) {
        score += 0.5;
      }
      count++;
    }

    if (obv) {
      const obvArr = this.obvSeries(obv);
      if (obvArr.length >= 5) {
        const recent = obvArr.slice(-5);
        const isFalling = recent[recent.length - 1] < recent[0];
        if (isFalling) score += 1;
        count++;
      }
    }

    if (structure.trend === 'downtrend') {
      score += 0.5;
    }
    count++;

    return count > 0 ? score / count : 0;
  }

  private evaluateVolumeConfirmation(
    relVol: IndicatorResult | undefined,
    volSpike: IndicatorResult | undefined,
    obv: IndicatorResult | undefined,
  ): number {
    let score = 0;
    let count = 0;

    if (relVol && typeof relVol.value === 'number') {
      if (relVol.value > this.config.volumeSpike.threshold) {
        score += 1;
      } else if (relVol.value > 1) {
        score += 0.5;
      }
      count++;
    }

    if (volSpike && typeof volSpike.value === 'number') {
      if (volSpike.value > this.config.volumeSpike.threshold) {
        score += 1;
      } else if (volSpike.value > 1) {
        score += 0.5;
      }
      count++;
    }

    if (obv) {
      const obvArr = this.obvSeries(obv);
      if (obvArr.length >= 3) {
        const recent = obvArr.slice(-3);
        const volatility = Math.abs(recent[2] - recent[0]) / (Math.abs(recent[0]) || 1);
        if (volatility > 0.1) score += 1;
        count++;
      }
    }

    return count > 0 ? score / count : 0;
  }

  private evaluateTrendConfirmation(
    adx: IndicatorResult | undefined,
    structure: MarketStructureResult,
  ): number {
    let score = 0;
    let count = 0;

    if (adx && typeof adx.value === 'object' && adx.value !== null) {
      const adxVal = adx.value as Record<string, number>;
      if (typeof adxVal.adx === 'number') {
        if (adxVal.adx > this.config.adx.strongTrend) {
          score += 1;
        } else if (adxVal.adx > 20) {
          score += 0.5;
        }
        count++;
      }
    }

    if (structure.trend !== 'sideways') {
      score += 1;
    } else {
      score += 0.25;
    }
    count++;

    if (structure.structure.length > 0) {
      score += 0.5;
    }
    count++;

    return count > 0 ? score / count : 0;
  }

  private evaluateMoneyFlowConfirmation(
    mfi: IndicatorResult | undefined,
    cmf: IndicatorResult | undefined,
    adx: IndicatorResult | undefined,
  ): number {
    let score = 0;
    let count = 0;

    if (mfi && typeof mfi.value === 'number') {
      if (mfi.value > 50) {
        score += 0.75;
      } else if (mfi.value > 40) {
        score += 0.5;
      } else {
        score += 0.25;
      }
      count++;
    }

    if (cmf && typeof cmf.value === 'number') {
      if (cmf.value > 0) {
        score += 0.75;
      } else if (cmf.value > -0.05) {
        score += 0.5;
      } else {
        score += 0.25;
      }
      count++;
    }

    if (adx && typeof adx.value === 'object' && adx.value !== null) {
      const adxVal = adx.value as Record<string, number>;
      if (typeof adxVal.diPlus === 'number' && typeof adxVal.diMinus === 'number') {
        const diff = Math.abs(adxVal.diPlus - adxVal.diMinus);
        if (diff > 10) score += 1;
        else if (diff > 5) score += 0.5;
        count++;
      }
    }

    return count > 0 ? score / count : 0;
  }

  private evaluateCompressionBreakout(
    compression: IndicatorResult | undefined,
    relVol: IndicatorResult | undefined,
    volSpike: IndicatorResult | undefined,
  ): number {
    let score = 0;
    let count = 0;

    if (compression && typeof compression.value === 'object' && compression.value !== null) {
      const compVal = compression.value as Record<string, number | boolean>;
      if (typeof compVal.isSqueezing === 'boolean' && compVal.isSqueezing) {
        score += 1;
      }
      if (typeof compVal.bandwidth === 'number') {
        if (compVal.bandwidth < this.config.compression.squeezeThreshold) {
          score += 0.75;
        } else if (compVal.bandwidth < 0.05) {
          score += 0.5;
        }
      }
      count++;
    }

    if (relVol && typeof relVol.value === 'number' && relVol.value > 1.5) {
      score += 0.5;
      count++;
    }

    if (volSpike && typeof volSpike.value === 'number' && volSpike.value > 1) {
      score += 0.5;
      count++;
    }

    return count > 0 ? score / count : 0;
  }

  private evaluateInstitutionalParticipation(
    accScore: number,
    distScore: number,
    volConf: number,
    trendConf: number,
    mfConf: number,
    adx: IndicatorResult | undefined,
  ): number {
    let score = 0;
    let count = 0;

    const activityLevel = Math.max(accScore, distScore);
    if (activityLevel > 0.6) {
      score += 1;
    } else if (activityLevel > 0.3) {
      score += 0.5;
    }
    count++;

    if (volConf > 0.5) {
      score += 1;
    } else if (volConf > 0.25) {
      score += 0.5;
    }
    count++;

    if (trendConf > 0.6) {
      score += 0.75;
    }
    count++;

    if (mfConf > 0.5) {
      score += 0.75;
    }
    count++;

    if (adx && typeof adx.value === 'object' && adx.value !== null) {
      const adxVal = adx.value as Record<string, number>;
      if (typeof adxVal.adx === 'number' && adxVal.adx > this.config.adx.strongTrend) {
        score += 1;
      }
      count++;
    }

    return count > 0 ? score / count : 0;
  }

  private buildSignals(
    accScore: number,
    distScore: number,
    volConf: number,
    trendConf: number,
    mfConf: number,
    compReady: number,
    instPart: number,
  ): SmartMoneySignal[] {
    const signals: SmartMoneySignal[] = [];

    if (accScore > 0.5) {
      signals.push({
        type: 'accumulation',
        strength: this.normalizeScore(accScore),
        description: 'Accumulation pattern detected',
      });
    }

    if (distScore > 0.5) {
      signals.push({
        type: 'distribution',
        strength: this.normalizeScore(distScore),
        description: 'Distribution pattern detected',
      });
    }

    if (volConf > 0.5) {
      signals.push({
        type: 'volume_confirmation',
        strength: this.normalizeScore(volConf),
        description: 'Volume confirms institutional activity',
      });
    }

    if (trendConf > 0.6) {
      signals.push({
        type: 'trend_confirmation',
        strength: this.normalizeScore(trendConf),
        description: 'Trend structure supports institutional flow',
      });
    }

    if (mfConf > 0.5) {
      signals.push({
        type: 'money_flow_confirmation',
        strength: this.normalizeScore(mfConf),
        description: 'Money flow indicators confirm direction',
      });
    }

    if (compReady > 0.5) {
      signals.push({
        type: 'compression_breakout',
        strength: this.normalizeScore(compReady),
        description: 'Compression breakout readiness detected',
      });
    }

    if (instPart > 0.6) {
      signals.push({
        type: 'institutional_participation',
        strength: this.normalizeScore(instPart),
        description: 'Strong institutional participation detected',
      });
    }

    return signals;
  }

  private classifyActivity(
    accumulationScore: number,
    distributionScore: number,
  ): 'accumulating' | 'distributing' | 'neutral' {
    const diff = accumulationScore - distributionScore;
    if (diff > 0.15) return 'accumulating';
    if (diff < -0.15) return 'distributing';
    return 'neutral';
  }

  private computeConfidence(
    accScore: number,
    distScore: number,
    volConf: number,
    trendConf: number,
    mfConf: number,
    compReady: number,
    instPart: number,
  ): number {
    const w = this.config.score;
    const raw =
      accScore * w.accumulationWeight +
      distScore * w.distributionWeight +
      volConf * w.volumeWeight +
      trendConf * w.trendWeight +
      mfConf * w.moneyFlowWeight +
      compReady * w.compressionWeight +
      instPart * w.institutionalWeight;
    return this.normalizeScore(raw);
  }

  private normalizeScore(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

  private findIndicator(
    indicators: IndicatorResult[],
    name: string,
  ): IndicatorResult | undefined {
    const normalized = name.toLowerCase();
    return indicators.find((ind) => ind.indicator.toLowerCase() === normalized);
  }

  private emptyResult(timeframe: Timeframe): SmartMoneyResult {
    return {
      timeframe,
      accumulationScore: 0,
      distributionScore: 0,
      institutionalActivity: 'neutral',
      smartMoneyConfidence: 0,
      trendAlignment: 'sideways',
      signals: [],
      metadata: {},
      isValid: false,
    };
  }
}
