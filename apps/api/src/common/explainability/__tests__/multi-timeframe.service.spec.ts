import { MultiTimeframeAnalyzer } from '../multi-timeframe.service';
import {
  ExplanationInput,
  Timeframe,
  TrendDirection,
  MomentumState,
} from '../types';

function createFullInput(overrides?: Partial<ExplanationInput>): ExplanationInput {
  return {
    stockSymbol: 'THYAO',
    stockName: 'Türk Hava Yolları',
    currentPrice: 285.50,
    technicalScore: { momentum: 65, trend: 60, volatility: 45, volume: 55, composite: 58 },
    indicators: [
      { indicator: 'RSI', timeframe: Timeframe.D1, value: 62, signal: 'bullish', interpretation: 'test', weight: 0.15, isPositive: true },
      { indicator: 'MACD', timeframe: Timeframe.D1, value: 1.5, signal: 'bullish', interpretation: 'test', weight: 0.15, isPositive: true },
    ],
    timeframeData: {
      [Timeframe.M4]: { trend: TrendDirection.UPTREND, momentum: MomentumState.BULLISH_MOMENTUM },
      [Timeframe.D1]: { trend: TrendDirection.UPTREND, momentum: MomentumState.BULLISH_MOMENTUM },
      [Timeframe.W1]: { trend: TrendDirection.UPTREND, momentum: MomentumState.BULLISH_MOMENTUM },
      [Timeframe.M1]: { trend: TrendDirection.SIDEWAYS, momentum: MomentumState.NEUTRAL },
    },
    ...overrides,
  };
}

describe('MultiTimeframeAnalyzer', () => {
  let analyzer: MultiTimeframeAnalyzer;

  beforeEach(() => {
    analyzer = new MultiTimeframeAnalyzer();
  });

  describe('analyze', () => {
    it('returns MultiTimeframeSummary with all fields', () => {
      const result = analyzer.analyze(createFullInput());
      expect(result).toHaveProperty('agreements');
      expect(result).toHaveProperty('dominantTrend');
      expect(result).toHaveProperty('overallAgreement');
      expect(result).toHaveProperty('hasConflict');
      expect(result).toHaveProperty('shortTermView');
      expect(result).toHaveProperty('mediumTermView');
      expect(result).toHaveProperty('longTermView');
    });

    it('creates agreement for each timeframe', () => {
      const result = analyzer.analyze(createFullInput());
      expect(result.agreements.length).toBe(4);
      const tfValues = result.agreements.map(a => a.timeframe);
      expect(tfValues).toContain(Timeframe.M4);
      expect(tfValues).toContain(Timeframe.D1);
      expect(tfValues).toContain(Timeframe.W1);
      expect(tfValues).toContain(Timeframe.M1);
    });

    it('each agreement has valid structure', () => {
      const result = analyzer.analyze(createFullInput());
      for (const agreement of result.agreements) {
        expect(agreement.timeframe).toBeTruthy();
        expect(agreement.direction).toBeTruthy();
        expect(agreement.momentum).toBeTruthy();
        expect(typeof agreement.agreementScore).toBe('number');
        expect(agreement.agreementScore).toBeGreaterThanOrEqual(0);
        expect(agreement.agreementScore).toBeLessThanOrEqual(1);
        expect(agreement.description).toBeTruthy();
      }
    });

    it('calculates overall agreement between 0 and 1', () => {
      const result = analyzer.analyze(createFullInput());
      expect(result.overallAgreement).toBeGreaterThanOrEqual(0);
      expect(result.overallAgreement).toBeLessThanOrEqual(1);
    });

    it('detects no conflict when all timeframes agree', () => {
      const result = analyzer.analyze(createFullInput({
        timeframeData: {
          [Timeframe.M4]: { trend: TrendDirection.STRONG_UPTREND },
          [Timeframe.D1]: { trend: TrendDirection.STRONG_UPTREND },
          [Timeframe.W1]: { trend: TrendDirection.STRONG_UPTREND },
          [Timeframe.M1]: { trend: TrendDirection.STRONG_UPTREND },
        },
      }));
      expect(result.hasConflict).toBe(false);
    });

    it('detects conflict when short-term and long-term disagree', () => {
      const result = analyzer.analyze(createFullInput({
        timeframeData: {
          [Timeframe.M4]: { trend: TrendDirection.STRONG_UPTREND },
          [Timeframe.D1]: { trend: TrendDirection.STRONG_UPTREND },
          [Timeframe.W1]: { trend: TrendDirection.STRONG_DOWNTREND },
          [Timeframe.M1]: { trend: TrendDirection.STRONG_DOWNTREND },
        },
      }));
      expect(result.hasConflict).toBe(true);
      expect(result.conflictDescription).toBeTruthy();
      expect(result.conflictDescription).toContain('çelişki');
    });

    it('provides Turkish view summaries', () => {
      const result = analyzer.analyze(createFullInput());
      expect(result.shortTermView).toBeTruthy();
      expect(result.mediumTermView).toBeTruthy();
      expect(result.longTermView).toBeTruthy();
    });

    it('determines dominant trend based on timeframe weights', () => {
      const result = analyzer.analyze(createFullInput({
        timeframeData: {
          [Timeframe.M4]: { trend: TrendDirection.STRONG_DOWNTREND },
          [Timeframe.D1]: { trend: TrendDirection.STRONG_UPTREND },
          [Timeframe.W1]: { trend: TrendDirection.STRONG_UPTREND },
          [Timeframe.M1]: { trend: TrendDirection.STRONG_UPTREND },
        },
      }));
      expect(result.dominantTrend).toBe(TrendDirection.STRONG_UPTREND);
    });

    it('handles missing timeframe data by inferring from indicators', () => {
      const result = analyzer.analyze({
        stockSymbol: 'TEST',
        stockName: 'Test',
        currentPrice: 100,
        indicators: [
          { indicator: 'RSI', timeframe: Timeframe.D1, value: 65, signal: 'bullish', interpretation: 'test', weight: 0.15, isPositive: true },
          { indicator: 'MACD', timeframe: Timeframe.D1, value: 1.2, signal: 'bullish', interpretation: 'test', weight: 0.15, isPositive: true },
        ],
      });
      expect(result.agreements.length).toBeGreaterThan(0);
    });

    it('handles empty input', () => {
      const result = analyzer.analyze({
        stockSymbol: 'TEST',
        stockName: 'Test',
        currentPrice: 100,
      });
      expect(result.agreements.length).toBe(4);
      expect(result.overallAgreement).toBeGreaterThanOrEqual(0);
    });
  });
});
