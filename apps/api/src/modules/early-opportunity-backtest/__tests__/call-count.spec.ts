import { PointInTimeDataService } from '../point-in-time-data.service';

describe('Call-Count Efficiency Tests', () => {
  let pointInTime: PointInTimeDataService;

  beforeEach(() => {
    pointInTime = new PointInTimeDataService();
  });

  it('should handle repeated historical evaluation with deterministic results', () => {
    const candles = [
      { timestamp: '2024-01-01T00:00:00.000Z', open: 100, high: 102, low: 99, close: 101, volume: 1000000 },
      { timestamp: '2024-01-15T00:00:00.000Z', open: 102, high: 104, low: 101, close: 103, volume: 1000000 },
      { timestamp: '2024-02-01T00:00:00.000Z', open: 200, high: 205, low: 198, close: 203, volume: 1000000 },
    ];

    const result1 = pointInTime.filterCandles(candles, '2024-01-15T23:59:59.000Z');
    const result2 = pointInTime.filterCandles(candles, '2024-01-15T23:59:59.000Z');

    expect(result1.data).toEqual(result2.data);
    expect(result1.rejectedCount).toBe(result2.rejectedCount);
  });

  it('should verify no future data leaks through verification', () => {
    const items = [
      { timestamp: '2024-01-01T00:00:00.000Z', value: 1 },
      { timestamp: '2024-01-15T00:00:00.000Z', value: 2 },
    ];

    const verify1 = pointInTime.verifyNoFutureData(items, '2024-01-15T23:59:59.000Z');
    expect(verify1.pass).toBe(true);

    const itemsWithFuture = [
      ...items,
      { timestamp: '2024-06-01T00:00:00.000Z', value: 3 },
    ];
    const verify2 = pointInTime.verifyNoFutureData(itemsWithFuture, '2024-01-15T23:59:59.000Z');
    expect(verify2.pass).toBe(false);
    expect(verify2.futureCount).toBe(1);
  });

  it('should handle backtest failure without data corruption', () => {
    const candles: any[] = [];
    const result = pointInTime.filterCandles(candles, '2024-01-15T23:59:59.000Z');
    expect(result.data).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });

  it('should provide deterministic point-in-time filtering', () => {
    const decisionDate = '2024-01-15T23:59:59.000Z';

    const candles = [
      { timestamp: '2024-01-01T00:00:00.000Z', open: 100, high: 102, low: 99, close: 101, volume: 1000000 },
      { timestamp: '2024-01-15T00:00:00.000Z', open: 102, high: 104, low: 101, close: 103, volume: 1000000 },
    ];

    const result = pointInTime.filterCandles(candles, decisionDate);
    expect(result.data).toHaveLength(2);
    expect(result.rejectedCount).toBe(0);
  });
});