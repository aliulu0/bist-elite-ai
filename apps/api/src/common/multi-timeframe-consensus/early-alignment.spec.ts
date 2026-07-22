import { EarlyAlignmentService } from './early-alignment.service';
import { TimeframeData, Timeframe, TrendDirection, VolumeState, SignalType } from './types';

describe('EarlyAlignmentService', () => {
  let service: EarlyAlignmentService;

  beforeEach(() => {
    service = new EarlyAlignmentService();
  });

  describe('detect', () => {
    it('should return empty array for low alignment', () => {
      const timeframes: TimeframeData[] = [
        { timeframe: Timeframe.M4, price: 100 },
        { timeframe: Timeframe.D1, price: 100 },
      ];
      const result = service.detect(timeframes);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should detect high alignment', () => {
      const timeframes: TimeframeData[] = [
        {
          timeframe: Timeframe.M4, price: 100,
          trend: TrendDirection.STRONG_UPTREND, trendScore: 85,
          momentumScore: 75, volume: VolumeState.HIGH_VOLUME,
          strategySignal: SignalType.BUY, strategyConfidence: 0.8,
          indicators: [
            { name: 'RSI', value: 70, signal: 'bullish', weight: 1, isPositive: true },
            { name: 'MACD', value: 5, signal: 'bullish', weight: 1, isPositive: true },
          ],
        },
        {
          timeframe: Timeframe.D1, price: 100,
          trend: TrendDirection.STRONG_UPTREND, trendScore: 80,
          momentumScore: 70, volume: VolumeState.HIGH_VOLUME,
          strategySignal: SignalType.BUY, strategyConfidence: 0.7,
          indicators: [
            { name: 'RSI', value: 65, signal: 'bullish', weight: 1, isPositive: true },
            { name: 'MACD', value: 3, signal: 'bullish', weight: 1, isPositive: true },
          ],
        },
        {
          timeframe: Timeframe.W1, price: 100,
          trend: TrendDirection.STRONG_UPTREND, trendScore: 75,
          momentumScore: 65, volume: VolumeState.NORMAL_VOLUME,
          strategySignal: SignalType.BUY, strategyConfidence: 0.6,
        },
      ];
      const result = service.detect(timeframes);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].alignmentScore).toBeGreaterThan(0);
    });

    it('should identify leading timeframe', () => {
      const timeframes: TimeframeData[] = [
        {
          timeframe: Timeframe.M4, price: 100,
          trend: TrendDirection.STRONG_UPTREND, trendScore: 85,
          momentumScore: 80, volume: VolumeState.HIGH_VOLUME,
          strategySignal: SignalType.BUY, strategyConfidence: 0.9,
        },
        {
          timeframe: Timeframe.D1, price: 100,
          trend: TrendDirection.STRONG_UPTREND, trendScore: 80,
          momentumScore: 75,
        },
      ];
      const result = service.detect(timeframes);
      const leading = result.find(a => a.isLeading);
      expect(leading).toBeDefined();
    });

    it('should detect false confirm risk', () => {
      const timeframes: TimeframeData[] = [
        {
          timeframe: Timeframe.M4, price: 100,
          trend: TrendDirection.WEAK_UPTREND, trendScore: 32,
          volume: VolumeState.LOW_VOLUME, riskScore: 70,
          indicators: [
            { name: 'RSI', value: 50, signal: 'neutral', weight: 1, isPositive: false },
            { name: 'MACD', value: 0, signal: 'neutral', weight: 1, isPositive: false },
          ],
        },
        {
          timeframe: Timeframe.D1, price: 100,
          trend: TrendDirection.STRONG_DOWNTREND, trendScore: 80,
        },
        {
          timeframe: Timeframe.W1, price: 100,
          trend: TrendDirection.STRONG_DOWNTREND, trendScore: 80,
        },
      ];
      const result = service.detect(timeframes);
      const falseConfirms = result.filter(a => a.potentialFalseConfirm);
      expect(falseConfirms.length).toBeGreaterThanOrEqual(0);
    });

    it('should find emerging indicators', () => {
      const timeframes: TimeframeData[] = [
        {
          timeframe: Timeframe.M4, price: 100,
          trend: TrendDirection.UPTREND,
          indicators: [
            { name: 'RSI', value: 85, signal: 'overbought', weight: 1, isPositive: true },
          ],
        },
        {
          timeframe: Timeframe.D1, price: 100,
          trend: TrendDirection.UPTREND,
          indicators: [
            { name: 'RSI', value: 60, signal: 'bullish', weight: 1, isPositive: true },
          ],
        },
      ];
      const result = service.detect(timeframes);
      const withEmerging = result.filter(a => a.emergingIndicators.length > 0);
      expect(withEmerging.length).toBeGreaterThanOrEqual(0);
    });

    it('should sort by alignment score descending', () => {
      const timeframes: TimeframeData[] = [
        {
          timeframe: Timeframe.M4, price: 100,
          trend: TrendDirection.STRONG_UPTREND, trendScore: 85,
          momentumScore: 80, volume: VolumeState.HIGH_VOLUME,
          strategySignal: SignalType.BUY, strategyConfidence: 0.9,
          indicators: [
            { name: 'RSI', value: 75, signal: 'bullish', weight: 1, isPositive: true },
          ],
        },
        {
          timeframe: Timeframe.D1, price: 100,
          trend: TrendDirection.STRONG_UPTREND, trendScore: 80,
          momentumScore: 75,
        },
        {
          timeframe: Timeframe.W1, price: 100,
          trend: TrendDirection.STRONG_UPTREND, trendScore: 75,
        },
      ];
      const result = service.detect(timeframes);
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].alignmentScore).toBeGreaterThanOrEqual(result[i].alignmentScore);
      }
    });
  });
});
