import { WorkflowType } from '../workflow/workflow.types';
import { QueuePriority } from '../workflow-queue/workflow-queue.types';

export interface WorkflowJobMapping {
  workflowId: string;
  jobId: string;
  createdAt: string;
}

export interface IntegrationState {
  activeMappings: WorkflowJobMapping[];
  totalEnqueued: number;
  totalCompleted: number;
  totalFailed: number;
  totalCancelled: number;
  totalRetried: number;
}

export interface IntegrationMetrics {
  queueWaitTimeMs: number;
  executionTimeMs: number;
  retryCount: number;
  workerUtilization: number;
  queueLatencyMs: number;
  avgQueueWaitTimeMs: number;
  avgExecutionTimeMs: number;
  totalWorkflowsProcessed: number;
}

export type WorkflowPriorityMap = Record<WorkflowType, QueuePriority>;
