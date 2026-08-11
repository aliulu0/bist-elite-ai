export type JobName =
  | 'marketOpenScan'
  | 'incrementalScan'
  | 'nightlyBacktest'
  | 'benchmark'
  | 'ruleAnalytics'
  | 'weightOptimization'
  | 'cacheRefresh'
  | 'providerHealthCheck'
  | 'macroRefresh'
  | 'portfolioRefresh'
  | 'alertRefresh'
  | 'retryFailedJobs'
  | 'fullPipelineRun'
  | 'researchRefresh'
  | 'companyResearch'
  | 'agentReachRefresh'
  | 'verificationRefresh';

export type JobStatus = 'idle' | 'running' | 'completed' | 'failed' | 'disabled';

export interface JobExecution {
  jobName: JobName;
  startedAt: string;
  completedAt: string | null;
  durationMs: number;
  success: boolean;
  error: string | null;
  metadata: Record<string, unknown>;
}

export interface JobState {
  jobName: JobName;
  status: JobStatus;
  enabled: boolean;
  intervalMs: number;
  lastExecution: JobExecution | null;
  totalExecutions: number;
  consecutiveFailures: number;
}

export interface SchedulerStatus {
  running: boolean;
  jobs: JobState[];
  uptime: number;
  totalExecutions: number;
}

export interface SchedulerResult {
  status: SchedulerStatus;
  metadata: Record<string, unknown>;
}
