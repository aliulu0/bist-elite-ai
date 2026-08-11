import { Injectable } from '@nestjs/common';
import { WorkflowQueueEngine } from './workflow-queue.engine';
import { QueueJob, QueueSnapshot, QueueStatistics, QueuePriority, QueueState } from './workflow-queue.types';

@Injectable()
export class WorkflowQueueService {
  constructor(private readonly engine: WorkflowQueueEngine) {}

  getSnapshot(): QueueSnapshot {
    return this.engine.getSnapshot();
  }

  getStatistics(): QueueStatistics {
    return this.engine.getStatistics();
  }

  getAllJobs(options?: { limit?: number; offset?: number; state?: string; priority?: string }): {
    jobs: QueueJob[];
    total: number;
  } {
    let jobs = [
      ...this.engine.getQueue(),
      ...this.engine.getRunning(),
      ...this.engine.getCompleted(),
      ...this.engine.getFailed(),
      ...this.engine.getDeadLetter(),
    ];

    if (options?.state) {
      jobs = jobs.filter((j) => j.state === options.state);
    }
    if (options?.priority) {
      jobs = jobs.filter((j) => j.priority === options.priority);
    }

    const total = jobs.length;
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    jobs = jobs.slice(offset, offset + limit);

    return { jobs, total };
  }

  getJob(jobId: string): QueueJob | undefined {
    return this.engine.getJob(jobId);
  }

  start(): void {
    this.engine.start();
  }

  stop(): void {
    this.engine.stop();
  }

  retryJob(jobId: string): boolean {
    return this.engine.retry(jobId);
  }

  cancelJob(jobId: string): boolean {
    return this.engine.cancel(jobId);
  }

  clear(): void {
    this.engine.clear();
  }

  isPriorityValid(priority: string): boolean {
    return (['CRITICAL', 'VERY_HIGH', 'HIGH', 'NORMAL', 'LOW'] as readonly string[]).includes(priority);
  }

  isStateValid(state: string): boolean {
    return (['WAITING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'DEAD_LETTER', 'CANCELLED', 'PAUSED'] as readonly string[]).includes(state);
  }
}
