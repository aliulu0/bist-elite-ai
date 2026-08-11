import { PerformanceMonitorService } from './performance-monitor.service';
import { PerformanceMonitorEngine } from './performance-monitor.engine';
import { MetricCategory } from './performance-monitor.types';

function makeEngine() {
  return new PerformanceMonitorEngine({
    retentionWindowMs: 60000,
    maxEntriesPerName: 100,
    healthThresholds: {
      memoryUsageWarningBytes: 1024 * 1024 * 1024 * 10,
      memoryUsageCriticalBytes: 1024 * 1024 * 1024 * 20,
      responseTimeP95WarningMs: 10000,
      responseTimeP95CriticalMs: 30000,
      cacheHitRateWarningPercent: 50,
      cacheHitRateCriticalPercent: 20,
    },
  });
}

function makeService(engine?: PerformanceMonitorEngine) {
  const eng = engine ?? makeEngine();
  const service = new PerformanceMonitorService(eng);
  return { service, engine: eng };
}

function seedMetric(engine: PerformanceMonitorEngine, category: MetricCategory, name: string, value: number) {
  engine.record(category, name, value);
}

describe('PerformanceMonitorService', () => {
  it('should be defined', () => {
    const { service } = makeService();
    expect(service).toBeDefined();
  });

  describe('getSnapshot', () => {
    it('should return a snapshot with all fields', () => {
      const { service } = makeService();
      const snapshot = service.getSnapshot();
      expect(snapshot).toHaveProperty('metrics');
      expect(snapshot).toHaveProperty('system');
      expect(snapshot).toHaveProperty('cache');
      expect(snapshot).toHaveProperty('health');
      expect(snapshot).toHaveProperty('totalRecorded');
      expect(snapshot).toHaveProperty('timestamp');
    });

    it('should return zero totalRecorded initially', () => {
      const { service } = makeService();
      const snapshot = service.getSnapshot();
      expect(snapshot.totalRecorded).toBe(0);
    });

    it('should include recorded metrics in snapshot', () => {
      const { service, engine } = makeService();
      seedMetric(engine, 'api_response', 'test_metric', 100);
      const snapshot = service.getSnapshot();
      expect(snapshot.totalRecorded).toBe(1);
    });

    it('should return ISO timestamp', () => {
      const { service } = makeService();
      const snapshot = service.getSnapshot();
      expect(new Date(snapshot.timestamp).toISOString()).toBe(snapshot.timestamp);
    });
  });

  describe('getHealth', () => {
    it('should return health check with status', () => {
      const { service } = makeService();
      const health = service.getHealth();
      expect(health).toHaveProperty('status');
      expect(['HEALTHY', 'DEGRADED', 'UNHEALTHY']).toContain(health.status);
    });

    it('should include system, cache, and metrics', () => {
      const { service } = makeService();
      const health = service.getHealth();
      expect(health).toHaveProperty('system');
      expect(health).toHaveProperty('cache');
      expect(health).toHaveProperty('metrics');
      expect(health).toHaveProperty('timestamp');
    });

    it('should default to HEALTHY with no data', () => {
      const { service } = makeService();
      const health = service.getHealth();
      expect(health.status).toBe('HEALTHY');
    });
  });

  describe('getCacheMetrics', () => {
    it('should return cache metrics with hits and misses', () => {
      const { service, engine } = makeService();
      engine.recordCacheHit('test');
      engine.recordCacheMiss('test');
      const cache = service.getCacheMetrics();
      expect(cache.hits).toBe(1);
      expect(cache.misses).toBe(1);
      expect(cache.totalOperations).toBe(2);
    });

    it('should return zero values initially', () => {
      const { service } = makeService();
      const cache = service.getCacheMetrics();
      expect(cache.hits).toBe(0);
      expect(cache.misses).toBe(0);
      expect(cache.hitRate).toBe(0);
      expect(cache.totalOperations).toBe(0);
    });

    it('should calculate hit rate correctly', () => {
      const { service, engine } = makeService();
      for (let i = 0; i < 3; i++) engine.recordCacheHit('test');
      engine.recordCacheMiss('test');
      const cache = service.getCacheMetrics();
      expect(cache.hitRate).toBeCloseTo(75, 0);
    });
  });

  describe('getSystemMetrics', () => {
    it('should return system metrics', () => {
      const { service } = makeService();
      const system = service.getSystemMetrics();
      expect(system).toHaveProperty('memoryUsageBytes');
      expect(system).toHaveProperty('heapUsedBytes');
      expect(system).toHaveProperty('heapTotalBytes');
      expect(system).toHaveProperty('externalBytes');
      expect(system).toHaveProperty('uptimeMs');
      expect(system).toHaveProperty('cpuUsagePercent');
      expect(system).toHaveProperty('rssBytes');
    });

    it('should return positive uptime', () => {
      const { service } = makeService();
      const system = service.getSystemMetrics();
      expect(system.uptimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should return positive memory usage', () => {
      const { service } = makeService();
      const system = service.getSystemMetrics();
      expect(system.memoryUsageBytes).toBeGreaterThan(0);
      expect(system.heapUsedBytes).toBeGreaterThan(0);
    });
  });

  describe('getAllMetrics', () => {
    it('should return empty array initially', () => {
      const { service } = makeService();
      const metrics = service.getAllMetrics();
      expect(metrics).toEqual([]);
    });

    it('should return all metric stats', () => {
      const { service, engine } = makeService();
      seedMetric(engine, 'api_response', 'metric_a', 100);
      seedMetric(engine, 'pipeline', 'metric_b', 200);
      const metrics = service.getAllMetrics();
      expect(metrics).toHaveLength(2);
    });

    it('should include stat details', () => {
      const { service, engine } = makeService();
      seedMetric(engine, 'cache', 'my_metric', 42);
      const metrics = service.getAllMetrics();
      expect(metrics[0].name).toBe('my_metric');
      expect(metrics[0].category).toBe('cache');
      expect(metrics[0].count).toBe(1);
    });
  });

  describe('getMetricsByCategory', () => {
    it('should return metrics for a specific category', () => {
      const { service, engine } = makeService();
      seedMetric(engine, 'api_response', 'resp_time', 100);
      seedMetric(engine, 'api_response', 'resp_size', 200);
      seedMetric(engine, 'pipeline', 'step_time', 300);
      const metrics = service.getMetricsByCategory('api_response');
      expect(metrics).toHaveLength(2);
      expect(metrics.every((m) => m.category === 'api_response')).toBe(true);
    });

    it('should return empty array for category with no metrics', () => {
      const { service, engine } = makeService();
      seedMetric(engine, 'api_response', 'resp_time', 100);
      const metrics = service.getMetricsByCategory('scheduler');
      expect(metrics).toEqual([]);
    });

    it('should handle all categories', () => {
      const { service, engine } = makeService();
      const categories: MetricCategory[] = [
        'engine_execution', 'pipeline', 'scheduler',
        'provider_latency', 'cache', 'system', 'api_response',
      ];
      for (const cat of categories) {
        seedMetric(engine, cat, `metric_${cat}`, 1);
      }
      for (const cat of categories) {
        const metrics = service.getMetricsByCategory(cat);
        expect(metrics).toHaveLength(1);
      }
    });
  });

  describe('getMetricStats', () => {
    it('should return stats for existing metric', () => {
      const { service, engine } = makeService();
      seedMetric(engine, 'api_response', 'test_metric', 50);
      seedMetric(engine, 'api_response', 'test_metric', 150);
      const stats = service.getMetricStats('test_metric');
      expect(stats).not.toBeNull();
      expect(stats!.name).toBe('test_metric');
      expect(stats!.count).toBe(2);
      expect(stats!.min).toBe(50);
      expect(stats!.max).toBe(150);
    });

    it('should return null for non-existent metric', () => {
      const { service } = makeService();
      const stats = service.getMetricStats('nonexistent');
      expect(stats).toBeNull();
    });

    it('should include all stat fields', () => {
      const { service, engine } = makeService();
      seedMetric(engine, 'cache', 'cache_lookup', 10);
      const stats = service.getMetricStats('cache_lookup');
      expect(stats).toHaveProperty('name');
      expect(stats).toHaveProperty('category');
      expect(stats).toHaveProperty('count');
      expect(stats).toHaveProperty('min');
      expect(stats).toHaveProperty('max');
      expect(stats).toHaveProperty('avg');
      expect(stats).toHaveProperty('p50');
      expect(stats).toHaveProperty('p95');
      expect(stats).toHaveProperty('p99');
      expect(stats).toHaveProperty('lastValue');
      expect(stats).toHaveProperty('lastTimestamp');
      expect(stats).toHaveProperty('rollingAvg');
    });
  });

  describe('resetAllMetrics', () => {
    it('should clear all metrics', () => {
      const { service, engine } = makeService();
      seedMetric(engine, 'api_response', 'metric_a', 100);
      seedMetric(engine, 'pipeline', 'metric_b', 200);
      service.resetAllMetrics();
      expect(service.getAllMetrics()).toEqual([]);
    });

    it('should clear cache metrics', () => {
      const { service, engine } = makeService();
      engine.recordCacheHit('test');
      engine.recordCacheMiss('test');
      service.resetAllMetrics();
      const cache = service.getCacheMetrics();
      expect(cache.hits).toBe(0);
      expect(cache.misses).toBe(0);
    });

    it('should reset totalRecorded to zero', () => {
      const { service, engine } = makeService();
      seedMetric(engine, 'cache', 'm', 1);
      service.resetAllMetrics();
      const snapshot = service.getSnapshot();
      expect(snapshot.totalRecorded).toBe(0);
    });

    it('should be safe to call on empty engine', () => {
      const { service } = makeService();
      service.resetAllMetrics();
      expect(service.getAllMetrics()).toEqual([]);
    });
  });

  describe('resetMetric', () => {
    it('should reset a specific metric', () => {
      const { service, engine } = makeService();
      seedMetric(engine, 'api_response', 'metric_a', 100);
      seedMetric(engine, 'pipeline', 'metric_b', 200);
      const result = service.resetMetric('metric_a');
      expect(result).toBe(true);
      expect(service.getMetricStats('metric_a')).toBeNull();
      expect(service.getMetricStats('metric_b')).not.toBeNull();
    });

    it('should return false for non-existent metric', () => {
      const { service } = makeService();
      const result = service.resetMetric('nonexistent');
      expect(result).toBe(false);
    });

    it('should handle resetting metric with multiple entries', () => {
      const { service, engine } = makeService();
      for (let i = 0; i < 10; i++) {
        seedMetric(engine, 'api_response', 'multi', i);
      }
      expect(service.getMetricStats('multi')?.count).toBe(10);
      const result = service.resetMetric('multi');
      expect(result).toBe(true);
      expect(service.getMetricStats('multi')).toBeNull();
    });

    it('should preserve other metrics when resetting one', () => {
      const { service, engine } = makeService();
      seedMetric(engine, 'cache', 'keep', 1);
      seedMetric(engine, 'cache', 'remove', 2);
      service.resetMetric('remove');
      expect(service.getMetricStats('keep')).not.toBeNull();
      expect(service.getMetricStats('remove')).toBeNull();
    });
  });
});
