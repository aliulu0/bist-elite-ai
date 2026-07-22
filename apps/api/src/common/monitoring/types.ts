export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
}

export interface MetricEntry {
  name: string;
  type: MetricType;
  value: number;
  labels?: Record<string, string>;
  timestamp: number;
}

export interface RequestMetric {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  timestamp: number;
  requestId?: string;
}

export interface SlowQueryEntry {
  query: string;
  duration: number;
  timestamp: number;
}

export interface MetricsSnapshot {
  uptime: number;
  requests: {
    total: number;
    byMethod: Record<string, number>;
    byStatus: Record<string, number>;
    avgDuration: number;
    p95Duration: number;
    p99Duration: number;
    failedRequests: number;
    slowRequests: number;
  };
  system: {
    cpuUsage: NodeJS.CpuUsage;
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
    activeHandles: number;
    activeRequests: number;
  };
  database: {
    slowQueries: SlowQueryEntry[];
    totalQueries: number;
    failedQueries: number;
  };
  worker: {
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
    queueLength: number;
  };
  timestamp: string;
}
