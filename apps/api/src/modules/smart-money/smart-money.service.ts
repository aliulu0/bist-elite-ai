import { Injectable, Logger } from '@nestjs/common';
import { MarketDataService } from '../market-data/market-data.service';
import { MarketDataPoint } from '../market-data/interfaces/market-data.types';
import { IndicatorEngine } from '../indicators/indicator-engine.service';
import { OHLCV, Timeframe, IndicatorResult } from '../indicators/indicator.types';
import { MarketStructureEngine } from '../market-structure/market-structure.engine';
import { SmartMoneyEngine } from './smart-money.engine';
import { SmartMoneyScoreEngine } from './smart-money-score.engine';
import { SmartMoneyRegistry } from './smart-money-registry';
import { SmartMoneyScoreResult } from './smart-money.types';
import {
  SMART_MONEY_CACHE_KEY_PREFIX,
  SMART_MONEY_CACHE_NAMESPACE,
  SMART_MONEY_TTL_MS,
} from './smart-money.config';
import { CacheService } from '../../common/cache/cache.service';
import { CatalystService } from '../catalyst/catalyst.service';
import { VerificationAIService } from '../verification-ai/verification-ai.service';
import { IndicatorCacheService } from '../indicator-cache/indicator-cache.service';
import { RegistryCacheAdapter } from '../indicator-cache/registry-cache.adapter';

@Injectable()
export class SmartMoneyService {
  private readonly logger = new Logger(SmartMoneyService.name);

  constructor(
    private readonly marketDataService: MarketDataService,
    private readonly indicatorEngine: IndicatorEngine,
    private readonly indicatorCache: IndicatorCacheService,
    private readonly registryCacheAdapter: RegistryCacheAdapter,
    private readonly marketStructureEngine: MarketStructureEngine,
    private readonly smartMoneyEngine: SmartMoneyEngine,
    private readonly scoreEngine: SmartMoneyScoreEngine,
    private readonly registry: SmartMoneyRegistry,
    private readonly cache: CacheService,
    private readonly catalystService: CatalystService,
    private readonly verificationAI: VerificationAIService,
  ) {}

  async getSmartMoney(ticker: string, timeframe: Timeframe = '1d', useCache = true, preFetched?: { ohlcv?: OHLCV[]; indicators?: IndicatorResult[] }): Promise<SmartMoneyScoreResult> {
    const normalized = ticker.toUpperCase();
    const cacheKey = `${SMART_MONEY_CACHE_KEY_PREFIX}${normalized}`;

    if (useCache && !preFetched) {
      return this.registryCacheAdapter.getOrCompute(
        {
          get: (key) => this.registry.get(key),
          save: (value) => this.registry.save(value),
        },
        normalized,
        cacheKey,
        SMART_MONEY_CACHE_NAMESPACE,
        SMART_MONEY_TTL_MS,
        () => this.refreshSmartMoney(normalized, timeframe),
      );
    }

    const result = await this.refreshSmartMoney(normalized, timeframe, preFetched);
    if (!preFetched) {
      this.cache.set(cacheKey, result, SMART_MONEY_TTL_MS, SMART_MONEY_CACHE_NAMESPACE);
    }
    return result;
  }

  async refreshSmartMoney(ticker: string, timeframe: Timeframe = '1d', preFetched?: { ohlcv?: OHLCV[]; indicators?: IndicatorResult[] }): Promise<SmartMoneyScoreResult> {
    const normalized = ticker.toUpperCase();

    let ohlcv = preFetched?.ohlcv;
    let indicators = preFetched?.indicators;

    if (!ohlcv) {
      const rawData = await this.marketDataService.fetchData(normalized, timeframe);
      ohlcv = this.toOHLCV(rawData);
    }

    if (ohlcv.length === 0) {
      return this.emptyResult(normalized, timeframe);
    }

    if (!indicators) {
      indicators = this.indicatorCache.getOrCalculate(
        normalized,
        timeframe,
        ohlcv,
        (data, tf) => this.indicatorEngine.calculateAll(data, tf),
      );
    }

    const structure = this.marketStructureEngine.analyze(ohlcv, timeframe);
    const smartMoney = this.smartMoneyEngine.evaluate(indicators, structure, timeframe);

    const [verification, catalyst] = await Promise.all([
      this.verificationAI.getVerification(normalized).catch(() => null),
      this.catalystService.getCatalyst(normalized).catch(() => null),
    ]);

    const result = this.scoreEngine.score({
      ticker: normalized,
      timeframe,
      bars: ohlcv,
      indicators,
      smartMoney,
      verification: verification ? verification.verified : null,
      catalystScore: catalyst ? catalyst.catalystScore : null,
    });

    return this.registry.save(result);
  }

  getTop(limit = 10): SmartMoneyScoreResult[] {
    return this.registry.getTop(limit);
  }

  private toOHLCV(rawData: MarketDataPoint[]): OHLCV[] {
    return rawData.map((point) => ({
      open: point.open,
      high: point.high,
      low: point.low,
      close: point.close,
      volume: point.volume,
      timestamp: point.timestamp,
    }));
  }

  private emptyResult(ticker: string, timeframe: Timeframe): SmartMoneyScoreResult {
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
      verification: null,
      catalystScore: null,
      metadata: {},
      generatedAt: new Date().toISOString(),
      isValid: false,
    };
  }
}
