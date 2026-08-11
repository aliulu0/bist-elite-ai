import { DiagnosticModule } from './system-diagnostics.types';

export interface SystemDiagnosticsConfig {
  enabledModules: DiagnosticModule[];
  timeoutMs: number;
  maxHistorySize: number;
  autoCleanupIntervalMs: number;
}

export const ALL_DIAGNOSTIC_MODULES: DiagnosticModule[] = [
  'workflow',
  'workflow_queue',
  'scheduler',
  'configuration',
  'performance_monitor',
  'provider_health',
  'event_bus',
  'audit_log',
  'market_scanner',
  'analysis_pipeline',
  'historical_data',
  'memory',
  'cpu',
  'heap',
  'node_runtime',
];

export const DEFAULT_SYSTEM_DIAGNOSTICS_CONFIG: SystemDiagnosticsConfig = {
  enabledModules: [...ALL_DIAGNOSTIC_MODULES],
  timeoutMs: 5000,
  maxHistorySize: 100,
  autoCleanupIntervalMs: 0,
};
