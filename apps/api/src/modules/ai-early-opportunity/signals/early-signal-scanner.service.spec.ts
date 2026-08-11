import { EarlySignalScannerService } from './early-signal-scanner.service';
import { EarlySignalScannerEngine } from './early-signal-scanner.engine';
import { PredictionService } from '../../prediction/prediction.service';
import { SmartMoneyService } from '../../smart-money/smart-money.service';
import { CatalystService } from '../../catalyst/catalyst.service';
import { MarketDataOrchestrator } from '../../market-data/orchestrator/market-data-orchestrator';
import { LatestPriceIncrementalService } from '../../market-data/incremental/latest-price-incremental.service';
import { SymbolRegistryService } from '../../market-data/symbol-registry/symbol-registry.service';
import { MultiTimeframeOpportunityService } from '../multi-timeframe/multi-timeframe.service';
import { FundamentalIntegrationService } from '../../financial-rules/fundamental-integration.service';
import { FinancialDataQualityService } from '../../financial-rules/financial-data-quality.service';
import { CacheService } from '../../../common/cache/cache.service';
import { PredictionResult } from '../../prediction/prediction.types';
import { SmartMoneyScoreResult } from '../../smart-money/smart-money.types';
import { CatalystResult } from '../../catalyst/catalyst.types';
import { MultiTimeframeOpportunityResult } from '../multi-timeframe/multi-timeframe.types';

function makePrediction(ticker: string): PredictionResult {
  return {
    ticker,
    timeframe: '1d',
    dataTimeframe: '1d',
    bullishProbability: 84,
    bearishProbability: 16,
    neutralProbability: 0,
    confidence: 81,
    trendStrength: 'strong',
    trendDirection: 'up',
    momentum: 'bullish',
    expectedReturn: 6.4,
    expectedVolatility: 2,
    risk: 'low',
    riskScore: 20,
    liquidityQuality: 'high',
    expectedHoldingPeriod: { value: 4, unit: 'days' },
    entryZone: { min: 1, max: 2 },
    stopZone: 0.9,
    target1: 2.5,
    target2: 3.0,
    riskRewardRatio: 2.0,
    scenarios: [],
    signals: [],
    backtestAccuracy: { winRate: 0.6, totalTrades: 10, sharpeRatio: 1, isValid: true },
    verification: 'TRUE',
    catalystScore: 70,
    smartMoneyScore: 78,
    metadata: {},
    generatedAt: new Date().toISOString(),
    isValid: true,
  } as PredictionResult;
}

function makeSmartMoney(ticker: string): SmartMoneyScoreResult {
  return {
    ticker,
    timeframe: '1d',
    smartMoneyScore: 78,
    liquidityScore: 80,
    volumeScore: 75,
    accumulationScore: 68,
    distributionScore: 10,
    relativeVolume: 1.8,
    volumeSpike: 2.4,
    volumeSmaTrend: 5,
    moneyFlow: 'positive',
    moneyFlowScore: 70,
    institutionalActivity: 'accumulating',
    confidence: 0.8,
    risk: 'low',
    riskScore: 20,
    liquidity: 'high',
    accumulationLevel: 'strong',
    distributionLevel: 'low',
    avgDailyVolume: 5_000_000,
    accumulationDays: 4,
    distributionDays: 0,
    breakoutVolume: true,
    signals: [],
    verification: 'TRUE',
    catalystScore: 70,
    metadata: {},
    generatedAt: new Date().toISOString(),
    isValid: true,
  };
}

function makeCatalyst(ticker: string): CatalystResult {
  return {
    ticker,
    catalystScore: 88,
    confidence: 0.8,
    expectedImpact: 'very_bullish',
    events: [{
      id: 'evt-1',
      ticker,
      category: 'defense_contract',
      title: 'Yeni savunma sözleşmesi',
      description: 'Sözleşme imzalandı.',
      importance: 'critical' as any,
      verified: true,
      verificationScore: 0.9,
      date: new Date().toISOString(),
      source: 'KAP',
      provider: 'test',
      expectedImpact: 'very_bullish',
      timeHorizon: '1_week',
      confidence: 0.85,
      catalystScore: 92,
      keywords: [],
    }],
    verifiedCount: 1,
    totalCount: 1,
    rawSources: [],
    generatedAt: new Date().toISOString(),
  };
}

function makeMultiTimeframe(ticker: string): MultiTimeframeOpportunityResult {
  return {
    ticker,
    company: 'Test Holding',
    sector: 'Ulaştırma',
    multiTimeframeScore: 82,
    strength: 'Strong',
    strengthLabel: 'Güçlü',
    trendStage: 'Growing',
    holdingType: 'Swing',
    bestTimeframe: '1d',
    worstTimeframe: '6m',
    mostBullishTimeframe: '1w',
    highestConfidenceTimeframe: '1d',
    timeframesAnalyzed: ['1h', '1d', '1w'],
    alignments: {
      timeframeAgreement: 80, trendAlignment: 78, momentumAlignment: 74,
      riskAlignment: 70, confidenceAlignment: 72, smartMoneyAlignment: 76,
      catalystAlignment: 80, macroAlignment: 60, marketStructureAlignment: 75,
    },
    riskSummary: { avgRiskScore: 20, distribution: { low: 3, medium: 0, high: 0 }, maxRisk: 'low', summary: 'Düşük risk.' },
    expectedReturn: 8.2,
    bullishPercent: 78,
    confidence: 0.82,
    entryZone: { min: 12.2, max: 12.6 },
    stop: 11.8,
    target1: 14.2,
    target2: 15.5,
    riskRewardRatio: 2.6,
    reasons: ['Zaman dilimleri hizalı'],
    evaluatedAt: new Date().toISOString(),
  };
}

describe('EarlySignalScannerService', () => {
  let service: EarlySignalScannerService;
  let predictionService: { getPrediction: jest.Mock };
  let smartMoneyService: { getSmartMoney: jest.Mock };
  let catalystService: { getCatalyst: jest.Mock };
  let multiTimeframeService: { analyze: jest.Mock };
  let marketData: any;
  let latestPrice: { getLatestPriceIncremental: jest.Mock };
  let symbolRegistry: { getSymbol: jest.Mock; getActiveSymbols: jest.Mock };
  let cache: CacheService;
  let fundamental: any;
  let mockDataQuality: { assess: jest.Mock };

  beforeEach(() => {
    predictionService = { getPrediction: jest.fn().mockResolvedValue(makePrediction('THYAO')) };
    smartMoneyService = { getSmartMoney: jest.fn().mockResolvedValue(makeSmartMoney('THYAO')) };
    catalystService = { getCatalyst: jest.fn().mockResolvedValue(makeCatalyst('THYAO')) };
    multiTimeframeService = { analyze: jest.fn().mockResolvedValue(makeMultiTimeframe('THYAO')) };
    symbolRegistry = {
      getSymbol: jest.fn().mockReturnValue({ companyName: 'Türk Hava Yolları', sector: 'Ulaştırma' }),
      getActiveSymbols: jest.fn().mockReturnValue([
        { canonicalTicker: 'THYAO', companyName: 'Türk Hava Yolları', sector: 'Ulaştırma' },
        { canonicalTicker: 'ASELS', companyName: 'Aselsan', sector: 'Savunma' },
        { canonicalTicker: 'AKBNK', companyName: 'Akbank', sector: 'Banka' },
      ]),
    };
    marketData = {
      fetchLatestPrice: jest.fn().mockResolvedValue({ data: { symbol: 'THYAO', close: 300, timestamp: new Date().toISOString() }, provider: 'yahoo', fallbackUsed: false, timestamp: new Date().toISOString() }),
      fetchHistoricalData: jest.fn().mockResolvedValue({ data: [], provider: 'yahoo', fallbackUsed: false, timestamp: new Date().toISOString() }),
      getAvailableProviders: jest.fn().mockReturnValue(['yahoo', 'fintables']),
    };
    mockDataQuality = { assess: jest.fn().mockResolvedValue({ status: 'DATA_VERIFIED', qualityScore: 90 }) };
    fundamental = {
      getReportAndMarketCap: jest.fn().mockResolvedValue({
        report: { symbol: 'THYAO', overallStatus: 'PASS', score: 82 } as any,
        marketCap: 5_000_000_000,
      }),
    };
    cache = new CacheService();
    latestPrice = {
      getLatestPriceIncremental: jest.fn().mockResolvedValue({
        symbol: 'THYAO',
        timeframe: '1d',
        price: 105,
        previousPrice: 100,
        change: 5,
        changePercent: 5,
        timestamp: new Date().toISOString(),
        provider: 'yahoo',
        sourceTimeframe: '1d',
        dataFreshness: 'fresh',
        lastSuccessfulUpdate: new Date().toISOString(),
        volume: 1000000,
      }),
    };

    service = new EarlySignalScannerService(
      predictionService as unknown as PredictionService,
      smartMoneyService as unknown as SmartMoneyService,
      catalystService as unknown as CatalystService,
      multiTimeframeService as unknown as MultiTimeframeOpportunityService,
      marketData as unknown as MarketDataOrchestrator,
      latestPrice as unknown as LatestPriceIncrementalService,
      symbolRegistry as unknown as SymbolRegistryService,
      cache,
      new EarlySignalScannerEngine(),
      fundamental as unknown as FundamentalIntegrationService,
      mockDataQuality as unknown as FinancialDataQualityService,
    );
  });

  it('scans a ticker using all cached engines exactly once', async () => {
    const result = await service.scan('thyao');
    expect(result).not.toBeNull();
    expect(result!.ticker).toBe('THYAO');
    expect(result!.company).toBe('Türk Hava Yolları');
    expect(result!.signals.length).toBeGreaterThan(0);
    expect(predictionService.getPrediction).toHaveBeenCalledTimes(1);
    expect(smartMoneyService.getSmartMoney).toHaveBeenCalledTimes(1);
    expect(catalystService.getCatalyst).toHaveBeenCalledTimes(1);
    expect(multiTimeframeService.analyze).toHaveBeenCalledTimes(1);
  });

  it('reuses cached scan result and does not re-fetch providers on second call', async () => {
    await service.scan('THYAO');
    const callsAfterFirst = predictionService.getPrediction.mock.calls.length;
    const second = await service.scan('THYAO');
    expect(second).not.toBeNull();
    expect(predictionService.getPrediction.mock.calls.length).toBe(callsAfterFirst);
  });

  it('returns null when no engine provides data', async () => {
    predictionService.getPrediction.mockResolvedValue(null);
    smartMoneyService.getSmartMoney.mockResolvedValue(null);
    catalystService.getCatalyst.mockResolvedValue(null);
    multiTimeframeService.analyze.mockResolvedValue(null);
    fundamental.getReportAndMarketCap.mockResolvedValue(null);

    const result = await service.scan('THYAO');
    expect(result).toBeNull();
  });

  it('tolerates engine failures and continues with remaining sources', async () => {
    smartMoneyService.getSmartMoney.mockRejectedValue(new Error('provider down'));
    catalystService.getCatalyst.mockRejectedValue(new Error('provider down'));

    const result = await service.scan('THYAO');
    expect(result).not.toBeNull();
    expect(result!.signals.length).toBeGreaterThan(0);
  });

  it('works without the fundamental integration service', async () => {
    const minimal = new EarlySignalScannerService(
      predictionService as unknown as PredictionService,
      smartMoneyService as unknown as SmartMoneyService,
      catalystService as unknown as CatalystService,
      multiTimeframeService as unknown as MultiTimeframeOpportunityService,
      marketData as unknown as MarketDataOrchestrator,
      latestPrice as unknown as LatestPriceIncrementalService,
      symbolRegistry as unknown as SymbolRegistryService,
      cache,
      new EarlySignalScannerEngine(),
      undefined,
      mockDataQuality as unknown as FinancialDataQualityService,
    );
    const result = await minimal.scan('THYAO');
    expect(result).not.toBeNull();
  });

  it('scanTop ranks active symbols by convergence and respects limit', async () => {
    const top = await service.scanTop(2);
    expect(top.length).toBe(2);
    expect(symbolRegistry.getActiveSymbols).toHaveBeenCalled();
    for (const r of top) {
      expect(r.signals.length).toBeGreaterThan(0);
    }
  });

  it('scanTop filters by minSignalConvergence', async () => {
    const top = await service.scanTop(10, { minSignalConvergence: 999 });
    expect(top).toHaveLength(0);
  });

  it('scanTop filters by signal category', async () => {
    const top = await service.scanTop(10, { signalCategory: 'CATALYST' });
    expect(top.length).toBeGreaterThan(0);
    for (const r of top) {
      expect(r.signals.some((s) => s.category === 'CATALYST')).toBe(true);
    }
  });

  it('scanTop does not duplicate provider fetches for repeated calls (cache reuse)', async () => {
    await service.scanTop(3);
    const before = predictionService.getPrediction.mock.calls.length;
    await service.scanTop(3);
    expect(predictionService.getPrediction.mock.calls.length).toBe(before);
  });
});
