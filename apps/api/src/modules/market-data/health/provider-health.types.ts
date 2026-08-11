import { FailureCategory } from '../error/error-classifier.service';

export type ProviderOverallStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'UNCONFIGURED';

export interface MarketDataProviderHealthEntry {
  provider: string;
  enabled: boolean;
  configured: boolean;
  authenticated: boolean;
  reachable: boolean | null;
  responseValid: boolean | null;
  latencyMs: number;
  lastSuccessfulRequest: string | null;
  lastFailure: string | null;
  errorCategory: FailureCategory | null;
  status: ProviderOverallStatus;
  circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  priority: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  failureRatePct: number;
  coverage: number;
}

export interface MarketDataHealthReport {
  overall: ProviderOverallStatus;
  providers: MarketDataProviderHealthEntry[];
  generatedAt: string;
}
