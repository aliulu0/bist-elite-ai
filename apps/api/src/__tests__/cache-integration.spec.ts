import { CacheService } from '../common/cache/cache.service';

describe('CacheService Integration', () => {
  let cache: CacheService;

  beforeEach(() => {
    jest.useFakeTimers();
    cache = new CacheService();
  });

  afterEach(() => {
    cache.onModuleDestroy();
    jest.useRealTimers();
  });

  describe('Basic operations', () => {
    it('should set and get string values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should set and get object values', () => {
      const obj = { name: 'THYAO', score: 85.5 };
      cache.set('stock:THYAO', obj);
      expect(cache.get('stock:THYAO')).toEqual(obj);
    });

    it('should set and get numeric values', () => {
      cache.set('count', 42);
      expect(cache.get('count')).toBe(42);
    });

    it('should return undefined for missing keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should overwrite existing values', () => {
      cache.set('key1', 'old');
      cache.set('key1', 'new');
      expect(cache.get('key1')).toBe('new');
    });
  });

  describe('Key existence and deletion', () => {
    it('should check key existence with has()', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
    });

    it('should delete keys and return true', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should return false when deleting non-existent keys', () => {
      expect(cache.delete('nonexistent')).toBe(false);
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', () => {
      cache.set('short-lived', 'data', 100);
      expect(cache.get('short-lived')).toBe('data');

      jest.advanceTimersByTime(200);
      expect(cache.get('short-lived')).toBeUndefined();
    });

    it('should not expire entries before TTL', () => {
      cache.set('long-lived', 'data', 10000);
      jest.advanceTimersByTime(5000);
      expect(cache.get('long-lived')).toBe('data');
    });

    it('should use default TTL when not specified', () => {
      cache.set('default-ttl', 'data');
      jest.advanceTimersByTime(290_000);
      expect(cache.get('default-ttl')).toBe('data');

      jest.advanceTimersByTime(20_000);
      expect(cache.get('default-ttl')).toBeUndefined();
    });
  });

  describe('Namespace operations', () => {
    it('should store values in specific namespaces', () => {
      cache.set('key1', 'indicators-data', undefined, 'indicators');
      cache.set('key1', 'scores-data', undefined, 'scores');

      expect(cache.get('key1', 'indicators')).toBe('indicators-data');
      expect(cache.get('key1', 'scores')).toBe('scores-data');
    });

    it('should not mix global and namespace values', () => {
      cache.set('key1', 'global-data');
      cache.set('key1', 'namespace-data', undefined, 'marketData');

      expect(cache.get('key1')).toBe('global-data');
      expect(cache.get('key1', 'marketData')).toBe('namespace-data');
    });

    it('should clear specific namespace', () => {
      cache.set('key1', 'data1', undefined, 'indicators');
      cache.set('key2', 'data2', undefined, 'indicators');
      cache.set('key1', 'global');

      const cleared = cache.clear('indicators');
      expect(cleared).toBe(2);
      expect(cache.get('key1', 'indicators')).toBeUndefined();
      expect(cache.get('key1')).toBe('global');
    });

    it('should return 0 when clearing non-existent namespace', () => {
      expect(cache.clear('nonexistent')).toBe(0);
    });

    it('should list keys per namespace', () => {
      cache.set('a', 1, undefined, 'indicators');
      cache.set('b', 2, undefined, 'indicators');
      cache.set('c', 3, undefined, 'scores');

      const indicatorKeys = cache.getKeys('indicators');
      expect(indicatorKeys).toHaveLength(2);
      expect(indicatorKeys).toContain('a');
      expect(indicatorKeys).toContain('b');
    });
  });

  describe('LRU eviction', () => {
    it('should evict least used entries when maxEntries reached', () => {
      const smallCache = new CacheService();
      (smallCache as any).namespaces.get('indicators').config.maxEntries = 3;

      smallCache.set('a', 1, undefined, 'indicators');
      smallCache.set('b', 2, undefined, 'indicators');
      smallCache.set('c', 3, undefined, 'indicators');

      smallCache.get('a');
      smallCache.get('b');

      smallCache.set('d', 4, undefined, 'indicators');

      const keys = smallCache.getKeys('indicators');
      expect(keys.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getOrSet pattern', () => {
    it('should compute and cache on miss', () => {
      const factory = jest.fn().mockReturnValue('computed');
      const result = cache.getOrSet('key1', factory);

      expect(result).toBe('computed');
      expect(factory).toHaveBeenCalledTimes(1);
      expect(cache.get('key1')).toBe('computed');
    });

    it('should return cached value on hit', () => {
      cache.set('key1', 'cached');
      const factory = jest.fn().mockReturnValue('new');
      const result = cache.getOrSet('key1', factory);

      expect(result).toBe('cached');
      expect(factory).not.toHaveBeenCalled();
    });

    it('should support async factories', async () => {
      const factory = jest.fn().mockResolvedValue('async-computed');
      const result = await cache.getOrSet('key1', factory);

      expect(result).toBe('async-computed');
      expect(cache.get('key1')).toBe('async-computed');
    });

    it('should not call factory again for cached async result', async () => {
      const factory = jest.fn().mockResolvedValue('async-cached');
      await cache.getOrSet('key1', factory);
      await cache.getOrSet('key1', factory);

      expect(factory).toHaveBeenCalledTimes(1);
    });
  });

  describe('Statistics tracking', () => {
    it('should track hits and misses', () => {
      cache.set('key1', 'value1');
      cache.get('key1');
      cache.get('key1');
      cache.get('miss1');

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.sets).toBe(1);
    });

    it('should calculate hit rate', () => {
      cache.set('key1', 'value1');
      cache.get('key1');
      cache.get('miss1');

      const stats = cache.getStats();
      expect(stats.hitRate).toBeCloseTo(0.5);
    });

    it('should track deletes', () => {
      cache.set('key1', 'value1');
      cache.delete('key1');

      const stats = cache.getStats();
      expect(stats.deletes).toBe(1);
    });

    it('should track total entries', () => {
      cache.set('a', 1);
      cache.set('b', 2);

      const stats = cache.getStats();
      expect(stats.totalEntries).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Size and clearing', () => {
    it('should report correct size', () => {
      expect(cache.size()).toBe(0);
      cache.set('a', 1);
      cache.set('b', 2);
      expect(cache.size()).toBe(2);
    });

    it('should clear all entries', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      const cleared = cache.clear();
      expect(cleared).toBe(2);
      expect(cache.size()).toBe(0);
    });

    it('should list all keys', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      const keys = cache.getKeys();
      expect(keys).toContain('a');
      expect(keys).toContain('b');
    });
  });

  describe('Disabled cache behavior', () => {
    it('should return undefined for gets when disabled', () => {
      const disabledCache = new CacheService();
      (disabledCache as any).config.enabled = false;

      disabledCache.set('key1', 'value1');
      expect(disabledCache.get('key1')).toBeUndefined();
    });

    it('should return false for sets when disabled', () => {
      const disabledCache = new CacheService();
      (disabledCache as any).config.enabled = false;

      expect(disabledCache.set('key1', 'value1')).toBe(false);
    });
  });

  describe('Module lifecycle', () => {
    it('should clean up interval on destroy', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const freshCache = new CacheService();
      freshCache.onModuleDestroy();
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });
});
