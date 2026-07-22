import { TechnicalScorer } from './technical-scorer.service';
import { IndicatorData, Timeframe } from './types';

describe('TechnicalScorer', () => {
  let scorer: TechnicalScorer;

  beforeEach(() => {
    scorer = new TechnicalScorer();
  });

  describe('calculate', () => {
    it('should return empty score for no inputs', () => {
      const result = scorer.calculate([]);
      expect(result.composite).toBe(50);
      expect(result.signalCount).toBe(0);
    });

    it('should calculate composite from trend, momentum, volume, volatility', () => {
      const result = scorer.calculate([{
        timeframe: Timeframe.D1,
        trend: 80,
        momentum: 70,
        volume: 60,
        volatility: 40,
      }]);
      expect(result.trend).toBe(80);
      expect(result.momentum).toBe(70);
      expect(result.volume).toBe(60);
      expect(result.volatility).toBe(40);
      expect(result.composite).toBeGreaterThan(50);
    });

    it('should aggregate multiple timeframe inputs', () => {
      const result = scorer.calculate([
        { timeframe: Timeframe.M4, trend: 60, momentum: 55 },
        { timeframe: Timeframe.D1, trend: 80, momentum: 75 },
      ]);
      expect(result.trend).toBe(70);
      expect(result.momentum).toBe(65);
    });

    it('should handle inputs with indicators', () => {
      const result = scorer.calculate([{
        timeframe: Timeframe.D1,
        indicators: [
          { name: 'RSI', value: 65, signal: 'bullish', weight: 1, isPositive: true, timeframe: Timeframe.D1 },
          { name: 'MACD', value: 2.5, signal: 'bullish', weight: 1, isPositive: true, timeframe: Timeframe.D1 },
        ],
      }]);
      expect(result.signalCount).toBe(2);
      expect(result.positiveSignals).toBe(2);
      expect(result.negativeSignals).toBe(0);
    });

    it('should track positive and negative signals', () => {
      const result = scorer.calculate([{
        timeframe: Timeframe.D1,
        indicators: [
          { name: 'RSI', value: 65, signal: 'bullish', weight: 1, isPositive: true, timeframe: Timeframe.D1 },
          { name: 'MACD', value: -2.5, signal: 'bearish', weight: 1, isPositive: false, timeframe: Timeframe.D1 },
        ],
      }]);
      expect(result.positiveSignals).toBe(1);
      expect(result.negativeSignals).toBe(1);
    });
  });

  describe('calculateFromIndicators', () => {
    it('should return empty score for no indicators', () => {
      const result = scorer.calculateFromIndicators([]);
      expect(result.composite).toBe(50);
    });

    it('should calculate trend score from EMA, SMA, ADX', () => {
      const indicators: IndicatorData[] = [
        { name: 'EMA', value: 70, signal: 'bullish', weight: 1, isPositive: true, timeframe: Timeframe.D1 },
        { name: 'SMA', value: 65, signal: 'bullish', weight: 1, isPositive: true, timeframe: Timeframe.D1 },
        { name: 'ADX', value: 30, signal: 'trending', weight: 1, isPositive: true, timeframe: Timeframe.D1 },
      ];
      const result = scorer.calculateFromIndicators(indicators);
      expect(result.trend).toBeGreaterThan(50);
    });

    it('should calculate momentum score from RSI, MACD, Stochastic', () => {
      const indicators: IndicatorData[] = [
        { name: 'RSI', value: 60, signal: 'neutral', weight: 1, isPositive: true, timeframe: Timeframe.D1 },
        { name: 'MACD', value: 5, signal: 'bullish', weight: 1, isPositive: true, timeframe: Timeframe.D1 },
      ];
      const result = scorer.calculateFromIndicators(indicators);
      expect(result.momentum).toBeDefined();
    });

    it('should compute volatility score from ATR', () => {
      const indicators: IndicatorData[] = [
        { name: 'ATR', value: 1.5, signal: 'high', weight: 2, isPositive: false, timeframe: Timeframe.D1 },
      ];
      const result = scorer.calculateFromIndicators(indicators);
      expect(result.volatility).toBeDefined();
    });

    it('should handle mixed positive/negative signals', () => {
      const indicators: IndicatorData[] = [
        { name: 'RSI', value: 70, signal: 'overbought', weight: 1, isPositive: true, timeframe: Timeframe.D1 },
        { name: 'MACD', value: -5, signal: 'bearish', weight: 1, isPositive: false, timeframe: Timeframe.D1 },
      ];
      const result = scorer.calculateFromIndicators(indicators);
      expect(result.positiveSignals).toBe(1);
      expect(result.negativeSignals).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined inputs', () => {
      const result = scorer.calculate(undefined as any);
      expect(result.composite).toBe(50);
    });

    it('should handle null indicators in calculateFromIndicators', () => {
      const result = scorer.calculateFromIndicators(null as any);
      expect(result.composite).toBe(50);
    });

    it('should clamp scores between 0 and 100', () => {
      const result = scorer.calculate([{
        timeframe: Timeframe.D1,
        trend: 150,
        momentum: -50,
      }]);
      expect(result.trend).toBeLessThanOrEqual(100);
      expect(result.momentum).toBeGreaterThanOrEqual(0);
    });
  });
});
