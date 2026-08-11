import { SmartMoneyScoreEngine } from './smart-money-score.engine';
import { SmartMoneyScoreInput } from './smart-money-score.engine';
import { IndicatorResult, OHLCV } from '../indicators/indicator.types';
import { SmartMoneyResult } from './smart-money.types';

function makeBar(close: number, volume: number, timestamp: string): OHLCV {
  return { open: close * 0.99, high: close * 1.01, low: close * 0.98, close, volume, timestamp };
}

function makeBars(count: number, baseClose = 100, baseVolume = 500_000): OHLCV[] {
  const bars: OHLCV[] = [];
  for (let i = 0; i < count; i++) {
    const step = i < count - 1 ? 0 : 3;
    bars.push(makeBar(baseClose + step, i < count - 1 ? baseVolume : baseVolume * 2.5, `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`));
  }
  return bars;
}

function makeIndicator(indicator: string, value: number | number[] | Record<string, number | boolean> | null, metadata: Record<string, unknown> = {}): IndicatorResult {
  return {
    indicator,
    timeframe: '1d',
    timestamp: '2026-01-30T00:00:00Z',
    value,
    metadata,
    isValid: true,
  };
}

function makeSmartMoney(overrides: Partial<SmartMoneyResult> = {}): SmartMoneyResult {
  return {
    timeframe: '1d',
    accumulationScore: 0.8,
    distributionScore: 0.2,
    institutionalActivity: 'accumulating',
    smartMoneyConfidence: 0.8,
    trendAlignment: 'uptrend',
    signals: [],
    metadata: {},
    isValid: true,
    ...overrides,
  };
}

function makeInput(overrides: Partial<SmartMoneyScoreInput> = {}): SmartMoneyScoreInput {
  return {
    ticker: 'ASELS.IS',
    timeframe: '1d',
    bars: makeBars(30),
    indicators: [
      makeIndicator('RelativeVolume', 2.4),
      makeIndicator('VolumeSpike', 2.2),
      makeIndicator('CMF', 0.08),
      makeIndicator('MFI', 62),
      makeIndicator('OBV', null, { values: [100, 110, 120, 130, 140, 150] }),
    ],
    smartMoney: makeSmartMoney(),
    verification: 'TRUE',
    catalystScore: 90,
    ...overrides,
  };
}

describe('SmartMoneyScoreEngine', () => {
  let engine: SmartMoneyScoreEngine;

  beforeEach(() => {
    engine = new SmartMoneyScoreEngine();
  });

  it('produces a valid result with all required fields', () => {
    const result = engine.score(makeInput());

    expect(result.isValid).toBe(true);
    expect(result.ticker).toBe('ASELS.IS');
    expect(result.timeframe).toBe('1d');
    expect(typeof result.smartMoneyScore).toBe('number');
    expect(typeof result.liquidityScore).toBe('number');
    expect(typeof result.volumeScore).toBe('number');
    expect(typeof result.accumulationScore).toBe('number');
    expect(typeof result.distributionScore).toBe('number');
    expect(typeof result.relativeVolume).toBe('number');
    expect(typeof result.volumeSpike).toBe('number');
    expect(typeof result.moneyFlow).toBe('string');
    expect(typeof result.institutionalActivity).toBe('string');
    expect(typeof result.confidence).toBe('number');
    expect(typeof result.risk).toBe('string');
    expect(result.relativeVolume).toBe(2.4);
    expect(result.volumeSpike).toBe(2.2);
    expect(result.generatedAt).toBeDefined();
  });

  it('scores high for strong accumulation with volume confirmation', () => {
    const result = engine.score(makeInput());

    expect(result.smartMoneyScore).toBeGreaterThanOrEqual(70);
    expect(result.accumulationScore).toBeGreaterThan(result.distributionScore);
    expect(result.institutionalActivity).toBe('accumulating');
    expect(['high', 'medium']).toContain(result.liquidity);
  });

  it('scores low for heavy distribution', () => {
    const result = engine.score(
      makeInput({
        smartMoney: makeSmartMoney({
          accumulationScore: 0.1,
          distributionScore: 0.9,
          institutionalActivity: 'distributing',
          trendAlignment: 'downtrend',
        }),
        indicators: [
          makeIndicator('RelativeVolume', 1.2),
          makeIndicator('VolumeSpike', 1.0),
          makeIndicator('CMF', -0.12),
          makeIndicator('MFI', 22),
          makeIndicator('OBV', null, { values: [150, 140, 130, 120, 110, 100] }),
        ],
        verification: 'FALSE',
      }),
    );

    expect(result.smartMoneyScore).toBeLessThanOrEqual(35);
    expect(result.distributionScore).toBeGreaterThan(result.accumulationScore);
    expect(result.institutionalActivity).toBe('distributing');
    expect(['negative', 'strong_negative']).toContain(result.moneyFlow);
  });

  it('returns neutral for balanced signals', () => {
    const result = engine.score(
      makeInput({
        smartMoney: makeSmartMoney({
          accumulationScore: 0.5,
          distributionScore: 0.5,
          institutionalActivity: 'neutral',
          trendAlignment: 'sideways',
        }),
        indicators: [
          makeIndicator('RelativeVolume', 1.0),
          makeIndicator('VolumeSpike', 1.0),
          makeIndicator('CMF', 0),
          makeIndicator('MFI', 50),
        ],
        verification: null,
        catalystScore: null,
      }),
    );

    expect(result.institutionalActivity).toBe('neutral');
    expect(result.moneyFlow).toBe('neutral');
    expect(result.smartMoneyScore).toBeGreaterThanOrEqual(30);
    expect(result.smartMoneyScore).toBeLessThanOrEqual(70);
  });

  it('classifies money flow directions', () => {
    const strongPositive = engine.score(
      makeInput({
        indicators: [
          makeIndicator('CMF', 0.2),
          makeIndicator('MFI', 90),
          makeIndicator('OBV', null, { values: [100, 120, 140, 160, 180, 200] }),
        ],
      }),
    );
    expect(strongPositive.moneyFlow).toBe('strong_positive');

    const strongNegative = engine.score(
      makeInput({
        indicators: [
          makeIndicator('CMF', -0.2),
          makeIndicator('MFI', 10),
          makeIndicator('OBV', null, { values: [200, 180, 160, 140, 120, 100] }),
        ],
      }),
    );
    expect(strongNegative.moneyFlow).toBe('strong_negative');
  });

  it('detects breakout volume when last bar surges on price up', () => {
    const result = engine.score(makeInput());
    expect(result.breakoutVolume).toBe(true);
  });

  it('counts accumulation and distribution days from bars', () => {
    const result = engine.score(makeInput());

    expect(result.accumulationDays).toBeGreaterThanOrEqual(0);
    expect(result.distributionDays).toBeGreaterThanOrEqual(0);
    expect(result.accumulationDays + result.distributionDays).toBeGreaterThan(0);
  });

  it('computes risk label from distribution and liquidity', () => {
    const highRisk = engine.score(
      makeInput({
        smartMoney: makeSmartMoney({ distributionScore: 0.9, accumulationScore: 0.1 }),
        bars: makeBars(30, 100, 50_000),
      }),
    );
    expect(['medium', 'high']).toContain(highRisk.risk);
  });

  it('folds verification and catalyst score into confidence', () => {
    const verified = engine.score(makeInput());
    const unverified = engine.score(
      makeInput({ verification: null, catalystScore: null }),
    );

    expect(verified.confidence).toBeGreaterThanOrEqual(unverified.confidence);
  });

  it('returns invalid result for empty bars', () => {
    const result = engine.score(
      makeInput({ bars: [], smartMoney: makeSmartMoney({ isValid: false }) }),
    );

    expect(result.isValid).toBe(false);
    expect(result.smartMoneyScore).toBe(0);
  });

  it('falls back to computed relative volume when indicator missing', () => {
    const result = engine.score(
      makeInput({
        indicators: [
          makeIndicator('VolumeSpike', 2.2),
          makeIndicator('CMF', 0.08),
        ],
      }),
    );

    expect(result.relativeVolume).toBeGreaterThan(1);
  });
});
