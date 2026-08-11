import { PredictionScoreEngine, PredictionScoreInput } from './prediction-score.engine';
import { PredictionFeatures } from './prediction.types';
import { OHLCV } from '../indicators/indicator.types';
import { EntryZoneResult } from '../entry/entry-zone.types';
import { SmartMoneyScoreResult } from '../smart-money/smart-money.types';

function makeBar(close: number, volume: number, timestamp: string): OHLCV {
  return { open: close * 0.99, high: close * 1.01, low: close * 0.98, close, volume, timestamp };
}

function makeBars(count: number): OHLCV[] {
  const bars: OHLCV[] = [];
  for (let i = 0; i < count; i++) {
    bars.push(makeBar(100 + i, 500_000, `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`));
  }
  return bars;
}

function makeFeatures(overrides: Partial<PredictionFeatures> = {}): PredictionFeatures {
  return {
    bullishProbability: 91,
    bearishProbability: 9,
    neutralProbability: 0,
    trendStrength: 'strong',
    trendDirection: 'up',
    momentum: 'strong_bullish',
    expectedVolatility: 2.1,
    expectedReturn: 6.4,
    liquidityQuality: 'high',
    risk: 'low',
    riskScore: 22,
    signals: [],
    metadata: {},
    isValid: true,
    ...overrides,
  };
}

function makeEntryZone(overrides: Partial<EntryZoneResult> = {}): EntryZoneResult {
  return {
    ticker: 'ASELS.IS',
    company: 'ASELS.IS',
    price: 160,
    idealEntryZone: { min: 158, max: 161 },
    aggressiveEntry: 162,
    conservativeEntry: 158,
    support1: 156,
    support2: 152,
    resistance1: 170,
    resistance2: 177,
    stopLoss: 154,
    target1: 170,
    target2: 177,
    target3: 184,
    riskRewardRatio: 1.7,
    riskRewardLabel: '1 : 1.7',
    entryConfidence: 78,
    trendDirection: 'UPTREND',
    entryQuality: { level: 'GOOD', label: 'İyi', stars: '★★★☆☆' },
    reasons: [],
    warnings: [],
    evaluatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeSmartMoney(): SmartMoneyScoreResult {
  return {
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
  };
}

function makeInput(overrides: Partial<PredictionScoreInput> = {}): PredictionScoreInput {
  return {
    ticker: 'ASELS.IS',
    timeframe: '1d',
    dataTimeframe: '1d',
    bars: makeBars(30),
    features: makeFeatures(),
    smartMoney: makeSmartMoney(),
    catalyst: { ticker: 'ASELS.IS', catalystScore: 90, confidence: 80, expectedImpact: 'bullish', events: [], verifiedCount: 1, totalCount: 1, rawSources: [], generatedAt: new Date().toISOString() },
    verification: { ticker: 'ASELS.IS', verified: 'TRUE', verificationScore: 90, evidenceCount: 2, sourceCount: 2, trustedSources: [], conflictingSources: [], lastVerified: new Date().toISOString(), verificationReason: 'ok', claims: [], rawSources: [] },
    entryZone: makeEntryZone(),
    backtest: { winRate: 68, totalTrades: 12, sharpeRatio: 1.4, isValid: true },
    ...overrides,
  };
}

describe('PredictionScoreEngine', () => {
  let engine: PredictionScoreEngine;

  beforeEach(() => {
    engine = new PredictionScoreEngine();
  });

  it('produces a valid result with all required fields', () => {
    const result = engine.score(makeInput());

    expect(result.isValid).toBe(true);
    expect(result.ticker).toBe('ASELS.IS');
    expect(result.bullishProbability).toBe(91);
    expect(result.bearishProbability).toBe(9);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
    expect(result.entryZone).toEqual({ min: 158, max: 161 });
    expect(result.stopZone).toBe(154);
    expect(result.target1).toBe(170);
    expect(result.target2).toBe(177);
    expect(result.riskRewardRatio).toBe(1.7);
    expect(result.expectedHoldingPeriod).toEqual({ value: 4, unit: 'days' });
    expect(result.scenarios).toHaveLength(3);
    expect(result.backtestAccuracy.winRate).toBe(68);
  });

  it('calibrates confidence with historical win rate', () => {
    const result = engine.score(makeInput());

    const metadata = result.metadata as Record<string, unknown>;
    const calibration = metadata.calibration as Record<string, number>;
    expect(calibration.historicalWinRate).toBe(68);
    expect(result.confidence).toBeGreaterThan(40);
  });

  it('produces three scenarios with matching probabilities', () => {
    const result = engine.score(makeInput());

    const bullish = result.scenarios.find((s) => s.bias === 'bullish');
    const bearish = result.scenarios.find((s) => s.bias === 'bearish');
    const neutral = result.scenarios.find((s) => s.bias === 'neutral');

    expect(bullish?.probability).toBe(91);
    expect(bearish?.probability).toBe(9);
    expect(neutral?.probability).toBe(0);
    expect(bullish?.expectedReturn).toBeGreaterThan(0);
    expect(bearish?.expectedReturn).toBeLessThan(0);
  });

  it('computes expected return from the entry zone target', () => {
    const result = engine.score(makeInput());

    expect(result.expectedReturn).toBeCloseTo((170 - 159.5) / 159.5 * 100, 1);
  });

  it('falls back to feature expected return when entry zone is missing', () => {
    const result = engine.score(
      makeInput({
        entryZone: makeEntryZone({ idealEntryZone: null, target1: null, target2: null, stopLoss: null, riskRewardRatio: null }),
      }),
    );

    expect(result.expectedReturn).toBe(6.4);
    expect(result.entryZone).toBeNull();
    expect(result.stopZone).toBeNull();
  });

  it('returns empty result when features are invalid', () => {
    const result = engine.score(makeInput({ features: makeFeatures({ isValid: false }) }));

    expect(result.isValid).toBe(false);
    expect(result.bullishProbability).toBe(0);
  });

  it('is deterministic for identical inputs', () => {
    const a = engine.score(makeInput());
    const b = engine.score(makeInput());

    expect(a).toEqual(b);
  });
});
