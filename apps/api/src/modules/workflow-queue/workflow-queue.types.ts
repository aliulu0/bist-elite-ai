export type QueuePriority = 'CRITICAL' | 'VERY_HIGH' | 'HIGH' | 'NORMAL' | 'LOW';

export type QueueState =
  | 'WAITING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'RETRYING'
  | 'DEAD_LETTER'
  | 'CANCELLED'
  | 'PAUSED';

export const PRIORITY_ORDER: Record<QueuePriority, number> = {
  CRITICAL: 0,
  VERY_HIGH: 1,
  HIGH: 2,
  NORMAL: 3,
  LOW: 4,
};

export interface QueueJob<TPayload = unknown> {
  id: string;
  workflowId: string;
  type: string;
  priority: QueuePriority;
  state: QueueState;
  payload: TPayload;
  attempt: number;
  maxAttempts: number;
  retryDelayMs: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  error: string | null;
  metadata: Record<string, unknown>;
}

export type QueueJobHandler<TPayload = unknown> = (
  job: QueueJob<TPayload>,
) => Promise<Record<string, unknown>> | Record<string, unknown>;

export interface QueueWorker {
  id: number;
  busy: boolean;
  jobId: string | null;
  startedAt: string | null;
}

export interface QueueStatistics {
  totalEnqueued: number;
  totalCompleted: number;
  totalFailed: number;
  totalCancelled: number;
  totalRetried: number;
  totalDeadLettered: number;
  waitingCount: number;
  runningCount: number;
  completedCount: number;
  failedCount: number;
  deadLetterCount: number;
  activeWorkers: number;
  totalWorkers: number;
  avgWaitTimeMs: number;
  avgExecutionTimeMs: number;
  uptimeMs: number;
}

export interface QueueSnapshot {
  statistics: QueueStatistics;
  waitingJobs: QueueJob[];
  runningJobs: QueueJob[];
  deadLetterJobs: QueueJob[];
  workers: QueueWorker[];
  timestamp: string;
}
