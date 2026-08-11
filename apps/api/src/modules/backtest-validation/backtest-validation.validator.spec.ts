import { HistoricalDatasetValidator } from './backtest-validation.validator';
import { DEFAULT_BACKTEST_VALIDATION_CONFIG } from './backtest-validation.config';
import { HistoricalDatasetValidationResult } from './backtest-validation.types';
import { OHLCV } from '../indicators/indicator.types';

function makeBar(overrides?: Partial<OHLCV>): OHLCV {
  return {
    timestamp: '2025-01-01',
    open: 100,
    high: 105,
    low: 98,
    close: 103,
    volume: 1000000,
    ...overrides,
  };
}

function makeDataset(count: number, startPrice = 100): OHLCV[] {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(Date.parse('2025-01-01') + i * 86400000).toISOString().split('T')[0],
    open: startPrice + i * 0.5,
    high: startPrice + i * 0.5 + 3,
    low: startPrice + i * 0.5 - 2,
    close: startPrice + i * 0.5 + 1,
    volume: 1000000 + i * 10000,
  }));
}

describe('HistoricalDatasetValidator', () => {
  let validator: HistoricalDatasetValidator;

  beforeEach(() => {
    validator = new HistoricalDatasetValidator();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined();
  });

  describe('empty data', () => {
    it('should return invalid for null/undefined data', () => {
      const result = validator.validate(null as any);
      expect(result.isValid).toBe(false);
      expect(result.qualityScore).toBe(0);
    });

    it('should return invalid for empty array', () => {
      const result = validator.validate([]);
      expect(result.isValid).toBe(false);
      expect(result.qualityScore).toBe(0);
    });
  });

  describe('valid data', () => {
    it('should return valid for clean dataset', () => {
      const data = makeDataset(50);
      const result = validator.validate(data);
      expect(result.isValid).toBe(true);
      expect(result.qualityScore).toBe(100);
      expect(result.priceErrors.length).toBe(0);
    });

    it('should include metadata with date range', () => {
      const data = makeDataset(50);
      const result = validator.validate(data);
      const meta = result.metadata as Record<string, unknown>;
      expect(meta.totalBars).toBe(50);
      const dateRange = meta.dateRange as { start: string; end: string };
      expect(dateRange.start).toBeDefined();
      expect(dateRange.end).toBeDefined();
    });
  });

  describe('OHLC integrity', () => {
    it('should detect high below low', () => {
      const data = makeDataset(50);
      data[10] = makeBar({ timestamp: data[10].timestamp, high: 95, low: 100 });
      const result = validator.validate(data);
      expect(result.priceErrors.some((e) => e.type === 'high_below_low')).toBe(true);
    });

    it('should detect negative price', () => {
      const data = makeDataset(50);
      data[5] = makeBar({ timestamp: data[5].timestamp, open: -10 });
      const result = validator.validate(data);
      expect(result.priceErrors.some((e) => e.type === 'negative_price')).toBe(true);
    });

    it('should detect zero price', () => {
      const data = makeDataset(50);
      data[5] = makeBar({ timestamp: data[5].timestamp, close: 0 });
      const result = validator.validate(data);
      expect(result.priceErrors.some((e) => e.type === 'zero_price')).toBe(true);
    });

    it('should detect high below open', () => {
      const data = makeDataset(50);
      data[10] = makeBar({ timestamp: data[10].timestamp, open: 110, high: 105, low: 100, close: 108 });
      const result = validator.validate(data);
      expect(result.priceErrors.some((e) => e.type === 'open_out_of_range')).toBe(true);
    });

    it('should detect low above close', () => {
      const data = makeDataset(50);
      data[10] = makeBar({ timestamp: data[10].timestamp, high: 110, low: 108, close: 105 });
      const result = validator.validate(data);
      expect(result.priceErrors.some((e) => e.type === 'close_out_of_range')).toBe(true);
    });

    it('should not flag valid bars', () => {
      const data = makeDataset(50);
      const result = validator.validate(data);
      expect(result.priceErrors.length).toBe(0);
    });
  });

  describe('timestamp validation', () => {
    it('should detect out-of-order timestamps', () => {
      const data = makeDataset(50);
      const tmp = { ...data[5] };
      data[5] = { ...data[10] };
      data[10] = tmp;
      const result = validator.validate(data);
      expect(result.timestampErrors.some((e) => e.type === 'out_of_order')).toBe(true);
    });

    it('should detect duplicate timestamps', () => {
      const data = makeDataset(50);
      data[10] = makeBar({ timestamp: data[5].timestamp });
      const result = validator.validate(data);
      expect(result.duplicateBars.length).toBeGreaterThan(0);
    });

    it('should detect invalid timestamp format', () => {
      const data = makeDataset(50);
      data[5] = makeBar({ timestamp: 'not-a-date' });
      const result = validator.validate(data);
      expect(result.timestampErrors.some((e) => e.type === 'invalid_format')).toBe(true);
    });
  });

  describe('missing bars', () => {
    it('should detect missing bars when gaps exceed threshold', () => {
      const v = new HistoricalDatasetValidator({ timestamps: { ...DEFAULT_BACKTEST_VALIDATION_CONFIG.timestamps, allowGaps: false } });
      const data: OHLCV[] = [];
      for (let i = 0; i < 10; i++) {
        const skip = i === 5 ? 5 : 0;
        data.push(makeBar({
          timestamp: new Date(Date.parse('2025-01-01') + (i + skip) * 86400000).toISOString().split('T')[0],
        }));
      }
      const result = v.validate(data);
      expect(result.missingBars.length).toBeGreaterThan(0);
    });

    it('should not detect missing bars for consecutive data', () => {
      const data = makeDataset(50);
      const result = validator.validate(data);
      expect(result.missingBars.length).toBe(0);
    });
  });

  describe('volume validation', () => {
    it('should detect negative volume', () => {
      const data = makeDataset(50);
      data[10] = makeBar({ timestamp: data[10].timestamp, volume: -100 });
      const result = validator.validate(data);
      expect(result.volumeErrors.some((e) => e.type === 'negative_volume')).toBe(true);
    });

    it('should detect zero volume', () => {
      const data = makeDataset(50);
      data[10] = makeBar({ timestamp: data[10].timestamp, volume: 0 });
      const result = validator.validate(data);
      expect(result.volumeErrors.some((e) => e.type === 'zero_volume')).toBe(true);
    });
  });

  describe('split detection', () => {
    it('should detect large price gap as potential split', () => {
      const data = makeDataset(50);
      data[10] = makeBar({ timestamp: data[10].timestamp, open: 50, high: 52, low: 49, close: 51 });
      const result = validator.validate(data);
      expect(result.splitDetected.length).toBeGreaterThan(0);
    });

    it('should estimate split ratio', () => {
      const data = makeDataset(50, 200);
      data[10] = makeBar({ timestamp: data[10].timestamp, open: 100, high: 102, low: 98, close: 101 });
      const result = validator.validate(data);
      const split = result.splitDetected.find((s) => s.index === 10);
      expect(split).toBeDefined();
      expect(split!.estimatedRatio).toBeDefined();
    });
  });

  describe('dividend adjustment detection', () => {
    it('should detect moderate gap down as potential dividend', () => {
      const data = makeDataset(50);
      data[10] = makeBar({ timestamp: data[10].timestamp, open: 85, high: 87, low: 84, close: 86 });
      const result = validator.validate(data);
      expect(result.dividendAdjusted.length).toBeGreaterThan(0);
    });

    it('should flag volume spike during gap down', () => {
      const data = makeDataset(50);
      data[10] = makeBar({ timestamp: data[10].timestamp, open: 85, high: 87, low: 84, close: 86, volume: 5000000 });
      const result = validator.validate(data);
      const adj = result.dividendAdjusted.find((d) => d.index === 10);
      expect(adj).toBeDefined();
      expect(adj!.volumeSpike).toBe(true);
    });
  });

  describe('outlier detection', () => {
    it('should detect price outliers', () => {
      const data = makeDataset(50);
      data[25] = makeBar({ timestamp: data[25].timestamp, close: 500, high: 510, low: 490, open: 505 });
      const result = validator.validate(data);
      expect(result.outliers.some((o) => o.field === 'close')).toBe(true);
    });

    it('should detect volume outliers', () => {
      const data = makeDataset(50);
      data[25] = makeBar({ timestamp: data[25].timestamp, volume: 100000000 });
      const result = validator.validate(data);
      expect(result.outliers.some((o) => o.field === 'volume')).toBe(true);
    });

    it('should not detect outliers in uniform data', () => {
      const data = makeDataset(50);
      const result = validator.validate(data);
      expect(result.outliers.length).toBe(0);
    });
  });

  describe('quality score', () => {
    it('should give 100 for perfect data', () => {
      const data = makeDataset(50);
      const result = validator.validate(data);
      expect(result.qualityScore).toBe(100);
    });

    it('should reduce score for errors', () => {
      const data = makeDataset(50);
      data[10] = makeBar({ timestamp: data[10].timestamp, high: 95, low: 100 });
      data[15] = makeBar({ timestamp: data[15].timestamp, close: 0 });
      const result = validator.validate(data);
      expect(result.qualityScore).toBeLessThan(100);
    });

    it('should be between 0 and 100', () => {
      const data = makeDataset(50);
      data[10] = makeBar({ timestamp: data[10].timestamp, high: 95, low: 100 });
      data[15] = makeBar({ timestamp: data[15].timestamp, volume: -1 });
      data[20] = makeBar({ timestamp: 'not-a-date' });
      const result = validator.validate(data);
      expect(result.qualityScore).toBeGreaterThanOrEqual(0);
      expect(result.qualityScore).toBeLessThanOrEqual(100);
    });
  });

  describe('warnings', () => {
    it('should generate warnings for issues', () => {
      const data = makeDataset(50);
      data[10] = makeBar({ timestamp: data[10].timestamp, high: 95, low: 100 });
      const result = validator.validate(data);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should warn about high zero-volume proportion', () => {
      const data = makeDataset(50);
      for (let i = 0; i < 10; i++) {
        data[i] = makeBar({ timestamp: data[i].timestamp, volume: 0 });
      }
      const result = validator.validate(data);
      expect(result.warnings.some((w) => w.includes('zero-volume'))).toBe(true);
    });

    it('should have no warnings for perfect data', () => {
      const data = makeDataset(50);
      const result = validator.validate(data);
      expect(result.warnings.length).toBe(0);
    });
  });

  describe('isValid logic', () => {
    it('should be invalid when quality score is low', () => {
      const data = makeDataset(50);
      for (let i = 0; i < 20; i++) {
        data[i] = makeBar({ timestamp: data[i].timestamp, high: 95, low: 100 });
      }
      const result = validator.validate(data);
      expect(result.isValid).toBe(false);
    });

    it('should be invalid when too few data points', () => {
      const data = makeDataset(5);
      const result = validator.validate(data);
      expect(result.isValid).toBe(false);
    });

    it('should be invalid when price errors exist', () => {
      const data = makeDataset(50);
      data[10] = makeBar({ timestamp: data[10].timestamp, high: 95, low: 100 });
      const result = validator.validate(data);
      expect(result.isValid).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle single bar', () => {
      const result = validator.validate([makeBar()]);
      expect(result.isValid).toBe(false);
      expect(result.metadata.totalBars).toBe(1);
    });

    it('should handle very large dataset', () => {
      const data = makeDataset(1000);
      const result = validator.validate(data);
      expect(result.isValid).toBe(true);
    });

    it('should handle dataset with all errors', () => {
      const data: OHLCV[] = [];
      for (let i = 0; i < 30; i++) {
        data.push(makeBar({
          timestamp: i % 3 === 0 ? 'not-a-date' : `2025-01-${String(i + 1).padStart(2, '0')}`,
          open: i % 5 === 0 ? -10 : 100,
          high: i % 4 === 0 ? 95 : 105,
          low: i % 4 === 0 ? 100 : 98,
          volume: i % 3 === 0 ? -1 : 1000,
        }));
      }
      const result = validator.validate(data);
      expect(result.isValid).toBe(false);
      expect(result.qualityScore).toBeLessThan(100);
      expect(result.priceErrors.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});
