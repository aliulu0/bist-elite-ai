import { Injectable, OnModuleInit, OnModuleDestroy, Optional } from '@nestjs/common';
import { WorkflowIntegrationConfig, DEFAULT_WORKFLOW_INTEGRATION_CONFIG } from './workflow-integration.config';
import { WorkflowJobMapping, IntegrationState, IntegrationMetrics } from './workflow-integration.types';
import { WorkflowEngine } from '../workflow/workflow.engine';
import { WorkflowType, WorkflowInstance } from '../workflow/workflow.types';
import { WorkflowQueueEngine } from '../workflow-queue/workflow-queue.engine';
import { QueuePriority, QueueJob } from '../workflow-queue/workflow-queue.types';
import { EventBusEngine } from '../event-bus/event-bus.engine';
import { PerformanceMonitorEngine } from '../performance-monitor/performance-monitor.engine';

@Injectable()
export class WorkflowIntegrationService implements OnModuleInit, OnModuleDestroy {
  private readonly config: WorkflowIntegrationConfig;
  private readonly jobToWorkflow = new Map<string, string>();
  private readonly workflowToJob = new Map<string, string>();
  private readonly autoEnqueued = new Set<string>();
  private readonly subscriptions: string[] = [];
  private totalEnqueued = 0;
  private totalCompleted = 0;
  private totalFailed = 0;
  private totalCancelled = 0;
  private totalRetried = 0;
  private totalWaitTimeMs = 0;
  private totalExecutionTimeMs = 0;

  constructor(
    @Optional() config?: Partial<WorkflowIntegrationConfig>,
    @Optional() private readonly workflowEngine?: WorkflowEngine,
    @Optional() private readonly queueEngine?: WorkflowQueueEngine,
    @Optional() private readonly eventBus?: EventBusEngine,
    @Optional() private readonly performanceMonitor?: PerformanceMonitorEngine,
  ) {
    this.config = { ...DEFAULT_WORKFLOW_INTEGRATION_CONFIG, ...config };
  }

  onModuleInit(): void {
    this.registerQueueHandlers();
    this.subscribeToEvents();
    if (this.queueEngine) {
      this.queueEngine.start();
    }
  }

  onModuleDestroy(): void {
    this.unsubscribeAll();
    if (this.queueEngine) {
      this.queueEngine.stop();
    }
  }

  createAndEnqueue(
    type: WorkflowType,
    symbol: string | null = null,
    metadata: Record<string, unknown> = {},
    options?: { priority?: QueuePriority; maxAttempts?: number },
  ): { workflow: WorkflowInstance; job: QueueJob } {
    if (!this.workflowEngine || !this.queueEngine) {
      throw new Error('Workflow and Queue engines are required');
    }

    const workflow = this.workflowEngine.create(type, symbol, metadata);
    const priority = options?.priority ?? this.config.defaultPriorityMap[type];

    const job = this.queueEngine.enqueue(
      workflow.id,
      'workflow-execution',
      { workflowId: workflow.id, type, symbol },
      {
        priority,
        maxAttempts: options?.maxAttempts,
        metadata: { workflowId: workflow.id, workflowType: type },
      },
    );

    this.jobToWorkflow.set(job.id, workflow.id);
    this.workflowToJob.set(workflow.id, job.id);
    this.totalEnqueued++;

    this.emitEvent('integration.workflow.enqueued', {
      workflowId: workflow.id,
      jobId: job.id,
      type,
      symbol,
    });

    this.recordMetric('integration.queue_wait_time', 0, { workflowId: workflow.id, jobId: job.id });

    return { workflow, job };
  }

  cancelWorkflow(workflowId: string): boolean {
    if (!this.workflowEngine || !this.queueEngine) return false;

    const jobId = this.workflowToJob.get(workflowId);
    const workflowCancelled = this.workflowEngine.cancel(workflowId);

    if (jobId) {
      const jobCancelled = this.queueEngine.cancel(jobId);
      if (workflowCancelled || jobCancelled) {
        this.totalCancelled++;
        this.workflowToJob.delete(workflowId);
        this.jobToWorkflow.delete(jobId);
        this.emitEvent('integration.workflow.cancelled', { workflowId, jobId });
        return true;
      }
    }

    if (workflowCancelled) {
      this.totalCancelled++;
      this.workflowToJob.delete(workflowId);
      this.emitEvent('integration.workflow.cancelled', { workflowId });
      return true;
    }

    return false;
  }

  retryWorkflow(workflowId: string): boolean {
    if (!this.workflowEngine || !this.queueEngine) return false;

    const original = this.workflowEngine.getWorkflow(workflowId);
    if (!original) return false;

    if (!['completed', 'failed', 'timeout', 'cancelled'].includes(original.status)) {
      return false;
    }

    const newWorkflow = this.workflowEngine.create(original.type, original.symbol, {
      ...original.metadata,
      retriedFrom: original.id,
    });

    const priority = this.config.defaultPriorityMap[original.type];
    const job = this.queueEngine.enqueue(
      newWorkflow.id,
      'workflow-execution',
      { workflowId: newWorkflow.id, type: original.type, symbol: original.symbol },
      {
        priority,
        metadata: { workflowId: newWorkflow.id, workflowType: original.type, retriedFrom: workflowId },
      },
    );

    this.jobToWorkflow.set(job.id, newWorkflow.id);
    this.workflowToJob.set(newWorkflow.id, job.id);
    this.totalEnqueued++;
    this.totalRetried++;

    this.emitEvent('integration.workflow.retried', {
      originalWorkflowId: workflowId,
      newWorkflowId: newWorkflow.id,
      jobId: job.id,
    });

    return true;
  }

  getState(): IntegrationState {
    return {
      activeMappings: this.getActiveMappings(),
      totalEnqueued: this.totalEnqueued,
      totalCompleted: this.totalCompleted,
      totalFailed: this.totalFailed,
      totalCancelled: this.totalCancelled,
      totalRetried: this.totalRetried,
    };
  }

  getMetrics(): IntegrationMetrics {
    this.updateMetrics();
    return {
      queueWaitTimeMs: this.totalWaitTimeMs,
      executionTimeMs: this.totalExecutionTimeMs,
      retryCount: this.totalRetried,
      workerUtilization: this.calculateWorkerUtilization(),
      queueLatencyMs: this.queueEngine?.getStatistics().avgWaitTimeMs ?? 0,
      avgQueueWaitTimeMs: this.totalEnqueued > 0 ? this.totalWaitTimeMs / this.totalEnqueued : 0,
      avgExecutionTimeMs: this.totalCompleted > 0 ? this.totalExecutionTimeMs / this.totalCompleted : 0,
      totalWorkflowsProcessed: this.totalCompleted + this.totalFailed,
    };
  }

  recoverPendingWorkflows(): number {
    if (!this.workflowEngine || !this.queueEngine) return 0;

    const pending = this.workflowEngine.getWorkflows({ status: 'pending' });
    const queued = this.workflowEngine.getWorkflows({ status: 'queued' });
    const recoverable = [...pending, ...queued];

    let recovered = 0;
    for (const wf of recoverable) {
      if (this.workflowToJob.has(wf.id)) continue;

      const priority = this.config.defaultPriorityMap[wf.type];
      const job = this.queueEngine.enqueue(
        wf.id,
        'workflow-execution',
        { workflowId: wf.id, type: wf.type, symbol: wf.symbol },
        { priority, metadata: { workflowId: wf.id, recovered: true } },
      );

      this.jobToWorkflow.set(job.id, wf.id);
      this.workflowToJob.set(wf.id, job.id);
      this.totalEnqueued++;
      recovered++;
    }

    return recovered;
  }

  getJobForWorkflow(workflowId: string): string | undefined {
    return this.workflowToJob.get(workflowId);
  }

  getWorkflowForJob(jobId: string): string | undefined {
    return this.jobToWorkflow.get(jobId);
  }

  private registerQueueHandlers(): void {
    if (!this.queueEngine) return;

    this.queueEngine.registerHandler('workflow-execution', async (job) => {
      const payload = job.payload as Record<string, unknown>;
      const workflowId = payload?.workflowId as string;
      if (!workflowId) throw new Error(`No workflowId in job payload: ${job.id}`);

      const wf = this.workflowEngine?.getWorkflow(workflowId);
      if (!wf) throw new Error(`Workflow not found: ${workflowId}`);

      this.emitEvent('workflow.execution.started', { workflowId, jobId: job.id, type: wf.type });

      if (wf.status === 'pending') {
        this.workflowEngine!.enqueue(workflowId);
      }

      const startMs = Date.now();
      try {
        const result = await this.workflowEngine!.execute(workflowId);
        const durationMs = Date.now() - startMs;

        this.totalExecutionTimeMs += durationMs;
        this.recordMetric('integration.execution_time', durationMs, { workflowId, status: result.status });

        if (result.status === 'failed' || result.status === 'timeout') {
          throw new Error(`Workflow ${result.status}: ${result.id}`);
        }

        return { workflowId: result.id, status: result.status, steps: result.steps.length, durationMs };
      } catch (err) {
        const durationMs = Date.now() - startMs;
        this.totalExecutionTimeMs += durationMs;
        this.recordMetric('integration.execution_time', durationMs, { workflowId, status: 'failed' });
        throw err;
      }
    });
  }

  private subscribeToEvents(): void {
    if (!this.eventBus) return;

    this.subscriptions.push(
      this.eventBus.subscribe(
        (event) => {
          const payload = event.payload as Record<string, unknown>;
          const workflowId = payload?.workflowId as string;
          if (!workflowId || !this.config.autoEnqueue) return;
          if (this.workflowToJob.has(workflowId)) return;

          const type = payload?.type as WorkflowType;
          const symbol = payload?.symbol as string | null;
          if (!type) return;

          const priority = this.config.defaultPriorityMap[type];
          const job = this.queueEngine?.enqueue(
            workflowId,
            'workflow-execution',
            { workflowId, type, symbol },
            { priority, metadata: { workflowId, workflowType: type } },
          );

          if (job) {
            this.jobToWorkflow.set(job.id, workflowId);
            this.workflowToJob.set(workflowId, job.id);
            this.autoEnqueued.add(workflowId);
            this.totalEnqueued++;
          }
        },
        { eventType: 'workflow.created' },
      ),
    );

    this.subscriptions.push(
      this.eventBus.subscribe(
        (event) => {
          const payload = event.payload as Record<string, unknown>;
          const workflowId = payload?.workflowId as string;
          if (!workflowId) return;

          const jobId = this.workflowToJob.get(workflowId);
          if (jobId) {
            this.queueEngine?.cancel(jobId);
            this.workflowToJob.delete(workflowId);
            this.jobToWorkflow.delete(jobId);
            this.totalCancelled++;
          }
        },
        { eventType: 'workflow.cancelled' },
      ),
    );

    this.subscriptions.push(
      this.eventBus.subscribe(
        (event) => {
          const payload = event.payload as Record<string, unknown>;
          const jobId = payload?.jobId as string;
          const durationMs = (payload?.durationMs as number) ?? 0;
          const workflowId = this.jobToWorkflow.get(jobId);

          if (workflowId) {
            this.totalCompleted++;
            this.totalExecutionTimeMs += durationMs;
            this.workflowToJob.delete(workflowId);
            this.jobToWorkflow.delete(jobId);
          }

          this.emitEvent('workflow.execution.completed', { workflowId, jobId, durationMs });
          this.recordMetric('integration.queue_execution_time', durationMs, { workflowId, jobId });
        },
        { eventType: 'queue.job.completed' },
      ),
    );

    this.subscriptions.push(
      this.eventBus.subscribe(
        (event) => {
          const payload = event.payload as Record<string, unknown>;
          const jobId = payload?.jobId as string;
          const error = payload?.error as string;
          const workflowId = this.jobToWorkflow.get(jobId);

          if (workflowId) {
            this.totalFailed++;
            this.workflowToJob.delete(workflowId);
            this.jobToWorkflow.delete(jobId);
          }

          this.emitEvent('workflow.execution.failed', { workflowId, jobId, error, reason: 'dead_letter' });
          this.recordMetric('integration.workflow_failed', 1, { workflowId, jobId, error });
        },
        { eventType: 'queue.job.deadletter' },
      ),
    );

    this.subscriptions.push(
      this.eventBus.subscribe(
        (event) => {
          const payload = event.payload as Record<string, unknown>;
          const jobId = payload?.jobId as string;
          if (jobId) {
            this.recordMetric('integration.retry', 1, { jobId });
          }
        },
        { eventType: 'queue.job.retry' },
      ),
    );
  }

  private unsubscribeAll(): void {
    if (!this.eventBus) return;
    for (const subId of this.subscriptions) {
      this.eventBus.unsubscribe(subId);
    }
    this.subscriptions.length = 0;
  }

  private getActiveMappings(): WorkflowJobMapping[] {
    const mappings: WorkflowJobMapping[] = [];
    for (const [jobId, workflowId] of this.jobToWorkflow) {
      mappings.push({ workflowId, jobId, createdAt: new Date().toISOString() });
    }
    return mappings;
  }

  private calculateWorkerUtilization(): number {
    const stats = this.queueEngine?.getStatistics();
    if (!stats || stats.totalWorkers === 0) return 0;
    return (stats.activeWorkers / stats.totalWorkers) * 100;
  }

  private updateMetrics(): void {
    const _stats = this.queueEngine?.getStatistics();
  }

  private emitEvent(type: string, payload: unknown): void {
    if (!this.eventBus) return;
    try {
      this.eventBus.publish(type, 'system', payload, { source: 'workflow-integration' });
    } catch { /* event bus failure is non-fatal */ }
  }

  private recordMetric(name: string, value: number, metadata?: Record<string, unknown>): void {
    if (!this.performanceMonitor) return;
    try {
      this.performanceMonitor.record('pipeline', name, value, metadata);
    } catch { /* perf monitor failure is non-fatal */ }
  }
}
