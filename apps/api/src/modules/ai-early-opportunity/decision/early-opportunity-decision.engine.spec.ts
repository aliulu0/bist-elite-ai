import { EarlyOpportunityDecisionEngine } from './early-opportunity-decision.engine';
import { EarlyOpportunityIntelligenceResult, EarlyOpportunityLevel } from '../early-opportunity.types';
import { FinancialDataQualityReport } from '../../financial-rules/financial-data-quality.types';
import { EarlySignal } from '../signals/early-signal.types';

function signal(category: any, type: string, phase: 'EARLY' | 'CONFIRMED', strength: number): EarlySignal {
  return {
    id: `${category}:${type}`,
    ticker: 'THYAO',
    category,
    type,
    phase,
    strength,
    strengthLabel: 'Strong',
    priority: 'MEDIUM',
    description: `${type} sinyali`,
    sourceFields: [],
    detectedAt: new Date().toISOString(),
  };
}

function dq(overrides: Partial<FinancialDataQualityReport> = {}): FinancialDataQualityReport {
  return {
    ticker: 'THYAO',
    qualityScore: 85,
    status: 'DATA_VERIFIED',
    freshness: { price: 'fresh', fundamental: 'fresh', research: 'fresh', overall: 'fresh' },
    freshnessScore: 90,
    marketDataScore: 100,
    marketIntegrity: { valid: true, errors: [], warnings: [] },
    fundamental: { status: 'PASS', score: 85, dataQuality: null },
    fundamentalDataScore: 85,
    providers: { price: 'alpha', fundamental: 'alpha', research: [], fallbackUsed: false, attemptedAt: [] },
    providerConsistencyScore: 100,
    providerConsistencyStatus: 'consistent',
    conflicts: [],
    completenessScore: 100,
    missingFields: [],
    integrityScore: 100,
    warnings: [],
    errors: [],
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function baseResult(overrides: Partial<EarlyOpportunityIntelligenceResult> = {}): EarlyOpportunityIntelligenceResult {
  return {
    ticker: 'THYAO',
    company: 'Türk Hava Yolları',
    sector: 'Ulaştırma',
    marketCap: 185000000000,
    earlyOpportunityScore: 78,
    earlyOpportunityLevel: 'GÜÇLÜ_FIRSAT' as EarlyOpportunityLevel,
    eliteScore: 85,
    confidence: 81,
    bullishPercent: 84,
    risk: 'low',
    expectedReturn: 6.4,
    entryZone: { min: 12.4, max: 12.8 },
    stop: 11.9,
    target1: 14.0,
    target2: 15.2,
    riskRewardRatio: 2.4,
    holdingPeriod: { value: 4, unit: 'days' },
    catalyst: { score: 70, verified: true },
    smartMoney: { score: 78, accumulation: 'very_strong' },
    verificationStatus: 'verified',
    researchConsensus: {
      agreementLevel: 72,
      confidence: 81,
      consensusScore: 80,
      summary: 'Alım baskısı gördü.',
      evidenceCount: 6,
    },
    momentum: 'bullish',
    trend: 'up',
    liquidityQuality: 'high',
    timeframeAgreement: 100,
    reasons: ['Yüksek yaşıl olasılık'],
    fundamentals: { overallStatus: 'PASS', score: 85, reasons: ['PD/DD: geçti'] } as any,
    multiTimeframe: {
      ticker: 'THYAO',
      trendStage: 'Early',
      trendDirection: 'up',
      momentum: 'bullish',
      multiTimeframeScore: 88,
      bestTimeframe: '1d',
      worstTimeframe: '6m',
      timeframesAnalyzed: ['1d', '1w', '1m', '3m', '6m'],
      alignments: { timeframeAgreement: 90, trendAlignment: 85, momentumAlignment: 80 },
      signals: [],
      reasons: [],
    } as any,
    financialDataQuality: dq(),
    signals: [
      signal('PRICE_VOLUME', 'accumulation', 'EARLY', 75),
      signal('SMART_MONEY', 'accumulation', 'EARLY', 80),
      signal('MULTI_TIMEFRAME', 'alignment', 'CONFIRMED', 70),
    ],
    signalConvergenceScore: 72,
    earlySignalCount: 2,
    confirmedSignalCount: 1,
    topSignals: [],
    decision: null,
    evaluatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('EarlyOpportunityDecisionEngine', () => {
  let engine: EarlyOpportunityDecisionEngine;

  beforeEach(() => {
    engine = new EarlyOpportunityDecisionEngine();
  });

  it('produces STRONG_EARLY_OPPORTUNITY for a full strong input', () => {
    const decision = engine.decide(baseResult());
    expect(decision.decisionStatus).toBe('STRONG_EARLY_OPPORTUNITY');
    expect(decision.earlyOpportunity).toBe(true);
    expect(decision.opportunityType).toBe('EARLY');
    expect(decision.decisionScore).toBeGreaterThanOrEqual(75);
    expect(decision.snapshot.inputDigest).toHaveLength(64);
    expect(decision.dimensions).toHaveLength(10);
    expect(decision.gates.invalidated).toHaveLength(0);
  });

  it('marks WEAK for a weak/missing-evidence input', () => {
    const decision = engine.decide(
      baseResult({
        confidence: 45,
        bullishPercent: 50,
        earlyOpportunityScore: 50,
        expectedReturn: -5,
        risk: 'medium',
        smartMoney: { score: 45, accumulation: 'moderate' },
        catalyst: { score: 35, verified: false },
        signalConvergenceScore: 30,
        earlySignalCount: 1,
        confirmedSignalCount: 0,
        signals: [
          signal('PRICE_VOLUME', 'dip', 'EARLY', 50),
          signal('SMART_MONEY', 'accumulation', 'EARLY', 45),
        ],
        topSignals: [],
        fundamentals: { overallStatus: 'WATCH', score: 60, reasons: [] } as any,
        multiTimeframe: {
          ...(baseResult().multiTimeframe as any),
          trendStage: 'Extended',
          multiTimeframeScore: 40,
          alignments: { timeframeAgreement: 30, trendAlignment: 30, momentumAlignment: 30 },
        } as any,
        financialDataQuality: dq({ qualityScore: 70, status: 'DATA_ACCEPTABLE', providerConsistencyScore: 70 }),
        entryZone: null,
        stop: null,
        target1: null,
        target2: null,
        riskRewardRatio: null,
      }),
    );
    expect(decision.decisionStatus).toBe('WEAK_OPPORTUNITY');
    expect(decision.earlyOpportunity).toBe(false);
  });

  it('marks EARLY_OPPORTUNITY for a converging but not strong setup', () => {
    // Medium convergence with an early/growing stage: score lands between 60-74
    // (below the STRONG threshold of 75) while earlyStage >= 55.
    const decision = engine.decide(
      baseResult({
        confidence: 55,
        bullishPercent: 60,
        earlyOpportunityScore: 62,
        expectedReturn: -5,
        smartMoney: { score: 50, accumulation: 'moderate' },
        catalyst: { score: 45, verified: false },
        signalConvergenceScore: 40,
        earlySignalCount: 2,
        confirmedSignalCount: 1,
        signals: [
          signal('PRICE_VOLUME', 'accumulation', 'EARLY', 55),
          signal('SMART_MONEY', 'accumulation', 'EARLY', 60),
          signal('CATALYST', 'earnings', 'CONFIRMED', 55),
        ],
        topSignals: [],
        multiTimeframe: {
          ...(baseResult().multiTimeframe as any),
          trendStage: 'Growing',
          multiTimeframeScore: 65,
          alignments: { timeframeAgreement: 65, trendAlignment: 65, momentumAlignment: 65 },
        } as any,
        financialDataQuality: dq({ qualityScore: 65, status: 'DATA_ACCEPTABLE' }),
      }),
    );
    expect(decision.decisionStatus).toBe('EARLY_OPPORTUNITY');
    expect(decision.earlyOpportunity).toBe(true);
    expect(decision.decisionScore).toBeGreaterThanOrEqual(60);
    expect(decision.decisionScore).toBeLessThanOrEqual(74);
  });

  it('invalidates when there is no market/prediction data', () => {
    const decision = engine.decide(
      baseResult({ confidence: 0, bullishPercent: 0, earlyOpportunityScore: 0, multiTimeframe: null }),
    );
    expect(decision.decisionStatus).toBe('INVALID_OPPORTUNITY');
    expect(decision.gates.invalidated.some((g) => g.id === 'NO_MARKET_DATA')).toBe(true);
    expect(decision.earlyOpportunity).toBe(false);
  });

  it('invalidates on DATA_INSUFFICIENT', () => {
    const decision = engine.decide(
      baseResult({ financialDataQuality: dq({ status: 'DATA_INSUFFICIENT', qualityScore: 20 }) }),
    );
    expect(decision.decisionStatus).toBe('INVALID_OPPORTUNITY');
    expect(decision.gates.invalidated.some((g) => g.id === 'DATA_INSUFFICIENT')).toBe(true);
  });

  it('caps STRONG to WATCHLIST_OPPORTUNITY when downgraded by provider conflict', () => {
    const decision = engine.decide(
      baseResult({ financialDataQuality: dq({ providerConsistencyStatus: 'conflicting', providerConsistencyScore: 40 }) }),
    );
    expect(decision.decisionStatus).toBe('WATCHLIST_OPPORTUNITY');
    expect(decision.gates.downgraded.some((g) => g.id === 'PROVIDER_CONFLICT')).toBe(true);
    expect(decision.earlyOpportunity).toBe(false);
  });

  it('is deterministic: identical input yields identical digest, score, status', () => {
    const input = baseResult(); // single shared input -> fixed evaluatedAt
    const a = engine.decide(input);
    const b = engine.decide(input);
    expect(b.snapshot.inputDigest).toBe(a.snapshot.inputDigest);
    expect(b.decisionScore).toBe(a.decisionScore);
    expect(b.decisionStatus).toBe(a.decisionStatus);
    expect(b.explanation).toBe(a.explanation);
  });

  it('includes dimension evidence in the snapshot', () => {
    const decision = engine.decide(baseResult());
    const evidenceKeys = Object.keys(decision.snapshot.evidence);
    expect(evidenceKeys).toContain('earlyStage');
    expect(evidenceKeys).toContain('multiTimeframe');
    expect(evidenceKeys).toContain('signals');
    expect(evidenceKeys.length).toBe(10);
  });

  it('builds warnings from downgrade gates', () => {
    const decision = engine.decide(
      baseResult({ financialDataQuality: dq({ providerConsistencyStatus: 'conflicting' }) }),
    );
    expect(decision.warnings.length).toBeGreaterThan(0);
    expect(decision.warnings[0]).toContain('çelişki');
  });

  it('computes confidence blending decision score and data quality', () => {
    const decision = engine.decide(baseResult({ financialDataQuality: dq({ qualityScore: 100 }) }));
    expect(decision.confidence).toBeGreaterThanOrEqual(decision.decisionScore);
  });
});
