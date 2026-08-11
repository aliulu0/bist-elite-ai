import { EarlySignalScannerEngine } from './early-signal-scanner.engine';
import { EarlySignalScannerInput, EarlySignalScannerResult } from './early-signal.types';
import { PredictionResult } from '../../prediction/prediction.types';
import { SmartMoneyScoreResult } from '../../smart-money/smart-money.types';
import { CatalystResult, CatalystEvent } from '../../catalyst/catalyst.types';
import { MultiTimeframeOpportunityResult } from '../multi-timeframe/multi-timeframe.types';
import { FundamentalValidationReport } from '../../financial-rules/fundamental-validation.service';
import { ResearchImportance } from '../../ai-research/ai-research.types';

function makePrediction(ticker: string, overrides: Partial<PredictionResult> = {}): PredictionResult {
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
    entryZone: { min: 12.4, max: 12.8 },
    stopZone: 11.9,
    target1: 14.0,
    target2: 15.2,
    riskRewardRatio: 2.4,
    scenarios: [],
    signals: [],
    backtestAccuracy: { winRate: 0.6, totalTrades: 10, sharpeRatio: 1, isValid: true },
    verification: 'TRUE',
    catalystScore: 70,
    smartMoneyScore: 78,
    metadata: {},
    generatedAt: new Date().toISOString(),
    isValid: true,
    ...overrides,
  } as PredictionResult;
}

function makeSmartMoney(ticker: string, overrides: Partial<SmartMoneyScoreResult> = {}): SmartMoneyScoreResult {
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
    ...overrides,
  };
}

function makeCatalyst(ticker: string, overrides: Partial<CatalystResult> = {}): CatalystResult {
  const event: CatalystEvent = {
    id: 'evt-1',
    ticker,
    category: 'defense_contract',
    title: 'Yeni savunma sözleşmesi',
    description: 'Şirket büyük savunma sözleşmesi imzaladı.',
    importance: ResearchImportance.CRITICAL,
    verified: true,
    verificationScore: 0.9,
    date: new Date().toISOString(),
    source: 'KAP',
    provider: 'test',
    expectedImpact: 'very_bullish',
    timeHorizon: '1_week',
    confidence: 0.85,
    catalystScore: 92,
    keywords: ['savunma', 'sözleşme'],
  };
  return {
    ticker,
    catalystScore: 88,
    confidence: 0.8,
    expectedImpact: 'very_bullish',
    events: [event],
    verifiedCount: 1,
    totalCount: 1,
    rawSources: [],
    generatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeMultiTimeframe(ticker: string, overrides: Partial<MultiTimeframeOpportunityResult> = {}): MultiTimeframeOpportunityResult {
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
      timeframeAgreement: 80,
      trendAlignment: 78,
      momentumAlignment: 74,
      riskAlignment: 70,
      confidenceAlignment: 72,
      smartMoneyAlignment: 76,
      catalystAlignment: 80,
      macroAlignment: 60,
      marketStructureAlignment: 75,
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
    ...overrides,
  };
}

function makeFundamentals(symbol: string, overrides: Partial<FundamentalValidationReport> = {}): FundamentalValidationReport {
  const mk = (id: string, availability: 'AVAILABLE' | 'UNAVAILABLE', status: 'PASS' | 'WATCH' | 'FAIL', value: number | null) => ({
    id,
    name: id,
    availability,
    status,
    value,
    thresholds: null,
    reason: 'test',
  });
  return {
    symbol,
    pdDd: mk('pdDd', 'AVAILABLE', 'PASS', 0.9),
    fdFavok: mk('fdFavok', 'AVAILABLE', 'PASS', 6),
    netProfitGrowth: mk('netProfitGrowth', 'AVAILABLE', 'PASS', 22),
    equityGrowth: mk('equityGrowth', 'AVAILABLE', 'PASS', 12),
    debtRatio: mk('debtRatio', 'AVAILABLE', 'PASS', 0.3),
    sectorRelative: mk('sectorRelative', 'UNAVAILABLE', 'FAIL', null),
    overallStatus: 'PASS',
    score: 82,
    availableFilters: ['pdDd', 'fdFavok', 'netProfitGrowth', 'equityGrowth', 'debtRatio'],
    unknownFilters: ['sectorRelative'],
    reasons: [],
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function makeInput(ticker: string, overrides: Partial<EarlySignalScannerInput> = {}): EarlySignalScannerInput {
  return {
    ticker,
    company: 'Test Holding',
    sector: 'Ulaştırma',
    prediction: makePrediction(ticker),
    smartMoney: makeSmartMoney(ticker),
    catalyst: makeCatalyst(ticker),
    multiTimeframe: makeMultiTimeframe(ticker),
    fundamentals: makeFundamentals(ticker),
    financialDataQuality: { status: 'DATA_VERIFIED' } as any,
    ...overrides,
  };
}

describe('EarlySignalScannerEngine', () => {
  const engine = new EarlySignalScannerEngine();

  it('returns a deterministic result with signals and convergence', () => {
    const result = engine.scan(makeInput('THYAO'));
    expect(result.ticker).toBe('THYAO');
    expect(result.signals.length).toBeGreaterThan(0);
    expect(result.convergence.totalSignals).toBe(result.signals.length);
    expect(result.convergence.categoryCoverage).toBeGreaterThan(0);
    expect(result.dataQualityStatus).toBe('DATA_VERIFIED');
    for (const signal of result.signals) {
      expect(signal.id).toBe(`THYAO:${signal.category}:${signal.type}`);
      expect(signal.strength).toBeGreaterThanOrEqual(0);
      expect(signal.strength).toBeLessThanOrEqual(100);
    }
  });

  it('detects smart money accumulation as an EARLY signal', () => {
    const result = engine.scan(makeInput('THYAO'));
    const accumulation = result.signals.find((s) => s.type === 'accumulation');
    expect(accumulation).toBeDefined();
    expect(accumulation!.phase).toBe('EARLY');
    expect(accumulation!.category).toBe('SMART_MONEY');
  });

  it('detects a CONFIRMED accumulation breakout when breakout volume exists', () => {
    const result = engine.scan(makeInput('THYAO'));
    const breakout = result.signals.find((s) => s.type === 'accumulation_breakout');
    expect(breakout).toBeDefined();
    expect(breakout!.phase).toBe('CONFIRMED');
  });

  it('detects catalyst signals with CONFIRMED phase when verified', () => {
    const result = engine.scan(makeInput('THYAO'));
    const contract = result.signals.find((s) => s.type === 'contract_catalyst');
    expect(contract).toBeDefined();
    expect(contract!.phase).toBe('CONFIRMED');
  });

  it('detects multi-timeframe alignment', () => {
    const result = engine.scan(makeInput('THYAO'));
    const alignment = result.signals.find((s) => s.type === 'mtf_alignment');
    expect(alignment).toBeDefined();
    expect(alignment!.strength).toBeGreaterThanOrEqual(60);
  });

  it('detects fundamental earnings improvement', () => {
    const result = engine.scan(makeInput('THYAO'));
    const earnings = result.signals.find((s) => s.type === 'earnings_improvement');
    expect(earnings).toBeDefined();
  });

  it('applies DATA_INSUFFICIENT cap and factor', () => {
    const input = makeInput('THYAO', {
      financialDataQuality: { status: 'DATA_INSUFFICIENT' } as any,
    });
    const result = engine.scan(input);
    expect(result.convergence.convergenceScore).toBeLessThanOrEqual(40);
    for (const signal of result.signals) {
      expect(signal.strength).toBeLessThanOrEqual(50);
    }
  });

  it('returns zero convergence when no data providers exist', () => {
    const result = engine.scan(
      makeInput('THYAO', {
        prediction: null,
        smartMoney: null,
        catalyst: null,
        multiTimeframe: null,
        fundamentals: null,
      }),
    );
    expect(result.signals).toHaveLength(0);
    expect(result.convergence.convergenceScore).toBe(0);
  });

  it('detects price_volume_divergence when trend and money flow conflict', () => {
    const result = engine.scan(
      makeInput('THYAO', {
        prediction: makePrediction('THYAO', { trendDirection: 'up' }),
        smartMoney: makeSmartMoney('THYAO', { moneyFlow: 'negative' }),
      }),
    );
    const divergence = result.signals.find((s) => s.type === 'price_volume_divergence');
    expect(divergence).toBeDefined();
    expect(divergence!.phase).toBe('EARLY');
  });

  it('assigns HIGH priority to confirmed strong signals', () => {
    const result = engine.scan(makeInput('THYAO'));
    const high = result.signals.filter((s) => s.priority === 'HIGH');
    expect(high.length).toBeGreaterThan(0);
    for (const s of high) {
      expect(s.phase).toBe('CONFIRMED');
      expect(s.strength).toBeGreaterThanOrEqual(75);
    }
  });

  it('assigns LOW priority to early weak signals', () => {
    const result = engine.scan(makeInput('THYAO'));
    const low = result.signals.filter((s) => s.priority === 'LOW');
    expect(low.length).toBeGreaterThan(0);
    for (const s of low) {
      expect(s.phase).toBe('EARLY');
      expect(s.strength).toBeLessThan(75);
    }
  });

  it('reports strongSignalCount as the number of Strong+ signals', () => {
    const result = engine.scan(makeInput('THYAO'));
    const expected = result.signals.filter((s) => s.strength >= 65).length;
    expect(result.convergence.strongSignalCount).toBe(expected);
    expect(result.convergence.strongSignalCount).toBeGreaterThan(0);
  });

  it('detects volume spike as EARLY unless breakout volume confirms', () => {
    const result = engine.scan(makeInput('THYAO'));
    const spike = result.signals.find((s) => s.type === 'volume_spike');
    expect(spike).toBeDefined();
    // breakoutVolume=true in the default fixture -> CONFIRMED
    expect(spike!.phase).toBe('CONFIRMED');

    const early = engine.scan(
      makeInput('THYAO', {
        smartMoney: makeSmartMoney('THYAO', { breakoutVolume: false }),
      }),
    );
    const spikeEarly = early.signals.find((s) => s.type === 'volume_spike');
    expect(spikeEarly).toBeDefined();
    expect(spikeEarly!.phase).toBe('EARLY');
  });

  it('detects relative volume and breakout signals', () => {
    const result = engine.scan(makeInput('THYAO'));
    expect(result.signals.some((s) => s.type === 'relative_volume')).toBe(true);
    expect(result.signals.some((s) => s.type === 'breakout')).toBe(true);
  });

  it('detects compression signals from smart-money compression_breakout', () => {
    const result = engine.scan(
      makeInput('THYAO', {
        smartMoney: makeSmartMoney('THYAO', {
          signals: [{ type: 'compression_breakout', strength: 70, description: 'compression' }],
        }),
      }),
    );
    const compression = result.signals.find((s) => s.type === 'price_compression');
    expect(compression).toBeDefined();
    expect(compression!.phase).toBe('EARLY');
    expect(compression!.category).toBe('PRICE_VOLUME');
  });

  it('detects volatility compression from low expected volatility', () => {
    const result = engine.scan(
      makeInput('THYAO', {
        prediction: makePrediction('THYAO', {
          expectedVolatility: 1.8,
          trendStrength: 'weak',
        }),
      }),
    );
    const vc = result.signals.find((s) => s.type === 'volatility_compression');
    expect(vc).toBeDefined();
    expect(vc!.category).toBe('PRICE_VOLUME');
  });

  it('detects accumulation and distribution days', () => {
    const result = engine.scan(
      makeInput('THYAO', {
        smartMoney: makeSmartMoney('THYAO', {
          accumulationDays: 6,
          distributionDays: 2,
        }),
      }),
    );
    expect(result.signals.some((s) => s.type === 'accumulation_day')).toBe(true);
    expect(result.signals.some((s) => s.type === 'distribution_day')).toBe(true);
  });

  it('detects smart money distribution as an EARLY signal', () => {
    const result = engine.scan(
      makeInput('THYAO', {
        smartMoney: makeSmartMoney('THYAO', {
          distributionScore: 70,
          accumulationScore: 10,
        }),
      }),
    );
    const distribution = result.signals.find((s) => s.type === 'distribution');
    expect(distribution).toBeDefined();
    expect(distribution!.phase).toBe('EARLY');
    expect(distribution!.category).toBe('SMART_MONEY');
  });

  it('detects smart money + catalyst composite as CONFIRMED when verified', () => {
    const result = engine.scan(makeInput('THYAO'));
    const composite = result.signals.find((s) => s.type === 'smart_money_catalyst');
    expect(composite).toBeDefined();
    expect(composite!.phase).toBe('CONFIRMED');
    expect(composite!.category).toBe('SMART_MONEY');
  });

  it('detects smart money + fundamental composite as CONFIRMED', () => {
    const result = engine.scan(makeInput('THYAO'));
    const composite = result.signals.find((s) => s.type === 'smart_money_fundamental');
    expect(composite).toBeDefined();
    expect(composite!.phase).toBe('CONFIRMED');
  });

  it('detects valuation improvement when PD/DD or FD/FAVÖK passes', () => {
    const result = engine.scan(makeInput('THYAO'));
    const valuation = result.signals.find((s) => s.type === 'valuation_improvement');
    expect(valuation).toBeDefined();
    expect(valuation!.category).toBe('FUNDAMENTAL');
  });

  it('detects fundamental + price divergence when strong fundamentals lag price', () => {
    const result = engine.scan(
      makeInput('THYAO', {
        prediction: makePrediction('THYAO', { trendDirection: 'down' }),
      }),
    );
    const divergence = result.signals.find((s) => s.type === 'fundamental_price_divergence');
    expect(divergence).toBeDefined();
    expect(divergence!.category).toBe('FUNDAMENTAL');
  });

  it('detects catalyst groups (contract, investment, partnership, capital, regulatory, corporate)', () => {
    const base = makeCatalyst('THYAO');
    const grouped = engine.scan(
      makeInput('THYAO', {
        catalyst: {
          ...base,
          events: base.events.map((e) => ({ ...e, category: 'new_investment' as const })),
        },
      }),
    );
    expect(grouped.signals.some((s) => s.type === 'investment_catalyst')).toBe(true);

    const capital = engine.scan(
      makeInput('THYAO', {
        catalyst: {
          ...base,
          events: base.events.map((e) => ({ ...e, category: 'share_buyback' as const })),
        },
      }),
    );
    expect(capital.signals.some((s) => s.type === 'capital_action_catalyst')).toBe(true);

    const corporate = engine.scan(
      makeInput('THYAO', {
        catalyst: {
          ...base,
          events: base.events.map((e) => ({ ...e, category: 'ceo_change' as const })),
        },
      }),
    );
    expect(corporate.signals.some((s) => s.type === 'corporate_event_catalyst')).toBe(true);
  });

  it('detects timeframe convergence when agreement and trend alignment align', () => {
    const result = engine.scan(makeInput('THYAO'));
    const convergence = result.signals.find((s) => s.type === 'timeframe_convergence');
    expect(convergence).toBeDefined();
    expect(convergence!.phase).toBe('CONFIRMED');
    expect(convergence!.category).toBe('MULTI_TIMEFRAME');
  });

  it('detects early trend transition at the Early trend stage', () => {
    const result = engine.scan(
      makeInput('THYAO', {
        multiTimeframe: makeMultiTimeframe('THYAO', {
          trendStage: 'Early',
          multiTimeframeScore: 68,
        }),
      }),
    );
    const early = result.signals.find((s) => s.type === 'early_trend_transition');
    expect(early).toBeDefined();
    expect(early!.phase).toBe('EARLY');
  });

  it('detects market structure trend change and consolidation breakout', () => {
    const result = engine.scan(
      makeInput('THYAO', {
        multiTimeframe: makeMultiTimeframe('THYAO', { trendStage: 'Breakout' }),
        smartMoney: makeSmartMoney('THYAO', {
          signals: [{ type: 'compression_breakout', strength: 70, description: 'compression' }],
        }),
      }),
    );
    expect(result.signals.some((s) => s.type === 'trend_change')).toBe(true);
    expect(result.signals.some((s) => s.type === 'consolidation_breakout')).toBe(true);
  });

  it('detects breakdown when distribution coincides with a downtrend', () => {
    const result = engine.scan(
      makeInput('THYAO', {
        prediction: makePrediction('THYAO', { trendDirection: 'down' }),
        smartMoney: makeSmartMoney('THYAO', {
          signals: [{ type: 'distribution', strength: 72, description: 'distribution' }],
          distributionScore: 72,
        }),
      }),
    );
    const breakdown = result.signals.find((s) => s.type === 'breakdown');
    expect(breakdown).toBeDefined();
    expect(breakdown!.phase).toBe('CONFIRMED');
    expect(breakdown!.category).toBe('MARKET_STRUCTURE');
  });

  it('caps strengths by DATA_WARNING and DATA_ACCEPTABLE status', () => {
    const warning = engine.scan(
      makeInput('THYAO', {
        financialDataQuality: { status: 'DATA_WARNING' } as any,
      }),
    );
    for (const s of warning.signals) {
      expect(s.strength).toBeLessThanOrEqual(75);
    }
    expect(warning.convergence.convergenceScore).toBeLessThanOrEqual(60);

    const acceptable = engine.scan(
      makeInput('THYAO', {
        financialDataQuality: { status: 'DATA_ACCEPTABLE' } as any,
      }),
    );
    for (const s of acceptable.signals) {
      expect(s.strength).toBeLessThanOrEqual(90);
    }
    expect(acceptable.convergence.convergenceScore).toBeLessThanOrEqual(80);
  });

  it('produces a deterministic convergence score that grows with more categories', () => {
    const rich = engine.scan(makeInput('THYAO'));
    const sparse = engine.scan(
      makeInput('THYAO', {
        prediction: null,
        catalyst: null,
        fundamentals: null,
      }),
    );
    expect(rich.convergence.convergenceScore).toBeGreaterThanOrEqual(sparse.convergence.convergenceScore);
  });
});
