import type { QueuePriority } from './workflow-queue.types';

export interface WorkflowQueueConfig {
  workers: number;
  maxQueueSize: number;
  defaultMaxAttempts: number;
  defaultRetryDelayMs: number;
  backoffMultiplier: number;
  maxRetryDelayMs: number;
  jobTimeoutMs: number;
  cleanupIntervalMs: number;
  defaultPriority: QueuePriority;
}

export const DEFAULT_WORKFLOW_QUEUE_CONFIG: WorkflowQueueConfig = {
  workers: 4,
  maxQueueSize: 1000,
  defaultMaxAttempts: 3,
  defaultRetryDelayMs: 1000,
  backoffMultiplier: 2,
  maxRetryDelayMs: 30000,
  jobTimeoutMs: 300000,
  cleanupIntervalMs: 60000,
  defaultPriority: 'NORMAL',
};
