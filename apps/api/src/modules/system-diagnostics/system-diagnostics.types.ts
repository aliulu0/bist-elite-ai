export type DiagnosticStatus = 'HEALTHY' | 'WARNING' | 'DEGRADED' | 'UNHEALTHY';

export type DiagnosticModule =
  | 'workflow'
  | 'workflow_queue'
  | 'scheduler'
  | 'configuration'
  | 'performance_monitor'
  | 'provider_health'
  | 'event_bus'
  | 'audit_log'
  | 'market_scanner'
  | 'analysis_pipeline'
  | 'historical_data'
  | 'memory'
  | 'cpu'
  | 'heap'
  | 'node_runtime';

export interface DiagnosticCheck {
  module: DiagnosticModule;
  status: DiagnosticStatus;
  message: string;
  duration: number;
  timestamp: number;
  details: Record<string, unknown>;
}

export interface DiagnosticSummary {
  overall: DiagnosticStatus;
  healthyCount: number;
  warningCount: number;
  failedCount: number;
  averageDuration: number;
  checkedAt: number;
}

export interface DiagnosticStatistics {
  totalRuns: number;
  runsByModule: Record<string, number>;
  runsByStatus: Record<string, number>;
  averageDurationMs: number;
  lastRunAt: number | null;
}

export interface DiagnosticRunResult {
  runId: string;
  checks: DiagnosticCheck[];
  summary: DiagnosticSummary;
  duration: number;
  timestamp: string;
}
