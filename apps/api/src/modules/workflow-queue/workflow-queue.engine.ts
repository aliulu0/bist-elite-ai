import { Injectable, Optional } from '@nestjs/common';
import {
  QueueJob,
  QueueJobHandler,
  QueuePriority,
  QueueState,
  QueueWorker,
  QueueStatistics,
  QueueSnapshot,
  PRIORITY_ORDER,
} from './workflow-queue.types';
import { WorkflowQueueConfig, DEFAULT_WORKFLOW_QUEUE_CONFIG } from './workflow-queue.config';
import { EventBusEngine } from '../event-bus/event-bus.engine';

let nextJobId = 0;

@Injectable()
export class WorkflowQueueEngine {
  private readonly config: WorkflowQueueConfig;
  private readonly waiting: QueueJob[] = [];
  private readonly running = new Map<string, QueueJob>();
  private readonly retrying = new Map<string, QueueJob>();
  private readonly completed: QueueJob[] = [];
  private readonly failed: QueueJob[] = [];
  private readonly deadLetter: QueueJob[] = [];
  private readonly cancelled = new Set<string>();
  private readonly handlers = new Map<string, QueueJobHandler>();
  private readonly workers: QueueWorker[] = [];
  private readonly timeouts = new Map<string, ReturnType<typeof setTimeout>>();
  private runningPaused = true;
  private startedAt: number | null = null;
  private totalEnqueued = 0;
  private totalCompleted = 0;
  private totalFailed = 0;
  private totalCancelled = 0;
  private totalRetried = 0;
  private totalDeadLettered = 0;
  private totalWaitTimeMs = 0;
  private totalExecutionTimeMs = 0;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Optional() config?: Partial<WorkflowQueueConfig>,
    @Optional() private readonly eventBus?: EventBusEngine,
  ) {
    this.config = { ...DEFAULT_WORKFLOW_QUEUE_CONFIG, ...config };
    for (let i = 0; i < this.config.workers; i++) {
      this.workers.push({ id: i, busy: false, jobId: null, startedAt: null });
    }
  }

  enqueue<TPayload = unknown>(
    workflowId: string,
    type: string,
    payload: TPayload,
    options?: {
      priority?: QueuePriority;
      maxAttempts?: number;
      retryDelayMs?: number;
      metadata?: Record<string, unknown>;
    },
  ): QueueJob<TPayload> {
    if (this.waiting.length + this.running.size >= this.config.maxQueueSize) {
      throw new Error(`Queue is full: ${this.config.maxQueueSize} jobs maximum`);
    }

    const job: QueueJob<TPayload> = {
      id: `jq-${Date.now()}-${(nextJobId++).toString(36)}`,
      workflowId,
      type,
      priority: options?.priority ?? this.config.defaultPriority,
      state: 'WAITING',
      payload,
      attempt: 0,
      maxAttempts: options?.maxAttempts ?? this.config.defaultMaxAttempts,
      retryDelayMs: options?.retryDelayMs ?? this.config.defaultRetryDelayMs,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      failedAt: null,
      error: null,
      metadata: options?.metadata ?? {},
    };

    this.waiting.push(job);
    this.sortWaiting();
    this.totalEnqueued++;

    this.emitEvent('queue.job.created', { jobId: job.id, workflowId, type, priority: job.priority });
    this.processQueue();
    return job;
  }

  dequeue(): QueueJob | null {
    const job = this.waiting.shift();
    if (!job) return null;
    this.processQueue();
    return job;
  }

  peek(): QueueJob | null {
    return this.waiting.length > 0 ? this.waiting[0] : null;
  }

  start(): void {
    if (this.startedAt !== null) return;
    this.startedAt = Date.now();
    this.runningPaused = false;
    if (this.config.cleanupIntervalMs > 0) {
      this.cleanupTimer = setInterval(() => this.cleanupCompleted(), this.config.cleanupIntervalMs);
    }
    this.processQueue();
    this.emitEvent('queue.resumed', { action: 'start' });
  }

  stop(): void {
    if (this.startedAt === null) return;
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.runningPaused = true;
    this.emitEvent('queue.paused', { action: 'stop' });
  }

  pause(): void {
    if (this.runningPaused) return;
    this.runningPaused = true;
    this.emitEvent('queue.paused', { action: 'pause' });
  }

  resume(): void {
    if (!this.runningPaused) return;
    this.runningPaused = false;
    this.processQueue();
    this.emitEvent('queue.resumed', { action: 'resume' });
  }

  cancel(jobId: string): boolean {
    const job = this.findInAnyState(jobId);
    if (!job) return false;

    if (job.state === 'COMPLETED' || job.state === 'FAILED' || job.state === 'CANCELLED' || job.state === 'DEAD_LETTER') {
      return false;
    }

    this.cancelled.add(jobId);

    if (job.state === 'WAITING') {
      job.state = 'CANCELLED';
      this.totalCancelled++;
      this.emitEvent('queue.job.cancelled', { jobId, type: job.type });
      return true;
    }

    if (job.state === 'RUNNING') {
      job.state = 'CANCELLED';
      this.totalCancelled++;
      this.releaseWorker(jobId);
      this.emitEvent('queue.job.cancelled', { jobId, type: job.type });
      return true;
    }

    if (job.state === 'RETRYING' || job.state === 'PAUSED') {
      job.state = 'CANCELLED';
      this.retrying.delete(jobId);
      this.totalCancelled++;
      this.emitEvent('queue.job.cancelled', { jobId, type: job.type });
      return true;
    }

    return false;
  }

  retry(jobId: string): boolean {
    const job = this.findInAnyState(jobId);
    if (!job) return false;

    if (job.state !== 'FAILED' && job.state !== 'DEAD_LETTER') {
      return false;
    }

    const wasDeadLetter = job.state === 'DEAD_LETTER';
    job.state = 'WAITING';
    job.attempt = 0;
    job.error = null;
    job.startedAt = null;
    job.completedAt = null;
    job.failedAt = null;

    if (wasDeadLetter) {
      const idx = this.deadLetter.findIndex((j) => j.id === jobId);
      if (idx >= 0) this.deadLetter.splice(idx, 1);
    } else {
      const idx = this.failed.findIndex((j) => j.id === jobId);
      if (idx >= 0) this.failed.splice(idx, 1);
    }

    this.waiting.push(job);
    this.sortWaiting();
    this.totalRetried++;
    this.emitEvent('queue.job.retry', { jobId, type: job.type });
    this.processQueue();
    return true;
  }

  moveToDeadLetter(jobId: string): boolean {
    const job = this.running.get(jobId) ?? this.failed.find((j) => j.id === jobId);
    if (!job) return false;

    if (job.state === 'DEAD_LETTER') return false;

    if (job.state === 'RUNNING') {
      this.running.delete(jobId);
      this.releaseWorker(jobId);
    } else if (job.state === 'FAILED') {
      const idx = this.failed.findIndex((j) => j.id === jobId);
      if (idx >= 0) this.failed.splice(idx, 1);
    }

    job.state = 'DEAD_LETTER';
    job.failedAt = new Date().toISOString();
    this.deadLetter.push(job);
    this.totalDeadLettered++;
    this.emitEvent('queue.job.deadletter', { jobId, type: job.type, error: job.error });
    return true;
  }

  clear(): void {
    this.waiting.length = 0;
    this.running.clear();
    this.retrying.clear();
    this.completed.length = 0;
    this.failed.length = 0;
    this.deadLetter.length = 0;
    this.cancelled.clear();
    for (const w of this.workers) {
      w.busy = false;
      w.jobId = null;
      w.startedAt = null;
    }
    for (const timer of this.timeouts.values()) {
      clearTimeout(timer);
    }
    this.timeouts.clear();
  }

  clearCompleted(): void {
    this.completed.length = 0;
  }

  clearDeadLetter(): void {
    this.deadLetter.length = 0;
  }

  getQueue(): QueueJob[] {
    return [...this.waiting];
  }

  getRunning(): QueueJob[] {
    return Array.from(this.running.values());
  }

  getCompleted(): QueueJob[] {
    return [...this.completed];
  }

  getFailed(): QueueJob[] {
    return [...this.failed];
  }

  getDeadLetter(): QueueJob[] {
    return [...this.deadLetter];
  }

  getWorkers(): QueueWorker[] {
    return [...this.workers];
  }

  getJob(jobId: string): QueueJob | undefined {
    return this.findJob(jobId) ?? this.findInAnyState(jobId);
  }

  getStatistics(): QueueStatistics {
    const uptimeMs = this.startedAt !== null ? Date.now() - this.startedAt : 0;
    const completedCount = this.totalCompleted;
    return {
      totalEnqueued: this.totalEnqueued,
      totalCompleted: this.totalCompleted,
      totalFailed: this.totalFailed,
      totalCancelled: this.totalCancelled,
      totalRetried: this.totalRetried,
      totalDeadLettered: this.totalDeadLettered,
      waitingCount: this.waiting.length,
      runningCount: this.running.size,
      completedCount: this.completed.length,
      failedCount: this.failed.length,
      deadLetterCount: this.deadLetter.length,
      activeWorkers: this.workers.filter((w) => w.busy).length,
      totalWorkers: this.workers.length,
      avgWaitTimeMs: this.totalEnqueued > 0 ? this.totalWaitTimeMs / this.totalEnqueued : 0,
      avgExecutionTimeMs: completedCount > 0 ? this.totalExecutionTimeMs / completedCount : 0,
      uptimeMs,
    };
  }

  getSnapshot(): QueueSnapshot {
    return {
      statistics: this.getStatistics(),
      waitingJobs: this.getQueue(),
      runningJobs: this.getRunning(),
      deadLetterJobs: this.getDeadLetter(),
      workers: this.getWorkers(),
      timestamp: new Date().toISOString(),
    };
  }

  registerHandler(type: string, handler: QueueJobHandler): void {
    this.handlers.set(type, handler);
  }

  isPaused(): boolean {
    return this.runningPaused;
  }

  isStarted(): boolean {
    return this.startedAt !== null;
  }

  private processQueue(): void {
    if (this.runningPaused) return;
    if (this.waiting.length === 0) return;

    const availableWorker = this.workers.find((w) => !w.busy);
    if (!availableWorker) return;

    const job = this.waiting.shift();
    if (!job) return;

    this.assignAndExecute(availableWorker, job);
  }

  private async assignAndExecute(worker: QueueWorker, job: QueueJob): Promise<void> {
    worker.busy = true;
    worker.jobId = job.id;
    worker.startedAt = new Date().toISOString();

    job.state = 'RUNNING';
    job.startedAt = new Date().toISOString();
    job.attempt++;
    this.running.set(job.id, job);

    const waitTime = new Date(job.startedAt).getTime() - new Date(job.createdAt).getTime();
    this.totalWaitTimeMs += waitTime;

    this.emitEvent('queue.job.started', { jobId: job.id, type: job.type, workerId: worker.id, attempt: job.attempt });

    const timer = setTimeout(() => {
      this.handleJobTimeout(job.id);
    }, job.retryDelayMs > 0 ? Math.max(this.config.jobTimeoutMs, job.retryDelayMs * 10) : this.config.jobTimeoutMs);
    this.timeouts.set(job.id, timer);

    try {
      const handler = this.handlers.get(job.type);
      if (!handler) {
        throw new Error(`No handler registered for job type: ${job.type}`);
      }

      const result = await handler(job);
      this.completeJob(job, result);
    } catch (err) {
      this.handleJobError(job, err);
    } finally {
      this.cleanupTimerAfterJob(job.id);
      worker.busy = false;
      worker.jobId = null;
      worker.startedAt = null;
      this.processQueue();
    }
  }

  private completeJob(job: QueueJob, result: Record<string, unknown>): void {
    if (this.cancelled.has(job.id)) {
      this.cancelled.delete(job.id);
      this.running.delete(job.id);
      return;
    }

    const execTime = Date.now() - new Date(job.startedAt!).getTime();
    this.totalExecutionTimeMs += execTime;

    job.state = 'COMPLETED';
    job.completedAt = new Date().toISOString();
    this.running.delete(job.id);
    this.completed.push(job);
    this.totalCompleted++;

    this.emitEvent('queue.job.completed', {
      jobId: job.id,
      type: job.type,
      durationMs: execTime,
      attempt: job.attempt,
      result,
    });
  }

  private handleJobError(job: QueueJob, err: unknown): void {
    if (this.cancelled.has(job.id)) {
      this.cancelled.delete(job.id);
      this.running.delete(job.id);
      return;
    }

    const errorMsg = err instanceof Error ? err.message : String(err);
    job.error = errorMsg;

    if (job.attempt < job.maxAttempts) {
      job.state = 'RETRYING';
      this.running.delete(job.id);
      this.retrying.set(job.id, job);
      job.retryDelayMs = Math.min(
        job.retryDelayMs * this.config.backoffMultiplier,
        this.config.maxRetryDelayMs,
      );
      this.totalRetried++;

      this.emitEvent('queue.job.retry', {
        jobId: job.id,
        type: job.type,
        attempt: job.attempt,
        nextRetryMs: job.retryDelayMs,
        error: errorMsg,
      });

      setTimeout(() => {
        this.retrying.delete(job.id);
        if (!this.cancelled.has(job.id)) {
          job.state = 'WAITING';
          this.waiting.push(job);
          this.sortWaiting();
          this.processQueue();
        }
      }, job.retryDelayMs);
    } else {
      job.state = 'DEAD_LETTER';
      job.failedAt = new Date().toISOString();
      this.running.delete(job.id);
      this.deadLetter.push(job);
      this.totalDeadLettered++;

      this.emitEvent('queue.job.deadletter', {
        jobId: job.id,
        type: job.type,
        attempt: job.attempt,
        error: errorMsg,
      });
    }
  }

  private handleJobTimeout(jobId: string): void {
    const job = this.running.get(jobId);
    if (!job || job.state !== 'RUNNING') return;

    this.handleJobError(job, new Error('Job timed out'));
  }

  private cleanupTimerAfterJob(jobId: string): void {
    const timer = this.timeouts.get(jobId);
    if (timer) {
      clearTimeout(timer);
      this.timeouts.delete(jobId);
    }
  }

  private cleanupCompleted(): void {
    const maxSize = Math.floor(this.config.maxQueueSize / 2);
    if (this.completed.length > maxSize) {
      this.completed.splice(0, this.completed.length - maxSize);
    }
  }

  private sortWaiting(): void {
    this.waiting.sort((a, b) => {
      const pa = PRIORITY_ORDER[a.priority];
      const pb = PRIORITY_ORDER[b.priority];
      if (pa !== pb) return pa - pb;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  private findJob(jobId: string): QueueJob | undefined {
    return this.waiting.find((j) => j.id === jobId) ?? this.running.get(jobId);
  }

  private findInAnyState(jobId: string): QueueJob | undefined {
    return (
      this.waiting.find((j) => j.id === jobId) ??
      this.running.get(jobId) ??
      this.retrying.get(jobId) ??
      this.completed.find((j) => j.id === jobId) ??
      this.failed.find((j) => j.id === jobId) ??
      this.deadLetter.find((j) => j.id === jobId)
    );
  }

  private releaseWorker(jobId: string): void {
    for (const w of this.workers) {
      if (w.jobId === jobId) {
        w.busy = false;
        w.jobId = null;
        w.startedAt = null;
        break;
      }
    }
  }

  private emitEvent(type: string, payload: unknown): void {
    if (!this.eventBus) return;
    try {
      this.eventBus.publish(type, 'system', payload, { source: 'workflow-queue-engine' });
    } catch { /* event bus failure is non-fatal */ }
  }
}
