import { Injectable, Logger } from '@nestjs/common';
import { MarketDataService } from '../market-data/market-data.service';
import { MarketDataPoint } from '../market-data/interfaces/market-data.types';
import { IndicatorEngine } from '../indicators/indicator-engine.service';
import { IndicatorResult, OHLCV, Timeframe } from '../indicators/indicator.types';
import { MarketStructureEngine } from '../market-structure/market-structure.engine';
import { CoreBacktestEngine } from '../backtest/backtest.engine';
import { buildStrategy } from '../backtest/backtest.config';
import { EntryZoneEngine } from '../entry/entry-zone.engine';
import { EntryZoneContext, EntryZoneInput } from '../entry/entry-zone.types';
import { SmartMoneyService } from '../smart-money/smart-money.service';
import { CatalystService } from '../catalyst/catalyst.service';
import { VerificationAIService } from '../verification-ai/verification-ai.service';
import { PredictionEngine } from './prediction.engine';
import { PredictionScoreEngine } from './prediction-score.engine';
import { PredictionRegistry } from './prediction-registry';
import { PredictionResult, PredictionTimeframe } from './prediction.types';
import { SmartMoneyScoreResult, SmartMoneySignal } from '../smart-money/smart-money.types';import {
  DEFAULT_PREDICTION_CONFIG,
  PREDICTION_CACHE_KEY_PREFIX,
  PREDICTION_CACHE_NAMESPACE,
  PREDICTION_TTL_MS,
  toIndicatorTimeframe,
} from './prediction.config';
import { CacheService } from '../../common/cache/cache.service';
import { IndicatorCacheService } from '../indicator-cache/indicator-cache.service';
import { RegistryCacheAdapter } from '../indicator-cache/registry-cache.adapter';

@Injectable()
export class PredictionService {
  private readonly logger = new Logger(PredictionService.name);

  constructor(
    private readonly marketDataService: MarketDataService,
    private readonly indicatorEngine: IndicatorEngine,
    private readonly indicatorCache: IndicatorCacheService,
    private readonly registryCacheAdapter: RegistryCacheAdapter,
    private readonly marketStructureEngine: MarketStructureEngine,
    private readonly smartMoneyService: SmartMoneyService,
    private readonly catalystService: CatalystService,
    private readonly verificationAI: VerificationAIService,
    private readonly coreBacktestEngine: CoreBacktestEngine,
    private readonly entryZoneEngine: EntryZoneEngine,
    private readonly predictionEngine: PredictionEngine,
    private readonly scoreEngine: PredictionScoreEngine,
    private readonly registry: PredictionRegistry,
    private readonly cache: CacheService,
  ) {}

  async getPrediction(
    ticker: string,
    timeframe: PredictionTimeframe = '1d',
    useCache = true,
  ): Promise<PredictionResult> {
    const normalized = ticker.toUpperCase();
    const cacheKey = `${PREDICTION_CACHE_KEY_PREFIX}${normalized}:${timeframe}`;

    if (useCache) {
      return this.registryCacheAdapter.getOrCompute(
        {
          get: (key) => {
            const [t, tf] = key.split(':');
            return this.registry.get(t, tf);
          },
          save: (value) => this.registry.save(value),
        },
        `${normalized}:${timeframe}`,
        cacheKey,
        PREDICTION_CACHE_NAMESPACE,
        PREDICTION_TTL_MS,
        () => this.refreshPrediction(normalized, timeframe),
      );
    }

    const result = await this.refreshPrediction(normalized, timeframe);
    this.cache.set(cacheKey, result, PREDICTION_TTL_MS, PREDICTION_CACHE_NAMESPACE);
    return result;
  }

  async refreshPrediction(
    ticker: string,
    timeframe: PredictionTimeframe = '1d',
  ): Promise<PredictionResult> {
    const normalized = ticker.toUpperCase();
    const dataTimeframe = toIndicatorTimeframe(timeframe);

    const rawData = await this.marketDataService.fetchData(normalized, dataTimeframe, {
      limit: DEFAULT_PREDICTION_CONFIG.historicalLimit,
    });
    const ohlcv = this.toOHLCV(rawData);

    if (ohlcv.length === 0) {
      return this.emptyResult(normalized, timeframe, dataTimeframe);
    }

    const indicators = this.indicatorCache.getOrCalculate(
      normalized,
      dataTimeframe,
      ohlcv,
      (data, tf) => this.indicatorEngine.calculateAll(data, tf),
    );
    const structure = this.marketStructureEngine.analyze(ohlcv, dataTimeframe);

    const [smartMoney, catalyst, verification] = await Promise.all([
      this.smartMoneyService.getSmartMoney(normalized, dataTimeframe, false, { ohlcv, indicators }).catch(() => null),
      this.catalystService.getCatalyst(normalized).catch(() => null),
      this.verificationAI.getVerification(normalized).catch(() => null),
    ]);

    const smartMoneyResult = smartMoney ?? this.emptySmartMoney(normalized, dataTimeframe);
    const backtest = this.runCalibrationBacktest(normalized, ohlcv, dataTimeframe);
    const entryZone = this.entryZoneEngine.evaluate(
      this.buildEntryZoneInput(normalized, ohlcv, indicators, structure, smartMoneyResult),
    );

    const features = this.predictionEngine.evaluate({
      ticker: normalized,
      timeframe,
      dataTimeframe,
      bars: ohlcv,
      indicators,
      structure,
      smartMoney: smartMoneyResult,
      catalyst,
      verification,
    });

    const result = this.scoreEngine.score({
      ticker: normalized,
      timeframe,
      dataTimeframe,
      bars: ohlcv,
      features,
      smartMoney: smartMoneyResult,
      catalyst,
      verification,
      entryZone,
      backtest,
    });

    return this.registry.save(result);
  }

  getTop(limit = 10): PredictionResult[] {
    return this.registry.getTop(limit);
  }

  private runCalibrationBacktest(
    symbol: string,
    ohlcv: OHLCV[],
    timeframe: Timeframe,
  ): { winRate: number; totalTrades: number; sharpeRatio: number; isValid: boolean } {
    try {
      const strategy = buildStrategy('momentum', {
        timeframe,
        timeRange: '1Y',
        symbol,
        initialCapital: DEFAULT_PREDICTION_CONFIG.backtest.initialCapital,
      });
      const result = this.coreBacktestEngine.run(ohlcv, timeframe, strategy);
      if (!result.isValid) {
        return { winRate: 0, totalTrades: 0, sharpeRatio: 0, isValid: false };
      }
      return {
        winRate: result.performance.winRate,
        totalTrades: result.performance.totalTrades,
        sharpeRatio: Number.isFinite(result.risk.sharpeRatio) ? result.risk.sharpeRatio : 0,
        isValid: true,
      };
    } catch (error) {
      this.logger.debug(
        `Backtest kalibrasyonu atlandı (${symbol}): ${error instanceof Error ? error.message : String(error)}`,
      );
      return { winRate: 0, totalTrades: 0, sharpeRatio: 0, isValid: false };
    }
  }

  private buildEntryZoneInput(
    ticker: string,
    bars: OHLCV[],
    indicators: IndicatorResult[],
    structure: { trend: string; supportZones: unknown[]; resistanceZones: unknown[] },
    smartMoney: { isValid: boolean; smartMoneyScore: number; riskScore: number } | null,
  ): EntryZoneInput {
    const get = (name: string): IndicatorResult | undefined =>
      indicators.find((i) => i.indicator.toLowerCase() === name.toLowerCase());
    const num = (v: unknown): number | null =>
      typeof v === 'number' && Number.isFinite(v) ? v : null;

    const atr = get('ATR');
    const bb = get('BollingerBands');
    const bbValue = (bb?.value as Record<string, number> | null) ?? null;
    const price = bars.length > 0 ? bars[bars.length - 1].close : null;

    const context: EntryZoneContext = {
      aiScore: smartMoney?.isValid ? smartMoney.smartMoneyScore : null,
      momentum: smartMoney?.isValid ? smartMoney.smartMoneyScore : null,
      risk: smartMoney?.isValid ? smartMoney.riskScore : null,
    };

    return {
      ticker,
      company: ticker,
      price,
      atr: num(atr?.value),
      bollinger: {
        upper: num(bbValue?.upper),
        middle: num(bbValue?.middle),
        lower: num(bbValue?.lower),
      },
      sma: {
        sma20: num(get('SMA_20')?.value),
        sma50: num(get('SMA_50')?.value),
        sma200: num(get('SMA_200')?.value),
      },
      ema: {
        ema20: num(get('EMA_20')?.value),
        ema50: num(get('EMA_50')?.value),
        ema200: num(get('EMA_200')?.value),
      },
      rsi: num(get('RSI')?.value),
      relativeVolume: num(get('RelativeVolume')?.value),
      supportZones: (structure.supportZones ?? []) as EntryZoneInput['supportZones'],
      resistanceZones: (structure.resistanceZones ?? []) as EntryZoneInput['resistanceZones'],
      trend: (structure.trend as EntryZoneInput['trend']) ?? 'sideways',
      context,
    };
  }

  private emptySmartMoney(ticker: string, timeframe: Timeframe): SmartMoneyScoreResult {
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
      signals: [] as SmartMoneySignal[],
      verification: null,
      catalystScore: null,
      metadata: {},
      generatedAt: new Date().toISOString(),
      isValid: false,
    };
  }

  private toOHLCV(rawData: MarketDataPoint[]): OHLCV[] {
    return rawData
      .filter((p) => p && typeof p.close === 'number' && Number.isFinite(p.close))
      .map((point) => ({
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close,
        volume: point.volume,
        timestamp: point.timestamp,
      }));
  }

  private emptyResult(
    ticker: string,
    timeframe: PredictionTimeframe,
    dataTimeframe: Timeframe,
  ): PredictionResult {
    const holding = DEFAULT_PREDICTION_CONFIG.timeframeData[timeframe];
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
      backtestAccuracy: { winRate: 0, totalTrades: 0, sharpeRatio: 0, isValid: false },
      verification: null,
      catalystScore: null,
      smartMoneyScore: 0,
      metadata: {},
      generatedAt: new Date().toISOString(),
      isValid: false,
    };
  }
}
