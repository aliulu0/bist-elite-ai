import { CacheService } from '../cache.service';
import { getCacheConfig } from '../cache.config';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    service = new CacheService({ enabled: true, ttl: 60_000, maxEntries: 100 });
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe('basic operations', () => {
    it('stores and retrieves values', () => {
      service.set('key1', { data: 'test' });
      expect(service.get('key1')).toEqual({ data: 'test' });
    });

    it('returns undefined for missing keys', () => {
      expect(service.get('missing')).toBeUndefined();
    });

    it('respects TTL', () => {
      service.set('expire', 'value', 1);
      expect(service.get('expire')).toBe('value');

      jest.advanceTimersByTime(2);
      expect(service.get('expire')).toBeUndefined();
    });

    it('deletes entries', () => {
      service.set('key', 'value');
      expect(service.delete('key')).toBe(true);
      expect(service.get('key')).toBeUndefined();
    });

    it('returns false for deleting non-existent keys', () => {
      expect(service.delete('missing')).toBe(false);
    });

    it('checks existence', () => {
      service.set('key', 'value');
      expect(service.has('key')).toBe(true);
      expect(service.has('missing')).toBe(false);
    });

    it('clears all entries', () => {
      service.set('a', 1);
      service.set('b', 2);
      const cleared = service.clear();
      expect(cleared).toBeGreaterThanOrEqual(2);
      expect(service.size()).toBe(0);
    });
  });

  describe('namespaces', () => {
    it('stores in named namespaces', () => {
      service.set('k1', 'v1', undefined, 'indicators');
      expect(service.get('k1', 'indicators')).toBe('v1');
    });

    it('isolates namespaces', () => {
      service.set('k1', 'v1', undefined, 'indicators');
      service.set('k1', 'v2', undefined, 'scores');
      expect(service.get('k1', 'indicators')).toBe('v1');
      expect(service.get('k1', 'scores')).toBe('v2');
    });

    it('clears specific namespace', () => {
      service.set('k1', 'v1', undefined, 'indicators');
      service.set('k2', 'v2', undefined, 'scores');
      service.clear('indicators');
      expect(service.get('k1', 'indicators')).toBeUndefined();
      expect(service.get('k2', 'scores')).toBe('v2');
    });

    it('returns namespace keys', () => {
      service.set('k1', 'v1', undefined, 'indicators');
      service.set('k2', 'v2', undefined, 'indicators');
      const keys = service.getKeys('indicators');
      expect(keys).toContain('k1');
      expect(keys).toContain('k2');
    });

    it('returns namespace size', () => {
      service.set('k1', 'v1', undefined, 'indicators');
      service.set('k2', 'v2', undefined, 'indicators');
      expect(service.size('indicators')).toBe(2);
    });
  });

  describe('getOrSet', () => {
    it('returns cached value', () => {
      service.set('key', 'cached');
      const result = service.getOrSet('key', () => 'factory');
      expect(result).toBe('cached');
    });

    it('calls factory and caches result', () => {
      const factory = jest.fn().mockReturnValue('computed');
      const result = service.getOrSet('key', factory);
      expect(result).toBe('computed');
      expect(factory).toHaveBeenCalled();
      expect(service.get('key')).toBe('computed');
    });

    it('supports async factories', async () => {
      const factory = jest.fn().mockResolvedValue('async-computed');
      const result = await service.getOrSet('key', factory);
      expect(result).toBe('async-computed');
      expect(service.get('key')).toBe('async-computed');
    });
  });

  describe('LRU eviction', () => {
    it('evicts when max entries reached', () => {
      const smallService = new CacheService({ enabled: true, ttl: 60_000, maxEntries: 3 });
      smallService.set('a', 1);
      smallService.set('b', 2);
      smallService.set('c', 3);
      smallService.set('d', 4);
      expect(smallService.size()).toBeLessThanOrEqual(3);
      smallService.onModuleDestroy();
    });
  });

  describe('stats', () => {
    it('tracks hit rate', () => {
      service.set('key', 'value');
      service.get('key');
      service.get('missing');
      const stats = service.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it('tracks sets and deletes', () => {
      service.set('key', 'value');
      service.delete('key');
      const stats = service.getStats();
      expect(stats.sets).toBe(1);
      expect(stats.deletes).toBe(1);
    });

    it('tracks total entries', () => {
      service.set('a', 1);
      service.set('b', 2);
      const stats = service.getStats();
      expect(stats.totalEntries).toBeGreaterThanOrEqual(2);
    });
  });

  describe('disabled cache', () => {
    it('does not store when disabled', () => {
      const disabled = new CacheService({ enabled: false });
      disabled.set('key', 'value');
      expect(disabled.get('key')).toBeUndefined();
      disabled.onModuleDestroy();
    });
  });

  describe('size estimation', () => {
    it('rejects oversized entries', () => {
      const result = service.set('big', 'x'.repeat(2 * 1024 * 1024));
      expect(result).toBe(false);
    });
  });
});
