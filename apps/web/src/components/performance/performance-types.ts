export type PerformanceTab =
  | 'overview'
  | 'engines'
  | 'pipeline'
  | 'api'
  | 'cache'
  | 'system'
  | 'workflow'
  | 'queue'
  | 'providers'
  | 'alerts';

export const PERFORMANCE_TABS: Array<{ key: PerformanceTab; label: string }> = [
  { key: 'overview', label: 'Genel' },
  { key: 'engines', label: 'Motorlar' },
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'api', label: 'API' },
  { key: 'cache', label: 'Önbellek' },
  { key: 'system', label: 'Sistem' },
  { key: 'workflow', label: 'İş Akışı' },
  { key: 'queue', label: 'Kuyruk' },
  { key: 'providers', label: 'Sağlayıcılar' },
  { key: 'alerts', label: 'Uyarılar' },
];

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';

export const HEALTH_STATUS_LABELS: Record<HealthStatus, string> = {
  HEALTHY: 'Sağlıklı',
  DEGRADED: 'Bozulmuş',
  UNHEALTHY: 'Sağlıksız',
  UNKNOWN: 'Bilinmiyor',
};

export const HEALTH_STATUS_COLORS: Record<HealthStatus, string> = {
  HEALTHY: 'text-success',
  DEGRADED: 'text-warning',
  UNHEALTHY: 'text-destructive',
  UNKNOWN: 'text-muted-foreground',
};

export interface EngineMetric {
  name: string;
  totalCalls: number;
  avgDurationMs: number;
  p95DurationMs: number;
  p99DurationMs: number;
  successRate: number;
  errorCount: number;
  lastExecutedAt: string | null;
}

export interface PipelineMetric {
  name: string;
  totalRuns: number;
  avgDurationMs: number;
  p95DurationMs: number;
  successRate: number;
  failureRate: number;
  stepDurations: Record<string, number>;
}

export interface ApiMetric {
  endpoint: string;
  method: string;
  count: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  successRate: number;
  errorRate: number;
  lastAccessedAt: string;
}

export interface CacheMetric {
  hitRate: number;
  missRate: number;
  evictions: number;
  sizeBytes: number;
  entryCount: number;
  warnings: string[];
}

export interface SystemMetric {
  cpuUsagePercent: number;
  memoryUsageMb: number;
  heapUsedMb: number;
  heapTotalMb: number;
  rssMb: number;
  eventLoopDelayMs: number;
  nodeUptimeSeconds: number;
  gcRuns: number;
}

export interface WorkflowMetric {
  activeCount: number;
  completedCount: number;
  failedCount: number;
  avgDurationMs: number;
  retryCount: number;
  queueLatencyMs: number;
}

export interface QueueMetric {
  queueLength: number;
  waitingCount: number;
  runningCount: number;
  completedCount: number;
  failedCount: number;
  deadLetterCount: number;
  avgWaitTimeMs: number;
}

export interface ProviderMetric {
  name: string;
  status: HealthStatus;
  latencyMs: number;
  reliabilityScore: number;
  failureCount: number;
  lastCheckAt: string | null;
}

export interface PerformanceAlert {
  id: string;
  type: 'SLOW_ENDPOINT' | 'HIGH_MEMORY' | 'QUEUE_OVERLOAD' | 'PROVIDER_FAILURE' | 'PERF_WARNING' | 'CRITICAL_WARNING';
  title: string;
  description: string;
  severity: 'WARNING' | 'CRITICAL';
  source: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface PerformanceSnapshot {
  health: HealthStatus;
  totalRequests: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  cacheHitRate: number;
  workflowAvgDurationMs: number;
  queueAvgWaitTimeMs: number;
  systemHealth: HealthStatus;
  uptime: number;
  engines: EngineMetric[];
  pipelines: PipelineMetric[];
  apiMetrics: ApiMetric[];
  cacheMetrics: CacheMetric;
  systemMetrics: SystemMetric;
  workflowMetrics: WorkflowMetric;
  queueMetrics: QueueMetric;
  providerMetrics: ProviderMetric[];
  alerts: PerformanceAlert[];
  timestamp: string;
}
