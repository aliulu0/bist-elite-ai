export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxEntries: number;
  maxEntrySize: number;
  prefix: string;
  redis: {
    enabled: boolean;
    url: string;
    keyPrefix: string;
    connectTimeout: number;
    commandTimeout: number;
    retryDelay: number;
    maxRetries: number;
  };
  strategies: {
    indicators: { ttl: number; maxEntries: number };
    scores: { ttl: number; maxEntries: number };
    marketData: { ttl: number; maxEntries: number };
    portfolio: { ttl: number; maxEntries: number };
     api: { ttl: number; maxEntries: number };
    research: { ttl: number; maxEntries: number };
    latestPrice: { ttl: number; maxEntries: number };
    indicatorCache: { ttl: number; maxEntries: number };
  };
  compression: {
    enabled: boolean;
    threshold: number;
    level: number;
  };
  deduplication: {
    enabled: boolean;
    windowMs: number;
    maxPending: number;
  };
}

const DEFAULTS: CacheConfig = {
  enabled: true,
  ttl: 300_000,
  maxEntries: 10_000,
  maxEntrySize: 1024 * 1024,
  prefix: 'bist:cache:',
  redis: {
    enabled: false,
    url: 'redis://localhost:6379',
    keyPrefix: 'bist:cache:',
    connectTimeout: 3000,
    commandTimeout: 1000,
    retryDelay: 100,
    maxRetries: 3,
  },
  strategies: {
    indicators: { ttl: 600_000, maxEntries: 5_000 },
    scores: { ttl: 300_000, maxEntries: 2_000 },
    marketData: { ttl: 60_000, maxEntries: 1_000 },
    portfolio: { ttl: 30_000, maxEntries: 500 },
    api: { ttl: 60_000, maxEntries: 2_000 },
    research: { ttl: 300_000, maxEntries: 5_000 },
    latestPrice: { ttl: 120_000, maxEntries: 2_000 },
    indicatorCache: { ttl: 300_000, maxEntries: 5_000 },
  },
  compression: {
    enabled: true,
    threshold: 1024,
    level: 6,
  },
  deduplication: {
    enabled: true,
    windowMs: 5000,
    maxPending: 100,
  },
};

export function getCacheConfig(overrides?: Partial<CacheConfig>): CacheConfig {
  if (!overrides) return { ...DEFAULTS };
  return {
    ...DEFAULTS,
    ...overrides,
    redis: { ...DEFAULTS.redis, ...overrides.redis },
    strategies: { ...DEFAULTS.strategies, ...overrides.strategies },
    compression: { ...DEFAULTS.compression, ...overrides.compression },
    deduplication: { ...DEFAULTS.deduplication, ...overrides.deduplication },
  };
}

export function parseCacheConfigFromEnv(): Partial<CacheConfig> {
  const config: Partial<CacheConfig> = {};

  if (process.env.CACHE_ENABLED !== undefined) {
    config.enabled = process.env.CACHE_ENABLED === 'true';
  }

  if (process.env.CACHE_TTL) {
    config.ttl = parseInt(process.env.CACHE_TTL, 10);
  }

  if (process.env.CACHE_MAX_ENTRIES) {
    config.maxEntries = parseInt(process.env.CACHE_MAX_ENTRIES, 10);
  }

  if (process.env.REDIS_URL) {
    config.redis = {
      ...DEFAULTS.redis,
      enabled: true,
      url: process.env.REDIS_URL,
    };
  }

  if (process.env.CACHE_COMPRESSION_ENABLED !== undefined) {
    config.compression = {
      ...DEFAULTS.compression,
      enabled: process.env.CACHE_COMPRESSION_ENABLED === 'true',
    };
  }

  if (process.env.CACHE_DEDUPLICATION_ENABLED !== undefined) {
    config.deduplication = {
      ...DEFAULTS.deduplication,
      enabled: process.env.CACHE_DEDUPLICATION_ENABLED === 'true',
    };
  }

  return config;
}
