export type WorkflowType = 'single_stock_analysis' | 'market_scan' | 'backtest' | 'optimization' | 'full_pipeline';

export type WorkflowStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'timeout' | 'cancelled';

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface StepDefinition {
  name: string;
  order: number;
  timeoutMs: number;
  retryAttempts: number;
  retryDelayMs: number;
  optional: boolean;
}

export interface StepResult {
  step: string;
  status: StepStatus;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number;
  attempt: number;
  error: string | null;
  metadata: Record<string, unknown>;
}

export interface WorkflowInstance {
  id: string;
  type: WorkflowType;
  status: WorkflowStatus;
  symbol: string | null;
  steps: StepResult[];
  currentStep: string | null;
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number;
  retryCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface WorkflowRetryPolicy {
  maxRetriesPerStep: number;
  retryDelayMs: number;
  backoffMultiplier: number;
}

export interface WorkflowTypeConfig {
  steps: StepDefinition[];
  timeoutMs: number;
  retryPolicy: WorkflowRetryPolicy;
}

export interface WorkflowConfig {
  types: Record<WorkflowType, WorkflowTypeConfig>;
  maxConcurrentWorkflows: number;
  maxHistorySize: number;
  enableEvents: boolean;
  enablePerformanceTracking: boolean;
}

export interface WorkflowStats {
  totalCreated: number;
  totalCompleted: number;
  totalFailed: number;
  totalCancelled: number;
  totalTimedOut: number;
  activeWorkflows: number;
  avgDurationMs: number;
  byType: Record<WorkflowType, { created: number; completed: number; failed: number }>;
}

export interface WorkflowSnapshot {
  stats: WorkflowStats;
  activeWorkflows: WorkflowInstance[];
  timestamp: string;
}

export interface WorkflowResult {
  snapshot: WorkflowSnapshot;
  metadata: Record<string, unknown>;
}

export type WorkflowStepHandler = (
  step: string,
  workflow: WorkflowInstance,
) => Promise<Record<string, unknown>> | Record<string, unknown>;
