import { Injectable, Optional } from '@nestjs/common';
import {
  MetricEntry,
  MetricStats,
  MetricCategory,
  CacheMetrics,
  SystemMetrics,
  HealthStatus,
  HealthCheck,
  PerformanceSnapshot,
  PerformanceMonitorResult,
} from './performance-monitor.types';
import { PerformanceMonitorConfig, DEFAULT_PERFORMANCE_MONITOR_CONFIG } from './performance-monitor.config';

@Injectable()
export class PerformanceMonitorEngine {
  private readonly config: PerformanceMonitorConfig;
  private readonly entries = new Map<string, MetricEntry[]>();
  private readonly cacheHits = new Map<string, number>();
  private readonly cacheMisses = new Map<string, number>();
  private totalRecorded = 0;
  private startedAt = Date.now();

  constructor(@Optional() config?: Partial<PerformanceMonitorConfig>) {
    this.config = { ...DEFAULT_PERFORMANCE_MONITOR_CONFIG, ...config };
  }

  record(category: MetricCategory, name: string, value: number, metadata?: Record<string, unknown>): MetricEntry {
    const entry: MetricEntry = {
      id: `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      category,
      value,
      timestamp: Date.now(),
      metadata,
    };

    let bucket = this.entries.get(name);
    if (!bucket) {
      bucket = [];
      this.entries.set(name, bucket);
    }

    bucket.push(entry);
    this.totalRecorded++;

    if (bucket.length > this.config.maxEntriesPerName) {
      bucket.splice(0, bucket.length - this.config.maxEntriesPerName);
    }

    return entry;
  }

  recordTiming(category: MetricCategory, name: string, startMs: number, metadata?: Record<string, unknown>): MetricEntry {
    const duration = Date.now() - startMs;
    return this.record(category, name, duration, metadata);
  }

  recordCacheHit(name: string): void {
    this.cacheHits.set(name, (this.cacheHits.get(name) ?? 0) + 1);
  }

  recordCacheMiss(name: string): void {
    this.cacheMisses.set(name, (this.cacheMisses.get(name) ?? 0) + 1);
  }

  getEntries(name: string): MetricEntry[] {
    const bucket = this.entries.get(name);
    if (!bucket) return [];
    const cutoff = Date.now() - this.config.retentionWindowMs;
    return bucket.filter((e) => e.timestamp >= cutoff);
  }

  getAllEntries(): MetricEntry[] {
    const all: MetricEntry[] = [];
    const cutoff = Date.now() - this.config.retentionWindowMs;
    for (const bucket of this.entries.values()) {
      for (const entry of bucket) {
        if (entry.timestamp >= cutoff) {
          all.push(entry);
        }
      }
    }
    return all;
  }

  getStats(name: string): MetricStats | null {
    const entries = this.getEntries(name);
    if (entries.length === 0) return null;

    const values = entries.map((e) => e.value).sort((a, b) => a - b);
    const last = entries[entries.length - 1];

    return {
      name,
      category: last.category,
      count: values.length,
      min: values[0],
      max: values[values.length - 1],
      avg: this.average(values),
      p50: this.percentile(values, 50),
      p95: this.percentile(values, 95),
      p99: this.percentile(values, 99),
      lastValue: last.value,
      lastTimestamp: last.timestamp,
      rollingAvg: this.rollingAverage(values),
    };
  }

  getStatsByCategory(category: MetricCategory): MetricStats[] {
    const stats: MetricStats[] = [];
    for (const name of this.entries.keys()) {
      const stat = this.getStats(name);
      if (stat && stat.category === category) {
        stats.push(stat);
      }
    }
    return stats;
  }

  getCacheMetrics(): CacheMetrics {
    let hits = 0;
    let misses = 0;
    for (const count of this.cacheHits.values()) hits += count;
    for (const count of this.cacheMisses.values()) misses += count;
    const total = hits + misses;
    return {
      hits,
      misses,
      hitRate: total > 0 ? (hits / total) * 100 : 0,
      totalOperations: total,
    };
  }

  getSystemMetrics(): SystemMetrics {
    const mem = process.memoryUsage();
    return {
      memoryUsageBytes: mem.heapUsed + mem.external,
      heapUsedBytes: mem.heapUsed,
      heapTotalBytes: mem.heapTotal,
      externalBytes: mem.external,
      uptimeMs: Date.now() - this.startedAt,
      cpuUsagePercent: this.getCpuUsage(),
      rssBytes: mem.rss,
    };
  }

  getHealth(): HealthCheck {
    const system = this.getSystemMetrics();
    const cache = this.getCacheMetrics();
    const apiStats = this.getStatsByCategory('api_response');
    const allStats = this.getAllStats();

    const status = this.evaluateHealthStatus(system, cache, apiStats);

    return {
      status,
      metrics: allStats,
      system,
      cache,
      timestamp: new Date().toISOString(),
    };
  }

  getSnapshot(): PerformanceSnapshot {
    return {
      metrics: this.getAllStats(),
      system: this.getSystemMetrics(),
      cache: this.getCacheMetrics(),
      health: this.getHealth(),
      totalRecorded: this.totalRecorded,
      timestamp: new Date().toISOString(),
    };
  }

  getResult(): PerformanceMonitorResult {
    return {
      snapshot: this.getSnapshot(),
      metadata: {
        config: this.config,
        entryCount: this.entries.size,
        startedAt: new Date(this.startedAt).toISOString(),
      },
    };
  }

  clearMetrics(): void {
    this.entries.clear();
    this.cacheHits.clear();
    this.cacheMisses.clear();
    this.totalRecorded = 0;
  }

  backdate(name: string, agoMs: number): void {
    const bucket = this.entries.get(name);
    if (!bucket) return;
    const cutoff = Date.now() - agoMs;
    for (const entry of bucket) {
      entry.timestamp = cutoff - 1;
    }
  }

  pruneExpired(): number {
    const cutoff = Date.now() - this.config.retentionWindowMs;
    let pruned = 0;
    for (const [name, bucket] of this.entries) {
      const before = bucket.length;
      const filtered = bucket.filter((e) => e.timestamp >= cutoff);
      if (filtered.length < before) {
        this.entries.set(name, filtered);
        pruned += before - filtered.length;
      }
      if (filtered.length === 0) {
        this.entries.delete(name);
      }
    }
    return pruned;
  }

  private getAllStats(): MetricStats[] {
    const stats: MetricStats[] = [];
    for (const name of this.entries.keys()) {
      const stat = this.getStats(name);
      if (stat) stats.push(stat);
    }
    return stats;
  }

  private evaluateHealthStatus(system: SystemMetrics, cache: CacheMetrics, apiStats: MetricStats[]): HealthStatus {
    const { healthThresholds } = this.config;

    if (system.memoryUsageBytes >= healthThresholds.memoryUsageCriticalBytes) return 'UNHEALTHY';
    if (cache.totalOperations > 0 && cache.hitRate < healthThresholds.cacheHitRateCriticalPercent) return 'UNHEALTHY';

    for (const stat of apiStats) {
      if (stat.p95 >= healthThresholds.responseTimeP95CriticalMs) return 'UNHEALTHY';
    }

    if (system.memoryUsageBytes >= healthThresholds.memoryUsageWarningBytes) return 'DEGRADED';
    if (cache.totalOperations > 0 && cache.hitRate < healthThresholds.cacheHitRateWarningPercent) return 'DEGRADED';

    for (const stat of apiStats) {
      if (stat.p95 >= healthThresholds.responseTimeP95WarningMs) return 'DEGRADED';
    }

    return 'HEALTHY';
  }

  private getCpuUsage(): number {
    const usage = process.cpuUsage();
    return ((usage.user + usage.system) / 1000);
  }

  private average(sorted: number[]): number {
    if (sorted.length === 0) return 0;
    let sum = 0;
    for (const v of sorted) sum += v;
    return sum / sorted.length;
  }

  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
  }

  private rollingAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const recentCount = Math.min(values.length, 10);
    const recent = values.slice(-recentCount);
    return this.average(recent);
  }
}
