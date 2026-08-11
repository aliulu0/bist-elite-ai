import { Injectable } from '@nestjs/common';
import { OHLCV, Timeframe } from '../indicators/indicator.types';
import { EntryZoneResult } from '../entry/entry-zone.types';
import { CatalystResult } from '../catalyst/catalyst.types';
import { VerificationResult } from '../verification-ai/verification-ai.types';
import { SmartMoneyScoreResult } from '../smart-money/smart-money.types';
import {
  BacktestAccuracy,
  PredictionFeatures,
  PredictionResult,
  PredictionScenario,
  PredictionTimeframe,
} from './prediction.types';
import {
  DEFAULT_PREDICTION_CONFIG,
  PredictionConfig,
} from './prediction.config';

export interface PredictionScoreInput {
  ticker: string;
  timeframe: PredictionTimeframe;
  dataTimeframe: Timeframe;
  bars: OHLCV[];
  features: PredictionFeatures;
  smartMoney: SmartMoneyScoreResult;
  catalyst: CatalystResult | null;
  verification: VerificationResult | null;
  entryZone: EntryZoneResult;
  backtest: BacktestAccuracy;
}

@Injectable()
export class PredictionScoreEngine {
  private readonly config: PredictionConfig;

  constructor() {
    this.config = DEFAULT_PREDICTION_CONFIG;
  }

  score(input: PredictionScoreInput): PredictionResult {
    const { ticker, timeframe, dataTimeframe, features } = input;

    if (!features.isValid || input.bars.length === 0) {
      return this.emptyResult(ticker, timeframe, dataTimeframe, input);
    }

    const confidence = this.calibrateConfidence(input);
    const holdingPeriod = this.config.timeframeData[timeframe];
    const entryZone = this.entryZoneNumbers(input.entryZone);
    const expectedReturn = this.expectedReturn(input, features);
    const scenarios = this.buildScenarios(input, entryZone, expectedReturn);
    const riskRewardRatio = this.entryZoneNumbers(input.entryZone).riskRewardRatio;

    return {
      ticker,
      timeframe,
      dataTimeframe,
      bullishProbability: features.bullishProbability,
      bearishProbability: features.bearishProbability,
      neutralProbability: features.neutralProbability,
      confidence,
      trendStrength: features.trendStrength,
      trendDirection: features.trendDirection,
      momentum: features.momentum,
      expectedReturn,
      expectedVolatility: features.expectedVolatility,
      risk: features.risk,
      riskScore: features.riskScore,
      liquidityQuality: features.liquidityQuality,
      expectedHoldingPeriod: {
        value: holdingPeriod.holdingValue,
        unit: holdingPeriod.holdingUnit,
      },
      entryZone: entryZone.idealEntryZone,
      stopZone: entryZone.stopZone,
      target1: entryZone.target1,
      target2: entryZone.target2,
      riskRewardRatio,
      scenarios,
      signals: features.signals,
      backtestAccuracy: {
        winRate: this.round2(input.backtest.winRate),
        totalTrades: input.backtest.totalTrades,
        sharpeRatio: this.round2(input.backtest.sharpeRatio),
        isValid: input.backtest.isValid,
      },
      verification: input.verification ? input.verification.verified : null,
      catalystScore: input.catalyst ? input.catalyst.catalystScore : null,
      smartMoneyScore: input.smartMoney.isValid ? input.smartMoney.smartMoneyScore : 0,
      metadata: {
        ...features.metadata,
        dataQuality: this.dataQuality(input.bars),
        calibration: {
          baseWeight: this.config.calibration.baseWeight,
          historicalWeight: this.config.calibration.historicalWeight,
          historicalWinRate: this.round2(input.backtest.winRate),
          historicalTrades: input.backtest.totalTrades,
        },
      },
      generatedAt: new Date().toISOString(),
      isValid: true,
    };
  }

  private calibrateConfidence(input: PredictionScoreInput): number {
    const { features, verification, catalyst, backtest } = input;
    const c = this.config.confidence;

    const agreement = Math.abs(features.bullishProbability - features.bearishProbability);
    let confidence = this.clamp(c.agreementBase + agreement * c.agreementScale);
    confidence = this.clamp(confidence + (this.dataQuality(input.bars) > 0 ? 5 : 0));

    if (
      backtest.isValid &&
      backtest.totalTrades >= this.config.calibration.minTradesRequired
    ) {
      const cal = this.config.calibration;
      confidence =
        confidence * cal.baseWeight + this.clamp(backtest.winRate) * cal.historicalWeight;
    }

    if (verification) {
      if (verification.verified === 'TRUE') confidence += c.verificationBoost;
      else if (verification.verified === 'FALSE') confidence -= c.verificationPenalty;
    }

    if (catalyst && typeof catalyst.confidence === 'number') {
      confidence =
        confidence * (1 - c.catalystWeight) +
        this.clamp(catalyst.confidence) * c.catalystWeight;
    }

    return Math.round(this.clamp(confidence));
  }

  private expectedReturn(
    input: PredictionScoreInput,
    features: PredictionFeatures,
  ): number {
    const entry = this.entryZoneNumbers(input.entryZone);
    if (
      entry.idealEntryZone &&
      entry.target1 !== null &&
      entry.idealEntryZone.min > 0
    ) {
      const entryMid = (entry.idealEntryZone.min + entry.idealEntryZone.max) / 2;
      if (entryMid > 0) {
        return this.round2(((entry.target1 - entryMid) / entryMid) * 100);
      }
    }
    return features.expectedReturn;
  }

  private buildScenarios(
    input: PredictionScoreInput,
    entry: ReturnType<PredictionScoreEngine['entryZoneNumbers']>,
    expectedReturn: number,
  ): PredictionScenario[] {
    const { features } = input;
    const target = entry.target1;
    const stop = entry.stopZone;
    const entryMid =
      entry.idealEntryZone
        ? (entry.idealEntryZone.min + entry.idealEntryZone.max) / 2
        : null;

    const bullishReturn =
      target !== null && entryMid !== null && entryMid > 0
        ? this.round2(((target - entryMid) / entryMid) * 100)
        : Math.max(0, expectedReturn);

    const bearishReturn =
      stop !== null && entryMid !== null && entryMid > 0
        ? this.round2(((stop - entryMid) / entryMid) * 100)
        : -Math.max(0, expectedReturn);

    return [
      {
        bias: 'bullish',
        title: 'Yükseliş Senaryosu',
        description: target !== null
          ? `Fiyatın ${target} hedef seviyesine doğru ilerlemesi`
          : 'Fiyatın yukarı yönlü hareket etmesi',
        probability: features.bullishProbability,
        trigger: 'Fiyat EMA/SMA yapısı üzerinde kalırsa ve momentum pozitif kalırsa',
        expectedReturn: bullishReturn,
      },
      {
        bias: 'neutral',
        title: 'Yatay Senaryo',
        description: 'Fiyatın mevcut destek-direnç aralığında konsolide olması',
        probability: features.neutralProbability,
        trigger: 'Fiyat bant içinde kalırsa ve hacim düşük seyrederse',
        expectedReturn: 0,
      },
      {
        bias: 'bearish',
        title: 'Düşüş Senaryosu',
        description: stop !== null
          ? `Fiyatın ${stop} stop seviyesine geri çekilmesi`
          : 'Fiyatın aşağı yönlü hareket etmesi',
        probability: features.bearishProbability,
        trigger: 'Fiyat destek seviyesinin altına sarkarsa',
        expectedReturn: bearishReturn,
      },
    ];
  }

  private entryZoneNumbers(result: EntryZoneResult): {
    idealEntryZone: { min: number; max: number } | null;
    stopZone: number | null;
    target1: number | null;
    target2: number | null;
    riskRewardRatio: number | null;
  } {
    return {
      idealEntryZone: result.idealEntryZone,
      stopZone: result.stopLoss,
      target1: result.target1,
      target2: result.target2,
      riskRewardRatio: result.riskRewardRatio,
    };
  }

  private dataQuality(bars: OHLCV[]): number {
    if (bars.length === 0) return 0;
    const window = Math.min(20, bars.length);
    const slice = bars.slice(-window);
    const valid = slice.filter(
      (b) =>
        typeof b.close === 'number' &&
        Number.isFinite(b.close) &&
        b.close > 0 &&
        typeof b.volume === 'number' &&
        b.volume >= 0,
    ).length;
    return (valid / slice.length) * 100;
  }

  private emptyResult(
    ticker: string,
    timeframe: PredictionTimeframe,
    dataTimeframe: Timeframe,
    input: PredictionScoreInput,
  ): PredictionResult {
    const holding = this.config.timeframeData[timeframe];
    return {
      ticker,
      timeframe,
      dataTimeframe,
      bullishProbability: 0,
      bearishProbability: 0,
      neutralProbability: 0,
      confidence: 0,
      trendStrength: 'weak',
      trendDirection: 'sideways',
      momentum: 'neutral',
      expectedReturn: 0,
      expectedVolatility: 0,
      risk: 'low',
      riskScore: 0,
      liquidityQuality: 'low',
      expectedHoldingPeriod: { value: holding.holdingValue, unit: holding.holdingUnit },
      entryZone: null,
      stopZone: null,
      target1: null,
      target2: null,
      riskRewardRatio: null,
      scenarios: [],
      signals: [],
      backtestAccuracy: {
        winRate: 0,
        totalTrades: 0,
        sharpeRatio: 0,
        isValid: false,
      },
      verification: input.verification ? input.verification.verified : null,
      catalystScore: input.catalyst ? input.catalyst.catalystScore : null,
      smartMoneyScore: 0,
      metadata: {},
      generatedAt: new Date().toISOString(),
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
