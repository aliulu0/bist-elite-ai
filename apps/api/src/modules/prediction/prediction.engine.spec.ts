import { PredictionEngine, PredictionEngineInput } from './prediction.engine';
import { IndicatorResult, OHLCV } from '../indicators/indicator.types';
import { MarketStructureResult } from '../market-structure/market-structure.types';
import { SmartMoneyScoreResult } from '../smart-money/smart-money.types';

function makeBar(close: number, volume: number, timestamp: string): OHLCV {
  return { open: close * 0.99, high: close * 1.01, low: close * 0.98, close, volume, timestamp };
}

function makeBars(count: number, baseClose = 100): OHLCV[] {
  const bars: OHLCV[] = [];
  for (let i = 0; i < count; i++) {
    bars.push(makeBar(baseClose + i, 500_000, `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`));
  }
  return bars;
}

function makeIndicator(
  indicator: string,
  value: number | number[] | Record<string, number | boolean> | null,
  metadata: Record<string, unknown> = {},
): IndicatorResult {
  return {
    indicator,
    timeframe: '1d',
    timestamp: '2026-01-30T00:00:00Z',
    value,
    metadata,
    isValid: true,
  };
}

function makeStructure(overrides: Partial<MarketStructureResult> = {}): MarketStructureResult {
  return {
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
    ...overrides,
  };
}

function makeSmartMoney(overrides: Partial<SmartMoneyScoreResult> = {}): SmartMoneyScoreResult {
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
    ...overrides,
  };
}

function bullishIndicators(): IndicatorResult[] {
  return [
    makeIndicator('SMA_20', 103),
    makeIndicator('SMA_50', 98),
    makeIndicator('SMA_200', 90),
    makeIndicator('EMA_20', 105),
    makeIndicator('EMA_50', 100),
    makeIndicator('RSI', 62),
    makeIndicator('MACD', { macd: 1.2, signal: 0.8, histogram: 0.4 }),
    makeIndicator('ROC', 2.1),
    makeIndicator('ATR', 2.5),
    makeIndicator('ADX', { adx: 30, diPlus: 24, diMinus: 14 }),
    makeIndicator('BollingerBands', { upper: 112, middle: 103, lower: 94 }),
  ];
}

function bearishIndicators(): IndicatorResult[] {
  return [
    makeIndicator('SMA_20', 103),
    makeIndicator('SMA_50', 106),
    makeIndicator('SMA_200', 110),
    makeIndicator('EMA_20', 102),
    makeIndicator('EMA_50', 105),
    makeIndicator('RSI', 38),
    makeIndicator('MACD', { macd: -1.2, signal: -0.8, histogram: -0.4 }),
    makeIndicator('ROC', -2.1),
    makeIndicator('ATR', 2.5),
    makeIndicator('ADX', { adx: 28, diPlus: 14, diMinus: 24 }),
    makeIndicator('BollingerBands', { upper: 112, middle: 103, lower: 94 }),
  ];
}

function makeInput(overrides: Partial<PredictionEngineInput> = {}): PredictionEngineInput {
  return {
    ticker: 'ASELS.IS',
    timeframe: '1d',
    dataTimeframe: '1d',
    bars: makeBars(30),
    indicators: bullishIndicators(),
    structure: makeStructure(),
    smartMoney: makeSmartMoney(),
    catalyst: { ticker: 'ASELS.IS', catalystScore: 90, confidence: 80, expectedImpact: 'bullish', events: [], verifiedCount: 1, totalCount: 1, rawSources: [], generatedAt: new Date().toISOString() },
    verification: { ticker: 'ASELS.IS', verified: 'TRUE', verificationScore: 90, evidenceCount: 2, sourceCount: 2, trustedSources: [], conflictingSources: [], lastVerified: new Date().toISOString(), verificationReason: 'ok', claims: [], rawSources: [] },
    ...overrides,
  };
}

describe('PredictionEngine', () => {
  let engine: PredictionEngine;

  beforeEach(() => {
    engine = new PredictionEngine();
  });

  it('produces bullish-dominant probabilities in an uptrend', () => {
    const features = engine.evaluate(makeInput());

    expect(features.isValid).toBe(true);
    expect(features.bullishProbability).toBeGreaterThan(features.bearishProbability);
    expect(features.bullishProbability + features.bearishProbability + features.neutralProbability).toBe(100);
    expect(features.trendDirection).toBe('up');
    expect(features.trendStrength).toBe('strong');
    expect(features.momentum).toBe('strong_bullish');
    expect(features.liquidityQuality).toBe('high');
    expect(features.risk).toBe('low');
    expect(features.expectedVolatility).toBeGreaterThan(0);
  });

  it('produces bearish-dominant probabilities in a downtrend', () => {
    const features = engine.evaluate(
      makeInput({
        structure: makeStructure({ trend: 'downtrend' }),
        indicators: bearishIndicators(),
        catalyst: null,
        verification: null,
      }),
    );

    expect(features.isValid).toBe(true);
    expect(features.bearishProbability).toBeGreaterThan(features.bullishProbability);
    expect(features.trendDirection).toBe('down');
    expect(features.trendStrength).toBe('strong');
  });

  it('returns empty features when structure is invalid', () => {
    const features = engine.evaluate(
      makeInput({ structure: makeStructure({ isValid: false, trend: 'sideways' }) }),
    );

    expect(features.isValid).toBe(false);
    expect(features.bullishProbability).toBe(0);
  });

  it('returns empty features when no bars', () => {
    const features = engine.evaluate(makeInput({ bars: [] }));

    expect(features.isValid).toBe(false);
  });

  it('is deterministic for identical inputs', () => {
    const a = engine.evaluate(makeInput());
    const b = engine.evaluate(makeInput());

    expect(a).toEqual(b);
  });

  it('builds deterministic signals in an uptrend', () => {
    const features = engine.evaluate(makeInput());

    const types = features.signals.map((s) => s.type);
    expect(types).toContain('trend_bullish');
    expect(types).toContain('momentum_bullish');
    expect(types).toContain('trend_strength_high');
  });

  it('computes expected volatility scaled by timeframe holding bars', () => {
    const daily = engine.evaluate(makeInput());
    const hourly = engine.evaluate(makeInput({ timeframe: '1h' }));

    expect(hourly.expectedVolatility).toBeLessThan(daily.expectedVolatility);
  });
});
