import { EarlyOpportunityIntelligenceService } from './early-opportunity.intelligence.service';
import { EarlyOpportunityIntelligenceEngine } from './early-opportunity.intelligence-engine';
import { EarlyOpportunityService } from './early-opportunity.service';
import { SelfLearningService } from './self-learning/self-learning.service';
import { MarketDataOrchestrator } from '../market-data/orchestrator/market-data-orchestrator';
import { LatestPriceIncrementalService } from '../market-data/incremental/latest-price-incremental.service';
import { MultiTimeframeOpportunityService } from './multi-timeframe/multi-timeframe.service';
import { FundamentalIntegrationService } from '../financial-rules/fundamental-integration.service';
import { FinancialDataQualityService } from '../financial-rules/financial-data-quality.service';
import { FundamentalValidationReport } from '../financial-rules/fundamental-validation.service';
import { PredictionResult } from '../prediction/prediction.types';
import { EarlyOpportunityIntelligenceResult, EarlyOpportunityResult, EarlyScoreComponents } from './early-opportunity.types';
import { EarlySignalScannerService } from './signals/early-signal-scanner.service';
import { EarlySignalScannerResult } from './signals/early-signal.types';

function makePrediction(ticker: string, bullish: number, confidence = 80): PredictionResult {
  return {
    ticker,
    timeframe: '1d',
    dataTimeframe: '1d',
    bullishProbability: bullish,
    bearishProbability: 100 - bullish,
    neutralProbability: 0,
    confidence,
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

function components(): EarlyScoreComponents {
  return {
    bullishProbability: 85,
    confidence: 85,
    expectedReturn: 32,
    riskAdjustedReturn: 27,
    smartMoneyScore: 78,
    catalystScore: 70,
    verification: true,
    researchScore: 77,
    eliteScore: 70,
    backtestWinRate: 60,
    opportunityScore: 82,
    decisionScore: 80,
    timeframeAgreement: 100,
  };
}

interface Detailed {
  input: { ticker: string; company: string; sector: string; predictions: PredictionResult[]; consensus: unknown; eliteScore: unknown; opportunity: unknown; decision: unknown };
  result: EarlyOpportunityResult;
}

function detailed(ticker: string, score = 85, conf = 85, sector = 'Banka', bullish = 90, marketCap = 50000000000): Detailed {
  return {
    input: {
      ticker,
      company: `${ticker} Co`,
      sector,
      predictions: [makePrediction(ticker, bullish, conf)],
      consensus: null,
      eliteScore: null,
      opportunity: null,
      decision: null,
    },
    result: {
      ticker,
      company: `${ticker} Co`,
      sector,
      score,
      level: 'GÜÇLÜ_FIRSAT',
      levelLabel: 'G',
      levelEmoji: '🟢',
      confidence: conf,
      components: components(),
      timeframesEvaluated: ['1d'],
      reasons: ['Yüksek yaşıl olasılık (multi-timeframe)'],
      evaluatedAt: new Date().toISOString(),
    },
  };
}

function makeSignalScan(ticker: string, convergenceScore: number): EarlySignalScannerResult {
  const sig = {
    id: `${ticker}:PRICE_VOLUME:BREAKOUT`,
    ticker,
    category: 'PRICE_VOLUME' as const,
    type: 'BREAKOUT',
    phase: 'EARLY' as const,
    strength: 82,
    strengthLabel: 'Very Strong' as const,
    priority: 'MEDIUM' as const,
    description: 'Breakout sinyali',
    sourceFields: ['close'],
    detectedAt: new Date().toISOString(),
  };
  return {
    ticker,
    company: 'Test Co',
    sector: 'Teknoloji',
    signals: [sig],
    convergence: {
      convergenceScore,
      totalSignals: 1,
      strongSignalCount: 1,
      earlyCount: 1,
      confirmedCount: 0,
      categoryCoverage: 1,
      avgStrength: 82,
      confirmedShare: 0,
      strongestSignals: [sig],
    },
    dataQualityStatus: 'DATA_VERIFIED',
    scannedAt: new Date().toISOString(),
  };
}

describe('EarlyOpportunityIntelligenceService', () => {
  let service: EarlyOpportunityIntelligenceService;
  let earlyOpportunityService: { scanAllDetailed: jest.Mock; scanTickerDetailed: jest.Mock };
  let intelligenceEngine: EarlyOpportunityIntelligenceEngine;
  let selfLearningService: { runLearningCycle: jest.Mock; getAllModifiers: jest.Mock };
  let marketData: { fetchCompany: jest.Mock; fetchLatestPrice: jest.Mock; fetchHistoricalData: jest.Mock; getAvailableProviders: jest.Mock };
  let latestPrice: { getLatestPriceIncremental: jest.Mock };
  let multiTimeframeService: { analyze: jest.Mock };
  let mockDataQuality: { assess: jest.Mock; explain: jest.Mock };
  let signalScanner: { scan: jest.Mock };

  beforeEach(() => {
    earlyOpportunityService = { scanAllDetailed: jest.fn(), scanTickerDetailed: jest.fn() };
    intelligenceEngine = new EarlyOpportunityIntelligenceEngine();
    selfLearningService = {
      runLearningCycle: jest.fn().mockResolvedValue({ scanned: 0, updated: 0, modifiers: [], generatedAt: '' }),
      getAllModifiers: jest.fn().mockReturnValue([]),
    };
    mockDataQuality = {
      assess: jest.fn().mockResolvedValue({
        ticker: 'AAA',
        qualityScore: 90,
        status: 'DATA_VERIFIED',
        freshness: { price: 'fresh', fundamental: 'fresh', research: 'fresh', overall: 'fresh' },
        freshnessScore: 90,
        marketDataScore: 90,
        marketIntegrity: { valid: true, errors: [], warnings: [] },
        fundamental: { status: 'PASS', score: 85, dataQuality: 'VALID' },
        fundamentalDataScore: 85,
        providers: { price: 'yahoo', fundamental: 'fintables', research: ['chatgpt'], fallbackUsed: false, attemptedAt: [] },
        providerConsistencyScore: 90,
        providerConsistencyStatus: 'consistent',
        conflicts: [],
        completenessScore: 100,
        missingFields: [],
        integrityScore: 90,
        warnings: [],
        errors: [],
        timestamp: new Date().toISOString(),
      }),
      explain: jest.fn().mockReturnValue('Veri kalitesi yüksek.'),
    };
    marketData = {
      fetchCompany: jest.fn(),
      fetchLatestPrice: jest.fn().mockResolvedValue({ data: { symbol: 'AAA', close: 100, timestamp: new Date().toISOString() }, provider: 'yahoo', cached: false, timestamp: new Date().toISOString() }),
      fetchHistoricalData: jest.fn().mockResolvedValue({ data: [], provider: 'yahoo', cached: false, timestamp: new Date().toISOString() }),
      getAvailableProviders: jest.fn().mockReturnValue(['yahoo', 'fintables']),
    };
    latestPrice = {
      getLatestPriceIncremental: jest.fn().mockResolvedValue({
        symbol: 'AAA',
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
    multiTimeframeService = { analyze: jest.fn().mockResolvedValue(null) };
    signalScanner = { scan: jest.fn().mockResolvedValue(null) };

    service = new EarlyOpportunityIntelligenceService(
      earlyOpportunityService as unknown as EarlyOpportunityService,
      intelligenceEngine,
      selfLearningService as unknown as SelfLearningService,
      marketData as unknown as MarketDataOrchestrator,
      latestPrice as unknown as LatestPriceIncrementalService,
      multiTimeframeService as unknown as MultiTimeframeOpportunityService,
      undefined,
      signalScanner as unknown as EarlySignalScannerService,
      mockDataQuality as unknown as FinancialDataQualityService,
    );
  });

  it('scans all, enriches market cap, and returns top results', async () => {
    earlyOpportunityService.scanAllDetailed.mockResolvedValue([detailed('AAA')]);
    marketData.fetchCompany.mockResolvedValue({ data: { marketCap: 50000000000 } });

    const results: EarlyOpportunityIntelligenceResult[] = await service.getEarlyOpportunities(
      { minConfidence: 80 },
      { limit: 5, runLearning: false },
    );

    expect(results).toHaveLength(1);
    const r = results[0];
    expect(r.ticker).toBe('AAA');
    expect(r.marketCap).toBe(50000000000);
    expect(r.entryZone).toEqual({ min: 1, max: 2 });
    expect(r.stop).toBe(0.9);
    expect(r.target1).toBe(2.5);
    expect(r.target2).toBe(3.0);
    expect(r.holdingPeriod).toEqual({ value: 4, unit: 'days' });
    expect(r.verificationStatus).toBe('verified');
    expect(r.earlyOpportunityScore).toBe(85);
    expect(r.bullishPercent).toBe(90);
    expect(r.risk).toBe('low');
    expect(r.researchConsensus).toBeNull();
  });

  it('excludes results failing the filter', async () => {
    earlyOpportunityService.scanAllDetailed.mockResolvedValue([detailed('LOW', 20, 30, 'X', 30)]);
    marketData.fetchCompany.mockResolvedValue({ data: { marketCap: 100 } });
    const results = await service.getEarlyOpportunities({ minEarlyOpportunityScore: 50 }, { runLearning: false });
    expect(results).toHaveLength(0);
  });

  it('respects limit', async () => {
    earlyOpportunityService.scanAllDetailed.mockResolvedValue([
      detailed('A'), detailed('B'), detailed('C'), detailed('D'), detailed('E'),
    ]);
    marketData.fetchCompany.mockResolvedValue({ data: { marketCap: 100 } });
    const results = await service.getEarlyOpportunities({}, { limit: 3, runLearning: false });
    expect(results).toHaveLength(3);
  });

  it('filters by sector', async () => {
    earlyOpportunityService.scanAllDetailed.mockResolvedValue([
      detailed('A', 90, 90, 'Banka'),
      detailed('B', 90, 90, 'Tekstil'),
    ]);
    marketData.fetchCompany.mockResolvedValue({ data: { marketCap: 100 } });
    const results = await service.getEarlyOpportunities({ sector: 'banka' }, { runLearning: false });
    expect(results).toHaveLength(1);
    expect(results[0].ticker).toBe('A');
  });

  it('enriches results with signals when scanner is available', async () => {
    earlyOpportunityService.scanAllDetailed.mockResolvedValue([detailed('AAA')]);
    marketData.fetchCompany.mockResolvedValue({ data: { marketCap: 100 } });
    signalScanner.scan.mockResolvedValue(makeSignalScan('AAA', 84));

    const results = await service.getEarlyOpportunities({}, { limit: 5, runLearning: false });
    expect(results).toHaveLength(1);
    expect(results[0].signals.length).toBeGreaterThan(0);
    expect(results[0].signalConvergenceScore).toBe(84);
    expect(results[0].earlySignalCount).toBeGreaterThan(0);
  });

  it('filters by minSignalConvergence using attached signals', async () => {
    earlyOpportunityService.scanAllDetailed.mockResolvedValue([detailed('AAA')]);
    marketData.fetchCompany.mockResolvedValue({ data: { marketCap: 100 } });
    signalScanner.scan.mockResolvedValue(makeSignalScan('AAA', 70));

    const pass = await service.getEarlyOpportunities(
      { minSignalConvergence: 70 },
      { limit: 5, runLearning: false },
    );
    expect(pass).toHaveLength(1);

    const fail = await service.getEarlyOpportunities(
      { minSignalConvergence: 71 },
      { limit: 5, runLearning: false },
    );
    expect(fail).toHaveLength(0);
  });

  it('exposes signals on single-ticker intelligence', async () => {
    earlyOpportunityService.scanTickerDetailed.mockResolvedValue(detailed('AAA'));
    signalScanner.scan.mockResolvedValue(makeSignalScan('AAA', 91));

    const result = await service.getEarlyOpportunity('AAA');
    expect(result).not.toBeNull();
    expect(result!.signalConvergenceScore).toBe(91);
    expect(result!.topSignals.length).toBeGreaterThan(0);
  });

  it('tolerates a failing signal scanner without breaking results', async () => {
    earlyOpportunityService.scanAllDetailed.mockResolvedValue([detailed('AAA')]);
    marketData.fetchCompany.mockResolvedValue({ data: { marketCap: 100 } });
    signalScanner.scan.mockRejectedValue(new Error('scanner down'));

    const results = await service.getEarlyOpportunities({}, { limit: 5, runLearning: false });
    expect(results).toHaveLength(1);
    expect(results[0].signals).toEqual([]);
    expect(results[0].signalConvergenceScore).toBe(0);
  });

  it('filters by marketCap range', async () => {
    earlyOpportunityService.scanAllDetailed.mockResolvedValue([
      detailed('BIG', 90, 90, 'Banka', 90, 200000000000),
      detailed('SMALL', 90, 90, 'Banka', 90, 50000000000),
    ]);
    marketData.fetchCompany.mockImplementation(async (_t: string) => ({ data: { marketCap: 0 } }));
    const results = await service.getEarlyOpportunities({ marketCap: { min: 1 } }, { runLearning: false });
    expect(results).toHaveLength(0);

    marketData.fetchCompany.mockImplementation(async (t: string) => ({ data: { marketCap: t === 'BIG' ? 200000000000 : 50000000000 } }));
    const filtered = await service.getEarlyOpportunities({ marketCap: { min: 100000000000 } }, { runLearning: false });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].ticker).toBe('BIG');
  });

  it('runs learning cycle by default', async () => {
    earlyOpportunityService.scanAllDetailed.mockResolvedValue([] as never);
    await service.getEarlyOpportunities({}, { limit: 1 });
    expect(selfLearningService.runLearningCycle).toHaveBeenCalled();
  });

  it('skips learning cycle when runLearning: false', async () => {
    earlyOpportunityService.scanAllDetailed.mockResolvedValue([] as never);
    await service.getEarlyOpportunities({}, { limit: 1, runLearning: false });
    expect(selfLearningService.runLearningCycle).not.toHaveBeenCalled();
  });

  it('applies learning modifiers to ranking (higher modifier ranks first)', async () => {
    const a = detailed('A', 80, 80, 'Banka', 80, 100);
    const b = detailed('B', 90, 90, 'Banka', 90, 100);
    earlyOpportunityService.scanAllDetailed.mockResolvedValue([a, b]);
    marketData.fetchCompany.mockResolvedValue({ data: { marketCap: 100 } });
    // A has a big boost, B none.
    selfLearningService.getAllModifiers.mockReturnValue([
      { ticker: 'A', modifier: 1.15, predictedBullish: 80, realizedWinRate: 0.95, rationale: 'rich', lastUpdated: '' },
    ]);
    const results = await service.getEarlyOpportunities({}, { limit: 5, runLearning: false });
    expect(results[0].ticker).toBe('A');
  });

  it('getEarlyOpportunity enriches a single ticker', async () => {
    earlyOpportunityService.scanTickerDetailed.mockResolvedValue(detailed('AAA'));
    marketData.fetchCompany.mockResolvedValue({ data: { marketCap: 99 } });
    const r = await service.getEarlyOpportunity('AAA');
    expect(r).not.toBeNull();
    expect(r!.ticker).toBe('AAA');
    expect(r!.marketCap).toBe(99);
    expect(r!.bullishPercent).toBe(90);
  });

  it('returns null when scanTickerDetailed returns null', async () => {
    earlyOpportunityService.scanTickerDetailed.mockResolvedValue(null);
    const r = await service.getEarlyOpportunity('NOPE');
    expect(r).toBeNull();
  });

  it('explain returns null for unknown ticker', async () => {
    earlyOpportunityService.scanTickerDetailed.mockResolvedValue(null);
    await expect(service.explain('NOPE')).resolves.toBeNull();
  });

  it('explain returns deterministic narrative for known ticker', async () => {
    earlyOpportunityService.scanTickerDetailed.mockResolvedValue(detailed('AAA'));
    marketData.fetchCompany.mockResolvedValue({ data: { marketCap: 99 } });
    const nar = await service.explain('AAA');
    expect(nar).not.toBeNull();
    expect(nar!).toContain('AAA');
    expect(nar!).toContain('doğrulandı');
  });

  describe('with FundamentalIntegrationService injected', () => {
    let fundamental: { getReportAndMarketCap: jest.Mock };
    let serviceWithFundamental: EarlyOpportunityIntelligenceService;
    let mockDataQuality: { assess: jest.Mock; explain: jest.Mock };

    const reportFor = (ticker: string, score = 88, status: 'PASS' | 'WATCH' | 'FAIL' | 'UNKNOWN' = 'PASS'): FundamentalValidationReport =>
      ({
        symbol: ticker,
        overallStatus: status,
        score,
        availableFilters: [],
        unknownFilters: [],
        reasons: [`${ticker} fundamental: ${status}`],
        pdDd: { id: 'price_to_book', name: 'PD/DD', availability: 'AVAILABLE', status, value: 1.2, thresholds: null, reason: '' },
        fdFavok: { id: 'ev_to_ebitda', name: 'FD/FAVÖK', availability: 'AVAILABLE', status, value: 5, thresholds: null, reason: '' },
        netProfitGrowth: { id: 'net_profit_growth', name: 'Net Kar Büyüme', availability: 'AVAILABLE', status, value: 10, thresholds: null, reason: '' },
        equityGrowth: { id: 'equity_growth', name: 'Sermaye Büyüme', availability: 'AVAILABLE', status, value: 5, thresholds: null, reason: '' },
        debtRatio: { id: 'debt_ratio', name: 'Borç Oranı', availability: 'AVAILABLE', status, value: 0.1, thresholds: null, reason: '' },
        sectorRelative: { id: 'sector_comparison', name: 'Sektöre Göre', availability: 'AVAILABLE', status, value: 0, thresholds: null, reason: '' },
      }) as unknown as FundamentalValidationReport;

    beforeEach(() => {
      fundamental = { getReportAndMarketCap: jest.fn() };
      mockDataQuality = {
        assess: jest.fn().mockResolvedValue({
          ticker: 'AAA',
          qualityScore: 90,
          status: 'DATA_VERIFIED',
          freshness: { price: 'fresh', fundamental: 'fresh', research: 'fresh', overall: 'fresh' },
          freshnessScore: 90,
          marketDataScore: 90,
          marketIntegrity: { valid: true, errors: [], warnings: [] },
          fundamental: { status: 'PASS', score: 85, dataQuality: 'VALID' },
          fundamentalDataScore: 85,
          providers: { price: 'yahoo', fundamental: 'fintables', research: ['chatgpt'], fallbackUsed: false, attemptedAt: [] },
          providerConsistencyScore: 90,
          providerConsistencyStatus: 'consistent',
          conflicts: [],
          completenessScore: 100,
          missingFields: [],
          integrityScore: 90,
          warnings: [],
          errors: [],
          timestamp: new Date().toISOString(),
        }),
        explain: jest.fn().mockReturnValue('Veri kalitesi yüksek.'),
      };
      multiTimeframeService.analyze.mockResolvedValue(null);
      serviceWithFundamental = new EarlyOpportunityIntelligenceService(
        earlyOpportunityService as unknown as EarlyOpportunityService,
        intelligenceEngine,
        selfLearningService as unknown as SelfLearningService,
        marketData as unknown as MarketDataOrchestrator,
        latestPrice as unknown as LatestPriceIncrementalService,
        multiTimeframeService as unknown as MultiTimeframeOpportunityService,
        fundamental as unknown as FundamentalIntegrationService,
        undefined,
        mockDataQuality as unknown as FinancialDataQualityService,
      );
    });

    it('populates fundamentals from the bundle and uses its marketCap (single acquisition)', async () => {
      earlyOpportunityService.scanAllDetailed.mockResolvedValue([detailed('AAA')]);
      fundamental.getReportAndMarketCap.mockResolvedValue({
        report: reportFor('AAA', 90),
        marketCap: 77_000_000_000,
        dataQuality: 'VALID',
      });

      const results = await serviceWithFundamental.getEarlyOpportunities({}, { runLearning: false });

      expect(results).toHaveLength(1);
      expect(results[0].fundamentals).not.toBeNull();
      expect(results[0].fundamentals!.score).toBe(90);
      expect(results[0].marketCap).toBe(77_000_000_000);
      expect(marketData.fetchCompany).not.toHaveBeenCalled();
    });

    it('falls back to fetchMarketCap when the bundle has no marketCap', async () => {
      earlyOpportunityService.scanAllDetailed.mockResolvedValue([detailed('AAA')]);
      fundamental.getReportAndMarketCap.mockResolvedValue({ report: reportFor('AAA'), marketCap: null, dataQuality: null });
      marketData.fetchCompany.mockResolvedValue({ data: { marketCap: 12 } });

      const results = await serviceWithFundamental.getEarlyOpportunities({}, { runLearning: false });

      expect(results[0].marketCap).toBe(12);
      expect(marketData.fetchCompany).toHaveBeenCalledWith('AAA');
    });

    it('filters by minFundamentalScore', async () => {
      earlyOpportunityService.scanAllDetailed.mockResolvedValue([detailed('AAA')]);
      fundamental.getReportAndMarketCap.mockResolvedValue({ report: reportFor('AAA', 40), marketCap: 1, dataQuality: 'VALID' });

      const results = await serviceWithFundamental.getEarlyOpportunities(
        { minFundamentalScore: 50 },
        { runLearning: false },
      );
      expect(results).toHaveLength(0);
    });

    it('filters by fundamentalStatus', async () => {
      earlyOpportunityService.scanAllDetailed.mockResolvedValue([detailed('AAA'), detailed('BBB')]);
      fundamental.getReportAndMarketCap.mockImplementation(async (t: string) => ({
        report: reportFor(t, t === 'AAA' ? 80 : 45, t === 'AAA' ? 'PASS' : 'FAIL'),
        marketCap: 1,
        dataQuality: 'VALID',
      }));

      const results = await serviceWithFundamental.getEarlyOpportunities(
        { fundamentalStatus: 'PASS' },
        { runLearning: false },
      );
      expect(results.map((r) => r.ticker)).toEqual(['AAA']);
    });

    it('getEarlyOpportunity includes fundamentals for a single ticker', async () => {
      earlyOpportunityService.scanTickerDetailed.mockResolvedValue(detailed('AAA'));
      fundamental.getReportAndMarketCap.mockResolvedValue({ report: reportFor('AAA', 88), marketCap: 5, dataQuality: null });

      const r = await serviceWithFundamental.getEarlyOpportunity('AAA');
      expect(r).not.toBeNull();
      expect(r!.fundamentals).not.toBeNull();
      expect(r!.fundamentals!.score).toBe(88);
      expect(r!.marketCap).toBe(5);
    });
  });
});
