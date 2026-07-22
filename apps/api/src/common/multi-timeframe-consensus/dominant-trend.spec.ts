import { DominantTrendService } from './dominant-trend.service';
import { TimeframeData, Timeframe, TrendDirection } from './types';

describe('DominantTrendService', () => {
  let service: DominantTrendService;

  beforeEach(() => {
    service = new DominantTrendService();
  });

  describe('analyze', () => {
    it('should return default analysis for empty input', () => {
      const result = service.analyze([]);
      expect(result.dominant.direction).toBeDefined();
      expect(result.secondary.direction).toBeDefined();
      expect(result.shortTerm).toBeDefined();
      expect(result.mediumTerm).toBeDefined();
      expect(result.longTerm).toBeDefined();
      expect(result.trendStrength).toBeGreaterThanOrEqual(0);
    });

    it('should identify dominant trend from majority', () => {
      const timeframes: TimeframeData[] = [
        { timeframe: Timeframe.M4, price: 100, trend: TrendDirection.STRONG_UPTREND, trendScore: 80 },
        { timeframe: Timeframe.D1, price: 100, trend: TrendDirection.STRONG_UPTREND, trendScore: 85 },
        { timeframe: Timeframe.W1, price: 100, trend: TrendDirection.STRONG_UPTREND, trendScore: 90 },
        { timeframe: Timeframe.M1, price: 100, trend: TrendDirection.SIDEWAYS, trendScore: 50 },
      ];
      const result = service.analyze(timeframes);
      expect(result.dominant.direction).toBe(TrendDirection.STRONG_UPTREND);
    });

    it('should identify secondary trend', () => {
      const timeframes: TimeframeData[] = [
        { timeframe: Timeframe.M4, price: 100, trend: TrendDirection.STRONG_UPTREND, trendScore: 80 },
        { timeframe: Timeframe.D1, price: 100, trend: TrendDirection.STRONG_UPTREND, trendScore: 85 },
        { timeframe: Timeframe.W1, price: 100, trend: TrendDirection.SIDEWAYS, trendScore: 50 },
        { timeframe: Timeframe.M1, price: 100, trend: TrendDirection.SIDEWAYS, trendScore: 45 },
      ];
      const result = service.analyze(timeframes);
      expect(result.secondary.direction).toBeDefined();
    });

    it('should resolve short-term direction', () => {
      const timeframes: TimeframeData[] = [
        { timeframe: Timeframe.M4, price: 100, trend: TrendDirection.UPTREND },
        { timeframe: Timeframe.D1, price: 100, trend: TrendDirection.DOWNTREND },
        { timeframe: Timeframe.W1, price: 100, trend: TrendDirection.UPTREND },
        { timeframe: Timeframe.M1, price: 100, trend: TrendDirection.DOWNTREND },
      ];
      const result = service.analyze(timeframes);
      expect(result.shortTerm).toBeDefined();
    });

    it('should calculate trend strength', () => {
      const timeframes: TimeframeData[] = [
        { timeframe: Timeframe.M4, price: 100, trend: TrendDirection.STRONG_UPTREND, trendScore: 90 },
        { timeframe: Timeframe.D1, price: 100, trend: TrendDirection.STRONG_UPTREND, trendScore: 85 },
        { timeframe: Timeframe.W1, price: 100, trend: TrendDirection.STRONG_UPTREND, trendScore: 80 },
        { timeframe: Timeframe.M1, price: 100, trend: TrendDirection.STRONG_UPTREND, trendScore: 75 },
      ];
      const result = service.analyze(timeframes);
      expect(result.trendStrength).toBeGreaterThan(60);
    });

    it('should handle mixed trends', () => {
      const timeframes: TimeframeData[] = [
        { timeframe: Timeframe.M4, price: 100, trend: TrendDirection.STRONG_UPTREND, trendScore: 85 },
        { timeframe: Timeframe.D1, price: 100, trend: TrendDirection.STRONG_DOWNTREND, trendScore: 85 },
        { timeframe: Timeframe.W1, price: 100, trend: TrendDirection.STRONG_UPTREND, trendScore: 85 },
        { timeframe: Timeframe.M1, price: 100, trend: TrendDirection.STRONG_DOWNTREND, trendScore: 85 },
      ];
      const result = service.analyze(timeframes);
      expect(result.dominant.direction).toBeDefined();
      expect(result.trendStrength).toBeGreaterThanOrEqual(0);
    });

    it('should include supporting indicators', () => {
      const timeframes: TimeframeData[] = [
        {
          timeframe: Timeframe.M4, price: 100,
          trend: TrendDirection.UPTREND, trendScore: 70,
          indicators: [{ name: 'RSI', value: 65, signal: 'bullish', weight: 1, isPositive: true }],
        },
        {
          timeframe: Timeframe.D1, price: 100,
          trend: TrendDirection.UPTREND, trendScore: 75,
          indicators: [{ name: 'MACD', value: 5, signal: 'bullish', weight: 1, isPositive: true }],
        },
      ];
      const result = service.analyze(timeframes);
      expect(result.dominant.indicators.length).toBeGreaterThan(0);
    });
  });
});
