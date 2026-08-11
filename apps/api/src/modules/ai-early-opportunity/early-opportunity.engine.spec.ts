import { EarlyOpportunityEngine } from './early-opportunity.engine';
import { EarlyOpportunitySymbolInput } from './early-opportunity.types';
import { PredictionResult } from '../prediction/prediction.types';
import { AIConsensus } from '../ai-research/ai-research.types';
import { EliteScoreResult } from '../ai-elite-score/elite-score.types';
import { OpportunityResult } from '../ai-opportunity/opportunity.types';
import { DecisionResult } from '../decision/decision.types';

function makePrediction(
  ticker: string,
  opts: Partial<PredictionResult> = {},
): PredictionResult {
  return {
    ticker,
    timeframe: '1d',
    dataTimeframe: '1d',
    bullishProbability: 80,
    bearishProbability: 20,
    neutralProbability: 0,
    confidence: 80,
    trendStrength: 'strong',
    trendDirection: 'up',
    momentum: 'bullish',
    expectedReturn: 6.4,
    expectedVolatility: 2,
    risk: 'low',
    riskScore: 20,
    liquidityQuality: 'high',
    expectedHoldingPeriod: { value: 4, unit: 'days' },
    entryZone: null,
    stopZone: null,
    target1: null,
    target2: null,
    riskRewardRatio: null,
    scenarios: [],
    signals: [],
    backtestAccuracy: { winRate: 0.6, totalTrades: 10, sharpeRatio: 1, isValid: true },
    verification: 'TRUE',
    catalystScore: 70,
    smartMoneyScore: 80,
    metadata: {},
    generatedAt: new Date().toISOString(),
    isValid: true,
    ...opts,
  };
}

function makeConsensus(ticker: string, parts: Partial<AIConsensus> = {}): AIConsensus {
  return {
    ticker,
    chatgptSummary: null,
    geminiSummary: null,
    perplexitySummary: null,
    grokSummary: null,
    newsSummary: '',
    researchSources: [],
    agreementLevel: 0.7,
    conflicts: [],
    confidence: 0.8,
    consensusScore: 80,
    providerSummaries: {},
    totalEvidence: 5,
    duplicatesRemoved: 0,
    timestamp: new Date().toISOString(),
    ...parts,
  };
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
  };
}

function makeOpportunity(ticker: string, score: number): OpportunityResult {
  return {
    ticker,
    company: `${ticker} Inc`,
    level: 'GÜÇLÜ_FIRSAT',
    levelLabel: 'Güçlü Fırsat',
    levelEmoji: '🟢',
    opportunityScore: score,
    confidence: 80,
    decision: 'AL',
    decisionLabel: 'Al',
    decisionScore: 75,
    decisionConfidence: 80,
    aiScore: 80,
    aiConfidence: 80,
    strategyId: 'momentum',
    strategyName: 'Momentum',
    strategyScore: 75,
    verification: 80,
    catalyst: 70,
    momentum: 75,
    trend: 80,
    risk: 20,
    liquidity: 85,
    technical: 80,
    fundamental: 70,
    quality: 80,
    reasons: [],
    warnings: [],
    positiveSignals: [],
    negativeSignals: [],
    tags: [],
    evaluatedAt: new Date().toISOString(),
  };
}

function makeDecision(ticker: string, decisionScore: number): DecisionResult {
  return {
    ticker,
    company: `${ticker} Inc`,
    decision: 'AL',
    decisionLabel: 'Al',
    decisionScore,
    confidence: 80,
    reasons: [],
    warnings: [],
    positiveSignals: [],
    negativeSignals: [],
    overview: { ratings: [], totalStars: 4, maxStars: 7 },
    aiScore: 80,
    aiConfidence: 80,
    strategyId: 'momentum',
    strategyName: 'Momentum',
    strategyScore: 75,
    dimensionScores: {
      technical: 80,
      fundamental: 70,
      momentum: 75,
      trend: 80,
      liquidity: 85,
      risk: 20,
      volume: 80,
      quality: 80,
      verification: 80,
      catalyst: 70,
    },
    evaluatedAt: new Date().toISOString(),
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
    opportunity: makeOpportunity(ticker, 82),
    decision: makeDecision(ticker, 80),
    ...overrides,
  };
}

describe('EarlyOpportunityEngine', () => {
  let engine: EarlyOpportunityEngine;

  beforeEach(() => {
    engine = new EarlyOpportunityEngine();
  });

  it('scores a strong bullish setup highly (>= 70)', () => {
    const res = engine.evaluate(baseInput());
    expect(res.score).toBeGreaterThanOrEqual(70);
    expect(res.level).not.toBe('BEKLE');
    expect(res.ticker).toBe('THYAO');
    expect(res.sector).toBe('Ulaştırma');
    expect(res.timeframesEvaluated).toEqual(['1d']);
  });

  it('returns score 0 / BEKLE when no valid predictions', () => {
    const res = engine.evaluate(
      baseInput('X', { predictions: [makePrediction('X', { isValid: false })] }),
    );
    expect(res.score).toBe(0);
    expect(res.level).toBe('BEKLE');
    expect(res.reasons).toContain('Yeterli tahmin verisi yok');
  });

  it('degrades to BEKLE when confidence and bullish probability are low', () => {
    const res = engine.evaluate(
      baseInput('WEAKL', {
        predictions: [
          makePrediction('WEAKL', {
            bullishProbability: 30,
            bearishProbability: 70,
            confidence: 30,
            expectedReturn: 1,
            smartMoneyScore: 10,
            riskScore: 80,
            verification: null,
          }),
        ],
        consensus: makeConsensus('WEAKL', { agreementLevel: 0.2, confidence: 0.2, consensusScore: 20 }),
        eliteScore: makeElite('WEAKL', 30),
        opportunity: makeOpportunity('WEAKL', 20),
        decision: makeDecision('WEAKL', 25),
      }),
    );
    expect(res.score).toBeLessThan(45);
    expect(res.level).toBe('BEKLE');
  });

  it('boosts score via multi-timeframe agreement', () => {
    const single = engine.evaluate(
      baseInput('ONE', {
        predictions: [
          makePrediction('ONE', {
            bullishProbability: 65,
            bearishProbability: 35,
            confidence: 65,
            expectedReturn: 4,
          }),
        ],
      }),
    );
    const multi = engine.evaluate(
      baseInput('ONE', {
        predictions: [
          makePrediction('ONE', {
            bullishProbability: 65,
            bearishProbability: 35,
            confidence: 65,
            expectedReturn: 4,
          }),
          makePrediction('ONE', {
            timeframe: '1w',
            bullishProbability: 70,
            bearishProbability: 30,
            confidence: 70,
            expectedReturn: 4,
            smartMoneyScore: 80,
          }),
          makePrediction('ONE', {
            timeframe: '1m',
            bullishProbability: 75,
            bearishProbability: 25,
            confidence: 72,
            expectedReturn: 4,
            smartMoneyScore: 85,
          }),
        ],
      }),
    );
    expect(multi.components.timeframeAgreement).toBe(100);
    expect(multi.score).toBeGreaterThan(single.score);
  });

  it('applies verification bonus and penalizes lack thereof', () => {
    const verified = engine.evaluate(baseInput('V', {
      predictions: [makePrediction('V', { verification: 'TRUE' })],
    }));
    const unverified = engine.evaluate(baseInput('V', {
      predictions: [makePrediction('V', { verification: null })],
    }));
    expect(verified.score).toBeGreaterThan(unverified.score);
  });

  it('confidence directly affects riskAdjustedReturn (gating)', () => {
    const lowConf = engine.evaluate(
      baseInput('C', {
        predictions: [
          makePrediction('C', { confidence: 20, expectedReturn: 10 }),
        ],
      }),
    );
    const highConf = engine.evaluate(
      baseInput('C', {
        predictions: [
          makePrediction('C', { confidence: 95, expectedReturn: 10 }),
        ],
      }),
    );
    expect(highConf.components.riskAdjustedReturn).toBeGreaterThan(lowConf.components.riskAdjustedReturn);
  });

  it('clamps score to 0-100', () => {
    const res = engine.evaluate(baseInput());
    expect(res.score).toBeGreaterThanOrEqual(0);
    expect(res.score).toBeLessThanOrEqual(100);
  });
});
