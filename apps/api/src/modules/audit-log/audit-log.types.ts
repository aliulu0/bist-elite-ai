export type AuditSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export type AuditAction =
  | 'CREATED'
  | 'UPDATED'
  | 'DELETED'
  | 'STARTED'
  | 'STOPPED'
  | 'FAILED'
  | 'COMPLETED'
  | 'RETRIED'
  | 'RESET'
  | 'IMPORTED'
  | 'EXPORTED'
  | 'CUSTOM';

export type AuditModule =
  | 'workflow'
  | 'workflow_queue'
  | 'scheduler'
  | 'configuration'
  | 'provider_health'
  | 'performance_monitor'
  | 'analysis_pipeline'
  | 'scanner'
  | 'optimizer'
  | 'backtest'
  | 'market_data'
  | 'event_bus'
  | 'system'
  | 'other';

export interface AuditEvent {
  id: string;
  timestamp: number;
  module: AuditModule;
  entity: string;
  entityId: string;
  action: AuditAction;
  severity: AuditSeverity;
  user: string | null;
  oldValue: unknown;
  newValue: unknown;
  metadata: Record<string, unknown>;
}

export interface AuditFilter {
  module?: AuditModule;
  entity?: string;
  severity?: AuditSeverity;
  action?: AuditAction;
  since?: number;
  until?: number;
  limit?: number;
  offset?: number;
}

export interface AuditStatistics {
  totalEvents: number;
  eventsByModule: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  eventsByAction: Record<string, number>;
  eventsToday: number;
  eventsThisHour: number;
}

export interface AuditPerformanceMetrics {
  recordLatencyMs: number[];
  queryLatencyMs: number[];
  cleanupDurationMs: number[];
}
