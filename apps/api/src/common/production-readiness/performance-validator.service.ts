import { Injectable } from '@nestjs/common';
import { PerformanceValidationResult, PerformanceBenchmark, ReadinessStatus } from './types';
import { MetricsService } from '../monitoring/metrics.service';

const DEFAULT_THRESHOLDS: Record<string, number> = {
  'api.avg': 200,
  'api.p95': 1000,
  'api.p99': 3000,
  'db_query.slow': 50,
};

@Injectable()
export class PerformanceValidatorService {
  private readonly thresholds: Record<string, number>;

  constructor(
    private readonly metricsService: MetricsService,
    thresholds?: Record<string, number>,
  ) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  validate(): PerformanceValidationResult {
    const snapshot = this.metricsService.getSnapshot();
    const benchmarks: PerformanceBenchmark[] = [];

    benchmarks.push({
      name: 'api.avg',
      avgMs: snapshot.requests.avgDuration,
      p50Ms: snapshot.requests.avgDuration,
      p95Ms: 0,
      p99Ms: 0,
      samples: snapshot.requests.total,
      thresholdMs: this.thresholds['api.avg'],
      status: snapshot.requests.avgDuration <= this.thresholds['api.avg']
        ? ReadinessStatus.PASS
        : ReadinessStatus.WARN,
    });

    benchmarks.push({
      name: 'api.p95',
      avgMs: 0,
      p50Ms: 0,
      p95Ms: snapshot.requests.p95Duration,
      p99Ms: 0,
      samples: snapshot.requests.total,
      thresholdMs: this.thresholds['api.p95'],
      status: snapshot.requests.p95Duration <= this.thresholds['api.p95']
        ? ReadinessStatus.PASS
        : ReadinessStatus.WARN,
    });

    benchmarks.push({
      name: 'api.p99',
      avgMs: 0,
      p50Ms: 0,
      p95Ms: 0,
      p99Ms: snapshot.requests.p99Duration,
      samples: snapshot.requests.total,
      thresholdMs: this.thresholds['api.p99'],
      status: snapshot.requests.p99Duration <= this.thresholds['api.p99']
        ? ReadinessStatus.PASS
        : ReadinessStatus.WARN,
    });

    const slowQueryCount = snapshot.database.slowQueries.length;
    if (slowQueryCount > 0) {
      benchmarks.push({
        name: 'db_query.slow',
        avgMs: 0,
        p50Ms: 0,
        p95Ms: 0,
        p99Ms: 0,
        samples: slowQueryCount,
        thresholdMs: this.thresholds['db_query.slow'],
        status: slowQueryCount > this.thresholds['db_query.slow']
          ? ReadinessStatus.WARN
          : ReadinessStatus.PASS,
      });
    }

    const warnCount = benchmarks.filter((b) => b.status === ReadinessStatus.WARN).length;
    const failCount = benchmarks.filter((b) => b.status === ReadinessStatus.FAIL).length;

    const overallScore = Math.max(0, 100 - failCount * 30 - warnCount * 15);

    const status = failCount > 0
      ? ReadinessStatus.FAIL
      : warnCount > 0
        ? ReadinessStatus.WARN
        : ReadinessStatus.PASS;

    return {
      status,
      timestamp: new Date().toISOString(),
      benchmarks,
      overallScore,
    };
  }
}
