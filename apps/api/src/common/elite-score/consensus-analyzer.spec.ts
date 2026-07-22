import { ConsensusAnalyzer } from './consensus-analyzer.service';
import { IndicatorData, Timeframe, TrendDirection } from './types';

describe('ConsensusAnalyzer', () => {
  let analyzer: ConsensusAnalyzer;

  beforeEach(() => {
    analyzer = new ConsensusAnalyzer();
  });

  describe('analyze', () => {
    it('should return default consensus for empty inputs', () => {
      const result = analyzer.analyze({ timeframeScores: [], indicators: [] });
      expect(result.indicatorAgreement).toBe(0.5);
      expect(result.strategyAgreement).toBe(0.5);
      expect(result.timeframeAgreement).toBe(0.5);
      expect(result.conflictCount).toBe(0);
      expect(result.dominantDirection).toBe(TrendDirection.SIDEWAYS);
    });

    it('should calculate high indicator agreement when all indicators agree', () => {
      const indicators: IndicatorData[] = [
        { name: 'RSI', value: 60, signal: 'bullish', weight: 1, isPositive: true, timeframe: Timeframe.D1 },
        { name: 'MACD', value: 5, signal: 'bullish', weight: 1, isPositive: true, timeframe: Timeframe.D1 },
        { name: 'EMA', value: 70, signal: 'bullish', weight: 1, isPositive: true, timeframe: Timeframe.D1 },
      ];
      const result = analyzer.analyze({ timeframeScores: [], indicators });
      expect(result.indicatorAgreement).toBe(1.0);
    });

    it('should calculate low indicator agreement when indicators disagree', () => {
      const indicators: IndicatorData[] = [
        { name: 'RSI', value: 80, signal: 'overbought', weight: 1, isPositive: true, timeframe: Timeframe.D1 },
        { name: 'MACD', value: -5, signal: 'bearish', weight: 1, isPositive: false, timeframe: Timeframe.D1 },
      ];
      const result = analyzer.analyze({ timeframeScores: [], indicators });
      expect(result.indicatorAgreement).toBeLessThan(0.5);
    });

    it('should calculate strategy agreement from trend and momentum indicators', () => {
      const indicators: IndicatorData[] = [
        { name: 'EMA', value: 70, signal: 'bullish', weight: 1, isPositive: true, timeframe: Timeframe.D1 },
        { name: 'SMA', value: 65, signal: 'bullish', weight: 1, isPositive: true, timeframe: Timeframe.D1 },
        { name: 'RSI', value: 60, signal: 'bullish', weight: 1, isPositive: true, timeframe: Timeframe.D1 },
        { name: 'MACD', value: 5, signal: 'bullish', weight: 1, isPositive: true, timeframe: Timeframe.D1 },
      ];
      const result = analyzer.analyze({ timeframeScores: [], indicators });
      expect(result.strategyAgreement).toBeGreaterThan(0.5);
    });

    it('should detect timeframe agreement when all timeframes agree', () => {
      const result = analyzer.analyze({
        timeframeScores: [
          { timeframe: Timeframe.M4, trend: 70, trendScore: 70 },
          { timeframe: Timeframe.D1, trend: 75, trendScore: 75 },
          { timeframe: Timeframe.W1, trend: 80, trendScore: 80 },
        ],
        indicators: [],
      });
      expect(result.timeframeAgreement).toBe(1.0);
    });

    it('should detect timeframe conflict', () => {
      const result = analyzer.analyze({
        timeframeScores: [
          { timeframe: Timeframe.M4, trend: 70, trendScore: 70 },
          { timeframe: Timeframe.D1, trend: 30, trendScore: 30 },
        ],
        indicators: [],
      });
      expect(result.timeframeAgreement).toBeLessThan(1.0);
      expect(result.conflictCount).toBeGreaterThan(0);
    });

    it('should calculate trend consistency from low variance', () => {
      const result = analyzer.analyze({
        timeframeScores: [
          { timeframe: Timeframe.M4, trendScore: 60 },
          { timeframe: Timeframe.D1, trendScore: 62 },
          { timeframe: Timeframe.W1, trendScore: 58 },
        ],
        indicators: [],
      });
      expect(result.trendConsistency).toBeGreaterThan(0.5);
    });

    it('should identify dominant direction', () => {
      const result = analyzer.analyze({
        timeframeScores: [
          { timeframe: Timeframe.M4, trend: TrendDirection.UPTREND },
          { timeframe: Timeframe.D1, trend: TrendDirection.UPTREND },
          { timeframe: Timeframe.W1, trend: TrendDirection.SIDEWAYS },
        ],
        indicators: [],
      });
      expect(result.dominantDirection).toBe(TrendDirection.UPTREND);
    });

    it('should calculate overall consensus as weighted average', () => {
      const result = analyzer.analyze({
        timeframeScores: [
          { timeframe: Timeframe.D1, trend: 70, trendScore: 70 },
        ],
        indicators: [
          { name: 'RSI', value: 60, signal: 'bullish', weight: 1, isPositive: true, timeframe: Timeframe.D1 },
        ],
      });
      expect(result.overallConsensus).toBeGreaterThanOrEqual(0);
      expect(result.overallConsensus).toBeLessThanOrEqual(1);
    });
  });
});
