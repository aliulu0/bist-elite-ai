export interface AuditLogConfig {
  maxHistorySize: number;
  retentionPeriodMs: number;
  autoPrune: boolean;
  autoCleanupIntervalMs: number;
  enablePerformanceMetrics: boolean;
}

export const DEFAULT_AUDIT_LOG_CONFIG: AuditLogConfig = {
  maxHistorySize: 10000,
  retentionPeriodMs: 30 * 24 * 60 * 60 * 1000,
  autoPrune: true,
  autoCleanupIntervalMs: 0,
  enablePerformanceMetrics: true,
};
