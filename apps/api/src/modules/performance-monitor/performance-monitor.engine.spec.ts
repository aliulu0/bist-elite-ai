import { PerformanceMonitorEngine } from './performance-monitor.engine';
import { DEFAULT_PERFORMANCE_MONITOR_CONFIG, PerformanceMonitorConfig } from './performance-monitor.config';
import { MetricCategory } from './performance-monitor.types';

function makeConfig(overrides?: Partial<PerformanceMonitorConfig>): Partial<PerformanceMonitorConfig> {
  return {
    maxEntriesPerName: 10,
    retentionWindowMs: 60 * 60 * 1000,
    healthThresholds: {
      responseTimeP95WarningMs: 500,
      responseTimeP95CriticalMs: 2000,
      cacheHitRateWarningPercent: 70,
      cacheHitRateCriticalPercent: 50,
      memoryUsageWarningBytes: 1024 * 1024 * 1024,
      memoryUsageCriticalBytes: 2 * 1024 * 1024 * 1024,
    },
    categories: ['engine_execution', 'pipeline', 'scheduler', 'provider_latency', 'cache', 'system', 'api_response'],
    ...overrides,
  };
}

describe('PerformanceMonitorEngine', () => {
  let engine: PerformanceMonitorEngine;

  beforeEach(() => {
    engine = new PerformanceMonitorEngine(makeConfig());
  });

  afterEach(() => {
    engine.clearMetrics();
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('record', () => {
    it('should record a metric entry', () => {
      const entry = engine.record('engine_execution', 'indicators', 120);
      expect(entry.id).toBeDefined();
      expect(entry.name).toBe('indicators');
      expect(entry.category).toBe('engine_execution');
      expect(entry.value).toBe(120);
      expect(entry.timestamp).toBeGreaterThan(0);
    });

    it('should store metadata when provided', () => {
      const entry = engine.record('api_response', 'GET /analysis', 50, { symbol: 'THYAO' });
      expect(entry.metadata).toEqual({ symbol: 'THYAO' });
    });

    it('should store entry in bucket', () => {
      engine.record('engine_execution', 'indicators', 100);
      const entries = engine.getEntries('indicators');
      expect(entries.length).toBe(1);
    });

    it('should create new bucket for unknown name', () => {
      engine.record('engine_execution', 'indicators', 100);
      engine.record('engine_execution', 'marketStructure', 200);
      expect(engine.getEntries('indicators').length).toBe(1);
      expect(engine.getEntries('marketStructure').length).toBe(1);
    });

    it('should append to existing bucket', () => {
      engine.record('engine_execution', 'indicators', 100);
      engine.record('engine_execution', 'indicators', 200);
      expect(engine.getEntries('indicators').length).toBe(2);
    });

    it('should increment totalRecorded', () => {
      engine.record('engine_execution', 'indicators', 100);
      engine.record('pipeline', 'backtest', 500);
      const snapshot = engine.getSnapshot();
      expect(snapshot.totalRecorded).toBe(2);
    });

    it('should enforce maxEntriesPerName limit', () => {
      for (let i = 0; i < 15; i++) {
        engine.record('engine_execution', 'indicators', i);
      }
      const entries = engine.getEntries('indicators');
      expect(entries.length).toBe(10);
      expect(entries[0].value).toBe(5);
      expect(entries[9].value).toBe(14);
    });
  });

  describe('recordTiming', () => {
    it('should record timing as duration', () => {
      const startMs = Date.now() - 100;
      const entry = engine.recordTiming('engine_execution', 'indicators', startMs);
      expect(entry.value).toBeGreaterThanOrEqual(90);
      expect(entry.category).toBe('engine_execution');
    });

    it('should pass metadata through', () => {
      const entry = engine.recordTiming('api_response', 'GET /test', Date.now() - 50, { foo: 'bar' });
      expect(entry.metadata).toEqual({ foo: 'bar' });
    });
  });

  describe('cache metrics', () => {
    it('should record cache hits', () => {
      engine.recordCacheHit('yahoo');
      engine.recordCacheHit('yahoo');
      engine.recordCacheHit('fintables');
      const cache = engine.getCacheMetrics();
      expect(cache.hits).toBe(3);
    });

    it('should record cache misses', () => {
      engine.recordCacheMiss('yahoo');
      engine.recordCacheMiss('yahoo');
      const cache = engine.getCacheMetrics();
      expect(cache.misses).toBe(2);
    });

    it('should calculate hit rate', () => {
      engine.recordCacheHit('yahoo');
      engine.recordCacheHit('yahoo');
      engine.recordCacheMiss('yahoo');
      const cache = engine.getCacheMetrics();
      expect(cache.hitRate).toBeCloseTo(66.67, 1);
      expect(cache.totalOperations).toBe(3);
    });

    it('should handle zero operations', () => {
      const cache = engine.getCacheMetrics();
      expect(cache.hitRate).toBe(0);
      expect(cache.totalOperations).toBe(0);
    });
  });

  describe('getEntries', () => {
    it('should return empty array for unknown name', () => {
      expect(engine.getEntries('unknown')).toEqual([]);
    });

    it('should return entries for known name', () => {
      engine.record('engine_execution', 'indicators', 100);
      const entries = engine.getEntries('indicators');
      expect(entries.length).toBe(1);
    });

    it('should filter out expired entries', () => {
      const shortConfig = makeConfig({ retentionWindowMs: 1 });
      engine = new PerformanceMonitorEngine(shortConfig);
      engine.record('engine_execution', 'indicators', 100);
      const entries = engine.getEntries('indicators');
      expect(entries.length).toBe(1);
    });
  });

  describe('getAllEntries', () => {
    it('should return all entries across all names', () => {
      engine.record('engine_execution', 'indicators', 100);
      engine.record('pipeline', 'backtest', 200);
      engine.record('api_response', 'GET /test', 50);
      const all = engine.getAllEntries();
      expect(all.length).toBe(3);
    });

    it('should return empty when nothing recorded', () => {
      expect(engine.getAllEntries()).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should return null for unknown name', () => {
      expect(engine.getStats('unknown')).toBeNull();
    });

    it('should compute stats for single entry', () => {
      engine.record('engine_execution', 'indicators', 100);
      const stats = engine.getStats('indicators');
      expect(stats).not.toBeNull();
      expect(stats!.name).toBe('indicators');
      expect(stats!.category).toBe('engine_execution');
      expect(stats!.count).toBe(1);
      expect(stats!.min).toBe(100);
      expect(stats!.max).toBe(100);
      expect(stats!.avg).toBe(100);
      expect(stats!.p50).toBe(100);
      expect(stats!.p95).toBe(100);
      expect(stats!.p99).toBe(100);
      expect(stats!.lastValue).toBe(100);
      expect(stats!.rollingAvg).toBe(100);
    });

    it('should compute stats for multiple entries', () => {
      for (let i = 1; i <= 10; i++) {
        engine.record('engine_execution', 'indicators', i * 10);
      }
      const stats = engine.getStats('indicators');
      expect(stats!.count).toBe(10);
      expect(stats!.min).toBe(10);
      expect(stats!.max).toBe(100);
      expect(stats!.avg).toBe(55);
      expect(stats!.p50).toBe(50);
      expect(stats!.p95).toBe(100);
      expect(stats!.p99).toBe(100);
      expect(stats!.lastValue).toBe(100);
    });

    it('should calculate rolling average of last 10', () => {
      for (let i = 1; i <= 15; i++) {
        engine.record('engine_execution', 'indicators', i);
      }
      const stats = engine.getStats('indicators');
      expect(stats!.rollingAvg).toBe(10.5);
    });

    it('should handle rolling average with fewer than 10 entries', () => {
      engine.record('engine_execution', 'indicators', 10);
      engine.record('engine_execution', 'indicators', 20);
      engine.record('engine_execution', 'indicators', 30);
      const stats = engine.getStats('indicators');
      expect(stats!.rollingAvg).toBe(20);
    });
  });

  describe('getStatsByCategory', () => {
    it('should return stats for matching category only', () => {
      engine.record('engine_execution', 'indicators', 100);
      engine.record('engine_execution', 'marketStructure', 200);
      engine.record('pipeline', 'backtest', 300);
      const stats = engine.getStatsByCategory('engine_execution');
      expect(stats.length).toBe(2);
      expect(stats.map((s) => s.name)).toContain('indicators');
      expect(stats.map((s) => s.name)).toContain('marketStructure');
    });

    it('should return empty for non-matching category', () => {
      engine.record('engine_execution', 'indicators', 100);
      const stats = engine.getStatsByCategory('api_response');
      expect(stats).toEqual([]);
    });

    it('should return empty when no metrics exist', () => {
      expect(engine.getStatsByCategory('engine_execution')).toEqual([]);
    });
  });

  describe('getSystemMetrics', () => {
    it('should return system metrics', () => {
      const sys = engine.getSystemMetrics();
      expect(sys.memoryUsageBytes).toBeGreaterThanOrEqual(0);
      expect(sys.heapUsedBytes).toBeGreaterThanOrEqual(0);
      expect(sys.heapTotalBytes).toBeGreaterThanOrEqual(0);
      expect(sys.externalBytes).toBeGreaterThanOrEqual(0);
      expect(sys.uptimeMs).toBeGreaterThanOrEqual(0);
      expect(sys.cpuUsagePercent).toBeGreaterThanOrEqual(0);
      expect(sys.rssBytes).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getHealth', () => {
    it('should return HEALTHY when no issues', () => {
      const health = engine.getHealth();
      expect(health.status).toBe('HEALTHY');
      expect(health.system).toBeDefined();
      expect(health.cache).toBeDefined();
      expect(health.metrics).toBeDefined();
      expect(health.timestamp).toBeDefined();
    });

    it('should return DEGRADED when API response time hits warning', () => {
      for (let i = 0; i < 5; i++) {
        engine.record('api_response', 'GET /test', 600);
      }
      const health = engine.getHealth();
      expect(health.status).toBe('DEGRADED');
    });

    it('should return UNHEALTHY when API response time hits critical', () => {
      for (let i = 0; i < 5; i++) {
        engine.record('api_response', 'GET /test', 2500);
      }
      const health = engine.getHealth();
      expect(health.status).toBe('UNHEALTHY');
    });

    it('should return DEGRADED when cache hit rate is low', () => {
      for (let i = 0; i < 3; i++) engine.recordCacheMiss('yahoo');
      for (let i = 0; i < 5; i++) engine.recordCacheHit('yahoo');
      const health = engine.getHealth();
      expect(health.status).toBe('DEGRADED');
    });

    it('should return UNHEALTHY when cache hit rate is critical', () => {
      for (let i = 0; i < 10; i++) engine.recordCacheMiss('yahoo');
      for (let i = 0; i < 1; i++) engine.recordCacheHit('yahoo');
      const health = engine.getHealth();
      expect(health.status).toBe('UNHEALTHY');
    });
  });

  describe('getSnapshot', () => {
    it('should return full snapshot', () => {
      engine.record('engine_execution', 'indicators', 100);
      const snap = engine.getSnapshot();
      expect(snap.metrics.length).toBe(1);
      expect(snap.system).toBeDefined();
      expect(snap.cache).toBeDefined();
      expect(snap.health).toBeDefined();
      expect(snap.totalRecorded).toBe(1);
      expect(snap.timestamp).toBeDefined();
    });
  });

  describe('getResult', () => {
    it('should return result with metadata', () => {
      engine.record('engine_execution', 'indicators', 100);
      const result = engine.getResult();
      expect(result.snapshot).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.entryCount).toBe(1);
      expect(result.metadata.startedAt).toBeDefined();
      expect(result.metadata.config).toBeDefined();
    });
  });

  describe('clearMetrics', () => {
    it('should clear all data', () => {
      engine.record('engine_execution', 'indicators', 100);
      engine.recordCacheHit('yahoo');
      engine.recordCacheMiss('yahoo');
      engine.clearMetrics();
      expect(engine.getEntries('indicators')).toEqual([]);
      expect(engine.getCacheMetrics().totalOperations).toBe(0);
      expect(engine.getSnapshot().totalRecorded).toBe(0);
    });
  });

  describe('pruneExpired', () => {
    it('should remove expired entries', () => {
      engine.record('engine_execution', 'indicators', 100);
      engine.record('engine_execution', 'indicators', 200);
      engine.backdate('indicators', 2 * 60 * 60 * 1000);
      const pruned = engine.pruneExpired();
      expect(pruned).toBe(2);
      expect(engine.getEntries('indicators')).toEqual([]);
    });

    it('should remove empty buckets', () => {
      engine.record('engine_execution', 'indicators', 100);
      engine.backdate('indicators', 2 * 60 * 60 * 1000);
      engine.pruneExpired();
      expect(engine.getStats('indicators')).toBeNull();
    });

    it('should return 0 when nothing to prune', () => {
      const pruned = engine.pruneExpired();
      expect(pruned).toBe(0);
    });
  });

  describe('constructor defaults', () => {
    it('should use default config when none provided', () => {
      const defaultEngine = new PerformanceMonitorEngine();
      const result = defaultEngine.getResult();
      expect(result.metadata.config).toEqual(DEFAULT_PERFORMANCE_MONITOR_CONFIG);
    });

    it('should merge with default config', () => {
      const custom = new PerformanceMonitorEngine({ maxEntriesPerName: 50 });
      const result = custom.getResult();
      expect((result.metadata.config as any).maxEntriesPerName).toBe(50);
      expect((result.metadata.config as any).retentionWindowMs).toBe(DEFAULT_PERFORMANCE_MONITOR_CONFIG.retentionWindowMs);
    });
  });

  describe('percentile edge cases', () => {
    it('should handle p50 for even-length array', () => {
      engine.record('engine_execution', 'indicators', 1);
      engine.record('engine_execution', 'indicators', 2);
      engine.record('engine_execution', 'indicators', 3);
      engine.record('engine_execution', 'indicators', 4);
      const stats = engine.getStats('indicators');
      expect(stats!.p50).toBe(2);
    });

    it('should handle p50 for odd-length array', () => {
      engine.record('engine_execution', 'indicators', 10);
      engine.record('engine_execution', 'indicators', 20);
      engine.record('engine_execution', 'indicators', 30);
      const stats = engine.getStats('indicators');
      expect(stats!.p50).toBe(20);
    });

    it('should return 0 for empty entries', () => {
      expect(engine.getStats('nonexistent')).toBeNull();
    });
  });

  describe('multiple categories', () => {
    it('should handle all metric categories', () => {
      const categories: MetricCategory[] = [
        'engine_execution', 'pipeline', 'scheduler', 'provider_latency',
        'cache', 'system', 'api_response',
      ];
      for (const cat of categories) {
        engine.record(cat, `test-${cat}`, 100);
      }
      const all = engine.getAllEntries();
      expect(all.length).toBe(7);
      for (const cat of categories) {
        expect(engine.getStats(`test-${cat}`)).not.toBeNull();
      }
    });
  });
});
