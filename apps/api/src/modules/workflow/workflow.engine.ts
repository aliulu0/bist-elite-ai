import { Injectable, Optional } from '@nestjs/common';
import {
  WorkflowType,
  WorkflowStatus,
  WorkflowInstance,
  WorkflowStepHandler,
  WorkflowStats,
  WorkflowSnapshot,
  WorkflowResult,
  StepResult,
} from './workflow.types';
import { WorkflowConfig, DEFAULT_WORKFLOW_CONFIG } from './workflow.config';
import { EventBusEngine } from '../event-bus/event-bus.engine';
import { PerformanceMonitorEngine } from '../performance-monitor/performance-monitor.engine';

let nextWorkflowId = 0;

const VALID_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  pending: ['queued', 'cancelled'],
  queued: ['running', 'cancelled'],
  running: ['completed', 'failed', 'timeout', 'cancelled'],
  completed: [],
  failed: [],
  timeout: [],
  cancelled: [],
};

@Injectable()
export class WorkflowEngine {
  private readonly config: WorkflowConfig;
  private readonly workflows = new Map<string, WorkflowInstance>();
  private readonly history: WorkflowInstance[] = [];
  private readonly handlers = new Map<string, WorkflowStepHandler>();
  private readonly timeouts = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly cancelled = new Set<string>();
  private totalCreated = 0;
  private totalCompleted = 0;
  private totalFailed = 0;
  private totalCancelled = 0;
  private totalTimedOut = 0;
  private totalDurationMs = 0;

  constructor(
    @Optional() config?: Partial<WorkflowConfig>,
    @Optional() private readonly eventBus?: EventBusEngine,
    @Optional() private readonly performanceMonitor?: PerformanceMonitorEngine,
  ) {
    this.config = { ...DEFAULT_WORKFLOW_CONFIG, ...config };
  }

  create(type: WorkflowType, symbol: string | null = null, metadata: Record<string, unknown> = {}): WorkflowInstance {
    const id = `wf-${Date.now()}-${(nextWorkflowId++).toString(36)}`;
    const typeConfig = this.config.types[type];

    const steps: StepResult[] = typeConfig.steps.map((s) => ({
      step: s.name,
      status: 'pending' as const,
      startedAt: null,
      completedAt: null,
      durationMs: 0,
      attempt: 0,
      error: null,
      metadata: {},
    }));

    const workflow: WorkflowInstance = {
      id,
      type,
      status: 'pending',
      symbol,
      steps,
      currentStep: null,
      progress: 0,
      startedAt: null,
      completedAt: null,
      durationMs: 0,
      retryCount: 0,
      metadata,
      createdAt: new Date().toISOString(),
    };

    this.workflows.set(id, workflow);
    this.totalCreated++;

    this.emitEvent('workflow.created', 'system', { workflowId: id, type, symbol });

    return workflow;
  }

  enqueue(workflowId: string): boolean {
    const wf = this.workflows.get(workflowId);
    if (!wf) return false;
    if (!this.transition(wf, 'queued')) return false;

    if (this.workflows.size > this.config.maxConcurrentWorkflows) {
      this.transition(wf, 'pending');
      return false;
    }

    this.emitEvent('workflow.queued', 'system', { workflowId, type: wf.type, symbol: wf.symbol });
    return true;
  }

  async execute(workflowId: string, handlers?: Record<string, WorkflowStepHandler>): Promise<WorkflowInstance> {
    const wf = this.workflows.get(workflowId);
    if (!wf) throw new Error(`Workflow not found: ${workflowId}`);

    if (!this.transition(wf, 'running')) {
      throw new Error(`Cannot execute workflow in status: ${wf.status}`);
    }

    wf.startedAt = new Date().toISOString();
    const startMs = Date.now();

    this.emitEvent('workflow.started', 'system', { workflowId, type: wf.type });
    this.recordMetric('workflow.duration', 0, { workflowId, type: wf.type });

    const typeConfig = this.config.types[wf.type];
    const timeoutMs = typeConfig.timeoutMs;

    this.setupTimeout(workflowId, timeoutMs);

    try {
      for (let i = 0; i < typeConfig.steps.length; i++) {
        if (this.cancelled.has(workflowId)) {
          this.transition(wf, 'cancelled');
          wf.completedAt = new Date().toISOString();
          wf.durationMs = wf.startedAt ? Date.now() - new Date(wf.startedAt).getTime() : 0;
          this.totalCancelled++;
          this.totalDurationMs += wf.durationMs;
          this.addToHistory(wf);
          this.emitEvent('workflow.cancelled', 'system', { workflowId, reason: 'cancelled_during_execution' });
          this.cleanup(workflowId);
          return wf;
        }

        const stepDef = typeConfig.steps[i];
        const stepResult = wf.steps[i];

        stepResult.status = 'running';
        stepResult.startedAt = new Date().toISOString();
        stepResult.attempt = 1;
        wf.currentStep = stepDef.name;
        wf.progress = Math.round((i / typeConfig.steps.length) * 100);

        const handler = handlers?.[stepDef.name] ?? this.handlers.get(`${wf.type}:${stepDef.name}`);

        this.emitEvent('workflow.step_started', 'system', {
          workflowId,
          step: stepDef.name,
          stepIndex: i,
        });

        if (!handler) {
          if (stepDef.optional) {
            stepResult.status = 'skipped';
            stepResult.completedAt = new Date().toISOString();
            stepResult.error = 'No handler registered';
            continue;
          }
          stepResult.status = 'failed';
          stepResult.completedAt = new Date().toISOString();
          stepResult.error = `No handler registered for required step: ${stepDef.name}`;
          this.finishWorkflow(wf, 'failed', startMs);
          return wf;
        }

        const stepStart = Date.now();
        let stepSuccess = false;
        let lastError: string | null = null;

        const maxAttempts = stepDef.retryAttempts + 1;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          if (this.cancelled.has(workflowId)) break;

          stepResult.attempt = attempt + 1;
          try {
            const result = await handler(stepDef.name, wf);
            stepResult.metadata = result ?? {};
            stepSuccess = true;
            break;
          } catch (err) {
            lastError = err instanceof Error ? err.message : String(err);
            if (attempt < maxAttempts - 1) {
              const delay = stepDef.retryDelayMs * Math.pow(typeConfig.retryPolicy.backoffMultiplier, attempt);
              await this.delay(delay);
            }
          }
        }

        const stepDuration = Date.now() - stepStart;
        stepResult.durationMs = stepDuration;
        stepResult.completedAt = new Date().toISOString();

        this.recordMetric('workflow.step_duration', stepDuration, {
          workflowId,
          step: stepDef.name,
          type: wf.type,
        });

        if (this.cancelled.has(workflowId)) {
          stepResult.status = 'failed';
          this.transition(wf, 'cancelled');
          wf.completedAt = new Date().toISOString();
          wf.durationMs = wf.startedAt ? Date.now() - new Date(wf.startedAt).getTime() : 0;
          this.totalCancelled++;
          this.totalDurationMs += wf.durationMs;
          this.addToHistory(wf);
          this.emitEvent('workflow.cancelled', 'system', { workflowId, reason: 'cancelled_during_step' });
          this.cleanup(workflowId);
          return wf;
        }

        if (stepSuccess) {
          stepResult.status = 'completed';
          stepResult.error = null;
          this.emitEvent('workflow.step_completed', 'system', {
            workflowId,
            step: stepDef.name,
            durationMs: stepDuration,
          });
        } else {
          if (stepDef.optional) {
            stepResult.status = 'skipped';
            stepResult.error = lastError;
            this.emitEvent('workflow.step_skipped', 'system', {
              workflowId,
              step: stepDef.name,
              error: lastError,
            });
          } else {
            stepResult.status = 'failed';
            stepResult.error = lastError;
            this.emitEvent('workflow.step_failed', 'system', {
              workflowId,
              step: stepDef.name,
              error: lastError,
            });
            this.finishWorkflow(wf, 'failed', startMs);
            return wf;
          }
        }
      }

      wf.progress = 100;
      wf.currentStep = null;
      this.finishWorkflow(wf, 'completed', startMs);
      return wf;
    } finally {
      this.cleanup(workflowId);
    }
  }

  cancel(workflowId: string): boolean {
    const wf = this.workflows.get(workflowId);
    if (!wf) return false;

    if (wf.status === 'completed' || wf.status === 'failed' || wf.status === 'timeout' || wf.status === 'cancelled') {
      return false;
    }

    this.cancelled.add(workflowId);

    if (wf.status === 'pending' || wf.status === 'queued') {
      this.transition(wf, 'cancelled');
      wf.completedAt = new Date().toISOString();
      wf.durationMs = wf.startedAt ? Date.now() - new Date(wf.startedAt).getTime() : 0;
      this.totalCancelled++;
      this.totalDurationMs += wf.durationMs;
      this.addToHistory(wf);
      this.emitEvent('workflow.cancelled', 'system', { workflowId, type: wf.type });
      this.cleanup(workflowId);
    }

    return true;
  }

  registerHandler(workflowType: WorkflowType, stepName: string, handler: WorkflowStepHandler): void {
    this.handlers.set(`${workflowType}:${stepName}`, handler);
  }

  getWorkflow(workflowId: string): WorkflowInstance | undefined {
    return this.workflows.get(workflowId);
  }

  getWorkflows(filters?: { status?: WorkflowStatus; type?: WorkflowType }): WorkflowInstance[] {
    let results = Array.from(this.workflows.values());
    if (filters?.status) {
      results = results.filter((w) => w.status === filters.status);
    }
    if (filters?.type) {
      results = results.filter((w) => w.type === filters.type);
    }
    return results;
  }

  getHistory(filters?: { type?: WorkflowType; status?: WorkflowStatus; limit?: number }): WorkflowInstance[] {
    let results = [...this.history];
    if (filters?.type) {
      results = results.filter((w) => w.type === filters.type);
    }
    if (filters?.status) {
      results = results.filter((w) => w.status === filters.status);
    }
    if (filters?.limit && filters.limit > 0) {
      results = results.slice(-filters.limit);
    }
    return results;
  }

  getStats(): WorkflowStats {
    const activeWorkflows = Array.from(this.workflows.values()).filter(
      (w) => w.status === 'running' || w.status === 'queued' || w.status === 'pending',
    ).length;

    const byType: Record<WorkflowType, { created: number; completed: number; failed: number }> = {
      single_stock_analysis: { created: 0, completed: 0, failed: 0 },
      market_scan: { created: 0, completed: 0, failed: 0 },
      backtest: { created: 0, completed: 0, failed: 0 },
      optimization: { created: 0, completed: 0, failed: 0 },
      full_pipeline: { created: 0, completed: 0, failed: 0 },
    };

    for (const w of this.history) {
      byType[w.type].created++;
      if (w.status === 'completed') byType[w.type].completed++;
      if (w.status === 'failed') byType[w.type].failed++;
    }

    const completedCount = this.totalCompleted;
    const avgDurationMs = completedCount > 0 ? this.totalDurationMs / completedCount : 0;

    return {
      totalCreated: this.totalCreated,
      totalCompleted: this.totalCompleted,
      totalFailed: this.totalFailed,
      totalCancelled: this.totalCancelled,
      totalTimedOut: this.totalTimedOut,
      activeWorkflows,
      avgDurationMs,
      byType,
    };
  }

  getSnapshot(): WorkflowSnapshot {
    const activeWorkflows = Array.from(this.workflows.values()).filter(
      (w) => w.status === 'running' || w.status === 'queued' || w.status === 'pending',
    );

    return {
      stats: this.getStats(),
      activeWorkflows,
      timestamp: new Date().toISOString(),
    };
  }

  getResult(): WorkflowResult {
    return {
      snapshot: this.getSnapshot(),
      metadata: {
        config: this.config,
        registeredHandlers: Array.from(this.handlers.keys()),
        activeTimeouts: Array.from(this.timeouts.keys()),
      },
    };
  }

  clearHistory(): void {
    this.history.length = 0;
  }

  clearAll(): void {
    for (const timer of this.timeouts.values()) {
      clearTimeout(timer);
    }
    this.timeouts.clear();
    this.cancelled.clear();
    this.workflows.clear();
    this.history.length = 0;
    this.totalCreated = 0;
    this.totalCompleted = 0;
    this.totalFailed = 0;
    this.totalCancelled = 0;
    this.totalTimedOut = 0;
    this.totalDurationMs = 0;
  }

  private transition(wf: WorkflowInstance, to: WorkflowStatus): boolean {
    const allowed = VALID_TRANSITIONS[wf.status];
    if (!allowed.includes(to)) return false;
    wf.status = to;
    return true;
  }

  private finishWorkflow(wf: WorkflowInstance, finalStatus: 'completed' | 'failed' | 'timeout', startMs: number): void {
    wf.completedAt = new Date().toISOString();
    wf.durationMs = Date.now() - startMs;
    wf.currentStep = null;
    wf.progress = wf.status === 'completed' ? 100 : wf.progress;

    this.transition(wf, finalStatus);

    if (finalStatus === 'completed') {
      this.totalCompleted++;
      this.totalDurationMs += wf.durationMs;
    } else if (finalStatus === 'failed') {
      this.totalFailed++;
    } else if (finalStatus === 'timeout') {
      this.totalTimedOut++;
    }

    this.addToHistory(wf);
    this.recordMetric('workflow.total_duration', wf.durationMs, { workflowId: wf.id, type: wf.type, status: finalStatus });
    this.emitEvent(`workflow.${finalStatus}`, 'system', {
      workflowId: wf.id,
      type: wf.type,
      durationMs: wf.durationMs,
      symbol: wf.symbol,
    });
  }

  private setupTimeout(workflowId: string, timeoutMs: number): void {
    const timer = setTimeout(() => {
      const wf = this.workflows.get(workflowId);
      if (wf && wf.status === 'running') {
        this.transition(wf, 'timeout');
        wf.completedAt = new Date().toISOString();
        wf.durationMs = wf.startedAt ? Date.now() - new Date(wf.startedAt).getTime() : 0;
        this.totalTimedOut++;
        this.totalDurationMs += wf.durationMs;
        this.addToHistory(wf);
        this.emitEvent('workflow.timeout', 'system', {
          workflowId,
          type: wf.type,
          durationMs: wf.durationMs,
        });
        this.recordMetric('workflow.timeout', wf.durationMs, { workflowId, type: wf.type });
      }
      this.timeouts.delete(workflowId);
    }, timeoutMs);
    this.timeouts.set(workflowId, timer);
  }

  private cleanup(workflowId: string): void {
    const timer = this.timeouts.get(workflowId);
    if (timer) {
      clearTimeout(timer);
      this.timeouts.delete(workflowId);
    }
    this.cancelled.delete(workflowId);
  }

  private addToHistory(wf: WorkflowInstance): void {
    this.history.push(wf);
    if (this.history.length > this.config.maxHistorySize) {
      this.history.splice(0, this.history.length - this.config.maxHistorySize);
    }
  }

  private emitEvent(type: string, category: 'system', payload: unknown): void {
    if (!this.config.enableEvents || !this.eventBus) return;
    try {
      this.eventBus.publish(type, category, payload, { source: 'workflow-engine' });
    } catch { /* event bus failure is non-fatal */ }
  }

  private recordMetric(name: string, value: number, metadata: Record<string, unknown>): void {
    if (!this.config.enablePerformanceTracking || !this.performanceMonitor) return;
    try {
      this.performanceMonitor.record('pipeline', name, value, metadata);
    } catch { /* perf monitor failure is non-fatal */ }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
