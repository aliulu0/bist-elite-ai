import { MetricCategory } from './performance-monitor.types';

export interface PerformanceMonitorConfig {
  maxEntriesPerName: number;
  retentionWindowMs: number;
  healthThresholds: {
    responseTimeP95WarningMs: number;
    responseTimeP95CriticalMs: number;
    cacheHitRateWarningPercent: number;
    cacheHitRateCriticalPercent: number;
    memoryUsageWarningBytes: number;
    memoryUsageCriticalBytes: number;
  };
  categories: MetricCategory[];
}

const ONE_HOUR = 60 * 60 * 1000;
const FIFTY_MB = 50 * 1024 * 1024;
const ONE_HUNDRED_MB = 100 * 1024 * 1024;

export const DEFAULT_PERFORMANCE_MONITOR_CONFIG: PerformanceMonitorConfig = {
  maxEntriesPerName: 1000,
  retentionWindowMs: ONE_HOUR,
  healthThresholds: {
    responseTimeP95WarningMs: 500,
    responseTimeP95CriticalMs: 2000,
    cacheHitRateWarningPercent: 70,
    cacheHitRateCriticalPercent: 50,
    memoryUsageWarningBytes: FIFTY_MB,
    memoryUsageCriticalBytes: ONE_HUNDRED_MB,
  },
  categories: [
    'engine_execution',
    'pipeline',
    'scheduler',
    'provider_latency',
    'cache',
    'system',
    'api_response',
  ],
};
