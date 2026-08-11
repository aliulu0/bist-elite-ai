export type MetricCategory =
  | 'engine_execution'
  | 'pipeline'
  | 'scheduler'
  | 'provider_latency'
  | 'cache'
  | 'system'
  | 'api_response';

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';

export interface MetricEntry {
  id: string;
  name: string;
  category: MetricCategory;
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface MetricStats {
  name: string;
  category: MetricCategory;
  count: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  lastValue: number;
  lastTimestamp: number;
  rollingAvg: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalOperations: number;
}

export interface SystemMetrics {
  memoryUsageBytes: number;
  heapUsedBytes: number;
  heapTotalBytes: number;
  externalBytes: number;
  uptimeMs: number;
  cpuUsagePercent: number;
  rssBytes: number;
}

export interface HealthCheck {
  status: HealthStatus;
  metrics: MetricStats[];
  system: SystemMetrics;
  cache: CacheMetrics;
  timestamp: string;
}

export interface PerformanceSnapshot {
  metrics: MetricStats[];
  system: SystemMetrics;
  cache: CacheMetrics;
  health: HealthCheck;
  totalRecorded: number;
  timestamp: string;
}

export interface PerformanceMonitorResult {
  snapshot: PerformanceSnapshot;
  metadata: Record<string, unknown>;
}
