import { AuditLogEngine } from './audit-log.engine';
import { AuditEvent, AuditModule, AuditAction, AuditSeverity } from './audit-log.types';

function makeEvent(overrides?: Partial<Omit<AuditEvent, 'id' | 'timestamp'>>): Omit<AuditEvent, 'id' | 'timestamp'> {
  return {
    module: 'workflow',
    entity: 'workflow',
    entityId: 'wf-1',
    action: 'CREATED',
    severity: 'INFO',
    user: null,
    oldValue: null,
    newValue: { status: 'created' },
    metadata: {},
    ...overrides,
  };
}

describe('AuditLogEngine', () => {
  let engine: AuditLogEngine;

  beforeEach(() => {
    engine = new AuditLogEngine({ maxHistorySize: 100, autoPrune: true, retentionPeriodMs: 30 * 24 * 60 * 60 * 1000 });
  });

  afterEach(() => {
    engine.destroy();
    engine.clear();
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('record', () => {
    it('should record an audit event', () => {
      const event = engine.record(makeEvent());
      expect(event.id).toBeDefined();
      expect(event.id.startsWith('aud-')).toBe(true);
      expect(event.timestamp).toBeGreaterThan(0);
      expect(event.module).toBe('workflow');
      expect(event.entity).toBe('workflow');
      expect(event.entityId).toBe('wf-1');
      expect(event.action).toBe('CREATED');
      expect(event.severity).toBe('INFO');
    });

    it('should deep clone newValue', () => {
      const original = { nested: { value: 1 } };
      const event = engine.record(makeEvent({ newValue: original }));
      (original.nested as any).value = 999;
      expect((event.newValue as any).nested.value).toBe(1);
    });

    it('should deep clone oldValue', () => {
      const original = { nested: { value: 1 } };
      const event = engine.record(makeEvent({ oldValue: original }));
      (original.nested as any).value = 999;
      expect((event.oldValue as any).nested.value).toBe(1);
    });

    it('should copy metadata', () => {
      const event = engine.record(makeEvent({ metadata: { key: 'value' } }));
      expect(event.metadata).toEqual({ key: 'value' });
    });

    it('should add to history', () => {
      engine.record(makeEvent());
      expect(engine.history().length).toBe(1);
    });

    it('should return the recorded event', () => {
      const input = makeEvent({ module: 'scheduler' });
      const event = engine.record(input);
      expect(event.module).toBe('scheduler');
    });
  });

  describe('recordMany', () => {
    it('should record multiple events', () => {
      const events = engine.recordMany([
        makeEvent({ module: 'workflow', entityId: 'wf-1' }),
        makeEvent({ module: 'scheduler', entityId: 'sch-1' }),
        makeEvent({ module: 'scanner', entityId: 'sc-1' }),
      ]);
      expect(events.length).toBe(3);
      expect(engine.history().length).toBe(3);
    });

    it('should return array of recorded events', () => {
      const events = engine.recordMany([makeEvent(), makeEvent()]);
      expect(events.every((e) => e.id.startsWith('aud-'))).toBe(true);
    });

    it('should handle empty array', () => {
      const events = engine.recordMany([]);
      expect(events).toEqual([]);
      expect(engine.history().length).toBe(0);
    });
  });

  describe('history', () => {
    it('should return all events', () => {
      engine.record(makeEvent());
      engine.record(makeEvent());
      expect(engine.history().length).toBe(2);
    });

    it('should return empty when no events', () => {
      expect(engine.history()).toEqual([]);
    });

    it('should filter by module', () => {
      engine.record(makeEvent({ module: 'workflow' }));
      engine.record(makeEvent({ module: 'scheduler' }));
      engine.record(makeEvent({ module: 'workflow' }));
      expect(engine.history({ module: 'workflow' }).length).toBe(2);
    });

    it('should filter by entity', () => {
      engine.record(makeEvent({ entity: 'config' }));
      engine.record(makeEvent({ entity: 'queue' }));
      expect(engine.history({ entity: 'config' }).length).toBe(1);
    });

    it('should filter by severity', () => {
      engine.record(makeEvent({ severity: 'INFO' }));
      engine.record(makeEvent({ severity: 'ERROR' }));
      engine.record(makeEvent({ severity: 'INFO' }));
      expect(engine.history({ severity: 'INFO' }).length).toBe(2);
    });

    it('should filter by action', () => {
      engine.record(makeEvent({ action: 'CREATED' }));
      engine.record(makeEvent({ action: 'UPDATED' }));
      expect(engine.history({ action: 'CREATED' }).length).toBe(1);
    });

    it('should filter by since', () => {
      engine.record(makeEvent());
      const future = Date.now() + 60000;
      expect(engine.history({ since: future }).length).toBe(0);
    });

    it('should filter by until', () => {
      engine.record(makeEvent());
      const past = Date.now() - 60000;
      expect(engine.history({ until: past }).length).toBe(0);
    });

    it('should filter by since and until', () => {
      const now = Date.now();
      engine.record(makeEvent());
      expect(engine.history({ since: now - 1000, until: now + 1000 }).length).toBe(1);
      expect(engine.history({ since: now + 1000 }).length).toBe(0);
    });

    it('should paginate with limit', () => {
      for (let i = 0; i < 10; i++) engine.record(makeEvent({ entityId: `wf-${i}` }));
      expect(engine.history({ limit: 3 }).length).toBe(3);
    });

    it('should paginate with offset', () => {
      for (let i = 0; i < 5; i++) engine.record(makeEvent({ entityId: `wf-${i}` }));
      expect(engine.history({ offset: 2 }).length).toBe(3);
    });

    it('should paginate with limit and offset', () => {
      for (let i = 0; i < 10; i++) engine.record(makeEvent({ entityId: `wf-${i}` }));
      expect(engine.history({ limit: 2, offset: 3 }).length).toBe(2);
    });

    it('should combine multiple filters', () => {
      engine.record(makeEvent({ module: 'workflow', severity: 'INFO', action: 'CREATED' }));
      engine.record(makeEvent({ module: 'workflow', severity: 'ERROR', action: 'FAILED' }));
      engine.record(makeEvent({ module: 'scheduler', severity: 'INFO', action: 'STARTED' }));
      expect(engine.history({ module: 'workflow', severity: 'INFO' }).length).toBe(1);
    });
  });

  describe('historyByModule', () => {
    it('should filter by module', () => {
      engine.record(makeEvent({ module: 'workflow' }));
      engine.record(makeEvent({ module: 'scheduler' }));
      expect(engine.historyByModule('workflow').length).toBe(1);
    });
  });

  describe('historyByEntity', () => {
    it('should filter by entity', () => {
      engine.record(makeEvent({ entity: 'config' }));
      engine.record(makeEvent({ entity: 'queue' }));
      expect(engine.historyByEntity('config').length).toBe(1);
    });
  });

  describe('historyBySeverity', () => {
    it('should filter by severity', () => {
      engine.record(makeEvent({ severity: 'INFO' }));
      engine.record(makeEvent({ severity: 'ERROR' }));
      expect(engine.historyBySeverity('ERROR').length).toBe(1);
    });
  });

  describe('historyByAction', () => {
    it('should filter by action', () => {
      engine.record(makeEvent({ action: 'CREATED' }));
      engine.record(makeEvent({ action: 'UPDATED' }));
      expect(engine.historyByAction('CREATED').length).toBe(1);
    });
  });

  describe('statistics', () => {
    it('should return zero stats when empty', () => {
      const stats = engine.statistics();
      expect(stats.totalEvents).toBe(0);
      expect(stats.eventsToday).toBe(0);
      expect(stats.eventsThisHour).toBe(0);
    });

    it('should count total events', () => {
      engine.record(makeEvent());
      engine.record(makeEvent());
      expect(engine.statistics().totalEvents).toBe(2);
    });

    it('should count events by module', () => {
      engine.record(makeEvent({ module: 'workflow' }));
      engine.record(makeEvent({ module: 'scheduler' }));
      engine.record(makeEvent({ module: 'workflow' }));
      const stats = engine.statistics();
      expect(stats.eventsByModule.workflow).toBe(2);
      expect(stats.eventsByModule.scheduler).toBe(1);
    });

    it('should count events by severity', () => {
      engine.record(makeEvent({ severity: 'INFO' }));
      engine.record(makeEvent({ severity: 'ERROR' }));
      const stats = engine.statistics();
      expect(stats.eventsBySeverity.INFO).toBe(1);
      expect(stats.eventsBySeverity.ERROR).toBe(1);
    });

    it('should count events by action', () => {
      engine.record(makeEvent({ action: 'CREATED' }));
      engine.record(makeEvent({ action: 'CREATED' }));
      engine.record(makeEvent({ action: 'UPDATED' }));
      const stats = engine.statistics();
      expect(stats.eventsByAction.CREATED).toBe(2);
      expect(stats.eventsByAction.UPDATED).toBe(1);
    });

    it('should count events today', () => {
      engine.record(makeEvent());
      expect(engine.statistics().eventsToday).toBe(1);
    });

    it('should count events this hour', () => {
      engine.record(makeEvent());
      expect(engine.statistics().eventsThisHour).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all events', () => {
      engine.record(makeEvent());
      engine.record(makeEvent());
      engine.clear();
      expect(engine.history().length).toBe(0);
    });

    it('should reset statistics', () => {
      engine.record(makeEvent());
      engine.clear();
      expect(engine.statistics().totalEvents).toBe(0);
    });
  });

  describe('export', () => {
    it('should export all events', () => {
      engine.record(makeEvent({ module: 'workflow' }));
      engine.record(makeEvent({ module: 'scheduler' }));
      const exported = engine.export();
      expect(exported.length).toBe(2);
    });

    it('should deep clone exported events', () => {
      const event = engine.record(makeEvent({ newValue: { key: 'value' } }));
      const exported = engine.export();
      (exported[0].newValue as any).key = 'modified';
      const reExported = engine.export();
      expect((reExported[0].newValue as any).key).toBe('value');
    });

    it('should return empty array when no events', () => {
      expect(engine.export()).toEqual([]);
    });
  });

  describe('cleanup', () => {
    it('should remove expired events', () => {
      const shortRetention = new AuditLogEngine({
        maxHistorySize: 100,
        retentionPeriodMs: 1000,
        autoPrune: true,
      });
      shortRetention.record(makeEvent());
      shortRetention.record(makeEvent());
      // Manually backdate timestamps
      const events = (shortRetention as any).events;
      events[0].timestamp = Date.now() - 2000;
      events[1].timestamp = Date.now() - 2000;
      shortRetention.cleanup();
      expect(shortRetention.history().length).toBe(0);
      shortRetention.destroy();
    });

    it('should keep recent events', () => {
      engine.record(makeEvent());
      engine.cleanup();
      expect(engine.history().length).toBe(1);
    });

    it('should not cleanup with zero retention', () => {
      const noRetain = new AuditLogEngine({ retentionPeriodMs: 0, autoPrune: true });
      noRetain.record(makeEvent());
      noRetain.cleanup();
      expect(noRetain.history().length).toBe(1);
      noRetain.destroy();
    });
  });

  describe('autoPrune', () => {
    it('should prune when exceeding maxHistorySize', () => {
      const small = new AuditLogEngine({ maxHistorySize: 5, autoPrune: true });
      for (let i = 0; i < 10; i++) small.record(makeEvent({ entityId: `wf-${i}` }));
      expect(small.history().length).toBe(5);
      small.destroy();
    });

    it('should keep newest events when pruning', () => {
      const small = new AuditLogEngine({ maxHistorySize: 3, autoPrune: true });
      for (let i = 0; i < 6; i++) small.record(makeEvent({ entityId: `wf-${i}` }));
      const events = small.history();
      expect((events[0].entityId as string)).toBe('wf-3');
      small.destroy();
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should track record latency', () => {
      engine.record(makeEvent());
      const metrics = engine.getPerformanceMetrics();
      expect(metrics.recordLatencyMs.length).toBeGreaterThanOrEqual(1);
    });

    it('should track query latency', () => {
      engine.record(makeEvent());
      engine.history();
      const metrics = engine.getPerformanceMetrics();
      expect(metrics.queryLatencyMs.length).toBeGreaterThanOrEqual(1);
    });

    it('should return deep copies', () => {
      engine.record(makeEvent());
      engine.history();
      const m1 = engine.getPerformanceMetrics();
      const m2 = engine.getPerformanceMetrics();
      m1.recordLatencyMs.push(999);
      expect(m2.recordLatencyMs).not.toContain(999);
    });

    it('should track cleanup duration', () => {
      engine.record(makeEvent());
      engine.cleanup();
      const metrics = engine.getPerformanceMetrics();
      expect(metrics.cleanupDurationMs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('eventBus integration', () => {
    it('should publish audit.recorded on record', () => {
      const published: unknown[] = [];
      const mockBus = { publish: jest.fn((type: string) => published.push(type)), subscribe: jest.fn(), once: jest.fn(), unsubscribe: jest.fn(), replay: jest.fn(), history: jest.fn(), stats: jest.fn(), getSnapshot: jest.fn(), getResult: jest.fn(), clear: jest.fn(), clearSubscribers: jest.fn() } as any;
      const busEngine = new AuditLogEngine({}, mockBus);
      busEngine.record(makeEvent());
      expect(published).toContain('audit.recorded');
      busEngine.destroy();
    });

    it('should publish audit.cleared on clear', () => {
      const published: unknown[] = [];
      const mockBus = { publish: jest.fn((type: string) => published.push(type)), subscribe: jest.fn(), once: jest.fn(), unsubscribe: jest.fn(), replay: jest.fn(), history: jest.fn(), stats: jest.fn(), getSnapshot: jest.fn(), getResult: jest.fn(), clear: jest.fn(), clearSubscribers: jest.fn() } as any;
      const busEngine = new AuditLogEngine({}, mockBus);
      busEngine.record(makeEvent());
      busEngine.clear();
      expect(published).toContain('audit.cleared');
      busEngine.destroy();
    });

    it('should publish audit.exported on export', () => {
      const published: unknown[] = [];
      const mockBus = { publish: jest.fn((type: string) => published.push(type)), subscribe: jest.fn(), once: jest.fn(), unsubscribe: jest.fn(), replay: jest.fn(), history: jest.fn(), stats: jest.fn(), getSnapshot: jest.fn(), getResult: jest.fn(), clear: jest.fn(), clearSubscribers: jest.fn() } as any;
      const busEngine = new AuditLogEngine({}, mockBus);
      busEngine.record(makeEvent());
      busEngine.export();
      expect(published).toContain('audit.exported');
      busEngine.destroy();
    });
  });

  describe('immutability', () => {
    it('should not expose internal array', () => {
      engine.record(makeEvent());
      const history = engine.history();
      history.length = 0;
      expect(engine.history().length).toBe(1);
    });

    it('should deep clone history results', () => {
      engine.record(makeEvent({ newValue: { key: 'value' } }));
      const history = engine.history();
      (history[0].newValue as any).key = 'modified';
      const fresh = engine.history();
      expect((fresh[0].newValue as any).key).toBe('value');
    });
  });

  describe('edge cases', () => {
    it('should handle record with null oldValue and newValue', () => {
      const event = engine.record(makeEvent({ oldValue: null, newValue: null }));
      expect(event.oldValue).toBeNull();
      expect(event.newValue).toBeNull();
    });

    it('should handle record with undefined oldValue', () => {
      const event = engine.record(makeEvent({ oldValue: undefined }));
      expect(event.oldValue).toBeUndefined();
    });

    it('should handle concurrent writes', () => {
      const promises = Array.from({ length: 100 }, (_, i) =>
        Promise.resolve(engine.record(makeEvent({ entityId: `wf-${i}` }))),
      );
      return Promise.all(promises).then((events) => {
        expect(events.length).toBe(100);
        expect(engine.history().length).toBe(100);
      });
    });

    it('should handle large dataset', () => {
      const large = new AuditLogEngine({ maxHistorySize: 1000, autoPrune: true });
      for (let i = 0; i < 500; i++) {
        large.record(makeEvent({
          module: ['workflow', 'scheduler', 'scanner'][i % 3] as AuditModule,
          action: ['CREATED', 'UPDATED', 'STARTED'][i % 3] as AuditAction,
          severity: ['INFO', 'WARNING', 'ERROR'][i % 3] as AuditSeverity,
          entityId: `entity-${i}`,
        }));
      }
      const stats = large.statistics();
      expect(stats.totalEvents).toBe(500);
      large.destroy();
    });

    it('should handle metadata with complex nested objects', () => {
      const metadata = { deep: { nested: { array: [1, 2, 3] } } };
      const event = engine.record(makeEvent({ metadata }));
      expect((event.metadata.deep as any).nested.array).toEqual([1, 2, 3]);
    });

    it('should handle all 12 actions', () => {
      const actions: AuditAction[] = ['CREATED', 'UPDATED', 'DELETED', 'STARTED', 'STOPPED', 'FAILED', 'COMPLETED', 'RETRIED', 'RESET', 'IMPORTED', 'EXPORTED', 'CUSTOM'];
      actions.forEach((action) => engine.record(makeEvent({ action })));
      const stats = engine.statistics();
      expect(Object.keys(stats.eventsByAction).length).toBe(12);
    });

    it('should handle all 4 severities', () => {
      const severities: AuditSeverity[] = ['INFO', 'WARNING', 'ERROR', 'CRITICAL'];
      severities.forEach((s) => engine.record(makeEvent({ severity: s })));
      const stats = engine.statistics();
      expect(Object.keys(stats.eventsBySeverity).length).toBe(4);
    });

    it('should handle all modules', () => {
      const modules: AuditModule[] = ['workflow', 'workflow_queue', 'scheduler', 'configuration', 'provider_health', 'performance_monitor', 'analysis_pipeline', 'scanner', 'optimizer', 'backtest', 'market_data', 'event_bus', 'system', 'other'];
      modules.forEach((m) => engine.record(makeEvent({ module: m })));
      const stats = engine.statistics();
      expect(Object.keys(stats.eventsByModule).length).toBe(14);
    });
  });

  describe('config defaults', () => {
    it('should use default config when none provided', () => {
      const defaultEngine = new AuditLogEngine();
      expect(defaultEngine).toBeDefined();
      defaultEngine.destroy();
    });

    it('should merge with default config', () => {
      const custom = new AuditLogEngine({ maxHistorySize: 500 });
      expect(custom).toBeDefined();
      custom.destroy();
    });
  });

  describe('destroy', () => {
    it('should clear cleanup timer', () => {
      const withTimer = new AuditLogEngine({ autoCleanupIntervalMs: 1000 });
      withTimer.destroy();
      expect((withTimer as any).cleanupTimer).toBeNull();
    });

    it('should be safe to call multiple times', () => {
      engine.destroy();
      engine.destroy();
    });
  });

  describe('performance metrics disabled', () => {
    it('should not track metrics when disabled', () => {
      const noMetrics = new AuditLogEngine({ enablePerformanceMetrics: false });
      noMetrics.record(makeEvent());
      noMetrics.history();
      const metrics = noMetrics.getPerformanceMetrics();
      expect(metrics.recordLatencyMs.length).toBe(0);
      expect(metrics.queryLatencyMs.length).toBe(0);
      noMetrics.destroy();
    });
  });

  describe('history ordering', () => {
    it('should return events in insertion order', () => {
      engine.record(makeEvent({ entityId: 'first' }));
      engine.record(makeEvent({ entityId: 'second' }));
      engine.record(makeEvent({ entityId: 'third' }));
      const events = engine.history();
      expect(events[0].entityId).toBe('first');
      expect(events[1].entityId).toBe('second');
      expect(events[2].entityId).toBe('third');
    });
  });

  describe('statistics after clear', () => {
    it('should return fresh stats after clear', () => {
      engine.record(makeEvent({ module: 'workflow', severity: 'ERROR' }));
      engine.clear();
      const stats = engine.statistics();
      expect(stats.totalEvents).toBe(0);
      expect(stats.eventsByModule).toEqual({});
      expect(stats.eventsBySeverity).toEqual({});
    });
  });

  describe('export count with filtered data', () => {
    it('should export all events not just recent', () => {
      for (let i = 0; i < 20; i++) engine.record(makeEvent({ entityId: `wf-${i}` }));
      const exported = engine.export();
      expect(exported.length).toBe(20);
    });
  });

  describe('user field', () => {
    it('should store null user', () => {
      const event = engine.record(makeEvent({ user: null }));
      expect(event.user).toBeNull();
    });

    it('should store string user', () => {
      const event = engine.record(makeEvent({ user: 'admin@bist.com' }));
      expect(event.user).toBe('admin@bist.com');
    });
  });

  describe('concurrent cleanup and record', () => {
    it('should handle interleaved operations', () => {
      engine.record(makeEvent({ entityId: '1' }));
      engine.cleanup();
      engine.record(makeEvent({ entityId: '2' }));
      engine.cleanup();
      expect(engine.history().length).toBe(2);
    });
  });
});
