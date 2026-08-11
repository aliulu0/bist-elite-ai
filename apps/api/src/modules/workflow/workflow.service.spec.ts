import { WorkflowService } from './workflow.service';
import { WorkflowEngine } from './workflow.engine';
import { WorkflowType, WorkflowInstance } from './workflow.types';

function makeNoRetryConfig() {
  return {
    types: {
      single_stock_analysis: {
        steps: [
          { name: 'fetch_data', order: 1, timeoutMs: 300000, retryAttempts: 0, retryDelayMs: 0, optional: false },
          { name: 'process', order: 2, timeoutMs: 300000, retryAttempts: 0, retryDelayMs: 0, optional: false },
        ],
        timeoutMs: 600000,
        retryPolicy: { maxRetriesPerStep: 0, retryDelayMs: 0, backoffMultiplier: 1 },
      },
      market_scan: {
        steps: [
          { name: 'scan', order: 1, timeoutMs: 300000, retryAttempts: 0, retryDelayMs: 0, optional: false },
        ],
        timeoutMs: 600000,
        retryPolicy: { maxRetriesPerStep: 0, retryDelayMs: 0, backoffMultiplier: 1 },
      },
      backtest: {
        steps: [
          { name: 'backtest', order: 1, timeoutMs: 300000, retryAttempts: 0, retryDelayMs: 0, optional: false },
        ],
        timeoutMs: 600000,
        retryPolicy: { maxRetriesPerStep: 0, retryDelayMs: 0, backoffMultiplier: 1 },
      },
      optimization: {
        steps: [
          { name: 'optimize', order: 1, timeoutMs: 300000, retryAttempts: 0, retryDelayMs: 0, optional: false },
        ],
        timeoutMs: 600000,
        retryPolicy: { maxRetriesPerStep: 0, retryDelayMs: 0, backoffMultiplier: 1 },
      },
      full_pipeline: {
        steps: [
          { name: 'fetch_market_data', order: 1, timeoutMs: 300000, retryAttempts: 0, retryDelayMs: 0, optional: false },
          { name: 'process', order: 2, timeoutMs: 300000, retryAttempts: 0, retryDelayMs: 0, optional: false },
        ],
        timeoutMs: 600000,
        retryPolicy: { maxRetriesPerStep: 0, retryDelayMs: 0, backoffMultiplier: 1 },
      },
    },
    maxConcurrentWorkflows: 5,
    maxHistorySize: 200,
    enableEvents: false,
    enablePerformanceTracking: false,
  };
}

const noopHandler = () => ({ ok: true });

describe('WorkflowService', () => {
  let service: WorkflowService;
  let engine: WorkflowEngine;

  beforeEach(() => {
    engine = new WorkflowEngine(makeNoRetryConfig());
    service = new WorkflowService(engine);
  });

  afterEach(() => {
    engine.clearAll();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createWorkflow', () => {
    it('should create a workflow', () => {
      const wf = service.createWorkflow('single_stock_analysis', 'THYAO');
      expect(wf.id).toBeDefined();
      expect(wf.type).toBe('single_stock_analysis');
      expect(wf.symbol).toBe('THYAO');
      expect(wf.status).toBe('pending');
    });

    it('should create workflow without symbol', () => {
      const wf = service.createWorkflow('market_scan');
      expect(wf.symbol).toBeNull();
      expect(wf.type).toBe('market_scan');
    });

    it('should create workflow with metadata', () => {
      const wf = service.createWorkflow('backtest', undefined, { source: 'manual' });
      expect(wf.metadata).toEqual({ source: 'manual' });
    });
  });

  describe('startWorkflow', () => {
    it('should start a pending workflow', async () => {
      engine.registerHandler('market_scan', 'scan', noopHandler);
      const wf = service.createWorkflow('market_scan');
      const result = await service.startWorkflow(wf.id);
      expect(result.status).toBe('completed');
    });

    it('should throw for non-existent workflow', async () => {
      await expect(service.startWorkflow('nonexistent')).rejects.toThrow('Workflow not found');
    });

    it('should enqueue pending workflow before executing', async () => {
      engine.registerHandler('market_scan', 'scan', noopHandler);
      const wf = service.createWorkflow('market_scan');
      const result = await service.startWorkflow(wf.id);
      expect(result.status).toBe('completed');
    });
  });

  describe('cancelWorkflow', () => {
    it('should cancel a pending workflow', () => {
      const wf = service.createWorkflow('market_scan');
      const cancelled = service.cancelWorkflow(wf.id);
      expect(cancelled).toBe(true);
      expect(wf.status).toBe('cancelled');
    });

    it('should return false for non-existent workflow', () => {
      expect(service.cancelWorkflow('nonexistent')).toBe(false);
    });

    it('should return false for already completed workflow', async () => {
      engine.registerHandler('market_scan', 'scan', noopHandler);
      const wf = service.createWorkflow('market_scan');
      await service.startWorkflow(wf.id);
      expect(service.cancelWorkflow(wf.id)).toBe(false);
    });
  });

  describe('retryWorkflow', () => {
    it('should retry a completed workflow', async () => {
      engine.registerHandler('market_scan', 'scan', noopHandler);
      const wf = service.createWorkflow('market_scan');
      await service.startWorkflow(wf.id);
      expect(wf.status).toBe('completed');

      engine.registerHandler('market_scan', 'scan', noopHandler);
      const retried = await service.retryWorkflow(wf.id);
      expect(retried.id).not.toBe(wf.id);
      expect(retried.type).toBe('market_scan');
      expect(retried.status).toBe('completed');
      expect(retried.metadata.retriedFrom).toBe(wf.id);
    });

    it('should throw for non-existent workflow', async () => {
      await expect(service.retryWorkflow('nonexistent')).rejects.toThrow('Workflow not found');
    });

    it('should throw for running workflow', async () => {
      const slowHandler = () => new Promise<{ ok: boolean }>((resolve) => setTimeout(() => resolve({ ok: true }), 50));
      engine.registerHandler('market_scan', 'scan', slowHandler);

      const wf = service.createWorkflow('market_scan');
      const startPromise = service.startWorkflow(wf.id);

      await new Promise((r) => setTimeout(r, 10));
      await expect(service.retryWorkflow(wf.id)).rejects.toThrow('Cannot retry workflow in status');
      await startPromise;
    });
  });

  describe('getWorkflow', () => {
    it('should return workflow by id', () => {
      const wf = service.createWorkflow('single_stock_analysis', 'THYAO');
      const found = service.getWorkflow(wf.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(wf.id);
    });

    it('should return undefined for non-existent id', () => {
      expect(service.getWorkflow('nonexistent')).toBeUndefined();
    });
  });

  describe('listWorkflows', () => {
    it('should list all workflows', () => {
      service.createWorkflow('market_scan');
      service.createWorkflow('backtest');
      const list = service.listWorkflows();
      expect(list.length).toBe(2);
    });

    it('should filter by status', () => {
      const wf1 = service.createWorkflow('market_scan');
      const wf2 = service.createWorkflow('backtest');
      engine.cancel(wf1.id);
      const pending = service.listWorkflows({ status: 'pending' });
      expect(pending.length).toBe(1);
      expect(pending[0].id).toBe(wf2.id);
    });

    it('should filter by type', () => {
      service.createWorkflow('market_scan');
      service.createWorkflow('backtest');
      const scans = service.listWorkflows({ type: 'market_scan' });
      expect(scans.length).toBe(1);
    });

    it('should return empty when no workflows', () => {
      expect(service.listWorkflows()).toEqual([]);
    });
  });

  describe('getActiveWorkflows', () => {
    it('should return empty when no workflows', () => {
      expect(service.getActiveWorkflows()).toEqual([]);
    });

    it('should return pending workflows', () => {
      service.createWorkflow('market_scan');
      const active = service.getActiveWorkflows();
      expect(active.length).toBe(1);
    });

    it('should not return cancelled workflows', () => {
      const wf = service.createWorkflow('market_scan');
      engine.cancel(wf.id);
      expect(service.getActiveWorkflows()).toEqual([]);
    });
  });

  describe('getHistory', () => {
    it('should return empty history initially', () => {
      expect(service.getHistory()).toEqual([]);
    });

    it('should return history after completion', async () => {
      engine.registerHandler('market_scan', 'scan', noopHandler);
      const wf = service.createWorkflow('market_scan');
      await service.startWorkflow(wf.id);
      const history = service.getHistory();
      expect(history.length).toBe(1);
    });

    it('should filter by type', async () => {
      engine.registerHandler('market_scan', 'scan', noopHandler);
      engine.registerHandler('backtest', 'backtest', noopHandler);

      const wf1 = service.createWorkflow('market_scan');
      const wf2 = service.createWorkflow('backtest');
      await service.startWorkflow(wf1.id);
      await service.startWorkflow(wf2.id);

      const scans = service.getHistory({ type: 'market_scan' });
      expect(scans.length).toBe(1);
      expect(scans[0].type).toBe('market_scan');
    });

    it('should respect limit', async () => {
      engine.registerHandler('market_scan', 'scan', noopHandler);

      for (let i = 0; i < 5; i++) {
        const wf = service.createWorkflow('market_scan');
        await service.startWorkflow(wf.id);
      }

      const limited = service.getHistory({ limit: 2 });
      expect(limited.length).toBe(2);
    });
  });

  describe('getStatistics', () => {
    it('should return zero stats initially', () => {
      const stats = service.getStatistics();
      expect(stats.totalCreated).toBe(0);
      expect(stats.totalCompleted).toBe(0);
      expect(stats.totalFailed).toBe(0);
      expect(stats.activeWorkflows).toBe(0);
    });

    it('should track completed workflows', async () => {
      engine.registerHandler('market_scan', 'scan', noopHandler);
      const wf = service.createWorkflow('market_scan');
      await service.startWorkflow(wf.id);
      const stats = service.getStatistics();
      expect(stats.totalCreated).toBe(1);
      expect(stats.totalCompleted).toBe(1);
    });

    it('should track cancelled workflows', () => {
      const wf = service.createWorkflow('market_scan');
      engine.cancel(wf.id);
      const stats = service.getStatistics();
      expect(stats.totalCancelled).toBe(1);
    });
  });
});
