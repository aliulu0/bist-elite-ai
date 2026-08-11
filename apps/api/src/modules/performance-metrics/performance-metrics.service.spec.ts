import { PerformanceMetricsService } from './performance-metrics.service';
import { CacheService } from '../../common/cache/cache.service';
import { IndicatorCacheService } from '../indicator-cache/indicator-cache.service';
import { RegistryCacheAdapter } from '../indicator-cache/registry-cache.adapter';
import { RequestDeduplicatorService } from '../market-data/dedup/request-deduplicator.service';
import { IndicatorEngine } from '../indicators/indicator-engine.service';
import { OHLCV } from '../indicators/indicator.types';

function makeBars(): OHLCV[] {
  return [
    { open: 1, high: 2, low: 1, close: 2, volume: 100, timestamp: '2026-01-01T00:00:00.000Z' },
    { open: 2, high: 3, low: 1, close: 2, volume: 100, timestamp: '2026-01-02T00:00:00.000Z' },
  ];
}

function makeEngine(): IndicatorEngine {
  return {
    calculateAll: jest.fn().mockReturnValue([
      { indicator: 'RSI', timeframe: '1d', timestamp: '2026-01-02T00:00:00.000Z', value: 55, metadata: {}, isValid: true },
    ]) as unknown as IndicatorEngine['calculateAll'],
  } as unknown as IndicatorEngine;
}

describe('PerformanceMetricsService', () => {
  let cache: CacheService;
  let indicatorCache: IndicatorCacheService;
  let adapter: RegistryCacheAdapter;
  let deduplicator: RequestDeduplicatorService;
  let service: PerformanceMetricsService;

  beforeEach(() => {
    cache = new CacheService();
    indicatorCache = new IndicatorCacheService(cache, makeEngine());
    adapter = new RegistryCacheAdapter(cache);
    deduplicator = new RequestDeduplicatorService(15_000);
    service = new PerformanceMetricsService(cache, indicatorCache, adapter, deduplicator);
  });

  it('returns cache metrics with indicator savings', () => {
    indicatorCache.getOrCalculate('THYAO', '1d', makeBars());
    indicatorCache.getOrCalculate('THYAO', '1d', makeBars());

    const metrics = service.getCacheMetrics();
    expect(metrics.cache.hitRate).toBeGreaterThan(0);
    expect(metrics.indicatorCache.calculations).toBe(1);
    expect(metrics.indicatorCache.calculationsSaved).toBe(1);
  });

  it('returns indicator endpoint metrics', () => {
    indicatorCache.getOrCalculate('THYAO', '1d', makeBars());
    indicatorCache.getOrCalculate('THYAO', '1d', makeBars());

    const metrics = service.getIndicatorMetrics();
    expect(metrics.indicatorCache.calculations).toBe(1);
    expect(metrics.indicatorCache.hits).toBe(1);
  });

  it('returns dedup metrics including registry and memory', async () => {
    let calls = 0;
    const factory = async () => {
      calls++;
      return calls;
    };
    const { registry } = makeAdapterRegistry();
    await adapter.getOrCompute(
      registry,
      'THYAO',
      'cache:THYAO',
      'indicatorCache',
      60_000,
      () => ({ id: 'THYAO', data: 1 }),
    );
    await deduplicator.execute('THYAO:1d', factory);
    await deduplicator.execute('THYAO:1d', factory);

    const metrics = service.getDedupMetrics();
    expect(metrics.dedup.memoryHits).toBe(1);
    expect(metrics.dedup.deduplicatedCount).toBe(1);
    expect(metrics.registry.registryHits).toBe(0);
    expect(metrics.registry.computed).toBe(1);
  });

  it('aggregates summary rates', async () => {
    indicatorCache.getOrCalculate('THYAO', '1d', makeBars());
    indicatorCache.getOrCalculate('THYAO', '1d', makeBars());
    await deduplicator.execute('k', async () => 1);
    await deduplicator.execute('k', async () => 1);

    service.recordRequest(12);

    const summary = service.getSummary();
    expect(summary.providerCallsSaved).toBeGreaterThan(0);
    expect(summary.dedupHitRate).toBeGreaterThan(0);
    expect(summary.averageResponseTimeMs).toBe(12);
    expect(summary.indicatorCallsSaved).toBe(1);
  });
});

function makeAdapterRegistry() {
  const store = new Map<string, { id: string; data: number }>();
  return {
    registry: {
      get: (key: string) => store.get(key),
      save: (value: { id: string; data: number }) => {
        store.set(value.id, value);
        return value;
      },
    },
  };
}
