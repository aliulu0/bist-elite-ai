import { OpportunityRadarEngine } from './radar.engine';
import { RadarConfig } from './radar.config';
import {
  OpportunityRadarSnapshot,
  OpportunityRadarItem,
  RadarMetrics,
  RadarRunOptions,
  RadarState,
} from './radar.types';
import { EarlyOpportunityIntelligenceResult } from '../early-opportunity.types';
import { EarlySignalScannerResult } from '../signals/early-signal.types';
import { DataFreshness } from '../../market-data/incremental/latest-price-freshness.config';
import { LatestPriceState } from '../../market-data/incremental/latest-price.types';
import { BistSymbolEntry } from '../../market-data/symbol-registry/symbol-registry.types';

const FIXED_NOW = 1_723_456_000_000;
const FIXED_TIMESTAMP = new Date(FIXED_NOW).toISOString();

function makeConfig(overrides: Partial<RadarConfig> = {}): RadarConfig {
  return {
    maxSymbols: 20,
    minRadarScore: 45,
    stage1: { minSignalConvergence: 50, minEarlySignals: 2 },
    thresholds: {
      scoreChange: 5,
      signalConvergenceChange: 5,
      confidenceChange: 5,
      expectedReturnChangePct: 5,
      strengthenScore: 5,
      weakenScore: 5,
      confirmedScore: 70,
    },
    priorityWeights: { score: 0.6, momentum: 0.2, freshness: 0.1, convergence: 0.1 },
    snapshotHistoryLimit: 10,
    freshnessTtlMs: 3_600_000,
    ...overrides,
  };
}

function makeSymbolEntry(ticker: string, company: string, sector: string): BistSymbolEntry {
  return {
    canonicalTicker: ticker,
    companyName: company,
    sector,
    exchange: 'BIST',
    isin: null,
    active: true,
    providers: {},
  };
}

function makePrice(ticker: string, timestamp = FIXED_TIMESTAMP): LatestPriceState {
  return {
    symbol: ticker,
    timeframe: '1d',
    price: 100,
    previousPrice: 99,
    change: 1,
    changePercent: 1.01,
    timestamp,
    provider: 'yahoo',
    sourceTimeframe: '1d',
    dataFreshness: DataFreshness.Fresh,
    lastSuccessfulUpdate: timestamp,
    volume: 1_000_000,
  };
}

function makeScan(convergence = 70, earlyCount = 3): EarlySignalScannerResult {
  return {
    ticker: 'THYAO',
    company: 'Türk Hava Yolları',
    sector: 'Industrials',
    signals: [],
    convergence: {
      convergenceScore: convergence,
      totalSignals: 3,
      strongSignalCount: 1,
      earlyCount,
      confirmedCount: 1,
      categoryCoverage: 2,
      strongestSignals: [],
      avgStrength: 0,
      confirmedShare: 0.5,
    },
    dataQualityStatus: null,
    scannedAt: FIXED_TIMESTAMP,
  } as EarlySignalScannerResult;
}

function makeIntelligenceResult(ticker: string, score = 65): EarlyOpportunityIntelligenceResult {
  return {
    ticker,
    company: 'Türk Hava Yolları',
    sector: 'Industrials',
    marketCap: 1000000000,
    earlyOpportunityScore: score,
    earlyOpportunityLevel: 'FIRSAT' as any,
    eliteScore: 70,
    confidence: 60,
    bullishPercent: 65,
    risk: 'medium',
    expectedReturn: 12,
    entryZone: { min: 95, max: 105 },
    stop: 90,
    target1: 120,
    target2: 135,
    riskRewardRatio: 2.5,
    holdingPeriod: { value: 30, unit: 'day' },
    catalyst: { score: 70, verified: true },
    smartMoney: { score: 65, accumulation: 'positive' },
    verificationStatus: 'verified',
    researchConsensus: {
      agreementLevel: 70,
      confidence: 65,
      consensusScore: 68,
      summary: 'ok',
      evidenceCount: 10,
    },
    momentum: 'bullish',
    trend: 'up',
    liquidityQuality: 'high',
    timeframeAgreement: 70,
    reasons: ['test'],
    fundamentals: { score: 80 } as any,
    multiTimeframe: null,
    financialDataQuality: { score: 90 } as any,
    signals: [],
    signalConvergenceScore: 70,
    earlySignalCount: 3,
    confirmedSignalCount: 1,
    topSignals: [],
    decision: {
      ticker,
      company: 'Türk Hava Yolları',
      decisionScore: 65,
      decisionStatus: 'EARLY_OPPORTUNITY',
      statusLabel: 'Erken Fırsat',
      statusEmoji: '🟢',
      opportunityType: 'EARLY',
      earlyOpportunity: true,
      confidence: 60,
      convergence: 70,
      coverage: 80,
      trendStage: 'early',
      timeframeAgreement: 70,
      predictionConfidence: 65,
      smartMoneyStatus: 'positive',
      catalystStatus: 'verified',
      fundamentalStatus: 'pass',
      financialDataQualityStatus: 'good',
      signalSummary: {
        convergenceScore: 70,
        totalSignals: 3,
        strongSignalCount: 1,
        earlyCount: 2,
        confirmedCount: 1,
        categoryCoverage: 2,
      },
      riskSummary: {
        level: 'medium',
        riskRewardRatio: 2.5,
        hasEntry: true,
        hasStop: true,
        hasTarget: true,
      },
      entryZone: { min: 95, max: 105 },
      stop: 90,
      target1: 120,
      target2: 135,
      expectedReturn: 12,
      bestTimeframe: '1d',
      worstTimeframe: null,
      reasons: ['test'],
      positiveFactors: [],
      negativeFactors: [],
      warnings: [],
      dataFreshness: 'fresh',
      providerStatus: 'yahoo',
      dimensions: [],
      gates: { invalidated: [], downgraded: [] },
      snapshot: {
        decisionTimestamp: FIXED_TIMESTAMP,
        symbol: ticker,
        timeframeContext: ['1d'],
        decisionScore: 65,
        decisionStatus: 'EARLY_OPPORTUNITY',
        earlyOpportunity: true,
        entry: { min: 95, max: 105 },
        stop: 90,
        target1: 120,
        target2: 135,
        expectedReturn: 12,
        confidence: 60,
        evidence: {} as any,
        inputDigest: 'digest',
      },
      explanation: 'test',
      generatedAt: FIXED_TIMESTAMP,
    } as any,
    evaluatedAt: FIXED_TIMESTAMP,
  } as EarlyOpportunityIntelligenceResult;
}

describe('OpportunityRadarEngine', () => {
  let engine: OpportunityRadarEngine;
  const config = makeConfig();

  const mockDeps = {
    config,
    now: () => FIXED_NOW,
    symbolRegistry: {
      getActiveSymbols: () => [
        makeSymbolEntry('THYAO', 'Türk Hava Yolları', 'Industrials'),
        makeSymbolEntry('ASELS', 'Aselsan', 'Defense'),
      ],
      getSymbolsBySector: () => [],
      getCompanyName: (t: string) => (t === 'THYAO' ? 'Türk Hava Yolları' : 'Aselsan'),
      getSector: (t: string) => (t === 'THYAO' ? 'Industrials' : 'Defense'),
    },
    latestPrice: {
      getLatestPriceIncremental: jest.fn().mockResolvedValue(makePrice('THYAO')),
    },
    signalScanner: {
      scan: jest
        .fn()
        .mockImplementation((tick: string) =>
          tick === 'THYAO' ? Promise.resolve(makeScan(70, 3)) : Promise.resolve(makeScan(20, 0)),
        ),
    },
    intelligence: {
      getEarlyOpportunity: jest.fn().mockResolvedValue(makeIntelligenceResult('THYAO', 65)),
    },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    engine = new OpportunityRadarEngine(mockDeps);
  });

  describe('cold run', () => {
    it('runs deep analysis for candidates and counts provider calls', async () => {
      const snap = await engine.run({ forceRefresh: true }, null);

      expect(snap.providerCallStats.providerCalls).toBe(1); // THYAO is candidate, ASELS not
      expect(snap.providerCallStats.cacheHits).toBe(0);
      expect(snap.providerCallStats.deepAnalyses).toBe(1);
      expect(snap.providerCallStats.cheapScans).toBe(2); // both symbols get cheap scan
      expect(snap.items['THYAO']).toBeDefined();
      expect(snap.items['THYAO']?.state).toBe('NEW');
    });
  });

  describe('warm run (data unchanged)', () => {
    it('reuses previous snapshot with ZERO provider calls', async () => {
      const coldSnap = await engine.run({ forceRefresh: true }, null);

      // Second run with same timestamps → warm reuse
      const warmSnap = await engine.run({ forceRefresh: false }, coldSnap);

      expect(warmSnap.providerCallStats.providerCalls).toBe(0);
      expect(warmSnap.providerCallStats.cacheHits).toBe(1); // THYAO reused from previous snapshot
      expect(warmSnap.providerCallStats.deepAnalyses).toBe(0);
      expect(warmSnap.items['THYAO']).toBe(coldSnap.items['THYAO']); // same object reference
    });
  });

  describe('staged gating', () => {
    it('only candidates and previously-active symbols get deep analysis', async () => {
      // ASELS has low convergence (not candidate) and no previous → skipped
      const snap = await engine.run({ forceRefresh: true }, null);
      expect(snap.providerCallStats.deepAnalyses).toBe(1); // only THYAO
      expect(snap.providerCallStats.skipped).toBe(1); // ASELS screened out
      expect(snap.items['ASELS']).toBeUndefined();
    });

    it('previously-active symbol gets deep analysis even if not candidate now', async () => {
      const prevSnap: OpportunityRadarSnapshot = {
        timestamp: FIXED_TIMESTAMP,
        marketSession: 'OPEN',
        marketSessionLabel: 'Açık',
        freshnessNote: '',
        symbolsEvaluated: 1,
        activeOpportunities: 1,
        newOpportunities: ['THYAO'],
        strengtheningOpportunities: [],
        weakeningOpportunities: [],
        invalidatedOpportunities: [],
        confirmedOpportunities: [],
        items: {
          THYAO: {
            ticker: 'THYAO',
            company: 'Türk Hava Yolları',
            sector: 'Industrials',
            state: 'NEW',
            current: {
              ...makeIntelligenceResult('THYAO', 65),
              earlyOpportunity: true,
              dataTimestamp: FIXED_TIMESTAMP,
            } as any,
            previous: null,
            scoreChange: null,
            changes: [],
            reasons: [],
            radarPriority: 65,
            dataFreshness: 'fresh',
            providerStatus: 'yahoo',
            decision: makeIntelligenceResult('THYAO', 65).decision!,
            evaluatedAt: FIXED_TIMESTAMP,
          },
        },
        providerCallStats: {
          providerCalls: 1,
          cacheHits: 0,
          cheapScans: 1,
          deepAnalyses: 1,
          symbolsEvaluated: 1,
          candidates: 1,
          skipped: 0,
          errors: 0,
        },
        dataQualitySummary: { averageScore: 90, warnings: [] },
        executionDurationMs: 100,
        generatedAt: FIXED_TIMESTAMP,
      };

      // THYAO was previously active, now signal convergence drops below threshold
      mockDeps.signalScanner.scan.mockResolvedValueOnce(makeScan(40, 0));
      const snap = await engine.run({ forceRefresh: true }, prevSnap);

      // THYAO should still get deep analysis (prevActive) even though not candidate
      expect(snap.providerCallStats.deepAnalyses).toBe(1);
      expect(snap.items['THYAO']).toBeDefined();
    });
  });

  describe('event emission', () => {
    it('emits NEW_OPPORTUNITY for first-time active symbol', async () => {
      const events: any[] = [];
      const emit = (e: any) => events.push(e);
      await engine.run({ forceRefresh: true }, null, emit);
      expect(events.length).toBe(1);
      expect(events[0].type).toBe('NEW_OPPORTUNITY');
      expect(events[0].ticker).toBe('THYAO');
    });

    it('emits STRENGTHENING when score increases materially', async () => {
      const coldSnap = await engine.run({ forceRefresh: true }, null);
      // Force a new deep analysis with higher score
      mockDeps.intelligence.getEarlyOpportunity.mockResolvedValueOnce(
        makeIntelligenceResult('THYAO', 75),
      );
      // Change price timestamp to force deep re-analysis
      mockDeps.latestPrice.getLatestPriceIncremental.mockResolvedValueOnce(
        makePrice('THYAO', new Date(FIXED_NOW + 60_000).toISOString()),
      );

      const events: any[] = [];
      await engine.run({ forceRefresh: true }, coldSnap, (e) => events.push(e));

      const strengthening = events.find((e) => e.type === 'OPPORTUNITY_STRENGTHENED');
      expect(strengthening).toBeDefined();
      expect(strengthening.scoreChange).toBeGreaterThanOrEqual(5);
    });
  });

  describe('INVALIDATED when data unavailable for previously-active', () => {
    it('marks INVALIDATED and emits event when intelligence returns null for prev-active', async () => {
      const prevSnap: OpportunityRadarSnapshot = {
        timestamp: FIXED_TIMESTAMP,
        marketSession: 'OPEN',
        marketSessionLabel: 'Açık',
        freshnessNote: '',
        symbolsEvaluated: 1,
        activeOpportunities: 1,
        newOpportunities: ['THYAO'],
        strengtheningOpportunities: [],
        weakeningOpportunities: [],
        invalidatedOpportunities: [],
        confirmedOpportunities: [],
        items: {
          THYAO: {
            ticker: 'THYAO',
            company: 'Türk Hava Yolları',
            sector: 'Industrials',
            state: 'NEW',
            current: {
              earlyOpportunityScore: 65,
              earlyOpportunity: true,
              dataTimestamp: FIXED_TIMESTAMP,
            } as any,
            previous: null,
            scoreChange: null,
            changes: [],
            reasons: [],
            radarPriority: 65,
            dataFreshness: 'fresh',
            providerStatus: 'yahoo',
            decision: makeIntelligenceResult('THYAO', 65).decision!,
            evaluatedAt: FIXED_TIMESTAMP,
          },
        },
        providerCallStats: {
          providerCalls: 1,
          cacheHits: 0,
          cheapScans: 1,
          deepAnalyses: 1,
          symbolsEvaluated: 1,
          candidates: 1,
          skipped: 0,
          errors: 0,
        },
        dataQualitySummary: { averageScore: 90, warnings: [] },
        executionDurationMs: 100,
        generatedAt: FIXED_TIMESTAMP,
      };

      mockDeps.intelligence.getEarlyOpportunity.mockResolvedValueOnce(null);
      const events: any[] = [];
      const snap = await engine.run({ forceRefresh: true }, prevSnap, (e) => events.push(e));

      const item = snap.items['THYAO'];
      expect(item).toBeDefined();
      expect(item?.state).toBe('INVALIDATED');
      expect(events.find((e) => e.type === 'OPPORTUNITY_INVALIDATED')).toBeDefined();
    });
  });
});
