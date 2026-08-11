import { PointInTimeDataService } from '../point-in-time-data.service';
import { OHLCV } from '../../indicators/indicator.types';

describe('PointInTimeDataService', () => {
  let service: PointInTimeDataService;

  beforeEach(() => {
    service = new PointInTimeDataService();
  });

  const makeCandle = (timestamp: string, close = 100): OHLCV => ({
    timestamp, open: close, high: close + 1, low: close - 1, close, volume: 1000000,
  });

  describe('filterCandles', () => {
    it('should only return candles up to decision timestamp', () => {
      const candles = [
        makeCandle('2024-01-01T00:00:00.000Z'),
        makeCandle('2024-01-15T00:00:00.000Z'),
        makeCandle('2024-02-01T00:00:00.000Z'),
      ];
      const result = service.filterCandles(candles, '2024-01-15T23:59:59.000Z');
      expect(result.data).toHaveLength(2);
      expect(result.rejectedCount).toBe(1);
    });

    it('should reject future candles', () => {
      const candles = [
        makeCandle('2024-01-01T00:00:00.000Z'),
        makeCandle('2024-06-01T00:00:00.000Z'),
      ];
      const result = service.filterCandles(candles, '2024-01-15T23:59:59.000Z');
      expect(result.data).toHaveLength(1);
      expect(result.rejectedCount).toBe(1);
    });

    it('should handle empty array', () => {
      const result = service.filterCandles([], '2024-01-15T23:59:59.000Z');
      expect(result.data).toHaveLength(0);
      expect(result.rejectedCount).toBe(0);
    });
  });

  describe('filterByTimestamp', () => {
    it('should filter by timestamp field', () => {
      const items = [
        { timestamp: '2024-01-01T00:00:00.000Z', value: 1 },
        { timestamp: '2024-02-01T00:00:00.000Z', value: 2 },
      ];
      const result = service.filterByTimestamp(items, '2024-01-15T23:59:59.000Z');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].value).toBe(1);
    });

    it('should reject items without timestamp', () => {
      const items = [{ value: 1 } as any];
      const result = service.filterByTimestamp(items, '2024-01-15T23:59:59.000Z');
      expect(result.data).toHaveLength(0);
    });
  });

  describe('verifyNoFutureData', () => {
    it('should pass when no future data exists', () => {
      const items = [{ timestamp: '2024-01-01T00:00:00.000Z' }];
      const result = service.verifyNoFutureData(items, '2024-01-15T23:59:59.000Z');
      expect(result.pass).toBe(true);
      expect(result.futureCount).toBe(0);
    });

    it('should fail when future data exists', () => {
      const items = [
        { timestamp: '2024-01-01T00:00:00.000Z' },
        { timestamp: '2024-02-01T00:00:00.000Z' },
      ];
      const result = service.verifyNoFutureData(items, '2024-01-15T23:59:59.000Z');
      expect(result.pass).toBe(false);
      expect(result.futureCount).toBe(1);
    });
  });

  describe('isWithinPointInTime', () => {
    it('should return true for data before decision', () => {
      expect(service.isWithinPointInTime('2024-01-01T00:00:00.000Z', '2024-01-15T23:59:59.000Z')).toBe(true);
    });

    it('should return false for data after decision', () => {
      expect(service.isWithinPointInTime('2024-02-01T00:00:00.000Z', '2024-01-15T23:59:59.000Z')).toBe(false);
    });
  });
});