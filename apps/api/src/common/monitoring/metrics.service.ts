import { Injectable } from '@nestjs/common';
import { MetricType, RequestMetric, SlowQueryEntry, MetricsSnapshot } from './types';

@Injectable()
export class MetricsService {
  private readonly requestMetrics: RequestMetric[] = [];
  private readonly slowQueries: SlowQueryEntry[] = [];
  private readonly customMetrics = new Map<string, { type: MetricType; value: number }>();
  private readonly startTime = Date.now();
  private readonly cpuStart: NodeJS.CpuUsage;

  private readonly MAX_REQUEST_METRICS = 10000;
  private readonly MAX_SLOW_QUERIES = 1000;
  private readonly SLOW_QUERY_THRESHOLD_MS = 1000;
  private readonly SLOW_REQUEST_THRESHOLD_MS = 3000;

  private totalRequests = 0;
  private failedRequests = 0;
  private slowRequests = 0;
  private totalQueries = 0;
  private failedQueries = 0;
  private activeJobs = 0;
  private completedJobs = 0;
  private failedJobs = 0;
  private queueLength = 0;

  private readonly methodCounts = new Map<string, number>();
  private readonly statusCounts = new Map<string, number>();
  private durations: number[] = [];

  constructor() {
    this.cpuStart = process.cpuUsage();
  }

  recordRequest(metric: RequestMetric): void {
    this.requestMetrics.push(metric);
    if (this.requestMetrics.length > this.MAX_REQUEST_METRICS) {
      this.requestMetrics.shift();
    }

    this.totalRequests++;
    this.durations.push(metric.duration);
    if (this.durations.length > this.MAX_REQUEST_METRICS) {
      this.durations.shift();
    }

    this.methodCounts.set(metric.method, (this.methodCounts.get(metric.method) || 0) + 1);
    this.statusCounts.set(String(metric.statusCode), (this.statusCounts.get(String(metric.statusCode)) || 0) + 1);

    if (metric.statusCode >= 400) {
      this.failedRequests++;
    }
    if (metric.duration > this.SLOW_REQUEST_THRESHOLD_MS) {
      this.slowRequests++;
    }
  }

  recordSlowQuery(query: string, duration: number): void {
    if (duration >= this.SLOW_QUERY_THRESHOLD_MS) {
      this.slowQueries.push({ query, duration, timestamp: Date.now() });
      if (this.slowQueries.length > this.MAX_SLOW_QUERIES) {
        this.slowQueries.shift();
      }
    }
    this.totalQueries++;
  }

  recordQueryFailed(): void {
    this.failedQueries++;
  }

  incrementActiveJobs(): void {
    this.activeJobs++;
  }

  decrementActiveJobs(): void {
    this.activeJobs = Math.max(0, this.activeJobs - 1);
  }

  recordJobCompleted(): void {
    this.completedJobs++;
  }

  recordJobFailed(): void {
    this.failedJobs++;
  }

  setQueueLength(length: number): void {
    this.queueLength = length;
  }

  setGauge(name: string, value: number): void {
    this.customMetrics.set(name, { type: MetricType.GAUGE, value });
  }

  incrementCounter(name: string, amount = 1): void {
    const existing = this.customMetrics.get(name);
    this.customMetrics.set(name, {
      type: MetricType.COUNTER,
      value: (existing?.value || 0) + amount,
    });
  }

  recordHistogram(name: string, value: number): void {
    this.customMetrics.set(name, { type: MetricType.HISTOGRAM, value });
  }

  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
  }

  getSnapshot(): MetricsSnapshot {
    const sortedDurations = [...this.durations].sort((a, b) => a - b);
    const avgDuration = sortedDurations.length > 0
      ? sortedDurations.reduce((a, b) => a + b, 0) / sortedDurations.length
      : 0;

    const byMethod: Record<string, number> = {};
    this.methodCounts.forEach((v, k) => { byMethod[k] = v; });

    const byStatus: Record<string, number> = {};
    this.statusCounts.forEach((v, k) => { byStatus[k] = v; });

    return {
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      requests: {
        total: this.totalRequests,
        byMethod,
        byStatus,
        avgDuration: Math.round(avgDuration * 100) / 100,
        p95Duration: this.percentile(sortedDurations, 95),
        p99Duration: this.percentile(sortedDurations, 99),
        failedRequests: this.failedRequests,
        slowRequests: this.slowRequests,
      },
      system: {
        cpuUsage: process.cpuUsage(this.cpuStart),
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        activeHandles: (process as any)._getActiveHandles?.()?.length || 0,
        activeRequests: (process as any)._getActiveRequests?.()?.length || 0,
      },
      database: {
        slowQueries: [...this.slowQueries].slice(-20),
        totalQueries: this.totalQueries,
        failedQueries: this.failedQueries,
      },
      worker: {
        activeJobs: this.activeJobs,
        completedJobs: this.completedJobs,
        failedJobs: this.failedJobs,
        queueLength: this.queueLength,
      },
      timestamp: new Date().toISOString(),
    };
  }

  reset(): void {
    this.requestMetrics.length = 0;
    this.slowQueries.length = 0;
    this.customMetrics.clear();
    this.totalRequests = 0;
    this.failedRequests = 0;
    this.slowRequests = 0;
    this.totalQueries = 0;
    this.failedQueries = 0;
    this.methodCounts.clear();
    this.statusCounts.clear();
    this.durations = [];
    this.activeJobs = 0;
    this.completedJobs = 0;
    this.failedJobs = 0;
    this.queueLength = 0;
  }
}
