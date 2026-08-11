import { BenchmarkService } from '../benchmark.service';
import { OHLCV } from '../../indicators/indicator.types';

describe('BenchmarkService', () => {
  let service: BenchmarkService;

  beforeEach(() => {
    service = new BenchmarkService();
  });

  const makeCandle = (timestamp: string, price: number): OHLCV => ({
    timestamp, open: price, high: price + 1, low: price - 1, close: price, volume: 1000000,
  });

  it('should calculate excess return', () => {
    const stockCandles = [
      makeCandle('2024-01-01T00:00:00.000Z', 100),
      makeCandle('2024-04-01T00:00:00.000Z', 120),
    ];
    const benchCandles = [
      makeCandle('2024-01-01T00:00:00.000Z', 1000),
      makeCandle('2024-04-01T00:00:00.000Z', 1100),
    ];
    const result = service.compare('THYAO.IS', '2024-01-15T23:59:59.000Z', stockCandles, benchCandles, '3M');
    expect(result.benchmarkAvailable).toBe(true);
    expect(result.stockReturn).toBeGreaterThan(0);
    expect(result.benchmarkReturn).toBeGreaterThan(0);
    expect(result.excessReturn).toBeDefined();
  });

  it('should return null when benchmark unavailable', () => {
    const stockCandles = [
      makeCandle('2024-01-01T00:00:00.000Z', 100),
      makeCandle('2024-04-01T00:00:00.000Z', 120),
    ];
    const result = service.compare('THYAO.IS', '2024-01-15T23:59:59.000Z', stockCandles, null, '3M');
    expect(result.benchmarkAvailable).toBe(false);
    expect(result.stockReturn).toBeNull();
  });

  it('should compare all horizons', () => {
    const stockCandles = [
      makeCandle('2024-01-01T00:00:00.000Z', 100),
      makeCandle('2024-01-08T00:00:00.000Z', 102),
      makeCandle('2024-02-01T00:00:00.000Z', 105),
      makeCandle('2024-04-01T00:00:00.000Z', 110),
      makeCandle('2024-06-01T00:00:00.000Z', 115),
      makeCandle('2024-07-01T00:00:00.000Z', 118),
      makeCandle('2025-01-01T00:00:00.000Z', 130),
    ];
    const benchCandles = [
      makeCandle('2024-01-01T00:00:00.000Z', 1000),
      makeCandle('2024-01-08T00:00:00.000Z', 1005),
      makeCandle('2024-02-01T00:00:00.000Z', 1010),
      makeCandle('2024-04-01T00:00:00.000Z', 1020),
      makeCandle('2024-06-01T00:00:00.000Z', 1030),
      makeCandle('2024-07-01T00:00:00.000Z', 1035),
      makeCandle('2025-01-01T00:00:00.000Z', 1050),
    ];
    const results = service.compareAllHorizons('THYAO.IS', '2024-01-01T00:00:00.000Z', stockCandles, benchCandles);
    expect(results).toHaveLength(6);
    results.forEach((r) => {
      expect(r.benchmarkAvailable).toBe(true);
    });
  });
});