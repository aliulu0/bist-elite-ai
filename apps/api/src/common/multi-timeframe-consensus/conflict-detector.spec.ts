import { ConflictDetector } from './conflict-detector.service';
import {
  TimeframeData,
  Timeframe,
  TrendDirection,
  MomentumState,
  VolumeState,
  ConflictType,
  ConflictSeverity,
} from './types';

describe('ConflictDetector', () => {
  let detector: ConflictDetector;

  beforeEach(() => {
    detector = new ConflictDetector();
  });

  describe('detect', () => {
    it('should return empty array for no conflicts', () => {
      const timeframes = createTimeframesWithTrend(TrendDirection.STRONG_UPTREND, 80);
      const result = detector.detect(timeframes);
      expect(result).toHaveLength(0);
    });

    it('should detect short-long conflicts', () => {
      const timeframes: TimeframeData[] = [
        { timeframe: Timeframe.M4, price: 100, trend: TrendDirection.STRONG_UPTREND, trendScore: 85 },
        { timeframe: Timeframe.D1, price: 100, trend: TrendDirection.STRONG_UPTREND, trendScore: 85 },
        { timeframe: Timeframe.W1, price: 100, trend: TrendDirection.STRONG_DOWNTREND, trendScore: 85 },
        { timeframe: Timeframe.M1, price: 100, trend: TrendDirection.STRONG_DOWNTREND, trendScore: 85 },
      ];
      const result = detector.detect(timeframes);
      const shortLongConflicts = result.filter(c => c.type === ConflictType.SHORT_LONG_CONFLICT);
      expect(shortLongConflicts.length).toBeGreaterThan(0);
    });

    it('should detect trend reversals', () => {
      const timeframes: TimeframeData[] = [
        { timeframe: Timeframe.M4, price: 100, trend: TrendDirection.STRONG_UPTREND, trendScore: 85 },
        { timeframe: Timeframe.D1, price: 100, trend: TrendDirection.STRONG_UPTREND, trendScore: 85 },
        { timeframe: Timeframe.W1, price: 100, trend: TrendDirection.STRONG_DOWNTREND, trendScore: 85 },
        { timeframe: Timeframe.M1, price: 100, trend: TrendDirection.STRONG_DOWNTREND, trendScore: 85 },
      ];
      const result = detector.detect(timeframes);
      const reversals = result.filter(c => c.type === ConflictType.TREND_REVERSAL);
      expect(reversals.length).toBeGreaterThan(0);
    });

    it('should detect weak confirmations', () => {
      const timeframes: TimeframeData[] = [
        { timeframe: Timeframe.M4, price: 100, trend: TrendDirection.SIDEWAYS, trendScore: 30 },
        { timeframe: Timeframe.D1, price: 100, trend: TrendDirection.SIDEWAYS, trendScore: 30 },
      ];
      const result = detector.detect(timeframes);
      const weak = result.filter(c => c.type === ConflictType.WEAK_CONFIRMATION);
      expect(weak.length).toBeGreaterThan(0);
    });

    it('should detect mixed indicators', () => {
      const timeframes: TimeframeData[] = [
        {
          timeframe: Timeframe.M4, price: 100,
          indicators: [
            { name: 'RSI', value: 65, signal: 'bullish', weight: 1, isPositive: true },
            { name: 'MACD', value: -5, signal: 'bearish', weight: 1, isPositive: false },
            { name: 'EMA', value: 70, signal: 'bullish', weight: 1, isPositive: true },
            { name: 'Stochastic', value: 25, signal: 'bearish', weight: 1, isPositive: false },
          ],
        },
      ];
      const result = detector.detect(timeframes);
      const mixed = result.filter(c => c.type === ConflictType.MIXED_INDICATORS);
      expect(mixed.length).toBeGreaterThan(0);
    });

    it('should detect volume inconsistencies', () => {
      const timeframes: TimeframeData[] = [
        { timeframe: Timeframe.M4, price: 100, volume: VolumeState.HIGH_VOLUME },
        { timeframe: Timeframe.D1, price: 100, volume: VolumeState.HIGH_VOLUME },
        { timeframe: Timeframe.W1, price: 100, volume: VolumeState.LOW_VOLUME },
        { timeframe: Timeframe.M1, price: 100, volume: VolumeState.HIGH_VOLUME },
      ];
      const result = detector.detect(timeframes);
      const volumeConflicts = result.filter(c => c.type === ConflictType.VOLUME_INCONSISTENCY);
      expect(volumeConflicts.length).toBeGreaterThan(0);
    });

    it('should detect risk inconsistencies', () => {
      const timeframes: TimeframeData[] = [
        { timeframe: Timeframe.M4, price: 100, riskScore: 20 },
        { timeframe: Timeframe.D1, price: 100, riskScore: 25 },
        { timeframe: Timeframe.W1, price: 100, riskScore: 80 },
        { timeframe: Timeframe.M1, price: 100, riskScore: 85 },
      ];
      const result = detector.detect(timeframes);
      const riskConflicts = result.filter(c => c.type === ConflictType.RISK_INCONSISTENCY);
      expect(riskConflicts.length).toBeGreaterThan(0);
    });

    it('should detect momentum divergence', () => {
      const timeframes: TimeframeData[] = [
        { timeframe: Timeframe.M4, price: 100, trend: TrendDirection.UPTREND, momentum: MomentumState.BEARISH_MOMENTUM },
      ];
      const result = detector.detect(timeframes);
      const divergence = result.filter(c => c.type === ConflictType.MOMENTUM_DIVERGENCE);
      expect(divergence.length).toBeGreaterThan(0);
    });

    it('should deduplicate conflicts', () => {
      const timeframes: TimeframeData[] = [
        { timeframe: Timeframe.M4, price: 100, trend: TrendDirection.STRONG_UPTREND, trendScore: 85 },
        { timeframe: Timeframe.W1, price: 100, trend: TrendDirection.STRONG_DOWNTREND, trendScore: 85 },
      ];
      const result = detector.detect(timeframes);
      const types = result.map(c => `${c.type}:${c.timeframe1}:${c.timeframe2}`);
      const uniqueTypes = new Set(types);
      expect(types.length).toBe(uniqueTypes.size);
    });
  });

  describe('getConflictLevel', () => {
    it('should return 0 for no conflicts', () => {
      expect(detector.getConflictLevel([])).toBe(0);
    });

    it('should return higher level for more severe conflicts', () => {
      const severeConflicts = [
        { type: ConflictType.SHORT_LONG_CONFLICT, severity: ConflictSeverity.CRITICAL, timeframe1: Timeframe.M4, timeframe2: Timeframe.W1, description: '', descriptionTr: '', impact: 0.9 },
        { type: ConflictType.TREND_REVERSAL, severity: ConflictSeverity.HIGH, timeframe1: Timeframe.D1, timeframe2: Timeframe.M1, description: '', descriptionTr: '', impact: 0.7 },
      ];
      const mildConflicts = [
        { type: ConflictType.WEAK_CONFIRMATION, severity: ConflictSeverity.LOW, timeframe1: Timeframe.M4, timeframe2: Timeframe.M4, description: '', descriptionTr: '', impact: 0.2 },
      ];

      expect(detector.getConflictLevel(severeConflicts)).toBeGreaterThan(detector.getConflictLevel(mildConflicts));
    });

    it('should cap at 1.0', () => {
      const manyConflicts = Array(10).fill(null).map(() => ({
        type: ConflictType.SHORT_LONG_CONFLICT,
        severity: ConflictSeverity.CRITICAL,
        timeframe1: Timeframe.M4,
        timeframe2: Timeframe.W1,
        description: '',
        descriptionTr: '',
        impact: 1.0,
      }));
      expect(detector.getConflictLevel(manyConflicts)).toBeLessThanOrEqual(1);
    });
  });
});

function createTimeframesWithTrend(trend: TrendDirection, trendScore: number): TimeframeData[] {
  return [
    { timeframe: Timeframe.M4, price: 100, trend, trendScore },
    { timeframe: Timeframe.D1, price: 100, trend, trendScore },
    { timeframe: Timeframe.W1, price: 100, trend, trendScore },
    { timeframe: Timeframe.M1, price: 100, trend, trendScore },
  ];
}
