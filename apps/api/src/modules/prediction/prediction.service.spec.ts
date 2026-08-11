import { Test, TestingModule } from '@nestjs/testing';
import { PredictionService } from './prediction.service';
import { MarketDataService } from '../market-data/market-data.service';
import { IndicatorEngine } from '../indicators/indicator-engine.service';
import { MarketStructureEngine } from '../market-structure/market-structure.engine';
import { SmartMoneyService } from '../smart-money/smart-money.service';
import { CatalystService } from '../catalyst/catalyst.service';
import { VerificationAIService } from '../verification-ai/verification-ai.service';
import { CoreBacktestEngine } from '../backtest/backtest.engine';
import { EntryZoneEngine } from '../entry/entry-zone.engine';
import { PredictionEngine } from './prediction.engine';
import { PredictionScoreEngine } from './prediction-score.engine';
import { PredictionRegistry } from './prediction-registry';
import { CacheService } from '../../common/cache/cache.service';
import { IndicatorCacheService } from '../indicator-cache/indicator-cache.service';
import { RegistryCacheAdapter } from '../indicator-cache/registry-cache.adapter';
import { MarketDataPoint } from '../market-data/interfaces/market-data.types';
import { PredictionResult } from './prediction.types';

function makeResult(ticker: string, timeframe = '1d'): PredictionResult {
  return {
    ticker,
    timeframe: timeframe as PredictionResult['timeframe'],
    dataTimeframe: '1d',
    bullishProbability: 91,
    bearishProbability: 9,
    neutralProbability: 0,
    confidence: 92,
    trendStrength: 'strong',
    trendDirection: 'up',
    momentum: 'strong_bullish',
    expectedReturn: 6.4,
    expectedVolatility: 2.1,
    risk: 'low',
    riskScore: 22,
    liquidityQuality: 'high',
    expectedHoldingPeriod: { value: 4, unit: 'days' },
    entryZone: { min: 158, max: 161 },
    stopZone: 154,
    target1: 170,
    target2: 177,
    riskRewardRatio: 1.7,
    scenarios: [],
    signals: [],
    backtestAccuracy: { winRate: 68, totalTrades: 12, sharpeRatio: 1.4, isValid: true },
    verification: 'TRUE',
    catalystScore: 90,
    smartMoneyScore: 93,
    metadata: {},
    generatedAt: new Date().toISOString(),
    isValid: true,
  };
}

function makeBar(close: number, volume: number, timestamp: string): MarketDataPoint {
  return {
    symbol: 'ASELS.IS',
    timeframe: '1d',
    open: close * 0.99,
    high: close * 1.01,
    low: close * 0.98,
    close,
    volume,
    timestamp,
    validationStatus: 'valid',
  };
}

function makeBars(): MarketDataPoint[] {
  const bars: MarketDataPoint[] = [];
  for (let i = 0; i < 30; i++) {
    bars.push(makeBar(100 + i, 500_000, `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`));
  }
  return bars;
}

describe('PredictionService', () => {
  let service: PredictionService;
  let marketDataService: { fetchData: jest.Mock };
  let indicatorEngine: { calculateAll: jest.Mock };
  let marketStructureEngine: { analyze: jest.Mock };
  let smartMoneyService: { getSmartMoney: jest.Mock };
  let catalystService: { getCatalyst: jest.Mock };
  let verificationAI: { getVerification: jest.Mock };
  let coreBacktestEngine: { run: jest.Mock };
  let entryZoneEngine: { evaluate: jest.Mock };
  let predictionEngine: { evaluate: jest.Mock };
  let scoreEngine: { score: jest.Mock };
  let registry: { get: jest.Mock; save: jest.Mock; getTop: jest.Mock };

  beforeEach(async () => {
    marketDataService = { fetchData: jest.fn().mockResolvedValue(makeBars()) };
    indicatorEngine = { calculateAll: jest.fn().mockReturnValue([]) };
    marketStructureEngine = {
      analyze: jest.fn().mockReturnValue({
        timeframe: '1d',
        trend: 'uptrend',
        structure: [],
        swingHighs: [],
        swingLows: [],
        supportZones: [],
        resistanceZones: [],
        breakOfStructure: [],
        changeOfCharacter: [],
        metadata: {},
        isValid: true,
      }),
    };
    smartMoneyService = {
      getSmartMoney: jest.fn().mockResolvedValue({
        ticker: 'ASELS.IS',
        timeframe: '1d',
        smartMoneyScore: 93,
        liquidityScore: 78,
        volumeScore: 85,
        accumulationScore: 90,
        distributionScore: 15,
        relativeVolume: 2.4,
        volumeSpike: 2.1,
        volumeSmaTrend: 0.35,
        moneyFlow: 'strong_positive',
        moneyFlowScore: 82,
        institutionalActivity: 'accumulating',
        confidence: 91,
        risk: 'low',
        riskScore: 22,
        liquidity: 'high',
        accumulationLevel: 'very_strong',
        distributionLevel: 'low',
        avgDailyVolume: 2_500_000,
        accumulationDays: 8,
        distributionDays: 2,
        breakoutVolume: true,
        signals: [],
        verification: 'TRUE',
        catalystScore: 90,
        metadata: {},
        generatedAt: new Date().toISOString(),
        isValid: true,
      }),
    };
    catalystService = {
      getCatalyst: jest.fn().mockResolvedValue({ ticker: 'ASELS.IS', catalystScore: 90, confidence: 80 }),
    };
    verificationAI = {
      getVerification: jest.fn().mockResolvedValue({ ticker: 'ASELS.IS', verified: 'TRUE', verificationScore: 90 }),
    };
    coreBacktestEngine = {
      run: jest.fn().mockReturnValue({
        isValid: true,
        performance: { winRate: 68, totalTrades: 12 },
        risk: { sharpeRatio: 1.4 },
      }),
    };
    entryZoneEngine = {
      evaluate: jest.fn().mockReturnValue({
        ticker: 'ASELS.IS',
        company: 'ASELS.IS',
        price: 160,
        idealEntryZone: { min: 158, max: 161 },
        stopLoss: 154,
        target1: 170,
        target2: 177,
        riskRewardRatio: 1.7,
      }),
    };
    predictionEngine = { evaluate: jest.fn().mockReturnValue({ isValid: true, bullishProbability: 91, bearishProbability: 9, neutralProbability: 0, trendStrength: 'strong', trendDirection: 'up', momentum: 'strong_bullish', expectedVolatility: 2.1, expectedReturn: 6.4, liquidityQuality: 'high', risk: 'low', riskScore: 22, signals: [], metadata: {} }) };
    scoreEngine = {
      score: jest.fn().mockImplementation((input) => ({ ...makeResult(input.ticker, input.timeframe) })),
    };
    registry = { get: jest.fn().mockReturnValue(undefined), save: jest.fn((r) => r), getTop: jest.fn().mockReturnValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PredictionService,
        { provide: MarketDataService, useValue: marketDataService },
        { provide: IndicatorEngine, useValue: indicatorEngine },
        { provide: MarketStructureEngine, useValue: marketStructureEngine },
        { provide: SmartMoneyService, useValue: smartMoneyService },
        { provide: CatalystService, useValue: catalystService },
        { provide: VerificationAIService, useValue: verificationAI },
        { provide: CoreBacktestEngine, useValue: coreBacktestEngine },
        { provide: EntryZoneEngine, useValue: entryZoneEngine },
        { provide: PredictionEngine, useValue: predictionEngine },
        { provide: PredictionScoreEngine, useValue: scoreEngine },
        { provide: PredictionRegistry, useValue: registry },
        CacheService,
        {
          provide: IndicatorCacheService,
          useFactory: (cache: CacheService) =>
            new IndicatorCacheService(cache, indicatorEngine as unknown as IndicatorEngine),
          inject: [CacheService],
        },
        {
          provide: RegistryCacheAdapter,
          useFactory: (cache: CacheService) => new RegistryCacheAdapter(cache),
          inject: [CacheService],
        },
      ],
    }).compile();

    service = module.get(PredictionService);
  });

  it('reuses MarketDataService, IndicatorEngine, Backtest and EntryZone on refresh', async () => {
    const result = await service.refreshPrediction('ASELS.IS');

    expect(result.ticker).toBe('ASELS.IS');
    expect(marketDataService.fetchData).toHaveBeenCalledTimes(1);
    expect(indicatorEngine.calculateAll).toHaveBeenCalledTimes(1);
    expect(marketStructureEngine.analyze).toHaveBeenCalledTimes(1);
    expect(coreBacktestEngine.run).toHaveBeenCalledTimes(1);
    expect(entryZoneEngine.evaluate).toHaveBeenCalledTimes(1);
    expect(predictionEngine.evaluate).toHaveBeenCalledTimes(1);
    expect(scoreEngine.score).toHaveBeenCalledTimes(1);
    expect(registry.save).toHaveBeenCalledWith(result);
  });

  it('reuses cached smart money, catalyst and verification results (no duplicates)', async () => {
    await service.refreshPrediction('ASELS.IS');

    expect(smartMoneyService.getSmartMoney).toHaveBeenCalledTimes(1);
    expect(catalystService.getCatalyst).toHaveBeenCalledTimes(1);
    expect(verificationAI.getVerification).toHaveBeenCalledTimes(1);
  });

  it('performs exactly one provider fetch per prediction', async () => {
    await service.refreshPrediction('ASELS.IS');

    expect(marketDataService.fetchData).toHaveBeenCalledWith('ASELS.IS', '1d', expect.anything());
  });

  it('caches results and reuses cache on second get', async () => {
    await service.refreshPrediction('ASELS.IS');
    const first = await service.getPrediction('ASELS.IS');
    const second = await service.getPrediction('ASELS.IS');

    expect(first.ticker).toBe('ASELS.IS');
    expect(second.ticker).toBe('ASELS.IS');
    expect(marketDataService.fetchData).toHaveBeenCalledTimes(2);
  });

  it('returns empty result when no market data', async () => {
    marketDataService.fetchData.mockResolvedValue([]);

    const result = await service.refreshPrediction('ASELS.IS');

    expect(result.isValid).toBe(false);
    expect(result.bullishProbability).toBe(0);
  });

  it('normalizes ticker to uppercase and maps timeframe to data timeframe', async () => {
    await service.getPrediction('asels.is', '1w');

    expect(marketDataService.fetchData).toHaveBeenCalledWith('ASELS.IS', '1w', expect.anything());
  });

  it('returns top results from registry', () => {
    registry.getTop.mockReturnValue([makeResult('ASELS.IS')]);

    const top = service.getTop(5);

    expect(top).toHaveLength(1);
    expect(registry.getTop).toHaveBeenCalledWith(5);
  });
});
