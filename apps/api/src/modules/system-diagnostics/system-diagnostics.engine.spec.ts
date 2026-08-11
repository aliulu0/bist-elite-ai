import { SystemDiagnosticsEngine } from './system-diagnostics.engine';
import { DiagnosticCheck, DiagnosticModule } from './system-diagnostics.types';

function makeCheck(overrides?: Partial<DiagnosticCheck>): DiagnosticCheck {
  return {
    module: 'workflow',
    status: 'HEALTHY',
    message: 'OK',
    duration: 10,
    timestamp: Date.now(),
    details: {},
    ...overrides,
  };
}

describe('SystemDiagnosticsEngine', () => {
  let engine: SystemDiagnosticsEngine;

  beforeEach(() => {
    engine = new SystemDiagnosticsEngine({
      enabledModules: ['workflow', 'scheduler', 'memory', 'node_runtime'],
      maxHistorySize: 50,
      autoCleanupIntervalMs: 0,
    });
  });

  afterEach(() => {
    engine.destroy();
    engine.clear();
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('runModule', () => {
    it('should run a registered module', async () => {
      const check = await engine.runModuleAsync('workflow');
      expect(check.module).toBe('workflow');
      expect(check.status).toBe('HEALTHY');
      expect(check.message).toBe('Workflow module operational');
      expect(check.duration).toBeGreaterThanOrEqual(0);
    });

    it('should return UNHEALTHY for unregistered module', async () => {
      const small = new SystemDiagnosticsEngine({ enabledModules: ['workflow'], maxHistorySize: 10 });
      (small as any).checkHandlers.delete('workflow');
      const check = await small.runModuleAsync('workflow');
      expect(check.status).toBe('UNHEALTHY');
      expect(check.message).toContain('No handler');
      small.destroy();
    });

    it('should record duration', async () => {
      const check = await engine.runModuleAsync('workflow');
      expect(check.duration).toBeGreaterThanOrEqual(0);
      expect(check.timestamp).toBeGreaterThan(0);
    });

    it('should handle custom handler', async () => {
      engine.registerCheck('memory', () => ({
        module: 'memory',
        status: 'WARNING',
        message: 'Memory usage high',
        duration: 5,
        timestamp: Date.now(),
        details: { usagePercent: 85 },
      }));
      const check = await engine.runModuleAsync('memory');
      expect(check.status).toBe('WARNING');
      expect(check.message).toBe('Memory usage high');
    });

    it('should handle handler that throws', async () => {
      engine.registerCheck('cpu', () => { throw new Error('CPU check failed'); });
      const check = await engine.runModuleAsync('cpu');
      expect(check.status).toBe('UNHEALTHY');
      expect(check.message).toBe('CPU check failed');
    });

    it('should handle handler returning DEGRADED status', async () => {
      engine.registerCheck('heap', () => makeCheck({ module: 'heap', status: 'DEGRADED', message: 'Heap nearly full' }));
      const check = await engine.runModuleAsync('heap');
      expect(check.status).toBe('DEGRADED');
    });
  });

  describe('run', () => {
    it('should run all enabled modules', async () => {
      const result = await engine.run();
      expect(result.runId).toBeDefined();
      expect(result.runId.startsWith('diag-')).toBe(true);
      expect(result.checks.length).toBe(4);
      expect(result.summary).toBeDefined();
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeDefined();
    });

    it('should produce correct summary for all healthy', async () => {
      const result = await engine.run();
      expect(result.summary.overall).toBe('HEALTHY');
      expect(result.summary.healthyCount).toBe(4);
      expect(result.summary.warningCount).toBe(0);
      expect(result.summary.failedCount).toBe(0);
    });

    it('should produce WARNING summary when warnings exist', async () => {
      engine.registerCheck('workflow', () => makeCheck({ status: 'WARNING', message: 'Degraded' }));
      const result = await engine.run();
      expect(result.summary.overall).toBe('WARNING');
      expect(result.summary.warningCount).toBe(1);
      expect(result.summary.healthyCount).toBe(3);
    });

    it('should produce UNHEALTHY summary when failures exist', async () => {
      engine.registerCheck('scheduler', () => makeCheck({ module: 'scheduler', status: 'UNHEALTHY', message: 'Down' }));
      const result = await engine.run();
      expect(result.summary.overall).toBe('UNHEALTHY');
      expect(result.summary.failedCount).toBe(1);
    });

    it('should calculate average duration', async () => {
      const result = await engine.run();
      expect(result.summary.averageDuration).toBeGreaterThanOrEqual(0);
    });

    it('should store in history', async () => {
      await engine.run();
      const history = engine.getHistory();
      expect(history.length).toBe(1);
    });

    it('should emit diagnostics.started event', async () => {
      const published: string[] = [];
      const mockBus = { publish: jest.fn((type: string) => { published.push(type); }), subscribe: jest.fn(), once: jest.fn(), unsubscribe: jest.fn(), replay: jest.fn(), history: jest.fn(), stats: jest.fn(), getSnapshot: jest.fn(), getResult: jest.fn(), clear: jest.fn(), clearSubscribers: jest.fn() } as any;
      const busEngine = new SystemDiagnosticsEngine({ enabledModules: ['workflow'], maxHistorySize: 10 }, mockBus);
      await busEngine.run();
      expect(published).toContain('diagnostics.started');
      expect(published).toContain('diagnostics.completed');
      busEngine.destroy();
    });

    it('should emit diagnostics.completed event', async () => {
      const published: string[] = [];
      const mockBus = { publish: jest.fn((type: string) => { published.push(type); }), subscribe: jest.fn(), once: jest.fn(), unsubscribe: jest.fn(), replay: jest.fn(), history: jest.fn(), stats: jest.fn(), getSnapshot: jest.fn(), getResult: jest.fn(), clear: jest.fn(), clearSubscribers: jest.fn() } as any;
      const busEngine = new SystemDiagnosticsEngine({ enabledModules: ['workflow'], maxHistorySize: 10 }, mockBus);
      await busEngine.run();
      expect(published).toContain('diagnostics.completed');
      busEngine.destroy();
    });

    it('should record to audit log', async () => {
      const records: unknown[] = [];
      const mockAudit = { record: jest.fn((e: unknown) => { records.push(e); return {}; }) } as any;
      const auditEngine = new SystemDiagnosticsEngine({ enabledModules: ['workflow'], maxHistorySize: 10 }, undefined, mockAudit);
      await auditEngine.run();
      expect(records.length).toBe(1);
      auditEngine.destroy();
    });

    it('should handle audit log failure gracefully', async () => {
      const mockAudit = { record: jest.fn(() => { throw new Error('Audit failed'); }) } as any;
      const auditEngine = new SystemDiagnosticsEngine({ enabledModules: ['workflow'], maxHistorySize: 10 }, undefined, mockAudit);
      const result = await auditEngine.run();
      expect(result.checks.length).toBe(1);
      auditEngine.destroy();
    });
  });

  describe('runAll', () => {
    it('should run all enabled modules synchronously', () => {
      const checks = engine.runAll();
      expect(checks.length).toBe(4);
      expect(checks.every((c) => c.status === 'HEALTHY')).toBe(true);
    });

    it('should skip disabled modules', () => {
      const small = new SystemDiagnosticsEngine({ enabledModules: ['workflow'], maxHistorySize: 10 });
      const checks = small.runAll();
      expect(checks.length).toBe(1);
      small.destroy();
    });
  });

  describe('summary', () => {
    it('should return default summary when no runs', () => {
      const summary = engine.summary();
      expect(summary.overall).toBe('HEALTHY');
      expect(summary.healthyCount).toBe(0);
      expect(summary.warningCount).toBe(0);
      expect(summary.failedCount).toBe(0);
      expect(summary.averageDuration).toBe(0);
    });

    it('should return last run summary', async () => {
      engine.registerCheck('workflow', () => makeCheck({ status: 'WARNING' }));
      await engine.run();
      const summary = engine.summary();
      expect(summary.overall).toBe('WARNING');
      expect(summary.warningCount).toBe(1);
    });
  });

  describe('statistics', () => {
    it('should return zero stats when no runs', () => {
      const stats = engine.statistics();
      expect(stats.totalRuns).toBe(0);
      expect(stats.averageDurationMs).toBe(0);
      expect(stats.lastRunAt).toBeNull();
    });

    it('should track total runs', async () => {
      await engine.run();
      await engine.run();
      expect(engine.statistics().totalRuns).toBe(2);
    });

    it('should track runs by module', async () => {
      await engine.run();
      const stats = engine.statistics();
      expect(stats.runsByModule.workflow).toBe(1);
      expect(stats.runsByModule.scheduler).toBe(1);
    });

    it('should track runs by status', async () => {
      await engine.run();
      const stats = engine.statistics();
      expect(stats.runsByStatus.HEALTHY).toBe(1);
    });

    it('should track average duration', async () => {
      await engine.run();
      expect(engine.statistics().averageDurationMs).toBeGreaterThanOrEqual(0);
    });

    it('should track lastRunAt', async () => {
      await engine.run();
      expect(engine.statistics().lastRunAt).toBeGreaterThan(0);
    });
  });

  describe('getHistory', () => {
    it('should return empty when no runs', () => {
      expect(engine.getHistory()).toEqual([]);
    });

    it('should return deep clones', async () => {
      await engine.run();
      const history = engine.getHistory();
      history.length = 0;
      expect(engine.getHistory().length).toBe(1);
    });

    it('should store multiple runs', async () => {
      await engine.run();
      await engine.run();
      expect(engine.getHistory().length).toBe(2);
    });
  });

  describe('clear', () => {
    it('should clear history', async () => {
      await engine.run();
      engine.clear();
      expect(engine.getHistory()).toEqual([]);
    });

    it('should reset statistics', async () => {
      await engine.run();
      engine.clear();
      const stats = engine.statistics();
      expect(stats.totalRuns).toBe(0);
      expect(stats.lastRunAt).toBeNull();
    });

    it('should reset module counts', async () => {
      await engine.run();
      engine.clear();
      expect(engine.statistics().runsByModule).toEqual({});
    });
  });

  describe('autoCleanup', () => {
    it('should prune history when exceeding maxHistorySize', async () => {
      const small = new SystemDiagnosticsEngine({ enabledModules: ['workflow'], maxHistorySize: 3 });
      for (let i = 0; i < 6; i++) await small.run();
      expect(small.getHistory().length).toBe(3);
      small.destroy();
    });

    it('should keep newest runs when pruning', async () => {
      const small = new SystemDiagnosticsEngine({ enabledModules: ['workflow'], maxHistorySize: 2 });
      await small.run();
      await small.run();
      await small.run();
      const history = small.getHistory();
      expect(history.length).toBe(2);
      small.destroy();
    });
  });

  describe('registerCheck', () => {
    it('should override default handler', async () => {
      engine.registerCheck('workflow', () => makeCheck({ message: 'Custom handler' }));
      const check = await engine.runModuleAsync('workflow');
      expect(check.message).toBe('Custom handler');
    });

    it('should add new module handler', async () => {
      engine.registerCheck('cpu', () => makeCheck({ module: 'cpu', status: 'DEGRADED' }));
      const check = await engine.runModuleAsync('cpu');
      expect(check.status).toBe('DEGRADED');
    });
  });

  describe('default handlers', () => {
    it('should have handlers for all 15 modules', async () => {
      const allModules: DiagnosticModule[] = [
        'workflow', 'workflow_queue', 'scheduler', 'configuration', 'performance_monitor',
        'provider_health', 'event_bus', 'audit_log', 'market_scanner', 'analysis_pipeline',
        'historical_data', 'memory', 'cpu', 'heap', 'node_runtime',
      ];
      for (const mod of allModules) {
        const check = await engine.runModuleAsync(mod);
        expect(check.status).toBe('HEALTHY');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle run with no enabled modules', async () => {
      const empty = new SystemDiagnosticsEngine({ enabledModules: [], maxHistorySize: 10 });
      const result = await empty.run();
      expect(result.checks.length).toBe(0);
      expect(result.summary.overall).toBe('HEALTHY');
      expect(result.summary.healthyCount).toBe(0);
      empty.destroy();
    });

    it('should handle mixed statuses in summary', async () => {
      engine.registerCheck('workflow', () => makeCheck({ status: 'HEALTHY' }));
      engine.registerCheck('scheduler', () => makeCheck({ module: 'scheduler', status: 'WARNING' }));
      engine.registerCheck('memory', () => makeCheck({ module: 'memory', status: 'UNHEALTHY' }));
      engine.registerCheck('node_runtime', () => makeCheck({ module: 'node_runtime', status: 'DEGRADED' }));
      const result = await engine.run();
      expect(result.summary.overall).toBe('UNHEALTHY');
      expect(result.summary.healthyCount).toBe(1);
      expect(result.summary.warningCount).toBe(1);
      expect(result.summary.failedCount).toBe(2);
    });

    it('should handle destroy called multiple times', () => {
      engine.destroy();
      engine.destroy();
    });

    it('should handle handler with details', async () => {
      engine.registerCheck('memory', () => makeCheck({
        details: { usedMB: 512, totalMB: 1024, percentUsed: 50 },
      }));
      const check = await engine.runModuleAsync('memory');
      expect((check.details as any).percentUsed).toBe(50);
    });

    it('should handle handler returning empty message', async () => {
      engine.registerCheck('cpu', () => makeCheck({ message: '' }));
      const check = await engine.runModuleAsync('cpu');
      expect(check.message).toBe('');
    });

    it('should handle rapid consecutive runs', async () => {
      for (let i = 0; i < 10; i++) await engine.run();
      expect(engine.statistics().totalRuns).toBe(10);
      expect(engine.getHistory().length).toBe(10);
    });
  });

  describe('runModuleSync', () => {
    it('should run module synchronously', () => {
      const check = engine.runModule('workflow');
      expect(check.module).toBe('workflow');
      expect(check.status).toBe('HEALTHY');
    });

    it('should return UNHEALTHY for unregistered module', () => {
      (engine as any).checkHandlers.delete('workflow');
      const check = engine.runModule('workflow');
      expect(check.status).toBe('UNHEALTHY');
    });

    it('should handle handler that throws synchronously', () => {
      engine.registerCheck('cpu', () => { throw new Error('Sync error'); });
      const check = engine.runModule('cpu');
      expect(check.status).toBe('UNHEALTHY');
      expect(check.message).toBe('Sync error');
    });
  });

  describe('summary edge cases', () => {
    it('should show DEGRADED in failedCount', async () => {
      engine.registerCheck('workflow', () => makeCheck({ status: 'DEGRADED' }));
      const result = await engine.run();
      expect(result.summary.failedCount).toBe(1);
      expect(result.summary.overall).toBe('UNHEALTHY');
    });

    it('should track warning count correctly with multiple warnings', async () => {
      engine.registerCheck('workflow', () => makeCheck({ status: 'WARNING' }));
      engine.registerCheck('scheduler', () => makeCheck({ module: 'scheduler', status: 'WARNING' }));
      const result = await engine.run();
      expect(result.summary.warningCount).toBe(2);
      expect(result.summary.overall).toBe('WARNING');
    });
  });

  describe('statistics cumulative', () => {
    it('should accumulate statistics across multiple runs', async () => {
      await engine.run();
      await engine.run();
      await engine.run();
      const stats = engine.statistics();
      expect(stats.totalRuns).toBe(3);
      expect(Object.values(stats.runsByModule).every((v) => v === 3)).toBe(true);
    });

    it('should track multiple status types', async () => {
      engine.registerCheck('workflow', () => makeCheck({ status: 'WARNING' }));
      await engine.run();
      engine.registerCheck('workflow', () => makeCheck({ status: 'HEALTHY' }));
      await engine.run();
      const stats = engine.statistics();
      expect(stats.runsByStatus.WARNING).toBe(1);
      expect(stats.runsByStatus.HEALTHY).toBe(1);
    });
  });

  describe('history immutability', () => {
    it('should not be affected by external mutation', async () => {
      await engine.run();
      const history = engine.getHistory();
      history[0].checks = [];
      const fresh = engine.getHistory();
      expect(fresh[0].checks.length).toBeGreaterThan(0);
    });
  });

  describe('config', () => {
    it('should use default config', () => {
      const defaultEngine = new SystemDiagnosticsEngine();
      expect(defaultEngine).toBeDefined();
      defaultEngine.destroy();
    });

    it('should merge partial config', () => {
      const partial = new SystemDiagnosticsEngine({ maxHistorySize: 25 });
      expect(partial).toBeDefined();
      partial.destroy();
    });

    it('should respect enabledModules from config', () => {
      const specific = new SystemDiagnosticsEngine({ enabledModules: ['workflow'] });
      const checks = specific.runAll();
      expect(checks.length).toBe(1);
      specific.destroy();
    });
  });

  describe('runModuleAsync edge cases', () => {
    it('should handle async handler', async () => {
      engine.registerCheck('cpu', () => makeCheck({ module: 'cpu', status: 'HEALTHY', message: 'Async check' }));
      const check = await engine.runModuleAsync('cpu');
      expect(check.message).toBe('Async check');
    });

    it('should handle async handler returning non-HEALTHY', async () => {
      engine.registerCheck('heap', () => makeCheck({ module: 'heap', status: 'WARNING', message: 'High usage' }));
      const check = await engine.runModuleAsync('heap');
      expect(check.status).toBe('WARNING');
    });
  });

  describe('audit log integration', () => {
    it('should record UNHEALTHY as ERROR severity', async () => {
      const records: unknown[] = [];
      const mockAudit = { record: jest.fn((e: unknown) => { records.push(e); return {}; }) } as any;
      const auditEngine = new SystemDiagnosticsEngine({ enabledModules: ['workflow'], maxHistorySize: 10 }, undefined, mockAudit);
      auditEngine.registerCheck('workflow', () => makeCheck({ status: 'UNHEALTHY' }));
      await auditEngine.run();
      expect((records[0] as any).severity).toBe('ERROR');
      auditEngine.destroy();
    });

    it('should record HEALTHY as INFO severity', async () => {
      const records: unknown[] = [];
      const mockAudit = { record: jest.fn((e: unknown) => { records.push(e); return {}; }) } as any;
      const auditEngine = new SystemDiagnosticsEngine({ enabledModules: ['workflow'], maxHistorySize: 10 }, undefined, mockAudit);
      await auditEngine.run();
      expect((records[0] as any).severity).toBe('INFO');
      auditEngine.destroy();
    });
  });

  describe('event bus integration', () => {
    it('should emit correct event payload', async () => {
      const events: Array<{ type: string; payload: unknown }> = [];
      const mockBus = {
        publish: jest.fn((type: string, _cat: string, payload: unknown) => { events.push({ type, payload }); }),
        subscribe: jest.fn(), once: jest.fn(), unsubscribe: jest.fn(), replay: jest.fn(), history: jest.fn(), stats: jest.fn(), getSnapshot: jest.fn(), getResult: jest.fn(), clear: jest.fn(), clearSubscribers: jest.fn(),
      } as any;
      const busEngine = new SystemDiagnosticsEngine({ enabledModules: ['workflow'], maxHistorySize: 10 }, mockBus);
      await busEngine.run();
      const completedEvent = events.find((e) => e.type === 'diagnostics.completed');
      expect(completedEvent).toBeDefined();
      expect((completedEvent!.payload as any).overall).toBe('HEALTHY');
      busEngine.destroy();
    });

    it('should not throw when eventBus is unavailable', async () => {
      const noBusEngine = new SystemDiagnosticsEngine({ enabledModules: ['workflow'], maxHistorySize: 10 });
      const result = await noBusEngine.run();
      expect(result.checks.length).toBe(1);
      noBusEngine.destroy();
    });
  });

  describe('run details', () => {
    it('should capture handler details in check result', async () => {
      engine.registerCheck('memory', () => ({
        module: 'memory',
        status: 'WARNING',
        message: 'Memory at 78%',
        duration: 0,
        timestamp: 0,
        details: { usedMB: 780, totalMB: 1000, percentUsed: 78, gcPauseMs: 12 },
      }));
      const check = await engine.runModuleAsync('memory');
      expect(check.details.percentUsed).toBe(78);
      expect(check.details.gcPauseMs).toBe(12);
    });

    it('should include timestamp in check results', async () => {
      const before = Date.now();
      const check = await engine.runModuleAsync('workflow');
      const after = Date.now();
      expect(check.timestamp).toBeGreaterThanOrEqual(before);
      expect(check.timestamp).toBeLessThanOrEqual(after);
    });

    it('should include duration in check results', async () => {
      const check = await engine.runModuleAsync('workflow');
      expect(typeof check.duration).toBe('number');
      expect(check.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('multiple run cycles', () => {
    it('should maintain correct stats over many runs', async () => {
      for (let i = 0; i < 5; i++) await engine.run();
      const stats = engine.statistics();
      expect(stats.totalRuns).toBe(5);
      expect(stats.lastRunAt).toBeGreaterThan(0);
      expect(stats.averageDurationMs).toBeGreaterThanOrEqual(0);
    });

    it('should maintain correct history size', async () => {
      for (let i = 0; i < 5; i++) await engine.run();
      expect(engine.getHistory().length).toBe(5);
    });
  });

  describe('summary after clear', () => {
    it('should return default summary after clear', async () => {
      await engine.run();
      engine.clear();
      const summary = engine.summary();
      expect(summary.overall).toBe('HEALTHY');
      expect(summary.healthyCount).toBe(0);
    });
  });

  describe('runModule vs runModuleAsync', () => {
    it('should produce same result for sync and async', async () => {
      const syncCheck = engine.runModule('workflow');
      const asyncCheck = await engine.runModuleAsync('workflow');
      expect(syncCheck.status).toBe(asyncCheck.status);
      expect(syncCheck.module).toBe(asyncCheck.module);
    });
  });

  describe('summary after runAll', () => {
    it('should not update summary from runAll', () => {
      engine.registerCheck('workflow', () => makeCheck({ status: 'WARNING' }));
      engine.runAll();
      const summary = engine.summary();
      expect(summary.overall).toBe('HEALTHY');
    });
  });

  describe('history ordering', () => {
    it('should maintain chronological order', async () => {
      await engine.run();
      await engine.run();
      await engine.run();
      const history = engine.getHistory();
      expect(history[0].timestamp <= history[1].timestamp).toBe(true);
      expect(history[1].timestamp <= history[2].timestamp).toBe(true);
    });
  });

  describe('statistics with no enabled modules', () => {
    it('should have zero stats for empty engine', () => {
      const empty = new SystemDiagnosticsEngine({ enabledModules: [], maxHistorySize: 10 });
      const stats = empty.statistics();
      expect(stats.totalRuns).toBe(0);
      expect(Object.keys(stats.runsByModule).length).toBe(0);
      empty.destroy();
    });
  });

  describe('runResult structure', () => {
    it('should have ISO timestamp', async () => {
      const result = await engine.run();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it('should have valid runId format', async () => {
      const result = await engine.run();
      expect(result.runId.startsWith('diag-')).toBe(true);
    });
  });
});
