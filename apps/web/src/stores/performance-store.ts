import { create } from 'zustand';
import type { PerformanceTab, PerformanceSnapshot, HealthStatus } from '@/components/performance/performance-types';

export interface PerformanceState {
  activeTab: PerformanceTab;
  snapshot: PerformanceSnapshot | null;
  loading: boolean;
  error: string;
  lastRefresh: string | null;
  search: string;
  sortKey: string;
  sortDir: 'asc' | 'desc';
  selectedEngine: string | null;

  setActiveTab: (tab: PerformanceTab) => void;
  setSnapshot: (snapshot: PerformanceSnapshot) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setLastRefresh: (ts: string) => void;
  setSearch: (search: string) => void;
  setSort: (key: string, dir: 'asc' | 'desc') => void;
  setSelectedEngine: (engine: string | null) => void;
  clearSnapshot: () => void;
}

const EMPTY_SNAPSHOT: PerformanceSnapshot = {
  health: 'UNKNOWN',
  totalRequests: 0,
  avgLatencyMs: 0,
  p95LatencyMs: 0,
  p99LatencyMs: 0,
  cacheHitRate: 0,
  workflowAvgDurationMs: 0,
  queueAvgWaitTimeMs: 0,
  systemHealth: 'UNKNOWN',
  uptime: 0,
  engines: [],
  pipelines: [],
  apiMetrics: [],
  cacheMetrics: { hitRate: 0, missRate: 0, evictions: 0, sizeBytes: 0, entryCount: 0, warnings: [] },
  systemMetrics: {
    cpuUsagePercent: 0,
    memoryUsageMb: 0,
    heapUsedMb: 0,
    heapTotalMb: 0,
    rssMb: 0,
    eventLoopDelayMs: 0,
    nodeUptimeSeconds: 0,
    gcRuns: 0,
  },
  workflowMetrics: {
    activeCount: 0,
    completedCount: 0,
    failedCount: 0,
    avgDurationMs: 0,
    retryCount: 0,
    queueLatencyMs: 0,
  },
  queueMetrics: {
    queueLength: 0,
    waitingCount: 0,
    runningCount: 0,
    completedCount: 0,
    failedCount: 0,
    deadLetterCount: 0,
    avgWaitTimeMs: 0,
  },
  providerMetrics: [],
  alerts: [],
  timestamp: new Date().toISOString(),
};

interface ApiMetricStats {
  name: string;
  category: string;
  count: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  lastValue: number;
  lastTimestamp: number;
  rollingAvg: number;
}

interface ApiSystemMetrics {
  memoryUsageBytes: number;
  heapUsedBytes: number;
  heapTotalBytes: number;
  externalBytes: number;
  uptimeMs: number;
  cpuUsagePercent: number;
  rssBytes: number;
}

interface ApiCacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalOperations: number;
}

const STATUS_MAP: Record<string, HealthStatus> = {
  HEALTHY: 'HEALTHY',
  DEGRADED: 'DEGRADED',
  UNHEALTHY: 'UNHEALTHY',
};

const asApiMetrics = (m: unknown[]): ApiMetricStats[] => m as ApiMetricStats[];

export function buildSnapshot(data: Record<string, unknown>): PerformanceSnapshot {
  const inner = (data['data'] ?? data) as Record<string, unknown>;
  const metrics = asApiMetrics(Array.isArray(inner['metrics']) ? (inner['metrics'] as unknown[]) : []);
  const system = (inner['system'] ?? {}) as ApiSystemMetrics;
  const cache = (inner['cache'] ?? {}) as ApiCacheMetrics;
  const healthObj = (inner['health'] ?? {}) as Record<string, unknown>;
  const healthStatus = STATUS_MAP[String(healthObj['status'] ?? '')] || 'UNKNOWN';

  const engines = metrics.filter((m) => m.category === 'engine_execution').map((m) => ({
    name: m.name,
    totalCalls: m.count,
    avgDurationMs: m.avg,
    p95DurationMs: m.p95,
    p99DurationMs: m.p99,
    successRate: Math.max(0, Math.min(100, 100 - (m.lastValue === 0 && m.avg === 0 ? 0 : (m.lastValue || 0)))),
    errorCount: 0,
    lastExecutedAt: m.lastTimestamp > 0 ? new Date(m.lastTimestamp).toISOString() : null,
  }));

  const pipelines = metrics.filter((m) => m.category === 'pipeline').map((m) => ({
    name: m.name,
    totalRuns: m.count,
    avgDurationMs: m.avg,
    p95DurationMs: m.p95,
    successRate: Math.max(0, Math.min(100, m.rollingAvg)),
    failureRate: Math.max(0, 100 - Math.min(100, m.rollingAvg)),
    stepDurations: {},
  }));

  const apiMetrics = metrics.filter((m) => m.category === 'api_response').map((m) => ({
    endpoint: m.name,
    method: 'GET',
    count: m.count,
    avgLatencyMs: m.avg,
    p95LatencyMs: m.p95,
    p99LatencyMs: m.p99,
    successRate: Math.max(0, Math.min(100, m.rollingAvg)),
    errorRate: Math.max(0, 100 - Math.min(100, m.rollingAvg)),
    lastAccessedAt: m.lastTimestamp > 0 ? new Date(m.lastTimestamp).toISOString() : '',
  }));

  const providerMetrics = metrics.filter((m) => m.category === 'provider_latency').map((m) => ({
    name: m.name,
    status: 'HEALTHY' as HealthStatus,
    latencyMs: m.avg,
    reliabilityScore: Math.max(0, Math.min(100, m.rollingAvg)),
    failureCount: 0,
    lastCheckAt: m.lastTimestamp > 0 ? new Date(m.lastTimestamp).toISOString() : null,
  }));

  const cacheMetrics: PerformanceSnapshot['cacheMetrics'] = {
    hitRate: cache.hitRate || 0,
    missRate: cache.hitRate > 0 ? 100 - cache.hitRate : 0,
    evictions: 0,
    sizeBytes: 0,
    entryCount: cache.totalOperations || 0,
    warnings: [],
  };

  const systemMetrics: PerformanceSnapshot['systemMetrics'] = {
    cpuUsagePercent: system.cpuUsagePercent || 0,
    memoryUsageMb: system.memoryUsageBytes ? Math.round(system.memoryUsageBytes / 1024 / 1024) : 0,
    heapUsedMb: system.heapUsedBytes ? Math.round(system.heapUsedBytes / 1024 / 1024) : 0,
    heapTotalMb: system.heapTotalBytes ? Math.round(system.heapTotalBytes / 1024 / 1024) : 0,
    rssMb: system.rssBytes ? Math.round(system.rssBytes / 1024 / 1024) : 0,
    eventLoopDelayMs: 0,
    nodeUptimeSeconds: system.uptimeMs ? Math.round(system.uptimeMs / 1000) : 0,
    gcRuns: 0,
  };

  const totalRequests = apiMetrics.reduce((s, m) => s + m.count, 0);
  const avgLatency = apiMetrics.length > 0 ? apiMetrics.reduce((s, m) => s + m.avgLatencyMs, 0) / apiMetrics.length : 0;
  const p95Latency = apiMetrics.length > 0 ? Math.max(...apiMetrics.map((m) => m.p95LatencyMs)) : 0;
  const p99Latency = apiMetrics.length > 0 ? Math.max(...apiMetrics.map((m) => m.p99LatencyMs)) : 0;

  const health: HealthStatus =
    systemMetrics.cpuUsagePercent > 90 || systemMetrics.memoryUsageMb > 1024
      ? 'UNHEALTHY'
      : systemMetrics.cpuUsagePercent > 70 || systemMetrics.memoryUsageMb > 768
        ? 'DEGRADED'
        : healthStatus;

  return {
    health,
    totalRequests,
    avgLatencyMs: avgLatency,
    p95LatencyMs: p95Latency,
    p99LatencyMs: p99Latency,
    cacheHitRate: cacheMetrics.hitRate,
    workflowAvgDurationMs: 0,
    queueAvgWaitTimeMs: 0,
    systemHealth: health,
    uptime: system.uptimeMs || 0,
    engines,
    pipelines,
    apiMetrics,
    cacheMetrics,
    systemMetrics,
    workflowMetrics: {
      activeCount: 0,
      completedCount: 0,
      failedCount: 0,
      avgDurationMs: 0,
      retryCount: 0,
      queueLatencyMs: 0,
    },
    queueMetrics: {
      queueLength: 0,
      waitingCount: 0,
      runningCount: 0,
      completedCount: 0,
      failedCount: 0,
      deadLetterCount: 0,
      avgWaitTimeMs: 0,
    },
    providerMetrics,
    alerts: [],
    timestamp: (inner['timestamp'] as string) || new Date().toISOString(),
  };
}

export function filterEngines(engines: PerformanceSnapshot['engines'], search: string): PerformanceSnapshot['engines'] {
  if (!search.trim()) return engines;
  const q = search.toLowerCase();
  return engines.filter((e) => e.name.toLowerCase().includes(q));
}

export function sortEngines(
  engines: PerformanceSnapshot['engines'],
  key: string,
  dir: 'asc' | 'desc',
): PerformanceSnapshot['engines'] {
  return [...engines].sort((a, b) => {
    const aVal = a[key as keyof typeof a];
    const bVal = b[key as keyof typeof b];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return dir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return dir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });
}

export const usePerformanceStore = create<PerformanceState>((set) => ({
  activeTab: 'overview',
  snapshot: null,
  loading: false,
  error: '',
  lastRefresh: null,
  search: '',
  sortKey: 'name',
  sortDir: 'asc',
  selectedEngine: null,

  setActiveTab: (activeTab) => set({ activeTab }),
  setSnapshot: (snapshot) => set({ snapshot, loading: false, error: '', lastRefresh: new Date().toISOString() }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  setLastRefresh: (lastRefresh) => set({ lastRefresh }),
  setSearch: (search) => set({ search }),
  setSort: (sortKey, sortDir) => set({ sortKey, sortDir }),
  setSelectedEngine: (selectedEngine) => set({ selectedEngine }),
  clearSnapshot: () => set({ snapshot: null, lastRefresh: null }),
}));

export { EMPTY_SNAPSHOT };
