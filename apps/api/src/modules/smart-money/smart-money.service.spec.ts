import { Test, TestingModule } from '@nestjs/testing';
import { SmartMoneyService } from './smart-money.service';
import { MarketDataService } from '../market-data/market-data.service';
import { IndicatorEngine } from '../indicators/indicator-engine.service';
import { MarketStructureEngine } from '../market-structure/market-structure.engine';
import { SmartMoneyEngine } from './smart-money.engine';
import { SmartMoneyScoreEngine } from './smart-money-score.engine';
import { SmartMoneyRegistry } from './smart-money-registry';
import { CacheService } from '../../common/cache/cache.service';
import { IndicatorCacheService } from '../indicator-cache/indicator-cache.service';
import { RegistryCacheAdapter } from '../indicator-cache/registry-cache.adapter';
import { CatalystService } from '../catalyst/catalyst.service';
import { VerificationAIService } from '../verification-ai/verification-ai.service';
import { SmartMoneyScoreResult } from './smart-money.types';
import { MarketDataPoint } from '../market-data/interfaces/market-data.types';
import { SmartMoneyResult } from './smart-money.types';

function makeResult(ticker: string): SmartMoneyScoreResult {
  return {
    ticker,
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
    bars.push(makeBar(100 + (i < 29 ? 0 : 3), i < 29 ? 500_000 : 1_500_000, `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`));
  }
  return bars;
}

function makeSmartMoney(): SmartMoneyResult {
  return {
    timeframe: '1d',
    accumulationScore: 0.8,
    distributionScore: 0.2,
    institutionalActivity: 'accumulating',
    smartMoneyConfidence: 0.8,
    trendAlignment: 'uptrend',
    signals: [],
    metadata: {},
    isValid: true,
  };
}

describe('SmartMoneyService', () => {
  let service: SmartMoneyService;
  let marketDataService: { fetchData: jest.Mock };
  let indicatorEngine: { calculateAll: jest.Mock };
  let marketStructureEngine: { analyze: jest.Mock };
  let smartMoneyEngine: { evaluate: jest.Mock };
  let scoreEngine: { score: jest.Mock };
  let registry: { get: jest.Mock; save: jest.Mock; getTop: jest.Mock };
  let catalystService: { getCatalyst: jest.Mock };
  let verificationAI: { getVerification: jest.Mock };

  beforeEach(async () => {
    marketDataService = { fetchData: jest.fn().mockResolvedValue(makeBars()) };
    indicatorEngine = { calculateAll: jest.fn().mockReturnValue([]) };
    marketStructureEngine = { analyze: jest.fn().mockReturnValue({ isValid: true, trend: 'uptrend', structure: [], swingHighs: [], swingLows: [], supportZones: [], resistanceZones: [], breakOfStructure: [], changeOfCharacter: [], metadata: {}, timeframe: '1d' }) };
    smartMoneyEngine = { evaluate: jest.fn().mockReturnValue(makeSmartMoney()) };
    scoreEngine = { score: jest.fn().mockImplementation((input) => ({ ...makeResult(input.ticker) })) };
    registry = { get: jest.fn().mockReturnValue(undefined), save: jest.fn((r) => r), getTop: jest.fn().mockReturnValue([]) };
    catalystService = { getCatalyst: jest.fn().mockResolvedValue({ ticker: 'ASELS.IS', catalystScore: 90 }) };
    verificationAI = { getVerification: jest.fn().mockResolvedValue({ ticker: 'ASELS.IS', verified: 'TRUE' }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmartMoneyService,
        { provide: MarketDataService, useValue: marketDataService },
        { provide: IndicatorEngine, useValue: indicatorEngine },
        { provide: MarketStructureEngine, useValue: marketStructureEngine },
        { provide: SmartMoneyEngine, useValue: smartMoneyEngine },
        { provide: SmartMoneyScoreEngine, useValue: scoreEngine },
        { provide: SmartMoneyRegistry, useValue: registry },
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
        { provide: CatalystService, useValue: catalystService },
        { provide: VerificationAIService, useValue: verificationAI },
      ],
    }).compile();

    service = module.get(SmartMoneyService);
  });

  it('reuses MarketDataService, IndicatorEngine and MarketStructureEngine on refresh', async () => {
    const result = await service.refreshSmartMoney('ASELS.IS');

    expect(result.ticker).toBe('ASELS.IS');
    expect(marketDataService.fetchData).toHaveBeenCalledWith('ASELS.IS', '1d');
    expect(indicatorEngine.calculateAll).toHaveBeenCalledTimes(1);
    expect(marketStructureEngine.analyze).toHaveBeenCalledTimes(1);
    expect(smartMoneyEngine.evaluate).toHaveBeenCalledTimes(1);
    expect(scoreEngine.score).toHaveBeenCalledTimes(1);
    expect(registry.save).toHaveBeenCalledWith(result);
  });

  it('reuses cached verification and catalyst results (no duplicates)', async () => {
    await service.refreshSmartMoney('ASELS.IS');

    expect(verificationAI.getVerification).toHaveBeenCalledTimes(1);
    expect(catalystService.getCatalyst).toHaveBeenCalledTimes(1);
  });

  it('caches results and reuses cache on second get', async () => {
    await service.refreshSmartMoney('ASELS.IS');
    const first = await service.getSmartMoney('ASELS.IS');
    const second = await service.getSmartMoney('ASELS.IS');

    expect(first.ticker).toBe('ASELS.IS');
    expect(second.ticker).toBe('ASELS.IS');
    expect(marketDataService.fetchData).toHaveBeenCalledTimes(2);
    expect(indicatorEngine.calculateAll).toHaveBeenCalledTimes(2);
  });

  it('returns empty result when no market data', async () => {
    marketDataService.fetchData.mockResolvedValue([]);

    const result = await service.refreshSmartMoney('ASELS.IS');

    expect(result.isValid).toBe(false);
    expect(result.smartMoneyScore).toBe(0);
  });

  it('normalizes ticker to uppercase', async () => {
    await service.getSmartMoney('asels.is');

    expect(marketDataService.fetchData).toHaveBeenCalledWith('ASELS.IS', '1d');
  });

  it('returns top results from registry', () => {
    registry.getTop.mockReturnValue([makeResult('ASELS.IS')]);

    const top = service.getTop(5);

    expect(top).toHaveLength(1);
    expect(registry.getTop).toHaveBeenCalledWith(5);
  });
});
