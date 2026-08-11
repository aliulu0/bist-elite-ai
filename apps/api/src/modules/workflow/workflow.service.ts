import { Injectable, Logger } from '@nestjs/common';
import { WorkflowEngine } from './workflow.engine';
import {
  WorkflowType,
  WorkflowStatus,
  WorkflowInstance,
  WorkflowStats,
} from './workflow.types';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(private readonly engine: WorkflowEngine) {}

  createWorkflow(
    type: WorkflowType,
    symbol?: string,
    metadata: Record<string, unknown> = {},
  ): WorkflowInstance {
    this.logger.debug(`Creating workflow: type=${type}, symbol=${symbol ?? 'N/A'}`);
    return this.engine.create(type, symbol ?? null, metadata);
  }

  async startWorkflow(id: string): Promise<WorkflowInstance> {
    this.logger.debug(`Starting workflow: ${id}`);
    const wf = this.engine.getWorkflow(id);
    if (!wf) throw new Error(`Workflow not found: ${id}`);

    if (wf.status === 'pending') {
      this.engine.enqueue(id);
    }

    return this.engine.execute(id);
  }

  cancelWorkflow(id: string): boolean {
    this.logger.debug(`Cancelling workflow: ${id}`);
    return this.engine.cancel(id);
  }

  async retryWorkflow(id: string): Promise<WorkflowInstance> {
    this.logger.debug(`Retrying workflow: ${id}`);
    const original = this.engine.getWorkflow(id);
    if (!original) throw new Error(`Workflow not found: ${id}`);

    if (original.status !== 'completed' && original.status !== 'failed' && original.status !== 'timeout') {
      throw new Error(`Cannot retry workflow in status: ${original.status}`);
    }

    const newWf = this.engine.create(original.type, original.symbol, {
      ...original.metadata,
      retriedFrom: id,
    });

    this.engine.enqueue(newWf.id);
    return this.engine.execute(newWf.id);
  }

  getWorkflow(id: string): WorkflowInstance | undefined {
    return this.engine.getWorkflow(id);
  }

  listWorkflows(filters?: { status?: WorkflowStatus; type?: WorkflowType }): WorkflowInstance[] {
    return this.engine.getWorkflows(filters);
  }

  getActiveWorkflows(): WorkflowInstance[] {
    return this.engine.getWorkflows().filter(
      (w) => w.status === 'running' || w.status === 'queued' || w.status === 'pending',
    );
  }

  getHistory(filters?: { type?: WorkflowType; status?: WorkflowStatus; limit?: number }): WorkflowInstance[] {
    return this.engine.getHistory(filters);
  }

  getStatistics(): WorkflowStats {
    return this.engine.getStats();
  }
}
