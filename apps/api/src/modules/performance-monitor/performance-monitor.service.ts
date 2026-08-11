import { Injectable } from '@nestjs/common';
import { PerformanceMonitorEngine } from './performance-monitor.engine';
import { MetricCategory, MetricStats } from './performance-monitor.types';

@Injectable()
export class PerformanceMonitorService {
  constructor(private readonly engine: PerformanceMonitorEngine) {}

  getSnapshot() {
    return this.engine.getSnapshot();
  }

  getHealth() {
    return this.engine.getHealth();
  }

  getCacheMetrics() {
    return this.engine.getCacheMetrics();
  }

  getSystemMetrics() {
    return this.engine.getSystemMetrics();
  }

  getAllMetrics(): MetricStats[] {
    return this.engine.getSnapshot().metrics;
  }

  getMetricsByCategory(category: MetricCategory): MetricStats[] {
    return this.engine.getStatsByCategory(category);
  }

  getMetricStats(name: string): MetricStats | null {
    return this.engine.getStats(name);
  }

  resetAllMetrics(): void {
    this.engine.clearMetrics();
  }

  resetMetric(name: string): boolean {
    const stats = this.engine.getStats(name);
    if (!stats) return false;

    this.engine.backdate(name, this.engine['config'].retentionWindowMs + 1);
    this.engine.pruneExpired();
    return true;
  }
}
