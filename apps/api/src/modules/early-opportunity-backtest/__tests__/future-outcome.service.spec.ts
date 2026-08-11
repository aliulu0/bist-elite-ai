import { FutureOutcomeService } from '../future-outcome.service';
import { OHLCV } from '../../indicators/indicator.types';

describe('FutureOutcomeService', () => {
  let service: FutureOutcomeService;

  beforeEach(() => {
    service = new FutureOutcomeService();
  });

  const makeCandle = (timestamp: string, open: number, high: number, low: number, close: number): OHLCV => ({
    timestamp, open, high, low, close, volume: 1000000,
  });

  const makeCandles = (): OHLCV[] => [
    makeCandle('2024-01-01T00:00:00.000Z', 100, 102, 99, 101),
    makeCandle('2024-01-08T00:00:00.000Z', 101, 103, 100, 102),
    makeCandle('2024-01-15T00:00:00.000Z', 102, 104, 101, 103),
    makeCandle('2024-01-22T00:00:00.000Z', 103, 106, 102, 105),
    makeCandle('2024-02-01T00:00:00.000Z', 105, 108, 104, 107),
    makeCandle('2024-02-15T00:00:00.000Z', 107, 110, 106, 109),
    makeCandle('2024-03-01T00:00:00.000Z', 109, 112, 108, 111),
    makeCandle('2024-04-01T00:00:00.000Z', 111, 115, 110, 114),
    makeCandle('2024-07-01T00:00:00.000Z', 114, 120, 113, 118),
    makeCandle('2025-01-01T00:00:00.000Z', 118, 125, 117, 123),
  ];

  describe('calculate', () => {
    it('should calculate 1W outcome', () => {
      const candles = makeCandles();
      const result = service.calculate('THYAO.IS', '2024-01-15T23:59:59.000Z', candles, ['1W'], 103, null, null);
      expect(result.dataAvailable).toBe(true);
      const outcome = result.outcomes.find((o) => o.horizon === '1W');
      expect(outcome).toBeDefined();
      expect(outcome!.dataAvailable).toBe(true);
    });

    it('should calculate 1M outcome', () => {
      const candles = makeCandles();
      const result = service.calculate('THYAO.IS', '2024-01-15T23:59:59.000Z', candles, ['1M'], 103, null, null);
      expect(result.dataAvailable).toBe(true);
      const outcome = result.outcomes.find((o) => o.horizon === '1M');
      expect(outcome).toBeDefined();
      expect(outcome!.dataAvailable).toBe(true);
    });

    it('should calculate 3M outcome', () => {
      const candles = makeCandles();
      const result = service.calculate('THYAO.IS', '2024-01-15T23:59:59.000Z', candles, ['3M'], 103, null, null);
      expect(result.dataAvailable).toBe(true);
      const outcome = result.outcomes.find((o) => o.horizon === '3M');
      expect(outcome).toBeDefined();
      expect(outcome!.dataAvailable).toBe(true);
    });

    it('should calculate 5M outcome', () => {
      const candles = makeCandles();
      const result = service.calculate('THYAO.IS', '2024-01-15T23:59:59.000Z', candles, ['5M'], 103, null, null);
      expect(result.dataAvailable).toBe(true);
      const outcome = result.outcomes.find((o) => o.horizon === '5M');
      expect(outcome).toBeDefined();
    });

    it('should calculate 6M outcome', () => {
      const candles = makeCandles();
      const result = service.calculate('THYAO.IS', '2024-01-15T23:59:59.000Z', candles, ['6M'], 103, null, null);
      expect(result.dataAvailable).toBe(true);
      const outcome = result.outcomes.find((o) => o.horizon === '6M');
      expect(outcome).toBeDefined();
    });

    it('should calculate 1Y outcome', () => {
      const candles = makeCandles();
      const result = service.calculate('THYAO.IS', '2024-01-15T23:59:59.000Z', candles, ['1Y'], 103, null, null);
      expect(result.dataAvailable).toBe(true);
      const outcome = result.outcomes.find((o) => o.horizon === '1Y');
      expect(outcome).toBeDefined();
    });

    it('should detect positive return', () => {
      const candles = makeCandles();
      const result = service.calculate('THYAO.IS', '2024-01-01T00:00:00.000Z', candles, ['3M'], 101, null, null);
      const outcome = result.outcomes.find((o) => o.horizon === '3M');
      expect(outcome!.percentageReturn).toBeGreaterThan(0);
    });

    it('should detect target reached', () => {
      const candles = makeCandles();
      const result = service.calculate('THYAO.IS', '2024-01-01T00:00:00.000Z', candles, ['3M'], 101, null, 110);
      const outcome = result.outcomes.find((o) => o.horizon === '3M');
      expect(outcome!.targetReached).toBe(true);
    });

    it('should detect stop reached', () => {
      const candles = makeCandles();
      const result = service.calculate('THYAO.IS', '2024-01-01T00:00:00.000Z', candles, ['3M'], 101, 100, null);
      const outcome = result.outcomes.find((o) => o.horizon === '3M');
      expect(outcome!.stopReached).toBe(true);
    });

    it('should handle negative return', () => {
      const candles = [
        makeCandle('2024-01-01T00:00:00.000Z', 100, 102, 98, 101),
        makeCandle('2024-01-15T00:00:00.000Z', 101, 102, 97, 98),
        makeCandle('2024-02-01T00:00:00.000Z', 98, 99, 95, 96),
        makeCandle('2024-03-01T00:00:00.000Z', 96, 97, 93, 94),
        makeCandle('2024-04-01T00:00:00.000Z', 94, 95, 91, 92),
      ];
      const result = service.calculate('THYAO.IS', '2024-01-01T00:00:00.000Z', candles, ['3M'], 101, null, null);
      const outcome = result.outcomes.find((o) => o.horizon === '3M');
      expect(outcome!.percentageReturn).toBeLessThan(0);
    });

    it('should handle commission and slippage', () => {
      const candles = makeCandles();
      const result = service.calculate('THYAO.IS', '2024-01-01T00:00:00.000Z', candles, ['3M'], 101, null, null, 0.1, 0.05);
      expect(result.dataAvailable).toBe(true);
    });

    it('should return dataAvailable false when no future candles', () => {
      const candles = [makeCandle('2024-01-01T00:00:00.000Z', 100, 102, 99, 101)];
      const result = service.calculate('THYAO.IS', '2024-01-15T23:59:59.000Z', candles, ['1M'], 101, null, null);
      expect(result.dataAvailable).toBe(false);
    });
  });
});