import { WorkflowEngine } from './workflow.engine';
import { DEFAULT_WORKFLOW_CONFIG } from './workflow.config';
import { WorkflowType, WorkflowStepHandler, StepDefinition } from './workflow.types';
import { EventBusEngine } from '../event-bus/event-bus.engine';
import { PerformanceMonitorEngine } from '../performance-monitor/performance-monitor.engine';

function makeConfig() {
  const types = {
    single_stock_analysis: {
      steps: DEFAULT_WORKFLOW_CONFIG.types.single_stock_analysis.steps.map((s: StepDefinition) => ({ ...s, retryDelayMs: 0 })),
      timeoutMs: 5000,
      retryPolicy: { maxRetriesPerStep: 2, retryDelayMs: 0, backoffMultiplier: 1 },
    },
    market_scan: {
      steps: DEFAULT_WORKFLOW_CONFIG.types.market_scan.steps.map((s: StepDefinition) => ({ ...s, retryDelayMs: 0 })),
      timeoutMs: 5000,
      retryPolicy: { maxRetriesPerStep: 2, retryDelayMs: 0, backoffMultiplier: 1 },
    },
    backtest: {
      steps: DEFAULT_WORKFLOW_CONFIG.types.backtest.steps.map((s: StepDefinition) => ({ ...s, retryDelayMs: 0 })),
      timeoutMs: 5000,
      retryPolicy: { maxRetriesPerStep: 2, retryDelayMs: 0, backoffMultiplier: 1 },
    },
    optimization: {
      steps: DEFAULT_WORKFLOW_CONFIG.types.optimization.steps.map((s: StepDefinition) => ({ ...s, retryDelayMs: 0 })),
      timeoutMs: 5000,
      retryPolicy: { maxRetriesPerStep: 2, retryDelayMs: 0, backoffMultiplier: 1 },
    },
    full_pipeline: {
      steps: DEFAULT_WORKFLOW_CONFIG.types.full_pipeline.steps.map((s: StepDefinition) => ({ ...s, retryDelayMs: 0 })),
      timeoutMs: 10000,
      retryPolicy: { maxRetriesPerStep: 2, retryDelayMs: 0, backoffMultiplier: 1 },
    },
  };
  return {
    maxConcurrentWorkflows: 5,
    maxHistorySize: 50,
    enableEvents: true,
    enablePerformanceTracking: true,
    types,
  };
}

const ok: WorkflowStepHandler = () => ({ result: 'ok' });
const fail: WorkflowStepHandler = () => { throw new Error('step failed'); };
const asyncOk: WorkflowStepHandler = () => Promise.resolve({ result: 'async-ok' });
const asyncFail: WorkflowStepHandler = () => Promise.reject(new Error('async step failed'));

function allHandlers(type: WorkflowType): Record<string, WorkflowStepHandler> {
  const h: Record<string, WorkflowStepHandler> = {};
  for (const s of DEFAULT_WORKFLOW_CONFIG.types[type].steps) h[s.name] = ok;
  return h;
}

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine;

  beforeEach(() => { engine = new WorkflowEngine(makeConfig()); });
  afterEach(() => { engine.clearAll(); });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('create', () => {
    it('should create pending workflow for single_stock_analysis', () => {
      const wf = engine.create('single_stock_analysis', 'THYAO');
      expect(wf.id).toBeDefined();
      expect(wf.type).toBe('single_stock_analysis');
      expect(wf.status).toBe('pending');
      expect(wf.symbol).toBe('THYAO');
      expect(wf.steps.length).toBe(13);
      expect(wf.progress).toBe(0);
    });

    it('should create pending workflow for market_scan', () => {
      const wf = engine.create('market_scan');
      expect(wf.type).toBe('market_scan');
      expect(wf.steps.length).toBe(5);
      expect(wf.symbol).toBeNull();
    });

    it('should create pending workflow for backtest', () => {
      const wf = engine.create('backtest', 'GARAN');
      expect(wf.type).toBe('backtest');
      expect(wf.steps.length).toBe(5);
    });

    it('should create pending workflow for optimization', () => {
      const wf = engine.create('optimization', 'ASELS');
      expect(wf.type).toBe('optimization');
      expect(wf.steps.length).toBe(6);
    });

    it('should include metadata', () => {
      const wf = engine.create('single_stock_analysis', 'THYAO', { source: 'manual' });
      expect(wf.metadata).toEqual({ source: 'manual' });
    });

    it('should increment totalCreated', () => {
      engine.create('single_stock_analysis');
      engine.create('market_scan');
      expect(engine.getStats().totalCreated).toBe(2);
    });

    it('should initialize all steps as pending', () => {
      const wf = engine.create('single_stock_analysis');
      for (const step of wf.steps) {
        expect(step.status).toBe('pending');
        expect(step.durationMs).toBe(0);
        expect(step.attempt).toBe(0);
        expect(step.error).toBeNull();
      }
    });
  });

  describe('enqueue', () => {
    it('should enqueue a pending workflow', () => {
      const wf = engine.create('market_scan');
      expect(engine.enqueue(wf.id)).toBe(true);
      expect(engine.getWorkflow(wf.id)!.status).toBe('queued');
    });

    it('should return false for unknown id', () => {
      expect(engine.enqueue('nonexistent')).toBe(false);
    });

    it('should return false when maxConcurrentWorkflows exceeded', () => {
      const small = new WorkflowEngine(makeConfig());
      (small as any).config.maxConcurrentWorkflows = 0;
      const wf = small.create('market_scan');
      expect(small.enqueue(wf.id)).toBe(false);
      small.clearAll();
    });
  });

  describe('execute', () => {
    it('should execute all steps and complete', async () => {
      const wf = engine.create('market_scan');
      engine.enqueue(wf.id);
      const result = await engine.execute(wf.id, allHandlers('market_scan'));
      expect(result.status).toBe('completed');
      expect(result.progress).toBe(100);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.completedAt).toBeDefined();
      expect(result.currentStep).toBeNull();
    });

    it('should track step results', async () => {
      const wf = engine.create('market_scan');
      engine.enqueue(wf.id);
      const result = await engine.execute(wf.id, {
        fetch_market_data: () => ({ count: 100 }),
        normalize: ok,
        screen_candidates: ok,
        rank: ok,
        generate_opportunities: ok,
      });
      const step = result.steps.find((s) => s.step === 'fetch_market_data')!;
      expect(step.status).toBe('completed');
      expect(step.metadata).toEqual({ count: 100 });
      expect(step.durationMs).toBeGreaterThanOrEqual(0);
      expect(step.attempt).toBe(1);
    });

    it('should update progress during execution', async () => {
      const wf = engine.create('market_scan');
      engine.enqueue(wf.id);
      let mid = -1;
      const track: WorkflowStepHandler = (step, inst) => {
        if (step === 'screen_candidates') mid = inst.progress;
        return { ok: true };
      };
      await engine.execute(wf.id, { fetch_market_data: track, normalize: track, screen_candidates: track, rank: track, generate_opportunities: track });
      expect(mid).toBeGreaterThan(0);
      expect(mid).toBeLessThan(100);
    });

    it('should fail on required step failure', async () => {
      const wf = engine.create('market_scan');
      engine.enqueue(wf.id);
      const result = await engine.execute(wf.id, { fetch_market_data: fail, normalize: ok, screen_candidates: ok, rank: ok, generate_opportunities: ok });
      expect(result.status).toBe('failed');
      expect(result.steps[0].status).toBe('failed');
      expect(result.steps[0].error).toBe('step failed');
    });

    it('should fail after exhausting retries', async () => {
      const wf = engine.create('market_scan');
      engine.enqueue(wf.id);
      const result = await engine.execute(wf.id, { fetch_market_data: fail, normalize: ok, screen_candidates: ok, rank: ok, generate_opportunities: ok });
      expect(result.steps[0].attempt).toBeGreaterThan(1);
      expect(result.status).toBe('failed');
    });

    it('should skip optional step on failure', async () => {
      const wf = engine.create('single_stock_analysis', 'THYAO');
      engine.enqueue(wf.id);
      const handlers = allHandlers('single_stock_analysis');
      handlers['smart_money'] = fail;
      const result = await engine.execute(wf.id, handlers);
      expect(result.steps.find((s) => s.step === 'smart_money')!.status).toBe('skipped');
      expect(result.status).toBe('completed');
    });

    it('should skip optional step when no handler registered', async () => {
      const wf = engine.create('single_stock_analysis', 'THYAO');
      engine.enqueue(wf.id);
      const handlers = allHandlers('single_stock_analysis');
      delete handlers['smart_money'];
      delete handlers['financial_rules'];
      delete handlers['financial_score'];
      const result = await engine.execute(wf.id, handlers);
      expect(result.steps.find((s) => s.step === 'smart_money')!.status).toBe('skipped');
      expect(result.status).toBe('completed');
    });

    it('should fail when required step has no handler', async () => {
      const wf = engine.create('market_scan');
      engine.enqueue(wf.id);
      const result = await engine.execute(wf.id, {});
      expect(result.status).toBe('failed');
      expect(result.steps[0].error).toContain('No handler registered');
    });

    it('should throw for unknown workflow', async () => {
      await expect(engine.execute('nonexistent')).rejects.toThrow('Workflow not found');
    });

    it('should throw when executing non-queued workflow', async () => {
      const wf = engine.create('market_scan');
      await expect(engine.execute(wf.id)).rejects.toThrow('Cannot execute workflow in status');
    });

    it('should use registered handlers when none passed', async () => {
      const wf = engine.create('market_scan');
      engine.enqueue(wf.id);
      for (const s of DEFAULT_WORKFLOW_CONFIG.types.market_scan.steps) {
        engine.registerHandler('market_scan', s.name, ok);
      }
      const result = await engine.execute(wf.id);
      expect(result.status).toBe('completed');
    });

    it('should prefer passed handlers over registered', async () => {
      const wf = engine.create('market_scan');
      engine.enqueue(wf.id);
      engine.registerHandler('market_scan', 'fetch_market_data', fail);
      const result = await engine.execute(wf.id, allHandlers('market_scan'));
      expect(result.status).toBe('completed');
    });

    it('should retry with backoff on flaky handler', async () => {
      const wf = engine.create('market_scan');
      engine.enqueue(wf.id);
      let attempts = 0;
      const flaky: WorkflowStepHandler = () => { attempts++; if (attempts < 3) throw new Error('fail'); return { ok: true }; };
      const result = await engine.execute(wf.id, { fetch_market_data: flaky, normalize: ok, screen_candidates: ok, rank: ok, generate_opportunities: ok });
      expect(result.status).toBe('completed');
      expect(attempts).toBe(3);
    });

    it('should handle async handler failure', async () => {
      const wf = engine.create('market_scan');
      engine.enqueue(wf.id);
      const result = await engine.execute(wf.id, { fetch_market_data: asyncFail, normalize: ok, screen_candidates: ok, rank: ok, generate_opportunities: ok });
      expect(result.status).toBe('failed');
      expect(result.steps[0].error).toBe('async step failed');
    });

    it('should execute all 4 workflow types', async () => {
      const types: WorkflowType[] = ['single_stock_analysis', 'market_scan', 'backtest', 'optimization'];
      for (const type of types) {
        const wf = engine.create(type, 'TEST');
        engine.enqueue(wf.id);
        const result = await engine.execute(wf.id, allHandlers(type));
        expect(result.status).toBe('completed');
        expect(result.type).toBe(type);
        engine.clearAll();
      }
    });
  });

  describe('cancel', () => {
    it('should cancel a queued workflow', () => {
      const wf = engine.create('market_scan');
      engine.enqueue(wf.id);
      expect(engine.cancel(wf.id)).toBe(true);
      expect(engine.getWorkflow(wf.id)!.status).toBe('cancelled');
    });

    it('should return false for unknown id', () => {
      expect(engine.cancel('nonexistent')).toBe(false);
    });

    it('should return false for completed workflow', async () => {
      const wf = engine.create('market_scan');
      engine.enqueue(wf.id);
      await engine.execute(wf.id, allHandlers('market_scan'));
      expect(engine.cancel(wf.id)).toBe(false);
    });

    it('should return false for already cancelled', () => {
      const wf = engine.create('market_scan');
      engine.enqueue(wf.id);
      engine.cancel(wf.id);
      expect(engine.cancel(wf.id)).toBe(false);
    });

    it('should cancel a pending workflow', () => {
      const wf = engine.create('market_scan');
      expect(engine.cancel(wf.id)).toBe(true);
      expect(engine.getWorkflow(wf.id)!.status).toBe('cancelled');
    });
  });

  describe('timeout', () => {
    it('should timeout a running workflow', async () => {
      const timeoutEngine = new WorkflowEngine({
        ...makeConfig(),
        types: {
          ...makeConfig().types,
          market_scan: {
            steps: DEFAULT_WORKFLOW_CONFIG.types.market_scan.steps.map((s: StepDefinition) => ({ ...s, retryDelayMs: 0, retryAttempts: 0 })),
            timeoutMs: 1,
            retryPolicy: { maxRetriesPerStep: 0, retryDelayMs: 0, backoffMultiplier: 1 },
          },
        },
      });

      const wf = timeoutEngine.create('market_scan');
      timeoutEngine.enqueue(wf.id);

      let resolveStep: (v: Record<string, unknown>) => void;
      const stepPromise = new Promise<Record<string, unknown>>((r) => { resolveStep = r; });

      const slow: WorkflowStepHandler = () => stepPromise;

      const execPromise = timeoutEngine.execute(wf.id, { fetch_market_data: slow, normalize: ok, screen_candidates: ok, rank: ok, generate_opportunities: ok });

      await new Promise((r) => setTimeout(r, 50));

      expect(timeoutEngine.getWorkflow(wf.id)!.status).toBe('timeout');
      resolveStep!({ done: true });
      await execPromise;
      timeoutEngine.clearAll();
    });
  });

  describe('getWorkflow', () => {
    it('should return workflow by id', () => {
      const wf = engine.create('market_scan');
      expect(engine.getWorkflow(wf.id)).toBeDefined();
      expect(engine.getWorkflow(wf.id)!.id).toBe(wf.id);
    });

    it('should return undefined for unknown id', () => {
      expect(engine.getWorkflow('nonexistent')).toBeUndefined();
    });
  });

  describe('getWorkflows', () => {
    it('should return all workflows', () => {
      engine.create('market_scan');
      engine.create('backtest');
      expect(engine.getWorkflows().length).toBe(2);
    });

    it('should filter by status', () => {
      const wf1 = engine.create('market_scan');
      const wf2 = engine.create('backtest');
      engine.enqueue(wf1.id);
      expect(engine.getWorkflows({ status: 'queued' }).length).toBe(1);
      expect(engine.getWorkflows({ status: 'pending' }).length).toBe(1);
    });

    it('should filter by type', () => {
      engine.create('market_scan');
      engine.create('backtest');
      expect(engine.getWorkflows({ type: 'market_scan' }).length).toBe(1);
    });
  });

  describe('getHistory', () => {
    it('should return completed workflows', async () => {
      const wf = engine.create('market_scan');
      engine.enqueue(wf.id);
      await engine.execute(wf.id, allHandlers('market_scan'));
      expect(engine.getHistory().length).toBe(1);
      expect(engine.getHistory()[0].status).toBe('completed');
    });

    it('should filter by type', async () => {
      const wf1 = engine.create('market_scan');
      engine.enqueue(wf1.id);
      await engine.execute(wf1.id, allHandlers('market_scan'));
      const wf2 = engine.create('backtest');
      engine.enqueue(wf2.id);
      await engine.execute(wf2.id, allHandlers('backtest'));
      expect(engine.getHistory({ type: 'market_scan' }).length).toBe(1);
    });

    it('should filter by status', async () => {
      const wf = engine.create('market_scan');
      engine.enqueue(wf.id);
      await engine.execute(wf.id, allHandlers('market_scan'));
      expect(engine.getHistory({ status: 'completed' }).length).toBe(1);
      expect(engine.getHistory({ status: 'failed' }).length).toBe(0);
    });

    it('should respect limit', async () => {
      for (let i = 0; i < 5; i++) {
        const wf = engine.create('market_scan');
        engine.enqueue(wf.id);
        await engine.execute(wf.id, allHandlers('market_scan'));
      }
      expect(engine.getHistory().length).toBe(5);
      expect(engine.getHistory({ limit: 2 }).length).toBe(2);
    });
  });

  describe('getStats', () => {
    it('should return correct stats', async () => {
      const wf1 = engine.create('market_scan');
      engine.enqueue(wf1.id);
      await engine.execute(wf1.id, allHandlers('market_scan'));
      const wf2 = engine.create('market_scan');
      engine.enqueue(wf2.id);
      await engine.execute(wf2.id, { fetch_market_data: fail, normalize: ok, screen_candidates: ok, rank: ok, generate_opportunities: ok });

      const stats = engine.getStats();
      expect(stats.totalCreated).toBe(2);
      expect(stats.totalCompleted).toBe(1);
      expect(stats.totalFailed).toBe(1);
      expect(stats.byType.market_scan.created).toBe(2);
      expect(stats.byType.market_scan.completed).toBe(1);
      expect(stats.byType.market_scan.failed).toBe(1);
    });

    it('should track activeWorkflows', () => {
      engine.create('market_scan');
      engine.create('backtest');
      const stats = engine.getStats();
      expect(stats.activeWorkflows).toBe(2);
    });

    it('should track timeouts and cancellations', () => {
      const wf1 = engine.create('market_scan');
      engine.enqueue(wf1.id);
      engine.cancel(wf1.id);
      const stats = engine.getStats();
      expect(stats.totalCancelled).toBe(1);
    });
  });

  describe('getSnapshot', () => {
    it('should include active workflows and stats', async () => {
      const wf = engine.create('market_scan');
      engine.enqueue(wf.id);
      const snap = engine.getSnapshot();
      expect(snap.stats).toBeDefined();
      expect(snap.activeWorkflows.length).toBe(1);
      expect(snap.timestamp).toBeDefined();
    });
  });

  describe('getResult', () => {
    it('should include snapshot and metadata', () => {
      const result = engine.getResult();
      expect(result.snapshot).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.config).toBeDefined();
    });
  });

  describe('clearHistory', () => {
    it('should clear history only', async () => {
      const wf = engine.create('market_scan');
      engine.enqueue(wf.id);
      await engine.execute(wf.id, allHandlers('market_scan'));
      expect(engine.getHistory().length).toBe(1);
      engine.clearHistory();
      expect(engine.getHistory().length).toBe(0);
      expect(engine.getWorkflows().length).toBe(1);
    });
  });

  describe('clearAll', () => {
    it('should reset everything', async () => {
      const wf = engine.create('market_scan');
      engine.enqueue(wf.id);
      await engine.execute(wf.id, allHandlers('market_scan'));
      engine.clearAll();
      expect(engine.getWorkflows().length).toBe(0);
      expect(engine.getHistory().length).toBe(0);
      expect(engine.getStats().totalCreated).toBe(0);
    });
  });

  describe('EventBus integration', () => {
    it('should publish events when eventBus provided', async () => {
      const eventBus = new EventBusEngine({ enableHistory: true, maxHistorySize: 1000, enableStats: true, maxSubscribersPerEvent: 100, categories: ['system', 'scheduler', 'scanner', 'analysis', 'opportunity', 'elite_score', 'provider', 'performance', 'backtest'] });
      const eng = new WorkflowEngine(makeConfig(), eventBus);
      const wf = eng.create('market_scan');
      eng.enqueue(wf.id);
      await eng.execute(wf.id, allHandlers('market_scan'));
      const events = eventBus.history({ type: 'workflow.completed' });
      expect(events.length).toBe(1);
      eng.clearAll();
      eventBus.clear();
      eventBus.clearSubscribers();
    });

    it('should not throw when eventBus publish fails', async () => {
      const badBus = { publish: () => { throw new Error('bus down'); } } as any;
      const eng = new WorkflowEngine(makeConfig(), badBus);
      const wf = eng.create('market_scan');
      eng.enqueue(wf.id);
      const result = await eng.execute(wf.id, allHandlers('market_scan'));
      expect(result.status).toBe('completed');
      eng.clearAll();
    });
  });

  describe('PerformanceMonitor integration', () => {
    it('should record metrics when performanceMonitor provided', async () => {
      const perfMon = new PerformanceMonitorEngine({ maxEntriesPerName: 1000, retentionWindowMs: 60000, healthThresholds: { responseTimeP95WarningMs: 500, responseTimeP95CriticalMs: 2000, cacheHitRateWarningPercent: 70, cacheHitRateCriticalPercent: 50, memoryUsageWarningBytes: 50 * 1024 * 1024, memoryUsageCriticalBytes: 100 * 1024 * 1024 }, categories: ['pipeline'] });
      const eng = new WorkflowEngine(makeConfig(), undefined, perfMon);
      const wf = eng.create('market_scan');
      eng.enqueue(wf.id);
      await eng.execute(wf.id, allHandlers('market_scan'));
      const entries = perfMon.getAllEntries();
      expect(entries.length).toBeGreaterThan(0);
      eng.clearAll();
      perfMon.clearMetrics();
    });

    it('should not throw when performanceMonitor fails', async () => {
      const badPerf = { record: () => { throw new Error('perf down'); } } as any;
      const eng = new WorkflowEngine(makeConfig(), undefined, badPerf);
      const wf = eng.create('market_scan');
      eng.enqueue(wf.id);
      const result = await eng.execute(wf.id, allHandlers('market_scan'));
      expect(result.status).toBe('completed');
      eng.clearAll();
    });
  });

  describe('cancel during execution', () => {
    it('should detect cancellation at start of step loop', async () => {
      const eng = new WorkflowEngine(makeConfig());
      const wf = eng.create('market_scan');
      eng.enqueue(wf.id);

      let cancelCalled = false;
      const slowStep: WorkflowStepHandler = (step) => {
        if (step === 'fetch_market_data' && !cancelCalled) {
          cancelCalled = true;
          eng.cancel(wf.id);
        }
        return { ok: true };
      };

      const result = await eng.execute(wf.id, { fetch_market_data: slowStep, normalize: ok, screen_candidates: ok, rank: ok, generate_opportunities: ok });
      expect(result.status).toBe('cancelled');
      eng.clearAll();
    });

    it('should detect cancellation after step completes', async () => {
      const eng = new WorkflowEngine(makeConfig());
      const wf = eng.create('market_scan');
      eng.enqueue(wf.id);

      let stepCount = 0;
      const cancelAfterStep: WorkflowStepHandler = (step) => {
        stepCount++;
        if (step === 'normalize') {
          eng.cancel(wf.id);
        }
        return { ok: true };
      };

      const result = await eng.execute(wf.id, { fetch_market_data: cancelAfterStep, normalize: cancelAfterStep, screen_candidates: ok, rank: ok, generate_opportunities: ok });
      expect(result.status).toBe('cancelled');
      eng.clearAll();
    });
  });

  describe('clearAll with active timeouts', () => {
    it('should clear active timeouts', () => {
      const eng = new WorkflowEngine(makeConfig());
      const wf = eng.create('market_scan');
      eng.enqueue(wf.id);
      eng.execute(wf.id, { fetch_market_data: () => new Promise(() => {}), normalize: ok, screen_candidates: ok, rank: ok, generate_opportunities: ok });
      eng.clearAll();
      expect(eng.getWorkflows().length).toBe(0);
    });
  });

  describe('history overflow', () => {
    it('should trim history when exceeding maxHistorySize', async () => {
      const eng = new WorkflowEngine(makeConfig());
      for (let i = 0; i < 55; i++) {
        const wf = eng.create('market_scan');
        eng.enqueue(wf.id);
        await eng.execute(wf.id, allHandlers('market_scan'));
      }
      expect(eng.getHistory().length).toBe(50);
      eng.clearAll();
    });
  });

  describe('handler returning void', () => {
    it('should handle handler that returns undefined', async () => {
      const wf = engine.create('market_scan');
      engine.enqueue(wf.id);
      const voidHandler: WorkflowStepHandler = () => undefined as any;
      const result = await engine.execute(wf.id, { fetch_market_data: voidHandler, normalize: voidHandler, screen_candidates: voidHandler, rank: voidHandler, generate_opportunities: voidHandler });
      expect(result.status).toBe('completed');
    });
  });
});
