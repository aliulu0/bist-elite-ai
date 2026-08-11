import { IndicatorCacheService } from './indicator-cache.service';
import { CacheService } from '../../common/cache/cache.service';
import { IndicatorEngine } from '../indicators/indicator-engine.service';
import { IndicatorResult, OHLCV } from '../indicators/indicator.types';

function makeBars(count = 30, firstTs = '2026-01-01T00:00:00.000Z'): OHLCV[] {
  const bars: OHLCV[] = [];
  for (let i = 0; i < count; i++) {
    bars.push({
      open: 100 + i,
      high: 102 + i,
      low: 98 + i,
      close: 101 + i,
      volume: 500_000,
      timestamp: new Date(Date.parse(firstTs) + i * 86_400_000).toISOString(),
    });
  }
  return bars;
}

describe('IndicatorCacheService', () => {
  let cacheService: CacheService;
  let indicatorEngine: { calculateAll: jest.Mock };
  let service: IndicatorCacheService;

  beforeEach(() => {
    cacheService = new CacheService();
    indicatorEngine = { calculateAll: jest.fn() };
    service = new IndicatorCacheService(
      cacheService,
      indicatorEngine as unknown as IndicatorEngine,
    );
  });

  it('computes indicators once and returns the same result on repeat call (same last bar)', () => {
    const bars = makeBars();
    const result1: IndicatorResult[] = [{ indicator: 'SMA_20', timeframe: '1d', timestamp: 'x', value: 1, metadata: {}, isValid: true }];
    indicatorEngine.calculateAll.mockReturnValue(result1);

    const first = service.getOrCalculate('THYAO', '1d', bars);
    const second = service.getOrCalculate('THYAO', '1d', bars);

    expect(first).toEqual(result1);
    expect(second).toEqual(result1);
    expect(indicatorEngine.calculateAll).toHaveBeenCalledTimes(1);
    expect(service.getStats().calculations).toBe(1);
    expect(service.getStats().hits).toBe(1);
  });

  it('recomputes when the last bar timestamp changes', () => {
    const bars1 = makeBars(30, '2026-01-01T00:00:00.000Z');
    const bars2 = makeBars(30, '2026-02-01T00:00:00.000Z');
    indicatorEngine.calculateAll.mockReturnValue([]);

    service.getOrCalculate('THYAO', '1d', bars1);
    service.getOrCalculate('THYAO', '1d', bars2);

    expect(indicatorEngine.calculateAll).toHaveBeenCalledTimes(2);
  });

  it('does not cache an empty calculation', () => {
    indicatorEngine.calculateAll.mockReturnValue([]);
    service.getOrCalculate('THYAO', '1d', makeBars());
    service.getOrCalculate('THYAO', '1d', makeBars());

    expect(indicatorEngine.calculateAll).toHaveBeenCalledTimes(2);
    expect(service.getStats().sets).toBe(0);
  });

  it('returns empty array for empty OHLCV without calculation', () => {
    const result = service.getOrCalculate('THYAO', '1d', []);
    expect(result).toEqual([]);
    expect(indicatorEngine.calculateAll).not.toHaveBeenCalled();
  });

  it('keys per symbol, so different symbols both compute', () => {
    indicatorEngine.calculateAll.mockReturnValue([]);
    const bars = makeBars();
    service.getOrCalculate('THYAO', '1d', bars);
    service.getOrCalculate('AKBNK', '1d', bars);

    expect(indicatorEngine.calculateAll).toHaveBeenCalledTimes(2);
  });

  it('keys per timeframe, so different timeframes both compute', () => {
    indicatorEngine.calculateAll.mockReturnValue([]);
    const bars = makeBars();
    service.getOrCalculate('THYAO', '1d', bars);
    service.getOrCalculate('THYAO', '4h', bars);

    expect(indicatorEngine.calculateAll).toHaveBeenCalledTimes(2);
  });

  it('tracks hit rate', () => {
    const bars = makeBars();
    indicatorEngine.calculateAll.mockReturnValue([
      { indicator: 'RSI', timeframe: '1d', timestamp: 'x', value: 55, metadata: {}, isValid: true },
    ]);
    service.getOrCalculate('THYAO', '1d', bars);
    service.getOrCalculate('THYAO', '1d', bars);

    const stats = service.getStats();
    expect(stats.hitRate).toBe(0.5);
    expect(stats.calculationsSaved).toBe(1);
  });

  it('applies timeframe-specific TTL (1d = 300s)', () => {
    cacheService = new CacheService();
    service = new IndicatorCacheService(cacheService, indicatorEngine as unknown as IndicatorEngine);
    const bars = makeBars();
    indicatorEngine.calculateAll.mockReturnValue([
      { indicator: 'RSI', timeframe: '1d', timestamp: 'x', value: 55, metadata: {}, isValid: true },
    ]);
    service.getOrCalculate('THYAO', '1d', bars);
    service.getOrCalculate('THYAO', '1d', bars);
    expect(indicatorEngine.calculateAll).toHaveBeenCalledTimes(1);
  });
});