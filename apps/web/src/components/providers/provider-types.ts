export type ProviderHealthTab = 'overview' | 'yahoo' | 'fintables' | 'investing' | 'google-discovery';

export const PROVIDER_TABS: Array<{ key: ProviderHealthTab; label: string }> = [
  { key: 'overview', label: 'Genel' },
  { key: 'yahoo', label: 'Yahoo' },
  { key: 'fintables', label: 'Fintables' },
  { key: 'investing', label: 'Investing' },
  { key: 'google-discovery', label: 'Google Discovery' },
];

export type ProviderStatus = 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'OFFLINE' | 'UNKNOWN';

export const PROVIDER_STATUS_LABELS: Record<ProviderStatus, string> = {
  HEALTHY: 'Sağlıklı',
  DEGRADED: 'Düşük',
  CRITICAL: 'Kritik',
  OFFLINE: 'Çevrimdışı',
  UNKNOWN: 'Bilinmiyor',
};

export const PROVIDER_STATUS_COLORS: Record<ProviderStatus, string> = {
  HEALTHY: 'text-success',
  DEGRADED: 'text-warning',
  CRITICAL: 'text-destructive',
  OFFLINE: 'text-destructive',
  UNKNOWN: 'text-muted-foreground',
};

export const PROVIDER_STATUS_BADGE: Record<ProviderStatus, 'success' | 'warning' | 'danger'> = {
  HEALTHY: 'success',
  DEGRADED: 'warning',
  CRITICAL: 'danger',
  OFFLINE: 'danger',
  UNKNOWN: 'default' as 'warning',
};

export interface ProviderHealthEntry {
  name: string;
  status: ProviderStatus;
  latencyMs: number;
  successRate: number;
  errorRate: number;
  reliabilityScore: number;
  consecutiveFailures: number;
  totalRequests: number;
  failedRequests: number;
  timeoutCount: number;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastRecoveryAt: string | null;
  recoveryTimeMs: number | null;
}

export interface LatencyHistoryPoint {
  timestamp: string;
  latencyMs: number;
  success: boolean;
}

export interface ProviderHistoryEntry {
  timestamp: string;
  latencyMs: number;
  success: boolean;
  timeout: boolean;
  errorMessage: string | null;
}

export interface ProviderAlert {
  id: string;
  type: 'OFFLINE' | 'DEGRADED' | 'HIGH_LATENCY' | 'HIGH_ERROR_RATE' | 'RECOVERY' | 'CONSECUTIVE_FAILURES';
  title: string;
  description: string;
  provider: string;
  timestamp: string;
  severity: 'WARNING' | 'CRITICAL';
}

export interface ProviderHealthSnapshot {
  providers: ProviderHealthEntry[];
  latencyHistory: Record<string, LatencyHistoryPoint[]>;
  alerts: ProviderAlert[];
  failoverOrder: string[];
  lastUpdate: string | null;
}

export const DEFAULT_FAILOVER_ORDER = ['Yahoo Finance', 'Fintables', 'Investing', 'Google Discovery'];

export const PROVIDER_NAMES: Record<string, string> = {
  yahoo: 'Yahoo Finance',
  fintables: 'Fintables',
  investing: 'Investing',
  'google-discovery': 'Google Discovery',
};
