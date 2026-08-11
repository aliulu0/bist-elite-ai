import { RegistryCacheAdapter } from './registry-cache.adapter';
import { CacheService } from '../../common/cache/cache.service';

interface FakeValue {
  id: string;
  data: number;
}

function adapterRegistry() {
  const store = new Map<string, FakeValue>();
  return {
    store,
    registry: {
      get: (key: string) => store.get(key),
      save: (value: FakeValue) => {
        store.set(value.id, value);
        return value;
      },
    },
  };
}

describe('RegistryCacheAdapter', () => {
  let adapter: RegistryCacheAdapter;
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService();
    adapter = new RegistryCacheAdapter(cacheService);
  });

  it('serves from registry on hit (no cache lookup, no compute)', async () => {
    const { store, registry } = adapterRegistry();
    store.set('THYAO', { id: 'THYAO', data: 42 });

    let computes = 0;
    const result = await adapter.getOrCompute<FakeValue>(
      registry,
      'THYAO',
      'cache:THYAO',
      'indicatorCache',
      60_000,
      () => {
        computes++;
        return { id: 'THYAO', data: 99 };
      },
    );

    expect(result.data).toBe(42);
    expect(computes).toBe(0);
    expect(adapter.getStats().registryHits).toBe(1);
  });

  it('serves from cache on registry miss (no compute)', async () => {
    const { registry } = adapterRegistry();
    cacheService.set('cache:AKBNK', { id: 'AKBNK', data: 7 }, 60_000, 'indicatorCache');

    let computes = 0;
    const result = await adapter.getOrCompute<FakeValue>(
      registry,
      'AKBNK',
      'cache:AKBNK',
      'indicatorCache',
      60_000,
      () => {
        computes++;
        return { id: 'AKBNK', data: 8 };
      },
    );

    expect(result.data).toBe(7);
    expect(computes).toBe(0);
    expect(adapter.getStats().cacheHits).toBe(1);
  });

  it('computes on registry+cache miss and writes both', async () => {
    const { store, registry } = adapterRegistry();

    let computes = 0;
    const result = await adapter.getOrCompute<FakeValue>(
      registry,
      'THYAO',
      'cache:THYAO',
      'indicatorCache',
      60_000,
      () => {
        computes++;
        return { id: 'THYAO', data: 55 };
      },
    );

    expect(result.data).toBe(55);
    expect(computes).toBe(1);
    expect(store.get('THYAO')?.data).toBe(55);
    expect(cacheService.get<FakeValue>('cache:THYAO', 'indicatorCache')?.data).toBe(55);
    expect(adapter.getStats().computed).toBe(1);
  });

  it('prefers registry over cache when both hold the value', async () => {
    const { store, registry } = adapterRegistry();
    store.set('THYAO', { id: 'THYAO', data: 1 });
    cacheService.set('cache:THYAO', { id: 'THYAO', data: 2 }, 60_000, 'indicatorCache');

    let computes = 0;
    const result = await adapter.getOrCompute<FakeValue>(
      registry,
      'THYAO',
      'cache:THYAO',
      'indicatorCache',
      60_000,
      () => {
        computes++;
        return { id: 'THYAO', data: 3 };
      },
    );

    expect(result.data).toBe(1);
    expect(computes).toBe(0);
  });

  it('tracks hit rates', async () => {
    const { registry } = adapterRegistry();
    cacheService.set('cache:X', { id: 'X', data: 1 }, 60_000, 'indicatorCache');

    await adapter.getOrCompute(registry, 'X', 'cache:X', 'indicatorCache', 60_000, () => ({ id: 'X', data: 1 }));
    await adapter.getOrCompute(registry, 'Y', 'cache:Y', 'indicatorCache', 60_000, () => ({ id: 'Y', data: 2 }));

    const stats = adapter.getStats();
    expect(stats.registryHits).toBe(0);
    expect(stats.cacheHits).toBe(1);
    expect(stats.computed).toBe(1);
    expect(stats.registryHitRate).toBe(0);
    expect(stats.cacheHitRate).toBe(0.5);
  });
});
