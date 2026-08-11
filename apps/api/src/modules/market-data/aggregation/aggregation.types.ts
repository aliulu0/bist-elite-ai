export interface ProviderContribution {
  provider: string;
  priority: number;
  healthy: boolean;
  latencyMs: number;
  fieldsReturned: number;
  fieldsExpected: number;
}

export interface ConflictRecord {
  field: string;
  values: Array<{ provider: string; value: unknown; priority: number; timestamp: string }>;
  resolution: 'latest_timestamp' | 'highest_priority' | 'average' | 'majority' | 'single_source';
  chosenValue: unknown;
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  provider?: string;
}

export interface AggregationMetadata {
  providersQueried: string[];
  providersUsed: string[];
  providersFailed: string[];
  providerConfidence: Record<string, number>;
  qualityScore: number;
  lastUpdated: string;
  cacheStatus: 'hit' | 'miss';
  aggregationDurationMs: number;
  validationWarnings: ValidationWarning[];
  conflictCount: number;
  conflicts: ConflictRecord[];
}

export interface AggregatedResult<T> {
  data: T;
  metadata: AggregationMetadata;
}

export interface ProviderResponse<T> {
  provider: string;
  data: T | null;
  priority: number;
  healthy: boolean;
  latencyMs: number;
  error?: string;
}

export type AggregationStrategy = 'merge' | 'prefer_latest' | 'prefer_highest_priority';

export interface AggregationConfig {
  strategy: AggregationStrategy;
  stalenessThresholdMs: number;
  minProvidersForAverage: number;
  weightByPriority: boolean;
  weightByHealth: boolean;
}
