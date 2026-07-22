import { CacheConfig, getCacheConfig, parseCacheConfigFromEnv } from '../cache.config';

describe('CacheConfig', () => {
  describe('getCacheConfig', () => {
    it('returns default config', () => {
      const config = getCacheConfig();
      expect(config.enabled).toBe(true);
      expect(config.ttl).toBe(300_000);
      expect(config.maxEntries).toBe(10_000);
      expect(config.compression.enabled).toBe(true);
      expect(config.compression.threshold).toBe(1024);
      expect(config.deduplication.enabled).toBe(true);
      expect(config.deduplication.windowMs).toBe(5000);
      expect(config.strategies.indicators.ttl).toBe(600_000);
      expect(config.strategies.scores.ttl).toBe(300_000);
      expect(config.strategies.marketData.ttl).toBe(60_000);
      expect(config.strategies.portfolio.ttl).toBe(30_000);
      expect(config.strategies.api.ttl).toBe(60_000);
    });

    it('returns a copy', () => {
      const a = getCacheConfig();
      const b = getCacheConfig();
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });

    it('applies overrides', () => {
      const config = getCacheConfig({ enabled: false, ttl: 1000 });
      expect(config.enabled).toBe(false);
      expect(config.ttl).toBe(1000);
      expect(config.compression.enabled).toBe(true);
    });

    it('applies nested overrides', () => {
      const config = getCacheConfig({
        redis: { enabled: true, url: 'redis://test:6379', keyPrefix: 'test:', connectTimeout: 1000, commandTimeout: 500, retryDelay: 50, maxRetries: 5 },
      });
      expect(config.redis.enabled).toBe(true);
      expect(config.redis.url).toBe('redis://test:6379');
      expect(config.redis.maxRetries).toBe(5);
    });
  });

  describe('parseCacheConfigFromEnv', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('returns empty when no env vars', () => {
      delete process.env.CACHE_ENABLED;
      delete process.env.CACHE_TTL;
      delete process.env.REDIS_URL;
      const config = parseCacheConfigFromEnv();
      expect(Object.keys(config)).toHaveLength(0);
    });

    it('parses cache enabled', () => {
      process.env.CACHE_ENABLED = 'false';
      const config = parseCacheConfigFromEnv();
      expect(config.enabled).toBe(false);
    });

    it('parses TTL', () => {
      process.env.CACHE_TTL = '60000';
      const config = parseCacheConfigFromEnv();
      expect(config.ttl).toBe(60000);
    });

    it('parses Redis URL', () => {
      process.env.REDIS_URL = 'redis://prod:6379';
      const config = parseCacheConfigFromEnv();
      expect(config.redis?.enabled).toBe(true);
      expect(config.redis?.url).toBe('redis://prod:6379');
    });

    it('parses compression setting', () => {
      process.env.CACHE_COMPRESSION_ENABLED = 'false';
      const config = parseCacheConfigFromEnv();
      expect(config.compression?.enabled).toBe(false);
    });

    it('parses deduplication setting', () => {
      process.env.CACHE_DEDUPLICATION_ENABLED = 'false';
      const config = parseCacheConfigFromEnv();
      expect(config.deduplication?.enabled).toBe(false);
    });
  });
});
