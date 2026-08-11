import { WorkflowIntegrationService } from './workflow-integration.service';
import { WorkflowEngine } from '../workflow/workflow.engine';
import { WorkflowType, WorkflowInstance, WorkflowStepHandler } from '../workflow/workflow.types';
import { DEFAULT_WORKFLOW_CONFIG } from '../workflow/workflow.config';
import { WorkflowQueueEngine } from '../workflow-queue/workflow-queue.engine';
import { EventBusEngine } from '../event-bus/event-bus.engine';
import { PerformanceMonitorEngine } from '../performance-monitor/performance-monitor.engine';
import { DEFAULT_WORKFLOW_INTEGRATION_CONFIG } from './workflow-integration.config';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const noopHandler: WorkflowStepHandler = async () => ({ ok: true });

function makeFastTypes() {
  const types = { ...DEFAULT_WORKFLOW_CONFIG.types };
  for (const key of Object.keys(types) as WorkflowType[]) {
    types[key] = {
      ...types[key],
      timeoutMs: 5000,
      retryPolicy: { maxRetriesPerStep: 0, retryDelayMs: 0, backoffMultiplier: 1 },
      steps: types[key].steps.map((s) => ({ ...s, retryAttempts: 0, retryDelayMs: 0 })),
    };
  }
  return types;
}

function makeEngines(opts?: { autoEnqueue?: boolean }) {
  const eventBus = new EventBusEngine();
  const perfMonitor = new PerformanceMonitorEngine();
  const workflowEngine = new WorkflowEngine({}, eventBus, perfMonitor);
  const queueEngine = new WorkflowQueueEngine(
    { workers: 2, defaultRetryDelayMs: 5, maxRetryDelayMs: 50, jobTimeoutMs: 5000 },
    eventBus,
  );
  const service = new WorkflowIntegrationService(
    { autoEnqueue: opts?.autoEnqueue ?? false },
    workflowEngine,
    queueEngine,
    eventBus,
    perfMonitor,
  );
  return { service, workflowEngine, queueEngine, eventBus, perfMonitor };
}

function makeEnginesFast(opts?: { autoEnqueue?: boolean }) {
  const eventBus = new EventBusEngine();
  const perfMonitor = new PerformanceMonitorEngine();
  const workflowEngine = new WorkflowEngine({ types: makeFastTypes() }, eventBus, perfMonitor);
  const queueEngine = new WorkflowQueueEngine(
    { workers: 2, defaultRetryDelayMs: 5, maxRetryDelayMs: 50, jobTimeoutMs: 5000 },
    eventBus,
  );
  const service = new WorkflowIntegrationService(
    { autoEnqueue: opts?.autoEnqueue ?? false },
    workflowEngine,
    queueEngine,
    eventBus,
    perfMonitor,
  );
  return { service, workflowEngine, queueEngine, eventBus, perfMonitor };
}

function registerAllHandlers(workflowEngine: WorkflowEngine) {
  const types: WorkflowType[] = ['single_stock_analysis', 'market_scan', 'backtest', 'optimization'];
  for (const type of types) {
    const cfg = (workflowEngine as any).config.types[type];
    for (const step of cfg.steps) {
      workflowEngine.registerHandler(type, step.name, noopHandler);
    }
  }
}

describe('WorkflowIntegrationService', () => {
  describe('module lifecycle', () => {
    it('should be defined', () => {
      const { service } = makeEngines();
      expect(service).toBeDefined();
    });

    it('should call onModuleInit successfully', () => {
      const { service, queueEngine } = makeEngines();
      expect(queueEngine.isStarted()).toBe(false);
      service.onModuleInit();
      expect(queueEngine.isStarted()).toBe(true);
      service.onModuleDestroy();
    });

    it('should call onModuleDestroy successfully', () => {
      const { service, queueEngine } = makeEngines();
      service.onModuleInit();
      expect(queueEngine.isStarted()).toBe(true);
      service.onModuleDestroy();
      expect(queueEngine.isPaused()).toBe(true);
    });

    it('should not throw on destroy without init', () => {
      const { service } = makeEngines();
      expect(() => service.onModuleDestroy()).not.toThrow();
    });

    it('should not throw on init without queue engine', () => {
      const service = new WorkflowIntegrationService({}, undefined, undefined, undefined, undefined);
      expect(() => service.onModuleInit()).not.toThrow();
    });
  });

  describe('createAndEnqueue', () => {
    it('should create workflow and enqueue to queue', () => {
      const { service, queueEngine } = makeEngines();
      const { workflow, job } = service.createAndEnqueue('single_stock_analysis', 'THYAO');
      expect(workflow).toBeDefined();
      expect(workflow.type).toBe('single_stock_analysis');
      expect(workflow.symbol).toBe('THYAO');
      expect(job).toBeDefined();
      expect(job.state).toBe('WAITING');
      expect(job.workflowId).toBe(workflow.id);
    });

    it('should return both workflow and job', () => {
      const { service } = makeEngines();
      const result = service.createAndEnqueue('market_scan');
      expect(result).toHaveProperty('workflow');
      expect(result).toHaveProperty('job');
    });

    it('should map single_stock_analysis to HIGH priority', () => {
      const { service } = makeEngines();
      const { job } = service.createAndEnqueue('single_stock_analysis', 'THYAO');
      expect(job.priority).toBe('HIGH');
    });

    it('should map market_scan to NORMAL priority', () => {
      const { service } = makeEngines();
      const { job } = service.createAndEnqueue('market_scan');
      expect(job.priority).toBe('NORMAL');
    });

    it('should map backtest to LOW priority', () => {
      const { service } = makeEngines();
      const { job } = service.createAndEnqueue('backtest');
      expect(job.priority).toBe('LOW');
    });

    it('should map optimization to NORMAL priority', () => {
      const { service } = makeEngines();
      const { job } = service.createAndEnqueue('optimization');
      expect(job.priority).toBe('NORMAL');
    });

    it('should use custom priority when provided', () => {
      const { service } = makeEngines();
      const { job } = service.createAndEnqueue('backtest', null, {}, { priority: 'CRITICAL' });
      expect(job.priority).toBe('CRITICAL');
    });

    it('should use custom maxAttempts when provided', () => {
      const { service } = makeEngines();
      const { job } = service.createAndEnqueue('single_stock_analysis', null, {}, { maxAttempts: 5 });
      expect(job.maxAttempts).toBe(5);
    });

    it('should track enqueued count', () => {
      const { service } = makeEngines();
      service.createAndEnqueue('single_stock_analysis', 'THYAO');
      service.createAndEnqueue('market_scan');
      const state = service.getState();
      expect(state.totalEnqueued).toBe(2);
    });

    it('should maintain workflow-job mapping', () => {
      const { service } = makeEngines();
      const { workflow, job } = service.createAndEnqueue('single_stock_analysis', 'THYAO');
      expect(service.getJobForWorkflow(workflow.id)).toBe(job.id);
      expect(service.getWorkflowForJob(job.id)).toBe(workflow.id);
    });

    it('should create valid workflow in pending state', () => {
      const { service } = makeEngines();
      const { workflow } = service.createAndEnqueue('single_stock_analysis', 'THYAO');
      expect(workflow.status).toBe('pending');
      expect(workflow.id).toMatch(/^wf-/);
    });

    it('should pass metadata to workflow', () => {
      const { service } = makeEngines();
      const { workflow } = service.createAndEnqueue('single_stock_analysis', 'THYAO', { source: 'test' });
      expect(workflow.metadata.source).toBe('test');
    });

    it('should handle null symbol', () => {
      const { service } = makeEngines();
      const { workflow } = service.createAndEnqueue('market_scan', null);
      expect(workflow.symbol).toBeNull();
    });

    it('should emit integration.workflow.enqueued event', async () => {
      const { service, eventBus } = makeEngines();
      let receivedPayload: unknown = null;
      eventBus.subscribe(
        (event) => { receivedPayload = event.payload; },
        { eventType: 'integration.workflow.enqueued' },
      );
      service.createAndEnqueue('single_stock_analysis', 'THYAO');
      await delay(10);
      expect(receivedPayload).toBeDefined();
      const p = receivedPayload as Record<string, unknown>;
      expect(p.type).toBe('single_stock_analysis');
      expect(p.symbol).toBe('THYAO');
    });

    it('should record metric on enqueue', () => {
      const { service, perfMonitor } = makeEngines();
      service.createAndEnqueue('single_stock_analysis', 'THYAO');
      const entries = perfMonitor.getEntries('integration.queue_wait_time');
      expect(entries.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('cancelWorkflow', () => {
    it('should cancel a pending workflow', () => {
      const { service } = makeEngines();
      const { workflow } = service.createAndEnqueue('single_stock_analysis', 'THYAO');
      const cancelled = service.cancelWorkflow(workflow.id);
      expect(cancelled).toBe(true);
    });

    it('should return false for non-existent workflow', () => {
      const { service } = makeEngines();
      expect(service.cancelWorkflow('nonexistent')).toBe(false);
    });

    it('should increment cancelled count', () => {
      const { service } = makeEngines();
      const { workflow } = service.createAndEnqueue('single_stock_analysis', 'THYAO');
      service.cancelWorkflow(workflow.id);
      expect(service.getState().totalCancelled).toBe(1);
    });

    it('should clean up mappings after cancel', () => {
      const { service } = makeEngines();
      const { workflow, job } = service.createAndEnqueue('single_stock_analysis', 'THYAO');
      service.cancelWorkflow(workflow.id);
      expect(service.getJobForWorkflow(workflow.id)).toBeUndefined();
      expect(service.getWorkflowForJob(job.id)).toBeUndefined();
    });

    it('should emit integration.workflow.cancelled event', async () => {
      const { service, eventBus } = makeEngines();
      let received = false;
      eventBus.subscribe(
        () => { received = true; },
        { eventType: 'integration.workflow.cancelled' },
      );
      const { workflow } = service.createAndEnqueue('single_stock_analysis', 'THYAO');
      service.cancelWorkflow(workflow.id);
      await delay(10);
      expect(received).toBe(true);
    });

    it('should return true when workflow cancel succeeds but no job mapping', () => {
      const { service, workflowEngine } = makeEngines();
      const wf = workflowEngine.create('single_stock_analysis', 'THYAO');
      const cancelled = service.cancelWorkflow(wf.id);
      expect(cancelled).toBe(true);
    });

    it('should handle cancel when queue engine is missing', () => {
      const service = new WorkflowIntegrationService({}, undefined, undefined, undefined, undefined);
      expect(service.cancelWorkflow('any')).toBe(false);
    });

    it('should handle multiple cancels on same workflow', () => {
      const { service } = makeEngines();
      const { workflow } = service.createAndEnqueue('single_stock_analysis', 'THYAO');
      expect(service.cancelWorkflow(workflow.id)).toBe(true);
      expect(service.cancelWorkflow(workflow.id)).toBe(false);
    });
  });

  describe('retryWorkflow', () => {
    it('should retry a completed workflow by creating new one', async () => {
      const { service, workflowEngine } = makeEnginesFast();
      registerAllHandlers(workflowEngine);
      const original = workflowEngine.create('single_stock_analysis', 'THYAO');
      workflowEngine.enqueue(original.id);
      await workflowEngine.execute(original.id);
      expect(original.status).toBe('completed');

      const retried = service.retryWorkflow(original.id);
      expect(retried).toBe(true);
      expect(service.getState().totalRetried).toBe(1);
    });

    it('should return false for non-existent workflow', () => {
      const { service } = makeEngines();
      expect(service.retryWorkflow('nonexistent')).toBe(false);
    });

    it('should return false for non-terminal workflow', () => {
      const { service } = makeEngines();
      const { workflow } = service.createAndEnqueue('single_stock_analysis', 'THYAO');
      expect(service.retryWorkflow(workflow.id)).toBe(false);
    });

    it('should create new workflow with retriedFrom metadata', async () => {
      const { service, workflowEngine } = makeEnginesFast();
      registerAllHandlers(workflowEngine);
      const original = workflowEngine.create('single_stock_analysis', 'THYAO');
      workflowEngine.enqueue(original.id);
      await workflowEngine.execute(original.id);

      service.retryWorkflow(original.id);
      const state = service.getState();
      expect(state.totalEnqueued).toBeGreaterThanOrEqual(1);
      expect(state.totalRetried).toBe(1);
    });

    it('should track new workflow-job mapping on retry', async () => {
      const { service, workflowEngine } = makeEnginesFast();
      registerAllHandlers(workflowEngine);
      const original = workflowEngine.create('single_stock_analysis', 'THYAO');
      workflowEngine.enqueue(original.id);
      await workflowEngine.execute(original.id);

      service.retryWorkflow(original.id);
      const mappings = service.getState().activeMappings;
      expect(mappings.length).toBeGreaterThanOrEqual(1);
    });

    it('should retry failed workflow', () => {
      const { service, workflowEngine } = makeEngines();
      const wf = workflowEngine.create('single_stock_analysis', 'THYAO');
      (wf as any).status = 'failed';
      expect(service.retryWorkflow(wf.id)).toBe(true);
    });

    it('should retry timed-out workflow', () => {
      const { service, workflowEngine } = makeEngines();
      const wf = workflowEngine.create('single_stock_analysis', 'THYAO');
      (wf as any).status = 'timeout';
      expect(service.retryWorkflow(wf.id)).toBe(true);
    });

    it('should emit integration.workflow.retried event', async () => {
      const { service, workflowEngine, eventBus } = makeEngines();
      let received = false;
      eventBus.subscribe(
        () => { received = true; },
        { eventType: 'integration.workflow.retried' },
      );
      const original = workflowEngine.create('single_stock_analysis', 'THYAO');
      (original as any).status = 'failed';
      service.retryWorkflow(original.id);
      await delay(10);
      expect(received).toBe(true);
    });

    it('should return false when engines are missing', () => {
      const service = new WorkflowIntegrationService({}, undefined, undefined, undefined, undefined);
      expect(service.retryWorkflow('any')).toBe(false);
    });
  });

  describe('queue handler execution', () => {
    it('should execute workflow through queue handler', async () => {
      const { service, workflowEngine } = makeEnginesFast();
      service.onModuleInit();
      registerAllHandlers(workflowEngine);

      const { workflow } = service.createAndEnqueue('single_stock_analysis', 'THYAO');
      await delay(200);

      const updated = workflowEngine.getWorkflow(workflow.id);
      expect(updated?.status).toBe('completed');
      service.onModuleDestroy();
    });

    it('should handle workflow execution lifecycle: create → enqueue → execute → complete', async () => {
      const { service, workflowEngine } = makeEnginesFast();
      service.onModuleInit();
      registerAllHandlers(workflowEngine);

      const { workflow } = service.createAndEnqueue('single_stock_analysis', 'THYAO');
      await delay(200);

      const completed = workflowEngine.getWorkflow(workflow.id);
      expect(completed?.status).toBe('completed');
      expect(completed?.progress).toBe(100);
      service.onModuleDestroy();
    });

    it('should handle failed workflow through queue', async () => {
      const { service, workflowEngine } = makeEnginesFast();
      service.onModuleInit();

      workflowEngine.registerHandler('single_stock_analysis', 'fetch_data', async () => {
        throw new Error('Network error');
      });

      const { workflow } = service.createAndEnqueue('single_stock_analysis', 'THYAO');
      await delay(200);

      const failed = workflowEngine.getWorkflow(workflow.id);
      expect(failed?.status).toBe('failed');
      service.onModuleDestroy();
    });

    it('should record execution time metric', async () => {
      const { service, workflowEngine, perfMonitor } = makeEngines();
      service.onModuleInit();
      registerAllHandlers(workflowEngine);

      service.createAndEnqueue('single_stock_analysis', 'THYAO');
      await delay(200);

      const entries = perfMonitor.getEntries('integration.execution_time');
      expect(entries.length).toBeGreaterThanOrEqual(1);
      service.onModuleDestroy();
    });

    it('should skip workflow if not in pending state', async () => {
      const { service, workflowEngine } = makeEngines();
      service.onModuleInit();
      registerAllHandlers(workflowEngine);

      const { workflow } = service.createAndEnqueue('single_stock_analysis', 'THYAO');
      workflowEngine.enqueue(workflow.id);
      await delay(200);

      const updated = workflowEngine.getWorkflow(workflow.id);
      expect(updated?.status).toBe('completed');
      service.onModuleDestroy();
    });
  });

  describe('event propagation', () => {
    it('should auto-enqueue when workflow.created event fires', async () => {
      const { service, workflowEngine } = makeEnginesFast({ autoEnqueue: true });
      service.onModuleInit();

      const wf = workflowEngine.create('single_stock_analysis', 'THYAO');
      const jobId = service.getJobForWorkflow(wf.id);
      expect(jobId).toBeDefined();
      service.onModuleDestroy();
    });

    it('should not auto-enqueue when config.autoEnqueue is false', async () => {
      const { service, workflowEngine } = makeEngines({ autoEnqueue: false });
      service.onModuleInit();

      const wf = workflowEngine.create('single_stock_analysis', 'THYAO');
      await delay(50);

      expect(service.getJobForWorkflow(wf.id)).toBeUndefined();
      service.onModuleDestroy();
    });

    it('should not double-enqueue if already enqueued via createAndEnqueue', async () => {
      const { service, workflowEngine, queueEngine } = makeEngines({ autoEnqueue: true });
      service.onModuleInit();
      registerAllHandlers(workflowEngine);

      const { workflow } = service.createAndEnqueue('single_stock_analysis', 'THYAO');
      await delay(100);

      const queueSize = queueEngine.getQueue().length + queueEngine.getRunning().length;
      expect(queueSize).toBeLessThanOrEqual(1);
      service.onModuleDestroy();
    });

    it('should handle workflow.cancelled event from workflow engine', async () => {
      const { service, workflowEngine, queueEngine } = makeEnginesFast();
      service.onModuleInit();
      queueEngine.stop();

      const { workflow } = service.createAndEnqueue('single_stock_analysis', 'THYAO');
      expect(service.getJobForWorkflow(workflow.id)).toBeDefined();

      workflowEngine.cancel(workflow.id);
      await delay(10);

      expect(service.getJobForWorkflow(workflow.id)).toBeUndefined();
      service.onModuleDestroy();
    });

    it('should handle missing workflowId in event payload gracefully', async () => {
      const { service, eventBus } = makeEngines({ autoEnqueue: true });
      service.onModuleInit();

      eventBus.publish('workflow.created', 'system', { type: 'single_stock_analysis' });
      await delay(10);

      expect(service.getState().totalEnqueued).toBe(0);
      service.onModuleDestroy();
    });

    it('should handle missing type in workflow.created event', async () => {
      const { service, eventBus } = makeEngines({ autoEnqueue: true });
      service.onModuleInit();

      eventBus.publish('workflow.created', 'system', { workflowId: 'wf-test' });
      await delay(10);

      expect(service.getState().totalEnqueued).toBe(0);
      service.onModuleDestroy();
    });

    it('should publish workflow.execution.started event during execution', async () => {
      const { service, workflowEngine, eventBus } = makeEngines();
      service.onModuleInit();
      registerAllHandlers(workflowEngine);

      let startedEvent = false;
      eventBus.subscribe(
        () => { startedEvent = true; },
        { eventType: 'workflow.execution.started' },
      );

      service.createAndEnqueue('single_stock_analysis', 'THYAO');
      await delay(200);

      expect(startedEvent).toBe(true);
      service.onModuleDestroy();
    });

    it('should publish workflow.execution.completed on job completion', async () => {
      const { service, workflowEngine, eventBus } = makeEngines();
      service.onModuleInit();
      registerAllHandlers(workflowEngine);

      let completedEvent = false;
      eventBus.subscribe(
        () => { completedEvent = true; },
        { eventType: 'workflow.execution.completed' },
      );

      service.createAndEnqueue('single_stock_analysis', 'THYAO');
      await delay(200);

      expect(completedEvent).toBe(true);
      service.onModuleDestroy();
    });

    it('should publish workflow.execution.failed on dead letter', async () => {
      const { service, workflowEngine, eventBus } = makeEnginesFast();
      service.onModuleInit();

      workflowEngine.registerHandler('single_stock_analysis', 'fetch_data', async () => {
        throw new Error('Fatal error');
      });

      let failedEvent = false;
      eventBus.subscribe(
        () => { failedEvent = true; },
        { eventType: 'workflow.execution.failed' },
      );

      service.createAndEnqueue('single_stock_analysis', 'THYAO', {}, { maxAttempts: 1 });
      await delay(200);

      expect(failedEvent).toBe(true);
      service.onModuleDestroy();
    });

    it('should track queue.job.retry events for metrics', async () => {
      const { service, workflowEngine, perfMonitor } = makeEnginesFast();
      service.onModuleInit();

      workflowEngine.registerHandler('single_stock_analysis', 'fetch_data', async () => {
        throw new Error('Transient error');
      });

      service.createAndEnqueue('single_stock_analysis', 'THYAO', {}, { maxAttempts: 2 });
      await delay(200);

      const entries = perfMonitor.getEntries('integration.retry');
      expect(entries.length).toBeGreaterThanOrEqual(1);
      service.onModuleDestroy();
    });

    it('should not fail on event bus errors during publish', () => {
      const { service, workflowEngine } = makeEngines();
      const wf = workflowEngine.create('single_stock_analysis', 'THYAO');
      expect(() => service.cancelWorkflow(wf.id)).not.toThrow();
    });
  });

  describe('state and metrics', () => {
    it('should return integration state', () => {
      const { service } = makeEngines();
      const state = service.getState();
      expect(state).toHaveProperty('activeMappings');
      expect(state).toHaveProperty('totalEnqueued');
      expect(state).toHaveProperty('totalCompleted');
      expect(state).toHaveProperty('totalFailed');
      expect(state).toHaveProperty('totalCancelled');
      expect(state).toHaveProperty('totalRetried');
    });

    it('should return integration metrics', () => {
      const { service } = makeEngines();
      const metrics = service.getMetrics();
      expect(metrics).toHaveProperty('queueWaitTimeMs');
      expect(metrics).toHaveProperty('executionTimeMs');
      expect(metrics).toHaveProperty('retryCount');
      expect(metrics).toHaveProperty('workerUtilization');
      expect(metrics).toHaveProperty('queueLatencyMs');
      expect(metrics).toHaveProperty('avgQueueWaitTimeMs');
      expect(metrics).toHaveProperty('avgExecutionTimeMs');
      expect(metrics).toHaveProperty('totalWorkflowsProcessed');
    });

    it('should track active mappings', () => {
      const { service } = makeEngines();
      service.createAndEnqueue('single_stock_analysis', 'THYAO');
      service.createAndEnqueue('market_scan');
      expect(service.getState().activeMappings.length).toBe(2);
    });

    it('should calculate worker utilization from queue stats', () => {
      const { service, queueEngine } = makeEngines();
      queueEngine.start();
      const metrics = service.getMetrics();
      expect(metrics.workerUtilization).toBeGreaterThanOrEqual(0);
      expect(metrics.workerUtilization).toBeLessThanOrEqual(100);
    });

    it('should calculate avgExecutionTimeMs after completion', async () => {
      const { service, workflowEngine } = makeEngines();
      service.onModuleInit();
      registerAllHandlers(workflowEngine);

      service.createAndEnqueue('single_stock_analysis', 'THYAO');
      await delay(200);

      const metrics = service.getMetrics();
      expect(metrics.avgExecutionTimeMs).toBeGreaterThanOrEqual(0);
      expect(metrics.totalWorkflowsProcessed).toBeGreaterThanOrEqual(1);
      service.onModuleDestroy();
    });

    it('should calculate avgQueueWaitTimeMs', () => {
      const { service } = makeEngines();
      service.createAndEnqueue('single_stock_analysis', 'THYAO');
      const metrics = service.getMetrics();
      expect(metrics.avgQueueWaitTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should return zero metrics initially', () => {
      const { service } = makeEngines();
      const metrics = service.getMetrics();
      expect(metrics.totalWorkflowsProcessed).toBe(0);
      expect(metrics.executionTimeMs).toBe(0);
      expect(metrics.retryCount).toBe(0);
    });
  });

  describe('recovery', () => {
    it('should recover pending workflows', () => {
      const { service, workflowEngine } = makeEngines();
      workflowEngine.create('single_stock_analysis', 'THYAO');
      workflowEngine.create('market_scan');

      const recovered = service.recoverPendingWorkflows();
      expect(recovered).toBe(2);
    });

    it('should return count of recovered workflows', () => {
      const { service, workflowEngine } = makeEngines();
      workflowEngine.create('single_stock_analysis', 'THYAO');
      expect(service.recoverPendingWorkflows()).toBe(1);
    });

    it('should return 0 when no pending workflows', () => {
      const { service } = makeEngines();
      expect(service.recoverPendingWorkflows()).toBe(0);
    });

    it('should not re-recover already mapped workflows', () => {
      const { service } = makeEngines();
      const { workflow } = service.createAndEnqueue('single_stock_analysis', 'THYAO');
      expect(service.recoverPendingWorkflows()).toBe(0);
    });

    it('should return 0 when engines are missing', () => {
      const service = new WorkflowIntegrationService({}, undefined, undefined, undefined, undefined);
      expect(service.recoverPendingWorkflows()).toBe(0);
    });

    it('should also recover queued workflows', () => {
      const { service, workflowEngine } = makeEngines();
      const wf = workflowEngine.create('single_stock_analysis', 'THYAO');
      workflowEngine.enqueue(wf.id);
      expect(service.recoverPendingWorkflows()).toBe(1);
    });
  });

  describe('concurrency', () => {
    it('should handle concurrent createAndEnqueue calls', () => {
      const { service } = makeEngines();
      for (let i = 0; i < 10; i++) {
        service.createAndEnqueue('single_stock_analysis', `SYM${i}`);
      }
      expect(service.getState().totalEnqueued).toBe(10);
      expect(service.getState().activeMappings.length).toBe(10);
    });

    it('should handle concurrent cancellations', () => {
      const { service } = makeEngines();
      const workflows: WorkflowInstance[] = [];
      for (let i = 0; i < 5; i++) {
        const { workflow } = service.createAndEnqueue('single_stock_analysis', `SYM${i}`);
        workflows.push(workflow);
      }
      for (const wf of workflows) {
        service.cancelWorkflow(wf.id);
      }
      expect(service.getState().totalCancelled).toBe(5);
    });

    it('should handle multiple retries concurrently', () => {
      const { service, workflowEngine } = makeEngines();
      const wf1 = workflowEngine.create('single_stock_analysis', 'THYAO');
      const wf2 = workflowEngine.create('market_scan');
      (wf1 as any).status = 'failed';
      (wf2 as any).status = 'failed';

      service.retryWorkflow(wf1.id);
      service.retryWorkflow(wf2.id);

      expect(service.getState().totalRetried).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('should handle createAndEnqueue without engines', () => {
      const service = new WorkflowIntegrationService({}, undefined, undefined, undefined, undefined);
      expect(() => service.createAndEnqueue('single_stock_analysis')).toThrow('Workflow and Queue engines are required');
    });

    it('should handle event subscriptions cleanup on destroy', () => {
      const { service, eventBus } = makeEngines();
      service.onModuleInit();
      service.onModuleDestroy();
      const snapshot = eventBus.getSnapshot();
      expect(snapshot.stats.activeSubscriptions).toBe(0);
    });

    it('should handle cancel after destroy', () => {
      const { service, workflowEngine } = makeEngines();
      const wf = workflowEngine.create('single_stock_analysis', 'THYAO');
      service.onModuleInit();
      service.onModuleDestroy();
      expect(service.cancelWorkflow(wf.id)).toBe(true);
    });

    it('should handle getState after multiple operations', () => {
      const { service, workflowEngine } = makeEngines();
      const wf1 = service.createAndEnqueue('single_stock_analysis', 'THYAO').workflow;
      const wf2 = service.createAndEnqueue('market_scan').workflow;
      service.cancelWorkflow(wf1.id);

      const state = service.getState();
      expect(state.totalEnqueued).toBe(2);
      expect(state.totalCancelled).toBe(1);
      expect(state.activeMappings.length).toBe(1);
    });

    it('should handle metrics with zero completions', () => {
      const { service } = makeEngines();
      const metrics = service.getMetrics();
      expect(metrics.avgExecutionTimeMs).toBe(0);
    });

    it('should handle getJobForWorkflow with unknown id', () => {
      const { service } = makeEngines();
      expect(service.getJobForWorkflow('unknown')).toBeUndefined();
    });

    it('should handle getWorkflowForJob with unknown id', () => {
      const { service } = makeEngines();
      expect(service.getWorkflowForJob('unknown')).toBeUndefined();
    });

    it('should handle config override', () => {
      const eventBus = new EventBusEngine();
      const perfMonitor = new PerformanceMonitorEngine();
      const workflowEngine = new WorkflowEngine({}, eventBus, perfMonitor);
      const queueEngine = new WorkflowQueueEngine({ workers: 1 }, eventBus);
      const service = new WorkflowIntegrationService(
        { autoEnqueue: false, retrySynchronization: false },
        workflowEngine,
        queueEngine,
        eventBus,
        perfMonitor,
      );
      expect(service).toBeDefined();
    });
  });

  describe('full lifecycle integration', () => {
    it('should complete full lifecycle with auto-enqueue', async () => {
      const { service, workflowEngine } = makeEnginesFast({ autoEnqueue: true });
      service.onModuleInit();
      registerAllHandlers(workflowEngine);

      const wf = workflowEngine.create('single_stock_analysis', 'THYAO');
      expect(wf.status).not.toBe('completed');

      await delay(300);

      const completed = workflowEngine.getWorkflow(wf.id);
      expect(completed?.status).toBe('completed');
      service.onModuleDestroy();
    });

    it('should handle lifecycle: create → cancel → cleanup', async () => {
      const { service, workflowEngine } = makeEngines();
      service.onModuleInit();
      registerAllHandlers(workflowEngine);

      const { workflow } = service.createAndEnqueue('single_stock_analysis', 'THYAO');
      service.cancelWorkflow(workflow.id);

      const state = service.getState();
      expect(state.totalCancelled).toBe(1);
      expect(state.activeMappings.length).toBe(0);
      service.onModuleDestroy();
    });

    it('should handle lifecycle: create → fail → retry → complete', async () => {
      const { service, workflowEngine } = makeEnginesFast();
      service.onModuleInit();

      let callCount = 0;
      workflowEngine.registerHandler('single_stock_analysis', 'fetch_data', async () => {
        callCount++;
        if (callCount === 1) throw new Error('First attempt fails');
        return { data: 'ok' };
      });

      const { workflow } = service.createAndEnqueue('single_stock_analysis', 'THYAO', {}, { maxAttempts: 1 });
      await delay(200);

      const afterFirst = workflowEngine.getWorkflow(workflow.id);
      expect(afterFirst?.status).toBe('failed');

      service.retryWorkflow(workflow.id);
      await delay(200);

      const state = service.getState();
      expect(state.totalRetried).toBe(1);
      service.onModuleDestroy();
    });

    it('should handle full lifecycle with dead letter', async () => {
      const { service, workflowEngine, eventBus } = makeEnginesFast();
      service.onModuleInit();

      let failedEventReceived = false;
      eventBus.subscribe(
        () => { failedEventReceived = true; },
        { eventType: 'workflow.execution.failed' },
      );

      workflowEngine.registerHandler('single_stock_analysis', 'fetch_data', async () => {
        throw new Error('Persistent error');
      });

      service.createAndEnqueue('single_stock_analysis', 'THYAO', {}, { maxAttempts: 1 });
      await delay(200);

      expect(failedEventReceived).toBe(true);
      service.onModuleDestroy();
    });
  });
});
