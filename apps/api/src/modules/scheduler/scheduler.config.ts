import { JobName } from './scheduler.types';

export interface JobConfig {
  enabled: boolean;
  intervalMs: number;
  retryAttempts: number;
  retryDelayMs: number;
}

export interface SchedulerConfig {
  jobs: Record<JobName, JobConfig>;
  maxHistoryPerJob: number;
  maxConsecutiveFailures: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

const FIVE_MINUTES = 5 * 60 * 1000;
const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;
const SIX_HOURS = 6 * ONE_HOUR;
const TWELVE_HOURS = 12 * ONE_HOUR;
const TWENTY_FOUR_HOURS = 24 * ONE_HOUR;

export const DEFAULT_JOB_CONFIGS: Record<JobName, JobConfig> = {
  marketOpenScan: { enabled: true, intervalMs: FIFTEEN_MINUTES, retryAttempts: 3, retryDelayMs: FIVE_MINUTES },
  incrementalScan: { enabled: true, intervalMs: ONE_HOUR, retryAttempts: 2, retryDelayMs: FIVE_MINUTES },
  nightlyBacktest: { enabled: true, intervalMs: TWENTY_FOUR_HOURS, retryAttempts: 1, retryDelayMs: ONE_HOUR },
  benchmark: { enabled: true, intervalMs: SIX_HOURS, retryAttempts: 2, retryDelayMs: FIVE_MINUTES },
  ruleAnalytics: { enabled: true, intervalMs: TWELVE_HOURS, retryAttempts: 2, retryDelayMs: FIVE_MINUTES },
  weightOptimization: { enabled: true, intervalMs: TWENTY_FOUR_HOURS, retryAttempts: 1, retryDelayMs: ONE_HOUR },
  cacheRefresh: { enabled: true, intervalMs: FIFTEEN_MINUTES, retryAttempts: 3, retryDelayMs: FIVE_MINUTES },
  providerHealthCheck: { enabled: true, intervalMs: FIVE_MINUTES, retryAttempts: 1, retryDelayMs: FIVE_MINUTES },
  macroRefresh: { enabled: true, intervalMs: FIFTEEN_MINUTES, retryAttempts: 2, retryDelayMs: FIVE_MINUTES },
  portfolioRefresh: { enabled: true, intervalMs: FIFTEEN_MINUTES, retryAttempts: 2, retryDelayMs: FIVE_MINUTES },
  alertRefresh: { enabled: true, intervalMs: FIVE_MINUTES, retryAttempts: 2, retryDelayMs: FIVE_MINUTES },
  retryFailedJobs: { enabled: true, intervalMs: ONE_HOUR, retryAttempts: 1, retryDelayMs: FIVE_MINUTES },
  fullPipelineRun: { enabled: true, intervalMs: ONE_HOUR, retryAttempts: 1, retryDelayMs: FIVE_MINUTES },
  researchRefresh: { enabled: true, intervalMs: FIFTEEN_MINUTES, retryAttempts: 2, retryDelayMs: FIVE_MINUTES },
  companyResearch: { enabled: true, intervalMs: TWENTY_FOUR_HOURS, retryAttempts: 1, retryDelayMs: ONE_HOUR },
  agentReachRefresh: { enabled: true, intervalMs: TWENTY_FOUR_HOURS, retryAttempts: 1, retryDelayMs: ONE_HOUR },
  verificationRefresh: { enabled: true, intervalMs: TWELVE_HOURS, retryAttempts: 2, retryDelayMs: FIVE_MINUTES },
};

export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  jobs: DEFAULT_JOB_CONFIGS,
  maxHistoryPerJob: 100,
  maxConsecutiveFailures: 5,
  logLevel: 'info',
};
