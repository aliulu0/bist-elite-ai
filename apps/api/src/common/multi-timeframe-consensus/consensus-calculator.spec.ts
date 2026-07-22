import { ConsensusCalculator } from './consensus-calculator.service';
import { TimeframeData, Timeframe, TrendDirection, MomentumState, VolumeState, SignalType } from './types';

describe('ConsensusCalculator', () => {
  let calculator: ConsensusCalculator;

  beforeEach(() => {
    calculator = new ConsensusCalculator();
  });

  describe('calculate', () => {
    it('should return empty array for empty input', () => {
      const result = calculator.calculate([]);
      expect(result).toHaveLength(0);
    });

    it('should calculate scores for each timeframe', () => {
      const timeframes = createUniformTimeframes(TrendDirection.UPTREND, 70);
      const result = calculator.calculate(timeframes);
      expect(result).toHaveLength(4);
      expect(result.every(ts => ts.score >= 0 && ts.score <= 100)).toBe(true);
    });

    it('should give higher scores when all timeframes agree', () => {
      const timeframes = createUniformTimeframes(TrendDirection.STRONG_UPTREND, 80);
      const result = calculator.calculate(timeframes);
      const avgScore = result.reduce((sum, ts) => sum + ts.score, 0) / result.length;
      expect(avgScore).toBeGreaterThan(60);
    });

    it('should give lower scores when timeframes disagree', () => {
      const timeframes: TimeframeData[] = [
        { timeframe: Timeframe.M4, price: 100, trend: TrendDirection.STRONG_UPTREND, trendScore: 85, momentumScore: 75 },
        { timeframe: Timeframe.D1, price: 100, trend: TrendDirection.STRONG_DOWNTREND, trendScore: 85, momentumScore: 25 },
        { timeframe: Timeframe.W1, price: 100, trend: TrendDirection.STRONG_UPTREND, trendScore: 85, momentumScore: 75 },
        { timeframe: Timeframe.M1, price: 100, trend: TrendDirection.STRONG_DOWNTREND, trendScore: 85, momentumScore: 25 },
      ];
      const result = calculator.calculate(timeframes);
      const avgScore = result.reduce((sum, ts) => sum + ts.score, 0) / result.length;
      expect(avgScore).toBeLessThan(60);
    });

    it('should calculate trend agreement correctly', () => {
      const timeframes = createUniformTimeframes(TrendDirection.UPTREND, 70);
      const result = calculator.calculate(timeframes);
      for (const ts of result) {
        expect(ts.trendAgreement).toBeGreaterThanOrEqual(0);
        expect(ts.trendAgreement).toBeLessThanOrEqual(1);
      }
    });

    it('should calculate momentum agreement', () => {
      const timeframes: TimeframeData[] = [
        { timeframe: Timeframe.M4, price: 100, momentumScore: 70 },
        { timeframe: Timeframe.D1, price: 100, momentumScore: 65 },
        { timeframe: Timeframe.W1, price: 100, momentumScore: 72 },
        { timeframe: Timeframe.M1, price: 100, momentumScore: 68 },
      ];
      const result = calculator.calculate(timeframes);
      for (const ts of result) {
        expect(ts.momentumAgreement).toBeGreaterThanOrEqual(0);
        expect(ts.momentumAgreement).toBeLessThanOrEqual(1);
      }
    });

    it('should calculate volume confirmation', () => {
      const timeframes: TimeframeData[] = [
        { timeframe: Timeframe.M4, price: 100, volume: VolumeState.HIGH_VOLUME },
        { timeframe: Timeframe.D1, price: 100, volume: VolumeState.HIGH_VOLUME },
        { timeframe: Timeframe.W1, price: 100, volume: VolumeState.LOW_VOLUME },
        { timeframe: Timeframe.M1, price: 100, volume: VolumeState.HIGH_VOLUME },
      ];
      const result = calculator.calculate(timeframes);
      for (const ts of result) {
        expect(ts.volumeConfirmation).toBeGreaterThanOrEqual(0);
        expect(ts.volumeConfirmation).toBeLessThanOrEqual(1);
      }
    });

    it('should calculate risk agreement', () => {
      const timeframes: TimeframeData[] = [
        { timeframe: Timeframe.M4, price: 100, riskScore: 30 },
        { timeframe: Timeframe.D1, price: 100, riskScore: 35 },
        { timeframe: Timeframe.W1, price: 100, riskScore: 25 },
        { timeframe: Timeframe.M1, price: 100, riskScore: 40 },
      ];
      const result = calculator.calculate(timeframes);
      for (const ts of result) {
        expect(ts.riskAgreement).toBeGreaterThanOrEqual(0);
        expect(ts.riskAgreement).toBeLessThanOrEqual(1);
      }
    });

    it('should calculate indicator agreement', () => {
      const timeframes: TimeframeData[] = [
        {
          timeframe: Timeframe.M4, price: 100,
          indicators: [
            { name: 'RSI', value: 65, signal: 'bullish', weight: 1, isPositive: true },
            { name: 'MACD', value: 5, signal: 'bullish', weight: 1, isPositive: true },
          ],
        },
        {
          timeframe: Timeframe.D1, price: 100,
          indicators: [
            { name: 'RSI', value: 60, signal: 'bullish', weight: 1, isPositive: true },
            { name: 'MACD', value: -2, signal: 'bearish', weight: 1, isPositive: false },
          ],
        },
      ];
      const result = calculator.calculate(timeframes);
      expect(result.length).toBe(2);
      for (const ts of result) {
        expect(ts.indicatorAgreement).toBeGreaterThanOrEqual(0);
        expect(ts.indicatorAgreement).toBeLessThanOrEqual(1);
      }
    });

    it('should calculate strategy agreement', () => {
      const timeframes: TimeframeData[] = [
        { timeframe: Timeframe.M4, price: 100, strategySignal: SignalType.BUY },
        { timeframe: Timeframe.D1, price: 100, strategySignal: SignalType.BUY },
        { timeframe: Timeframe.W1, price: 100, strategySignal: SignalType.SELL },
      ];
      const result = calculator.calculate(timeframes);
      expect(result.length).toBe(3);
    });

    it('should calculate weighted contribution correctly', () => {
      const timeframes = createUniformTimeframes(TrendDirection.UPTREND, 70);
      const result = calculator.calculate(timeframes);
      for (const ts of result) {
        expect(ts.weightedContribution).toBeGreaterThanOrEqual(0);
        expect(ts.weightedContribution).toBeLessThanOrEqual(100);
      }
    });

    it('should calculate confidence', () => {
      const timeframes: TimeframeData[] = [
        {
          timeframe: Timeframe.M4, price: 100,
          trend: TrendDirection.UPTREND, trendScore: 70,
          momentumScore: 65, volume: VolumeState.HIGH_VOLUME,
          riskScore: 30, strategySignal: SignalType.BUY,
          indicators: [{ name: 'RSI', value: 65, signal: 'bullish', weight: 1, isPositive: true }],
        },
      ];
      const result = calculator.calculate(timeframes);
      expect(result[0].confidence).toBeGreaterThanOrEqual(0);
      expect(result[0].confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('custom config', () => {
    it('should use custom timeframe weights', () => {
      const custom = new ConsensusCalculator({
        timeframeWeights: {
          [Timeframe.M4]: 0.40,
          [Timeframe.D1]: 0.30,
          [Timeframe.W1]: 0.20,
          [Timeframe.M1]: 0.10,
        },
      });
      const timeframes = createUniformTimeframes(TrendDirection.UPTREND, 70);
      const result = custom.calculate(timeframes);
      expect(result).toHaveLength(4);
    });
  });
});

function createUniformTimeframes(trend: TrendDirection, trendScore: number): TimeframeData[] {
  return [
    { timeframe: Timeframe.M4, price: 100, trend, trendScore, momentumScore: 65, volume: VolumeState.NORMAL_VOLUME },
    { timeframe: Timeframe.D1, price: 100, trend, trendScore, momentumScore: 68, volume: VolumeState.NORMAL_VOLUME },
    { timeframe: Timeframe.W1, price: 100, trend, trendScore, momentumScore: 72, volume: VolumeState.NORMAL_VOLUME },
    { timeframe: Timeframe.M1, price: 100, trend, trendScore, momentumScore: 70, volume: VolumeState.NORMAL_VOLUME },
  ];
}
