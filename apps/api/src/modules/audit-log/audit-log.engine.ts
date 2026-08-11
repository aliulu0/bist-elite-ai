import { Injectable, Optional } from '@nestjs/common';
import {
  AuditEvent,
  AuditFilter,
  AuditStatistics,
  AuditPerformanceMetrics,
  AuditSeverity,
  AuditAction,
  AuditModule,
} from './audit-log.types';
import { AuditLogConfig, DEFAULT_AUDIT_LOG_CONFIG } from './audit-log.config';
import { EventBusEngine } from '../event-bus/event-bus.engine';

let nextAuditId = 0;

@Injectable()
export class AuditLogEngine {
  private readonly config: AuditLogConfig;
  private readonly events: AuditEvent[] = [];
  private readonly performanceMetrics: AuditPerformanceMetrics = {
    recordLatencyMs: [],
    queryLatencyMs: [],
    cleanupDurationMs: [],
  };
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Optional() config?: Partial<AuditLogConfig>,
    @Optional() private readonly eventBus?: EventBusEngine,
  ) {
    this.config = { ...DEFAULT_AUDIT_LOG_CONFIG, ...config };
    if (this.config.autoCleanupIntervalMs > 0) {
      this.cleanupTimer = setInterval(() => this.cleanup(), this.config.autoCleanupIntervalMs);
    }
  }

  record(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
    const start = Date.now();
    const record: AuditEvent = {
      id: `aud-${Date.now()}-${(nextAuditId++).toString(36)}`,
      timestamp: Date.now(),
      ...event,
      oldValue: this.deepClone(event.oldValue),
      newValue: this.deepClone(event.newValue),
      metadata: { ...event.metadata },
    };

    this.events.push(record);

    if (this.config.autoPrune && this.events.length > this.config.maxHistorySize) {
      this.events.splice(0, this.events.length - this.config.maxHistorySize);
    }

    if (this.config.enablePerformanceMetrics) {
      this.performanceMetrics.recordLatencyMs.push(Date.now() - start);
    }

    this.emitEvent('audit.recorded', {
      id: record.id,
      module: record.module,
      entity: record.entity,
      entityId: record.entityId,
      action: record.action,
      severity: record.severity,
    });

    return record;
  }

  recordMany(events: Array<Omit<AuditEvent, 'id' | 'timestamp'>>): AuditEvent[] {
    return events.map((e) => this.record(e));
  }

  history(filter?: AuditFilter): AuditEvent[] {
    const start = Date.now();
    let result = this.events.map((e) => this.deepClone(e));

    if (filter?.module) {
      result = result.filter((e) => e.module === filter.module);
    }
    if (filter?.entity) {
      result = result.filter((e) => e.entity === filter.entity);
    }
    if (filter?.severity) {
      result = result.filter((e) => e.severity === filter.severity);
    }
    if (filter?.action) {
      result = result.filter((e) => e.action === filter.action);
    }
    if (filter?.since !== undefined) {
      result = result.filter((e) => e.timestamp >= filter.since!);
    }
    if (filter?.until !== undefined) {
      result = result.filter((e) => e.timestamp <= filter.until!);
    }

    if (filter?.offset !== undefined && filter.offset > 0) {
      result = result.slice(filter.offset);
    }
    if (filter?.limit !== undefined && filter.limit > 0) {
      result = result.slice(0, filter.limit);
    }

    if (this.config.enablePerformanceMetrics) {
      this.performanceMetrics.queryLatencyMs.push(Date.now() - start);
    }

    return result;
  }

  historyByModule(module: AuditModule): AuditEvent[] {
    return this.history({ module });
  }

  historyByEntity(entity: string): AuditEvent[] {
    return this.history({ entity });
  }

  historyBySeverity(severity: AuditSeverity): AuditEvent[] {
    return this.history({ severity });
  }

  historyByAction(action: AuditAction): AuditEvent[] {
    return this.history({ action });
  }

  statistics(): AuditStatistics {
    const start = Date.now();
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const hourStart = new Date();
    hourStart.setMinutes(0, 0, 0);

    const eventsByModule: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const eventsByAction: Record<string, number> = {};
    let eventsToday = 0;
    let eventsThisHour = 0;

    for (const event of this.events) {
      eventsByModule[event.module] = (eventsByModule[event.module] ?? 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] ?? 0) + 1;
      eventsByAction[event.action] = (eventsByAction[event.action] ?? 0) + 1;
      if (event.timestamp >= todayStart.getTime()) eventsToday++;
      if (event.timestamp >= hourStart.getTime()) eventsThisHour++;
    }

    if (this.config.enablePerformanceMetrics) {
      this.performanceMetrics.queryLatencyMs.push(Date.now() - start);
    }

    return {
      totalEvents: this.events.length,
      eventsByModule,
      eventsBySeverity,
      eventsByAction,
      eventsToday,
      eventsThisHour,
    };
  }

  clear(): void {
    this.events.length = 0;
    this.emitEvent('audit.cleared', { action: 'clear' });
  }

  cleanup(): void {
    const start = Date.now();
    if (this.config.retentionPeriodMs <= 0) return;
    const cutoff = Date.now() - this.config.retentionPeriodMs;
    const before = this.events.length;
    for (let i = this.events.length - 1; i >= 0; i--) {
      if (this.events[i].timestamp < cutoff) {
        this.events.splice(0, i + 1);
        break;
      }
    }
    if (this.config.enablePerformanceMetrics) {
      this.performanceMetrics.cleanupDurationMs.push(Date.now() - start);
    }
  }

  export(): AuditEvent[] {
    const exported = this.events.map((e) => this.deepClone(e));
    this.emitEvent('audit.exported', { count: exported.length });
    return exported;
  }

  getPerformanceMetrics(): AuditPerformanceMetrics {
    return {
      recordLatencyMs: [...this.performanceMetrics.recordLatencyMs],
      queryLatencyMs: [...this.performanceMetrics.queryLatencyMs],
      cleanupDurationMs: [...this.performanceMetrics.cleanupDurationMs],
    };
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
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
      this.eventBus.publish(type, 'system', payload, { source: 'audit-log-engine' });
    } catch { /* event bus failure is non-fatal */ }
  }
}
