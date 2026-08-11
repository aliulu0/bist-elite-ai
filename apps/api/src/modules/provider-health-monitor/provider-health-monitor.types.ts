export type ProviderName = 'yahoo_finance' | 'fintables' | 'investing' | 'google_discovery' | 'finnhub' | 'kap' | 'mkk' | 'tcmb' | 'alpha_vantage';

export type ProviderStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export type ProviderHealthEvent = 'request' | 'success' | 'failure' | 'timeout' | 'recovery';

export interface ProviderRequestRecord {
  timestamp: number;
  latencyMs: number;
  success: boolean;
  isTimeout: boolean;
  error?: string;
}

export interface ProviderHealthState {
  provider: ProviderName;
  status: ProviderStatus;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  timeoutCount: number;
  consecutiveFailures: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  lastRequestTime: number | null;
  recoveryTimeMs: number | null;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  reliabilityScore: number;
  successRate: number;
  errorRate: number;
  uptime: number;
}

export interface ProviderHealthSnapshot {
  providers: ProviderHealthState[];
  overallStatus: ProviderStatus;
  totalProviders: number;
  healthyCount: number;
  degradedCount: number;
  unhealthyCount: number;
  timestamp: string;
}

export interface ProviderHealthResult {
  snapshot: ProviderHealthSnapshot;
  metadata: Record<string, unknown>;
}
