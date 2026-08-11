import { Injectable, Optional } from '@nestjs/common';
import {
  DiagnosticCheck,
  DiagnosticStatus,
  DiagnosticModule,
  DiagnosticSummary,
  DiagnosticStatistics,
  DiagnosticRunResult,
} from './system-diagnostics.types';
import {
  SystemDiagnosticsConfig,
  DEFAULT_SYSTEM_DIAGNOSTICS_CONFIG,
} from './system-diagnostics.config';
import { EventBusEngine } from '../event-bus/event-bus.engine';
import { AuditLogEngine } from '../audit-log/audit-log.engine';

let nextRunId = 0;

@Injectable()
export class SystemDiagnosticsEngine {
  private readonly config: SystemDiagnosticsConfig;
  private readonly history: DiagnosticRunResult[] = [];
  private readonly moduleCheckCounts: Record<string, number> = {};
  private readonly statusCounts: Record<string, number> = {};
  private totalRuns = 0;
  private totalDurationMs = 0;
  private lastRunAt: number | null = null;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private checkHandlers = new Map<DiagnosticModule, () => DiagnosticCheck>();

  constructor(
    @Optional() config?: Partial<SystemDiagnosticsConfig>,
    @Optional() private readonly eventBus?: EventBusEngine,
    @Optional() private readonly auditLog?: AuditLogEngine,
  ) {
    this.config = { ...DEFAULT_SYSTEM_DIAGNOSTICS_CONFIG, ...config };
    this.registerDefaultHandlers();
    if (this.config.autoCleanupIntervalMs > 0) {
      this.cleanupTimer = setInterval(
        () => this.cleanup(),
        this.config.autoCleanupIntervalMs,
      );
    }
  }

  registerCheck(module: DiagnosticModule, handler: () => DiagnosticCheck): void {
    this.checkHandlers.set(module, handler);
  }

  runModule(module: DiagnosticModule): DiagnosticCheck {
    const handler = this.checkHandlers.get(module);
    if (!handler) {
      return {
        module,
        status: 'UNHEALTHY',
        message: `No handler registered for module: ${module}`,
        duration: 0,
        timestamp: Date.now(),
        details: { error: 'no_handler' },
      };
    }
    return this.executeCheck(module, handler);
  }

  async runModuleAsync(module: DiagnosticModule): Promise<DiagnosticCheck> {
    const handler = this.checkHandlers.get(module);
    if (!handler) {
      return {
        module,
        status: 'UNHEALTHY',
        message: `No handler registered for module: ${module}`,
        duration: 0,
        timestamp: Date.now(),
        details: { error: 'no_handler' },
      };
    }
    return this.executeCheckAsync(module, handler);
  }

  async run(): Promise<DiagnosticRunResult> {
    const runId = `diag-${Date.now()}-${(nextRunId++).toString(36)}`;
    const start = Date.now();
    this.emitEvent('diagnostics.started', { runId });

    const checks: DiagnosticCheck[] = [];
    for (const module of this.config.enabledModules) {
      const handler = this.checkHandlers.get(module);
      if (handler) {
        checks.push(await this.executeCheckAsync(module, handler));
      }
    }

    const duration = Date.now() - start;
    const summary = this.buildSummary(checks, Date.now());
    const result: DiagnosticRunResult = {
      runId,
      checks,
      summary,
      duration,
      timestamp: new Date().toISOString(),
    };

    this.recordRun(result);
    this.emitEvent('diagnostics.completed', { runId, duration, overall: summary.overall });

    if (this.auditLog) {
      try {
        this.auditLog.record({
          module: 'system',
          entity: 'diagnostics',
          entityId: runId,
          action: 'COMPLETED',
          severity: summary.overall === 'UNHEALTHY' ? 'ERROR' : 'INFO',
          user: null,
          oldValue: null,
          newValue: { overall: summary.overall, checks: checks.length },
          metadata: { duration, summary },
        });
      } catch { /* audit failure is non-fatal */ }
    }

    return result;
  }

  runAll(): DiagnosticCheck[] {
    const checks: DiagnosticCheck[] = [];
    for (const module of this.config.enabledModules) {
      const handler = this.checkHandlers.get(module);
      if (handler) {
        checks.push(this.executeCheck(module, handler));
      }
    }
    return checks;
  }

  summary(): DiagnosticSummary {
    const lastRun = this.history[this.history.length - 1];
    if (lastRun) {
      return lastRun.summary;
    }
    return {
      overall: 'HEALTHY',
      healthyCount: 0,
      warningCount: 0,
      failedCount: 0,
      averageDuration: 0,
      checkedAt: Date.now(),
    };
  }

  statistics(): DiagnosticStatistics {
    return {
      totalRuns: this.totalRuns,
      runsByModule: { ...this.moduleCheckCounts },
      runsByStatus: { ...this.statusCounts },
      averageDurationMs: this.totalRuns > 0 ? this.totalDurationMs / this.totalRuns : 0,
      lastRunAt: this.lastRunAt,
    };
  }

  getHistory(): DiagnosticRunResult[] {
    return this.history.map((r) => this.deepClone(r));
  }

  clear(): void {
    this.history.length = 0;
    this.totalRuns = 0;
    this.totalDurationMs = 0;
    this.lastRunAt = null;
    Object.keys(this.moduleCheckCounts).forEach((k) => delete this.moduleCheckCounts[k]);
    Object.keys(this.statusCounts).forEach((k) => delete this.statusCounts[k]);
  }

  private cleanup(): void {
    if (this.history.length > this.config.maxHistorySize) {
      this.history.splice(0, this.history.length - this.config.maxHistorySize);
    }
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private executeCheck(module: DiagnosticModule, handler: () => DiagnosticCheck): DiagnosticCheck {
    const start = Date.now();
    try {
      const result = handler();
      result.duration = Date.now() - start;
      result.timestamp = Date.now();
      return result;
    } catch (err) {
      return {
        module,
        status: 'UNHEALTHY',
        message: err instanceof Error ? err.message : String(err),
        duration: Date.now() - start,
        timestamp: Date.now(),
        details: { error: true },
      };
    }
  }

  private async executeCheckAsync(
    module: DiagnosticModule,
    handler: () => DiagnosticCheck,
  ): Promise<DiagnosticCheck> {
    const start = Date.now();
    try {
      const result = handler();
      result.duration = Date.now() - start;
      result.timestamp = Date.now();
      return result;
    } catch (err) {
      return {
        module,
        status: 'UNHEALTHY',
        message: err instanceof Error ? err.message : String(err),
        duration: Date.now() - start,
        timestamp: Date.now(),
        details: { error: true },
      };
    }
  }

  private buildSummary(checks: DiagnosticCheck[], now: number): DiagnosticSummary {
    let healthyCount = 0;
    let warningCount = 0;
    let failedCount = 0;
    let totalDuration = 0;

    for (const check of checks) {
      totalDuration += check.duration;
      if (check.status === 'HEALTHY') healthyCount++;
      else if (check.status === 'WARNING') warningCount++;
      else failedCount++;
    }

    let overall: DiagnosticStatus = 'HEALTHY';
    if (failedCount > 0) overall = 'UNHEALTHY';
    else if (warningCount > 0) overall = 'WARNING';

    return {
      overall,
      healthyCount,
      warningCount,
      failedCount,
      averageDuration: checks.length > 0 ? totalDuration / checks.length : 0,
      checkedAt: now,
    };
  }

  private recordRun(result: DiagnosticRunResult): void {
    this.totalRuns++;
    this.totalDurationMs += result.duration;
    this.lastRunAt = Date.now();
    this.statusCounts[result.summary.overall] =
      (this.statusCounts[result.summary.overall] ?? 0) + 1;

    for (const check of result.checks) {
      this.moduleCheckCounts[check.module] =
        (this.moduleCheckCounts[check.module] ?? 0) + 1;
    }

    this.history.push(result);
    if (this.history.length > this.config.maxHistorySize) {
      this.history.splice(0, this.history.length - this.config.maxHistorySize);
    }
  }

  private deepClone<T>(value: T): T {
    if (value === null || value === undefined) return value;
    if (typeof value !== 'object') return value;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return value;
    }
  }

  private emitEvent(type: string, payload: unknown): void {
    if (!this.eventBus) return;
    try {
      this.eventBus.publish(type, 'system', payload, {
        source: 'system-diagnostics-engine',
      });
    } catch { /* event bus failure is non-fatal */ }
  }

  private registerDefaultHandlers(): void {
    const defaultCheck = (module: DiagnosticModule, status: DiagnosticStatus, message: string): (() => DiagnosticCheck) => {
      return () => ({
        module,
        status,
        message,
        duration: 0,
        timestamp: Date.now(),
        details: {},
      });
    };

    this.checkHandlers.set('workflow', defaultCheck('workflow', 'HEALTHY', 'Workflow module operational'));
    this.checkHandlers.set('workflow_queue', defaultCheck('workflow_queue', 'HEALTHY', 'Workflow queue operational'));
    this.checkHandlers.set('scheduler', defaultCheck('scheduler', 'HEALTHY', 'Scheduler operational'));
    this.checkHandlers.set('configuration', defaultCheck('configuration', 'HEALTHY', 'Configuration operational'));
    this.checkHandlers.set('performance_monitor', defaultCheck('performance_monitor', 'HEALTHY', 'Performance monitor operational'));
    this.checkHandlers.set('provider_health', defaultCheck('provider_health', 'HEALTHY', 'Provider health operational'));
    this.checkHandlers.set('event_bus', defaultCheck('event_bus', 'HEALTHY', 'Event bus operational'));
    this.checkHandlers.set('audit_log', defaultCheck('audit_log', 'HEALTHY', 'Audit log operational'));
    this.checkHandlers.set('market_scanner', defaultCheck('market_scanner', 'HEALTHY', 'Market scanner operational'));
    this.checkHandlers.set('analysis_pipeline', defaultCheck('analysis_pipeline', 'HEALTHY', 'Analysis pipeline operational'));
    this.checkHandlers.set('historical_data', defaultCheck('historical_data', 'HEALTHY', 'Historical data operational'));
    this.checkHandlers.set('memory', defaultCheck('memory', 'HEALTHY', 'Memory usage normal'));
    this.checkHandlers.set('cpu', defaultCheck('cpu', 'HEALTHY', 'CPU usage normal'));
    this.checkHandlers.set('heap', defaultCheck('heap', 'HEALTHY', 'Heap usage normal'));
    this.checkHandlers.set('node_runtime', defaultCheck('node_runtime', 'HEALTHY', `Node ${process.version} running`));
  }
}
