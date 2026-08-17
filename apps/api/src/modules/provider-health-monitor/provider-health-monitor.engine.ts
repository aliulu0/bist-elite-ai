import { Injectable, Optional } from '@nestjs/common';
import {
  ProviderName,
  ProviderStatus,
  ProviderRequestRecord,
  ProviderHealthState,
  ProviderHealthSnapshot,
  ProviderHealthResult,
} from './provider-health-monitor.types';
import {
  ProviderHealthConfig,
  DEFAULT_PROVIDER_HEALTH_CONFIG,
} from './provider-health-monitor.config';

const ALL_PROVIDERS: ProviderName[] = [
  'yahoo_finance',
  'fintables',
  'investing',
  'google_discovery',
  'kap',
  'mkk',
  'tcmb',
];

@Injectable()
export class ProviderHealthMonitorEngine {
  private readonly config: ProviderHealthConfig;
  private readonly requests = new Map<ProviderName, ProviderRequestRecord[]>();
  private readonly consecutiveFailures = new Map<ProviderName, number>();
  private readonly lastFailureTime = new Map<ProviderName, number | null>();
  private readonly lastSuccessTime = new Map<ProviderName, number | null>();
  private readonly lastRequestTime = new Map<ProviderName, number | null>();
  private readonly recoveryTime = new Map<ProviderName, number | null>();
  private readonly startedAt = Date.now();

  constructor(@Optional() config?: Partial<ProviderHealthConfig>) {
    this.config = { ...DEFAULT_PROVIDER_HEALTH_CONFIG, ...config };
    for (const provider of this.config.providers) {
      this.requests.set(provider, []);
      this.consecutiveFailures.set(provider, 0);
      this.lastFailureTime.set(provider, null);
      this.lastSuccessTime.set(provider, null);
      this.lastRequestTime.set(provider, null);
      this.recoveryTime.set(provider, null);
    }
  }

  recordRequest(
    provider: ProviderName,
    latencyMs: number,
    success: boolean,
    isTimeout = false,
    error?: string,
  ): void {
    if (!this.requests.has(provider)) {
      this.requests.set(provider, []);
      this.consecutiveFailures.set(provider, 0);
      this.lastFailureTime.set(provider, null);
      this.lastSuccessTime.set(provider, null);
      this.lastRequestTime.set(provider, null);
      this.recoveryTime.set(provider, null);
    }

    const record: ProviderRequestRecord = {
      timestamp: Date.now(),
      latencyMs,
      success,
      isTimeout,
      error,
    };

    const history = this.requests.get(provider)!;
    history.push(record);
    if (history.length > this.config.maxRequestHistory) {
      history.splice(0, history.length - this.config.maxRequestHistory);
    }

    const now = Date.now();
    this.lastRequestTime.set(provider, now);

    if (success) {
      const prevFailures = this.consecutiveFailures.get(provider) ?? 0;
      this.consecutiveFailures.set(provider, 0);
      this.lastSuccessTime.set(provider, now);

      if (prevFailures > 0) {
        const failTime = this.lastFailureTime.get(provider);
        if (failTime) {
          this.recoveryTime.set(provider, now - failTime);
        }
      }
    } else {
      const prev = this.consecutiveFailures.get(provider) ?? 0;
      this.consecutiveFailures.set(provider, prev + 1);
      this.lastFailureTime.set(provider, now);
    }
  }

  getProviderState(provider: ProviderName): ProviderHealthState {
    const history = this.getRecentRequests(provider);
    const totalRequests = history.length;
    if (totalRequests === 0) {
      return this.emptyState(provider);
    }

    const successes = history.filter((r) => r.success).length;
    const failures = totalRequests - successes;
    const timeouts = history.filter((r) => r.isTimeout).length;
    const latencies = history.map((r) => r.latencyMs).sort((a, b) => a - b);

    const successRate = totalRequests > 0 ? (successes / totalRequests) * 100 : 0;
    const errorRate = totalRequests > 0 ? (failures / totalRequests) * 100 : 0;
    const avgLatency = this.average(latencies);
    const p50 = this.percentile(latencies, 50);
    const p95 = this.percentile(latencies, 95);
    const p99 = this.percentile(latencies, 99);

    const status = this.evaluateStatus(successRate, p95);
    const reliabilityScore = this.computeReliability(
      successRate,
      p95,
      this.consecutiveFailures.get(provider) ?? 0,
    );

    const uptimeStart = history[0].timestamp;
    const uptime = Date.now() - uptimeStart;

    return {
      provider,
      status,
      totalRequests,
      successfulRequests: successes,
      failedRequests: failures,
      timeoutCount: timeouts,
      consecutiveFailures: this.consecutiveFailures.get(provider) ?? 0,
      lastFailureTime: this.lastFailureTime.get(provider) ?? null,
      lastSuccessTime: this.lastSuccessTime.get(provider) ?? null,
      lastRequestTime: this.lastRequestTime.get(provider) ?? null,
      recoveryTimeMs: this.recoveryTime.get(provider) ?? null,
      avgLatencyMs: avgLatency,
      p50LatencyMs: p50,
      p95LatencyMs: p95,
      p99LatencyMs: p99,
      reliabilityScore,
      successRate,
      errorRate,
      uptime,
    };
  }

  getSnapshot(): ProviderHealthSnapshot {
    const providers = this.config.providers.map((p) => this.getProviderState(p));
    const healthyCount = providers.filter((p) => p.status === 'healthy').length;
    const degradedCount = providers.filter((p) => p.status === 'degraded').length;
    const unhealthyCount = providers.filter((p) => p.status === 'unhealthy').length;

    let overallStatus: ProviderStatus = 'healthy';
    if (unhealthyCount > 0) overallStatus = 'unhealthy';
    else if (degradedCount > 0) overallStatus = 'degraded';

    return {
      providers,
      overallStatus,
      totalProviders: providers.length,
      healthyCount,
      degradedCount,
      unhealthyCount,
      timestamp: new Date().toISOString(),
    };
  }

  getResult(): ProviderHealthResult {
    return {
      snapshot: this.getSnapshot(),
      metadata: {
        config: this.config,
        startedAt: new Date(this.startedAt).toISOString(),
        providers: this.config.providers,
      },
    };
  }

  resetProvider(provider: ProviderName): void {
    this.requests.set(provider, []);
    this.consecutiveFailures.set(provider, 0);
    this.lastFailureTime.set(provider, null);
    this.lastSuccessTime.set(provider, null);
    this.lastRequestTime.set(provider, null);
    this.recoveryTime.set(provider, null);
  }

  resetAll(): void {
    for (const provider of this.config.providers) {
      this.resetProvider(provider);
    }
  }

  getRequestHistory(provider: ProviderName): ProviderRequestRecord[] {
    return [...(this.requests.get(provider) ?? [])];
  }

  private getRecentRequests(provider: ProviderName): ProviderRequestRecord[] {
    const history = this.requests.get(provider) ?? [];
    const cutoff = Date.now() - this.config.rollingWindowMs;
    return history.filter((r) => r.timestamp >= cutoff);
  }

  private evaluateStatus(successRate: number, p95Latency: number): ProviderStatus {
    const { thresholds } = this.config;

    if (successRate < thresholds.unhealthySuccessRate) return 'unhealthy';
    if (p95Latency >= thresholds.unhealthyLatencyP95Ms) return 'unhealthy';

    if (successRate < thresholds.degradedSuccessRate) return 'degraded';
    if (p95Latency >= thresholds.degradedLatencyP95Ms) return 'degraded';

    return 'healthy';
  }

  private computeReliability(
    successRate: number,
    p95Latency: number,
    consecutiveFailures: number,
  ): number {
    let score = successRate;

    if (p95Latency > 0) {
      const latencyPenalty = Math.min(30, (p95Latency / 1000) * 3);
      score -= latencyPenalty;
    }

    score -= consecutiveFailures * 5;

    return Math.max(0, Math.min(100, Math.round(score)));
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

  private emptyState(provider: ProviderName): ProviderHealthState {
    return {
      provider,
      status: 'unknown',
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      timeoutCount: 0,
      consecutiveFailures: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      lastRequestTime: null,
      recoveryTimeMs: null,
      avgLatencyMs: 0,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      p99LatencyMs: 0,
      reliabilityScore: 100,
      successRate: 0,
      errorRate: 0,
      uptime: 0,
    };
  }
}
