import { DailyMarketScanService } from './daily-market-scan.service';
import { MarketScannerEngine } from './market-scanner.engine';
import { OpportunityRadarService } from './opportunity-radar.service';
import { CacheService } from '../../common/cache/cache.service';
import { AnalysisService } from '../analysis-pipeline/analysis.service';
import { MarketDataOrchestrator } from '../market-data/orchestrator/market-data-orchestrator';
import { AnalysisResult } from '../analysis-pipeline/analysis-pipeline.types';
import { MarketDataPoint } from '../market-data/interfaces';
import { DailyScanConfig } from './daily-scan.config';

function makeAnalysisResult(symbol: string, eliteScore: number): AnalysisResult {
  return {
    symbol,
    timeframe: '1d',
    indicators: [],
    marketStructure: {
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
    },
    smartMoney: {
      timeframe: '1d',
      accumulationScore: 0,
      distributionScore: 0,
      institutionalActivity: 'neutral',
      smartMoneyConfidence: 0,
      trendAlignment: 'sideways',
      signals: [],
      metadata: {},
      isValid: false,
    },
    technicalRules: { timeframe: '1d', rules: [], isValid: true },
    technicalScore: {
      timeframe: '1d',
      score: 60,
      grade: 'B',
      confidence: 0.6,
      ruleBreakdown: [],
      metadata: {},
      isValid: true,
    },
    technicalSummary: {
      timeframe: '1d',
      summary: 'Ok',
      overallOpinion: 'Bullish',
      strengths: [],
      weaknesses: [],
      risks: [],
      recommendations: [],
      metadata: {},
      isValid: true,
    },
    financialScore: {
      symbol,
      score: 60,
      grade: 'B',
      passedRules: 0,
      warningRules: 0,
      failedRules: 0,
      confidence: 0.6,
      breakdown: { items: [], totalWeight: 0 },
      dataStatus: 'UNAVAILABLE',
    },
    financialRules: { symbol, rules: [] },
    financialSummary: {
      summary: '',
      strengths: [],
      weaknesses: [],
      risks: [],
      positives: [],
      overallOpinion: '',
    },
    confluence: {
      confluenceScore: 60,
      agreement: 'HIGH',
      financialAlignment: { score: 60, direction: 'bullish', confidence: 0.6, factors: [] },
      technicalAlignment: { score: 60, direction: 'bullish', confidence: 0.6, factors: [] },
      smartMoneyAlignment: { score: 0, direction: 'neutral', confidence: 0, factors: [] },
      trendAlignment: { score: 60, direction: 'bullish', confidence: 0.6, factors: [] },
      confidence: 0.6,
      metadata: {},
      isValid: true,
    },
    candidate: {
      candidate: true,
      candidateScore: 60,
      priority: 'HIGH',
      reasons: [],
      confidence: 0.6,
      metadata: {},
      isValid: true,
    },
    opportunity: {
      opportunityScore: eliteScore - 20,
      earlyOpportunity: true,
      opportunityLevel: 'HIGH',
      confidence: 0.6,
      strengths: [],
      riskFactors: [],
      reasons: [],
      metadata: {},
      isValid: true,
    },
    eliteScore: {
      eliteScore,
      rating: 'A',
      priority: 'HIGH',
      confidence: 0.6,
      earlyOpportunity: true,
      summary: '',
      breakdown: {
        financial: { score: 60, weight: 20, contribution: 12 },
        technical: { score: 60, weight: 20, contribution: 12 },
        opportunity: { score: eliteScore - 20, weight: 25, contribution: (eliteScore - 20) * 0.25 },
        confluence: { score: 60, weight: 25, contribution: 15 },
        candidate: { score: 60, weight: 15, contribution: 9 },
      },
      metadata: {},
      isValid: true,
    },
    pipelineSteps: [],
    metadata: {},
    isValid: true,
  };
}

function makePoints(
  symbol: string,
  timeframe: MarketDataPoint['timeframe'],
  count = 60,
  startClose = 100,
): MarketDataPoint[] {
  const points: MarketDataPoint[] = [];
  for (let i = 0; i < count; i++) {
    const close = startClose + i;
    points.push({
      symbol,
      timeframe,
      open: close,
      high: close + 1,
      low: close - 1,
      close,
      volume: 1_000_000 + i * 1000,
      timestamp: new Date(Date.UTC(2026, 0, 1 + i)).toISOString(),
      validationStatus: 'valid',
    });
  }
  return points;
}

class MockCache {
  store = new Map<string, unknown>();
  enabled = true;
  get<T = any>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }
  set<T = any>(key: string, value: T): boolean {
    this.store.set(key, value);
    return true;
  }
}

function makeOrchestrator(symbols: string[]): Partial<MarketDataOrchestrator> {
  return {
    discoverUniverse: jest.fn().mockResolvedValue({
      discoveredCount: symbols.length,
      validatedCount: symbols.length,
      invalidCount: 0,
      unavailableCount: 0,
      byStatus: { AVAILABLE: symbols.length },
      symbols: symbols.map((ticker, i) => ({
        ticker,
        yahooTicker: `${ticker}.IS`,
        status: 'AVAILABLE',
        instrumentType: 'EQUITY',
        sector: null,
        currency: 'TRY',
        hasPriceData: true,
        hasVolumeData: true,
        coverage: 'FULL',
      })),
      timestamp: '2026-01-01T00:00:00.000Z',
      source: 'BIST_MASTER_REGISTRY',
    }),
    fetchHistoricalData: jest.fn(async (ticker: string, timeframe: string) => {
      const symbol = ticker.replace('.IS', '');
      return {
        data: makePoints(symbol, timeframe as MarketDataPoint['timeframe']),
        provider: 'Yahoo',
        cached: false,
        timestamp: '2026-01-01T00:00:00.000Z',
      };
    }),
  };
}

describe('DailyMarketScanService', () => {
  it('runs a complete scan and stores a ranked snapshot', async () => {
    const engine = new MarketScannerEngine();
    const radar = new OpportunityRadarService();
    const cache = new MockCache();
    const orchestrator = makeOrchestrator(['THYAO', 'AKBNK', 'ASELS']);
    const analysisService = {
      analyzeSymbol: jest.fn(async (symbol: string) => {
        const score = symbol === 'THYAO' ? 85 : symbol === 'AKBNK' ? 70 : 45;
        return makeAnalysisResult(symbol, score);
      }),
    };

    const service = new DailyMarketScanService(
      engine,
      radar,
      orchestrator as unknown as MarketDataOrchestrator,
      cache as unknown as CacheService,
      analysisService as unknown as AnalysisService,
      undefined,
      { snapshotNamespace: 'scannerSnapshots', snapshotTtlMs: 60000 },
    );

    const response = await service.runDailyScan();

    expect(response.status).toBe('COMPLETE');
    expect(response.summary.evaluatedCount).toBe(3);
    expect(response.summary.availableCount).toBe(3);
    expect(response.summary.failedCount).toBe(0);

    const snapshot = service.getLatestSnapshot();
    expect(snapshot).not.toBeNull();
    expect(snapshot!.results).toHaveLength(3);
    expect(snapshot!.results[0].symbol).toBe('THYAO');
    expect(snapshot!.results[0].eliteScore).toBe(85);
    expect(snapshot!.results[0].rank).toBe(1);
  });

  it('satisfies the invariants signalCount <= eligibleCount <= evaluatedCount', async () => {
    const engine = new MarketScannerEngine();
    const radar = new OpportunityRadarService();
    const cache = new MockCache();
    const orchestrator = makeOrchestrator(['THYAO', 'AKBNK', 'ASELS']);
    const analysisService = {
      analyzeSymbol: jest.fn(async (symbol: string) => {
        const score = symbol === 'THYAO' ? 85 : symbol === 'AKBNK' ? 70 : 45;
        return makeAnalysisResult(symbol, score);
      }),
    };

    const service = new DailyMarketScanService(
      engine,
      radar,
      orchestrator as unknown as MarketDataOrchestrator,
      cache as unknown as CacheService,
      analysisService as unknown as AnalysisService,
    );
    const response = await service.runDailyScan();

    const s = response.summary;
    expect(s.signalCount).toBeLessThanOrEqual(s.eligibleCount);
    expect(s.eligibleCount).toBeLessThanOrEqual(s.evaluatedCount);
  });

  it('preserves previous snapshot and compares it to the current one', async () => {
    const engine = new MarketScannerEngine();
    const radar = new OpportunityRadarService();
    const cache = new MockCache();
    const orchestrator = makeOrchestrator(['THYAO', 'AKBNK']);
    const analysisService = {
      analyzeSymbol: jest.fn(async (symbol: string) => {
        const score = symbol === 'THYAO' ? 85 : 70;
        return makeAnalysisResult(symbol, score);
      }),
    };

    const service = new DailyMarketScanService(
      engine,
      radar,
      orchestrator as unknown as MarketDataOrchestrator,
      cache as unknown as CacheService,
      analysisService as unknown as AnalysisService,
    );

    const first = await service.runDailyScan();
    const second = await service.runDailyScan();

    const current = cache.get('current');
    const previous = cache.get('previous');
    expect(current).toBeDefined();
    expect(previous).toBeDefined();
    expect((previous as { scanId: string }).scanId).toBe(first.scanId);
    expect((current as { scanId: string }).scanId).toBe(second.scanId);

    const events = service.getLatestRadarEvents();
    expect(Array.isArray(events)).toBe(true);
  });

  it('does not fail the whole scan when a single symbol analysis fails', async () => {
    const engine = new MarketScannerEngine();
    const radar = new OpportunityRadarService();
    const cache = new MockCache();
    const orchestrator = makeOrchestrator(['THYAO', 'AKBNK', 'ASELS']);
    const analysisService = {
      analyzeSymbol: jest.fn(async (symbol: string) => {
        if (symbol === 'AKBNK') throw new Error('provider timeout');
        return makeAnalysisResult(symbol, 75);
      }),
    };

    const service = new DailyMarketScanService(
      engine,
      radar,
      orchestrator as unknown as MarketDataOrchestrator,
      cache as unknown as CacheService,
      analysisService as unknown as AnalysisService,
    );

    const response = await service.runDailyScan();

    expect(response.status).toBe('PARTIAL');
    expect(response.summary.availableCount).toBe(2);
    expect(response.summary.failedCount).toBe(1);
    expect(response.summary.evaluatedCount).toBe(3);
  });

  it('respects maxSymbols to bound provider load', async () => {
    const engine = new MarketScannerEngine();
    const radar = new OpportunityRadarService();
    const cache = new MockCache();
    const orchestrator = makeOrchestrator(['THYAO', 'AKBNK', 'ASELS']);
    const analysisService = {
      analyzeSymbol: jest.fn(async (symbol: string) => makeAnalysisResult(symbol, 70)),
    };

    const service = new DailyMarketScanService(
      engine,
      radar,
      orchestrator as unknown as MarketDataOrchestrator,
      cache as unknown as CacheService,
      analysisService as unknown as AnalysisService,
    );

    const response = await service.runDailyScan({ maxSymbols: 2 });

    expect(response.summary.evaluatedCount).toBe(2);
    expect(analysisService.analyzeSymbol).toHaveBeenCalledTimes(2);
  });

  it('excludes non-equity / unavailable symbols from the candidate set', async () => {
    const engine = new MarketScannerEngine();
    const radar = new OpportunityRadarService();
    const cache = new MockCache();
    const orchestrator: Partial<MarketDataOrchestrator> = {
      discoverUniverse: jest.fn().mockResolvedValue({
        discoveredCount: 3,
        validatedCount: 2,
        invalidCount: 0,
        unavailableCount: 1,
        byStatus: { AVAILABLE: 2, UNAVAILABLE: 1 },
        symbols: [
          {
            ticker: 'THYAO',
            yahooTicker: 'THYAO.IS',
            status: 'AVAILABLE',
            instrumentType: 'EQUITY',
            sector: null,
            currency: 'TRY',
            hasPriceData: true,
            hasVolumeData: true,
            coverage: 'FULL',
          },
          {
            ticker: 'XFIN',
            yahooTicker: 'XFIN.IS',
            status: 'UNAVAILABLE',
            instrumentType: 'INDEX',
            sector: null,
            currency: 'TRY',
            hasPriceData: false,
            hasVolumeData: false,
            coverage: 'UNAVAILABLE',
          },
          {
            ticker: 'BONDO',
            yahooTicker: 'BONDO.IS',
            status: 'AVAILABLE',
            instrumentType: null,
            sector: null,
            currency: 'TRY',
            hasPriceData: true,
            hasVolumeData: false,
            coverage: 'PARTIAL',
          },
        ],
        timestamp: '2026-01-01T00:00:00.000Z',
        source: 'BIST_MASTER_REGISTRY',
      }),
      fetchHistoricalData: jest.fn(async (ticker: string, timeframe: string) => {
        const symbol = ticker.replace('.IS', '');
        return {
          data: makePoints(symbol, timeframe as MarketDataPoint['timeframe']),
          provider: 'Yahoo',
          cached: false,
          timestamp: '2026-01-01T00:00:00.000Z',
        };
      }),
    };
    const analysisService = {
      analyzeSymbol: jest.fn(async (symbol: string) => makeAnalysisResult(symbol, 70)),
    };

    const service = new DailyMarketScanService(
      engine,
      radar,
      orchestrator as unknown as MarketDataOrchestrator,
      cache as unknown as CacheService,
      analysisService as unknown as AnalysisService,
    );

    const response = await service.runDailyScan();

    // Only THYAO (AVAILABLE + equity-registered) is a candidate; XFIN (UNAVAILABLE)
    // and BONDO (null instrument type) are excluded.
    expect(response.summary.evaluatedCount).toBe(1);
    expect(response.summary.unavailableCount).toBe(1);
    const snapshot = service.getLatestSnapshot();
    expect(snapshot!.results.map((r) => r.symbol)).toEqual(['THYAO']);
  });

  it('builds summary with TOP10/20/50 bounded by result count', async () => {
    const engine = new MarketScannerEngine();
    const radar = new OpportunityRadarService();
    const cache = new MockCache();
    const orchestrator = makeOrchestrator(['THYAO', 'AKBNK']);
    const analysisService = {
      analyzeSymbol: jest.fn(async (symbol: string) => makeAnalysisResult(symbol, 70)),
    };

    const service = new DailyMarketScanService(
      engine,
      radar,
      orchestrator as unknown as MarketDataOrchestrator,
      cache as unknown as CacheService,
      analysisService as unknown as AnalysisService,
    );

    const response = await service.runDailyScan();
    expect(response.summary.top10.length).toBeLessThanOrEqual(10);
    expect(response.summary.top20.length).toBeLessThanOrEqual(20);
    expect(response.summary.top50.length).toBeLessThanOrEqual(50);
    expect(response.summary.top10.length).toBe(2);
  });

  it('never fabricates data: UNAVAILABLE classification stays when no confluence data', async () => {
    const engine = new MarketScannerEngine();
    const radar = new OpportunityRadarService();
    const cache = new MockCache();
    const orchestrator: Partial<MarketDataOrchestrator> = {
      discoverUniverse: jest.fn().mockResolvedValue({
        discoveredCount: 1,
        validatedCount: 1,
        invalidCount: 0,
        unavailableCount: 0,
        byStatus: { AVAILABLE: 1 },
        symbols: [
          {
            ticker: 'THYAO',
            yahooTicker: 'THYAO.IS',
            status: 'AVAILABLE',
            instrumentType: 'EQUITY',
            sector: null,
            currency: 'TRY',
            hasPriceData: true,
            hasVolumeData: true,
            coverage: 'FULL',
          },
        ],
        timestamp: '2026-01-01T00:00:00.000Z',
        source: 'BIST_MASTER_REGISTRY',
      }),
      fetchHistoricalData: jest.fn().mockResolvedValue(null),
    };
    const analysisService = {
      analyzeSymbol: jest.fn(async () => makeAnalysisResult('THYAO', 70)),
    };

    const service = new DailyMarketScanService(
      engine,
      radar,
      orchestrator as unknown as MarketDataOrchestrator,
      cache as unknown as CacheService,
      analysisService as unknown as AnalysisService,
    );

    await service.runDailyScan();
    const snapshot = service.getLatestSnapshot();
    expect(snapshot!.results[0].currentPrice).toBeNull();
    expect(snapshot!.results[0].earlyOpportunityClassification).toBe('UNAVAILABLE');
    expect(snapshot!.results[0].dataStatus).toBe('UNAVAILABLE');
    expect(snapshot!.results[0].sourceProvenance.source).toBe('UNAVAILABLE');
  });
});
