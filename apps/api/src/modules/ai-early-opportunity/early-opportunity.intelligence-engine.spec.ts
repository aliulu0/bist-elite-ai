import { EarlyOpportunityIntelligenceEngine } from './early-opportunity.intelligence-engine';
import {
  EarlyOpportunitySymbolInput,
  EarlyOpportunityResult,
  EarlyScoreComponents,
} from './early-opportunity.types';
import { PredictionResult } from '../prediction/prediction.types';
import { AIConsensus } from '../ai-research/ai-research.types';
import { EliteScoreResult } from '../ai-elite-score/elite-score.types';
import { EarlyOpportunityIntelligenceResult } from './early-opportunity.types';
import { EarlySignal } from './signals/early-signal.types';

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

function makeConsensus(ticker: string, parts: Partial<AIConsensus> = {}): AIConsensus {
  return {
    ticker,
    chatgptSummary: null,
    geminiSummary: null,
    perplexitySummary: null,
    grokSummary: null,
    newsSummary: 'Alım baskısı gördü.',
    researchSources: [],
    agreementLevel: 0.72,
    conflicts: [],
    confidence: 0.81,
    consensusScore: 80,
    providerSummaries: {},
    totalEvidence: 6,
    duplicatesRemoved: 1,
    timestamp: new Date().toISOString(),
    ...parts,
  } as AIConsensus;
}

function makeElite(ticker: string, skor: number): EliteScoreResult {
  return {
    ticker,
    company: `${ticker} Inc`,
    horizons: [{ horizon: 'GUNLUK', etiket: 'Günlük', skor, confidence: 80, reasons: [], warnings: [] }],
    dominantStrategyId: 'momentum',
    dominantStrategyName: 'Momentum',
    dominantSignals: [],
    decision: 'AL',
    decisionLabel: 'Al',
    opportunityLevel: 'GÜÇLÜ_FIRSAT',
    evaluatedAt: new Date().toISOString(),
  } as EliteScoreResult;
}

function components(overrides: Partial<EarlyScoreComponents> = {}): EarlyScoreComponents {
  return {
    bullishProbability: 84,
    confidence: 81,
    expectedReturn: 32,
    riskAdjustedReturn: 26,
    smartMoneyScore: 78,
    catalystScore: 70,
    verification: true,
    researchScore: 77,
    eliteScore: 85,
    backtestWinRate: 60,
    opportunityScore: 82,
    decisionScore: 80,
    timeframeAgreement: 100,
    ...overrides,
  };
}

function baseInput(ticker = 'THYAO', overrides: Partial<EarlyOpportunitySymbolInput> = {}): EarlyOpportunitySymbolInput {
  return {
    ticker,
    company: 'Türk Hava Yolları',
    sector: 'Ulaştırma',
    predictions: [makePrediction(ticker)],
    consensus: makeConsensus(ticker),
    eliteScore: makeElite(ticker, 85),
    opportunity: null,
    decision: null,
    ...overrides,
  };
}

function baseScore(ticker = 'THYAO', overrides: Partial<EarlyOpportunityResult> = {}): EarlyOpportunityResult {
  return {
    ticker,
    company: `${ticker} Inc`,
    sector: 'Ulaştırma',
    score: 78,
    level: 'GÜÇLÜ_FIRSAT',
    levelLabel: 'Güçlü Erken Fırsat',
    levelEmoji: '🟢',
    confidence: 81,
    components: components(),
    timeframesEvaluated: ['1d'],
    reasons: ['Yüksek yaşıl olasılık (multi-timeframe)', 'Yüksek tahmin güveni'],
    evaluatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('EarlyOpportunityIntelligenceEngine', () => {
  let engine: EarlyOpportunityIntelligenceEngine;

  beforeEach(() => {
    engine = new EarlyOpportunityIntelligenceEngine();
  });

  const res = () => engine.buildIntelligenceResult(baseInput(), baseScore(), 185000000000);

  function signal(ticker: string, category: any, type: string, phase: 'EARLY' | 'CONFIRMED', strength: number): EarlySignal {
    return {
      id: `${ticker}:${category}:${type}`,
      ticker,
      category,
      type,
      phase,
      strength,
      strengthLabel: strength >= 80 ? 'Very Strong' : strength >= 65 ? 'Strong' : strength >= 40 ? 'Medium' : 'Weak',
      priority: phase === 'CONFIRMED' && strength >= 75 ? 'HIGH' : phase === 'CONFIRMED' || strength >= 75 ? 'MEDIUM' : 'LOW',
      description: `${type} sinyali`,
      sourceFields: [],
      detectedAt: new Date().toISOString(),
    };
  }

  function withSignalFields(overrides: Partial<EarlyOpportunityIntelligenceResult>): EarlyOpportunityIntelligenceResult {
    return {
      ...res(),
      signals: [],
      signalConvergenceScore: 0,
      earlySignalCount: 0,
      confirmedSignalCount: 0,
      topSignals: [],
      ...overrides,
    };
  }

  describe('buildIntelligenceResult', () => {
    it('maps all full-output fields from prediction + consensus + elite', () => {
      const res = engine.buildIntelligenceResult(baseInput(), baseScore(), 185000000000);
      expect(res.ticker).toBe('THYAO');
      expect(res.company).toBe('Türk Hava Yolları');
      expect(res.sector).toBe('Ulaştırma');
      expect(res.marketCap).toBe(185000000000);
      expect(res.earlyOpportunityScore).toBe(78);
      expect(res.earlyOpportunityLevel).toBe('GÜÇLÜ_FIRSAT');
      expect(res.eliteScore).toBe(85);
      expect(res.bullishPercent).toBe(84);
      expect(res.risk).toBe('low');
      expect(res.expectedReturn).toBe(6.4);
      expect(res.entryZone).toEqual({ min: 12.4, max: 12.8 });
      expect(res.stop).toBe(11.9);
      expect(res.target1).toBe(14.0);
      expect(res.target2).toBe(15.2);
      expect(res.riskRewardRatio).toBe(2.4);
      expect(res.holdingPeriod).toEqual({ value: 4, unit: 'days' });
      expect(res.catalyst).toEqual({ score: 70, verified: true });
      expect(res.smartMoney).toEqual({ score: 78, accumulation: 'very_strong' });
      expect(res.verificationStatus).toBe('verified');
      expect(res.researchConsensus?.agreementLevel).toBe(72);
      expect(res.researchConsensus?.evidenceCount).toBe(6);
      expect(res.momentum).toBe('bullish');
      expect(res.trend).toBe('up');
      expect(res.liquidityQuality).toBe('high');
      expect(res.timeframeAgreement).toBe(100);
      expect(res.reasons).toHaveLength(2);
    });

    it('defaults marketCap to null when not provided', () => {
      const res = engine.buildIntelligenceResult(baseInput(), baseScore(), null);
      expect(res.marketCap).toBeNull();
    });

    it('marks verification unknown when verification is null', () => {
      const res = engine.buildIntelligenceResult(
        baseInput('Y', { predictions: [makePrediction('Y', { verification: null })] }),
        baseScore('Y'),
        null,
      );
      expect(res.verificationStatus).toBe('unknown');
      expect(res.catalyst).toEqual({ score: 70, verified: false });
    });

    it('marks verification unverified for non-TRUE string values', () => {
      const res = engine.buildIntelligenceResult(
        baseInput('Y', { predictions: [makePrediction('Y', { verification: 'FALSE' })] }),
        baseScore('Y'),
        null,
      );
      expect(res.verificationStatus).toBe('unverified');
    });

    it('maps smart money accumulation tiers', () => {
      const low = engine.buildIntelligenceResult(
        baseInput('L', { predictions: [makePrediction('L', { smartMoneyScore: 30 })] }),
        baseScore('L'),
        null,
      );
      const mod = engine.buildIntelligenceResult(
        baseInput('M', { predictions: [makePrediction('M', { smartMoneyScore: 55 })] }),
        baseScore('M'),
        null,
      );
      const hi = engine.buildIntelligenceResult(
        baseInput('H', { predictions: [makePrediction('H', { smartMoneyScore: 75 })] }),
        baseScore('H'),
        null,
      );
      expect(low.smartMoney?.accumulation).toBe('weak');
      expect(mod.smartMoney?.accumulation).toBe('moderate');
      expect(hi.smartMoney?.accumulation).toBe('very_strong');
    });

    it('returns empty intelligence when no predictions', () => {
      const res = engine.buildIntelligenceResult(
        baseInput('Z', { predictions: [] }),
        baseScore('Z'),
        null,
      );
      expect(res.earlyOpportunityScore).toBe(0);
      expect(res.earlyOpportunityLevel).toBe('BEKLE');
      expect(res.reasons).toContain('Yeterli çok-zamanlı veri yok');
    });

    it('sets catalyst to null when no catalyst and no verification', () => {
      const res = engine.buildIntelligenceResult(
        baseInput('Z', {
          predictions: [makePrediction('Z', { catalystScore: null, verification: null })],
        }),
        baseScore('Z'),
        null,
      );
      expect(res.catalyst).toBeNull();
    });

    it('researchConsensus is null when no consensus', () => {
      const res = engine.buildIntelligenceResult(
        baseInput('Z', { consensus: null }),
        baseScore('Z'),
        null,
      );
      expect(res.researchConsensus).toBeNull();
    });
  });

  describe('matchesFilters', () => {
    it('passes when no filters', () => {
      expect(engine.matchesFilters(res(), {})).toBe(true);
    });

    it('filters by minEarlyOpportunityScore', () => {
      expect(engine.matchesFilters(res(), { minEarlyOpportunityScore: 78 })).toBe(true);
      expect(engine.matchesFilters(res(), { minEarlyOpportunityScore: 79 })).toBe(false);
    });

    it('filters by minConfidence', () => {
      expect(engine.matchesFilters(res(), { minConfidence: 81 })).toBe(true);
      expect(engine.matchesFilters(res(), { minConfidence: 82 })).toBe(false);
    });

    it('filters by minExpectedReturn', () => {
      expect(engine.matchesFilters(res(), { minExpectedReturn: 6.4 })).toBe(true);
      expect(engine.matchesFilters(res(), { minExpectedReturn: 6.5 })).toBe(false);
    });

    it('filters by maxRisk (low acceptable for medium/high thresholds)', () => {
      expect(engine.matchesFilters(res(), { maxRisk: 'low' })).toBe(true);
      expect(engine.matchesFilters(res(), { maxRisk: 'medium' })).toBe(true);
      expect(engine.matchesFilters(res(), { maxRisk: 'high' })).toBe(true);

      const highRisk = engine.buildIntelligenceResult(
        baseInput('R', { predictions: [makePrediction('R', { risk: 'high', bullishProbability: 90, confidence: 90 })] }),
        baseScore('R', { score: 60, level: 'İZLEME_LISTESI', levelLabel: 'İzleme' }),
        null,
      );
      expect(engine.matchesFilters(highRisk, { maxRisk: 'low' })).toBe(false);
      expect(engine.matchesFilters(highRisk, { maxRisk: 'high' })).toBe(true);
    });

    it('filters by sector (case-insensitive)', () => {
      expect(engine.matchesFilters(res(), { sector: 'ulaştırma' })).toBe(true);
      expect(engine.matchesFilters(res(), { sector: 'banka' })).toBe(false);
    });

    it('filters by marketCap', () => {
      expect(engine.matchesFilters(res(), { marketCap: { min: 100000000000 } })).toBe(true);
      expect(engine.matchesFilters(res(), { marketCap: { min: 200000000000 } })).toBe(false);
      expect(engine.matchesFilters(res(), { marketCap: { max: 180000000000 } })).toBe(false);

      const noCap = engine.buildIntelligenceResult(baseInput('N'), baseScore('N'), null);
      expect(engine.matchesFilters(noCap, { marketCap: { min: 1 } })).toBe(false);
    });

    it('filters by liquidity (low acceptable for medium/high thresholds)', () => {
      expect(engine.matchesFilters(res(), { liquidity: 'high' })).toBe(true);
      expect(engine.matchesFilters(res(), { liquidity: 'medium' })).toBe(true);
      expect(engine.matchesFilters(res(), { liquidity: 'low' })).toBe(true);

      const lowLiq = engine.buildIntelligenceResult(
        baseInput('L', { predictions: [makePrediction('L', { liquidityQuality: 'low' })] }),
        baseScore('L'),
        null,
      );
      expect(engine.matchesFilters(lowLiq, { liquidity: 'medium' })).toBe(false);
      expect(engine.matchesFilters(lowLiq, { liquidity: 'low' })).toBe(true);
    });

    it('filters by minSmartMoneyScore', () => {
      expect(engine.matchesFilters(res(), { minSmartMoneyScore: 78 })).toBe(true);
      expect(engine.matchesFilters(res(), { minSmartMoneyScore: 79 })).toBe(false);
    });

    it('filters by minCatalystScore', () => {
      expect(engine.matchesFilters(res(), { minCatalystScore: 70 })).toBe(true);
      expect(engine.matchesFilters(res(), { minCatalystScore: 71 })).toBe(false);
    });

    it('filters by minEliteScore', () => {
      expect(engine.matchesFilters(res(), { minEliteScore: 85 })).toBe(true);
      expect(engine.matchesFilters(res(), { minEliteScore: 86 })).toBe(false);
    });

    it('combines multiple filters (AND)', () => {
      expect(
        engine.matchesFilters(res(), {
          minEarlyOpportunityScore: 75,
          minConfidence: 80,
          sector: 'ulaştırma',
          minEliteScore: 80,
        }),
      ).toBe(true);

      expect(
        engine.matchesFilters(res(), {
          minEarlyOpportunityScore: 79,
          minConfidence: 80,
        }),
      ).toBe(false);
    });

    it('filters by minSignalConvergence', () => {
      const withSignals = withSignalFields({ signalConvergenceScore: 84, earlySignalCount: 5, confirmedSignalCount: 3 });
      expect(engine.matchesFilters(withSignals, { minSignalConvergence: 84 })).toBe(true);
      expect(engine.matchesFilters(withSignals, { minSignalConvergence: 85 })).toBe(false);
    });

    it('filters by minSignalStrength using strongest signal', () => {
      const withSignals = withSignalFields({
        signalConvergenceScore: 84,
        signals: [signal('THYAO', 'SMART_MONEY', 'accumulation', 'EARLY', 72)],
      });
      expect(engine.matchesFilters(withSignals, { minSignalStrength: 72 })).toBe(true);
      expect(engine.matchesFilters(withSignals, { minSignalStrength: 73 })).toBe(false);
    });

    it('filters by signalCategory', () => {
      const withSignals = withSignalFields({
        signalConvergenceScore: 84,
        signals: [signal('THYAO', 'CATALYST', 'material_disclosure', 'CONFIRMED', 80)],
      });
      expect(engine.matchesFilters(withSignals, { signalCategory: 'CATALYST' })).toBe(true);
      expect(engine.matchesFilters(withSignals, { signalCategory: 'FUNDAMENTAL' })).toBe(false);
    });

    it('filters by signalType', () => {
      const withSignals = withSignalFields({
        signalConvergenceScore: 84,
        signals: [signal('THYAO', 'SMART_MONEY', 'accumulation', 'EARLY', 72)],
      });
      expect(engine.matchesFilters(withSignals, { signalType: 'accumulation' })).toBe(true);
      expect(engine.matchesFilters(withSignals, { signalType: 'distribution' })).toBe(false);
    });

    it('filters by earlyOnly / confirmedOnly', () => {
      const earlyOnly = withSignalFields({
        signalConvergenceScore: 84,
        earlySignalCount: 3,
        confirmedSignalCount: 0,
        signals: [signal('THYAO', 'SMART_MONEY', 'accumulation', 'EARLY', 72)],
      });
      expect(engine.matchesFilters(earlyOnly, { earlyOnly: true })).toBe(true);
      expect(engine.matchesFilters(earlyOnly, { confirmedOnly: true })).toBe(false);

      const confirmed = withSignalFields({
        signalConvergenceScore: 84,
        earlySignalCount: 0,
        confirmedSignalCount: 1,
        signals: [signal('THYAO', 'CATALYST', 'material_disclosure', 'CONFIRMED', 80)],
      });
      expect(engine.matchesFilters(confirmed, { confirmedOnly: true })).toBe(true);
      expect(engine.matchesFilters(confirmed, { earlyOnly: true })).toBe(false);
    });
  });

  describe('explain', () => {
    it('produces a deterministic Turkish narrative containing key figures and ticker', () => {
      const nar = engine.explain(res());
      expect(nar).toContain('THYAO');
      expect(nar).toContain('78/100');
      expect(nar).toContain('%84');
      expect(nar).toContain('%81');
      expect(nar).toContain('%6.4');
      expect(nar).toContain('Akıllı para');
      expect(nar).toContain('Katalizör');
      expect(nar).toContain('doğrulandı');
      expect(nar).toContain('Nedenler:');
    });

    it('does not mention smart money when score is low', () => {
      const low = engine.buildIntelligenceResult(
        baseInput('L', { predictions: [makePrediction('L', { smartMoneyScore: 10, confidence: 40, bullishProbability: 40 })] }),
        baseScore('L', { score: 30, level: 'BEKLE', levelLabel: 'Bekle', components: components({ smartMoneyScore: 10, confidence: 40 }) }),
        null,
      );
      const nar = engine.explain(low);
      expect(nar).not.toContain('Akıllı para');
    });
  });

  describe('rankByAdjusted', () => {
    it('ranks by score * modifier descending', () => {
      const a = engine.buildIntelligenceResult(baseInput('A'), baseScore('A', { score: 80 }), 100);
      const b = engine.buildIntelligenceResult(baseInput('B'), baseScore('B', { score: 90 }), 100);
      const modifiers = new Map([['A', 1.15]]);
      const ranked = engine.rankByAdjusted([a, b], modifiers);
      expect(ranked[0].ticker).toBe('A');
      expect(ranked[1].ticker).toBe('B');
    });
  });
});
