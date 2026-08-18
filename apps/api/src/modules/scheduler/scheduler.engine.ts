import { Injectable, Logger, OnModuleDestroy, Optional } from '@nestjs/common';
import {
  JobName,
  JobState,
  JobExecution,
  SchedulerStatus,
  SchedulerResult,
} from './scheduler.types';
import { SchedulerConfig, DEFAULT_SCHEDULER_CONFIG } from './scheduler.config';
import { IJob } from './jobs/job.interface';

const ALL_JOB_NAMES: JobName[] = [
  'marketOpenScan',
  'incrementalScan',
  'nightlyBacktest',
  'benchmark',
  'ruleAnalytics',
  'weightOptimization',
  'cacheRefresh',
  'providerHealthCheck',
  'macroRefresh',
  'portfolioRefresh',
  'alertRefresh',
  'retryFailedJobs',
  'fullPipelineRun',
  'researchRefresh',
  'companyResearch',
  'agentReachRefresh',
  'verificationRefresh',
  'dailyScan',
];

@Injectable()
export class SchedulerEngine implements OnModuleDestroy {
  private readonly logger = new Logger(SchedulerEngine.name);
  private readonly config: SchedulerConfig;
  private readonly jobs = new Map<JobName, IJob>();
  private readonly timers = new Map<JobName, ReturnType<typeof setInterval>>();
  private readonly states = new Map<JobName, JobState>();
  private readonly history = new Map<JobName, JobExecution[]>();
  private startedAt: Date | null = null;
  private running = false;

  constructor(@Optional() config?: Partial<SchedulerConfig>) {
    const jobs = { ...DEFAULT_SCHEDULER_CONFIG.jobs };
    for (const [name, jobConfig] of Object.entries(config?.jobs ?? {})) {
      jobs[name as JobName] = { ...jobs[name as JobName], ...jobConfig };
    }
    this.config = { ...DEFAULT_SCHEDULER_CONFIG, ...config, jobs };
    for (const name of ALL_JOB_NAMES) {
      const jobConfig = this.config.jobs[name];
      this.states.set(name, {
        jobName: name,
        status: jobConfig.enabled ? 'idle' : 'disabled',
        enabled: jobConfig.enabled,
        intervalMs: jobConfig.intervalMs,
        lastExecution: null,
        totalExecutions: 0,
        consecutiveFailures: 0,
      });
      this.history.set(name, []);
    }
  }

  registerJob(name: JobName, job: IJob): void {
    this.jobs.set(name, job);
    this.logger.debug(`Registered job: ${name}`);
  }

  start(): void {
    if (this.running) {
      this.logger.warn('Scheduler already running');
      return;
    }

    this.running = true;
    this.startedAt = new Date();

    for (const name of ALL_JOB_NAMES) {
      const state = this.states.get(name)!;
      if (!state.enabled) continue;

      const intervalMs = state.intervalMs;
      this.timers.set(
        name,
        setInterval(() => this.executeJob(name), intervalMs),
      );
      this.logger.debug(`Scheduled ${name} every ${intervalMs}ms`);
    }

    this.logger.log(`Scheduler started with ${this.timers.size} active jobs`);
  }

  stop(): void {
    if (!this.running) return;

    for (const [name, timer] of this.timers) {
      clearInterval(timer);
      this.logger.debug(`Stopped job: ${name}`);
    }
    this.timers.clear();
    this.running = false;
    this.logger.log('Scheduler stopped');
  }

  async executeJob(name: JobName): Promise<JobExecution> {
    const job = this.jobs.get(name);
    const state = this.states.get(name);

    if (!job || !state) {
      return this.createExecution(name, false, 'Job not registered');
    }

    if (!state.enabled) {
      return this.createExecution(name, false, 'Job disabled');
    }

    if (state.status === 'running') {
      this.logger.warn(`Job ${name} already running, skipping`);
      return this.createExecution(name, false, 'Already running');
    }

    state.status = 'running';
    const startedAt = new Date();
    const jobConfig = this.config.jobs[name];
    let lastError: string | null = null;
    let success = false;

    for (let attempt = 0; attempt <= jobConfig.retryAttempts; attempt++) {
      try {
        const result = await job.execute();
        success = result.success;
        if (!success) {
          lastError = result.message;
          if (attempt < jobConfig.retryAttempts) {
            this.logger.warn(
              `Job ${name} attempt ${attempt + 1} failed: ${result.message}, retrying...`,
            );
            await this.delay(jobConfig.retryDelayMs);
          }
        } else {
          lastError = null;
          break;
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        this.logger.error(`Job ${name} attempt ${attempt + 1} error: ${lastError}`);
        if (attempt < jobConfig.retryAttempts) {
          await this.delay(jobConfig.retryDelayMs);
        }
      }
    }

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    const execution: JobExecution = {
      jobName: name,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs,
      success,
      error: lastError,
      metadata: {},
    };

    state.lastExecution = execution;
    state.totalExecutions++;
    state.status = success ? 'idle' : 'failed';

    if (success) {
      state.consecutiveFailures = 0;
    } else {
      state.consecutiveFailures++;
      if (state.consecutiveFailures >= this.config.maxConsecutiveFailures) {
        state.enabled = false;
        state.status = 'disabled';
        this.logger.error(
          `Job ${name} disabled after ${state.consecutiveFailures} consecutive failures`,
        );
      }
    }

    const jobHistory = this.history.get(name)!;
    jobHistory.push(execution);
    if (jobHistory.length > this.config.maxHistoryPerJob) {
      jobHistory.splice(0, jobHistory.length - this.config.maxHistoryPerJob);
    }

    this.logger.debug(`Job ${name} ${success ? 'completed' : 'failed'} in ${durationMs}ms`);

    return execution;
  }

  enableJob(name: JobName): void {
    const state = this.states.get(name);
    if (!state) return;
    state.enabled = true;
    state.status = 'idle';
    state.consecutiveFailures = 0;

    if (this.running && !this.timers.has(name)) {
      const intervalMs = state.intervalMs;
      this.timers.set(
        name,
        setInterval(() => this.executeJob(name), intervalMs),
      );
    }
  }

  disableJob(name: JobName): void {
    const state = this.states.get(name);
    if (!state) return;
    state.enabled = false;
    state.status = 'disabled';

    const timer = this.timers.get(name);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(name);
    }
  }

  getJobState(name: JobName): JobState | undefined {
    return this.states.get(name);
  }

  getJobHistory(name: JobName): JobExecution[] {
    return this.history.get(name) ?? [];
  }

  getStatus(): SchedulerStatus {
    const jobs = ALL_JOB_NAMES.map((name) => this.states.get(name)!);
    const totalExecutions = jobs.reduce((sum, j) => sum + j.totalExecutions, 0);
    const uptime = this.startedAt ? Date.now() - this.startedAt.getTime() : 0;

    return {
      running: this.running,
      jobs,
      uptime,
      totalExecutions,
    };
  }

  getResult(): SchedulerResult {
    return {
      status: this.getStatus(),
      metadata: {
        config: this.config,
        registeredJobs: Array.from(this.jobs.keys()),
        activeTimers: Array.from(this.timers.keys()),
      },
    };
  }

  onModuleDestroy(): void {
    this.stop();
  }

  private createExecution(name: JobName, success: boolean, error: string): JobExecution {
    return {
      jobName: name,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: 0,
      success,
      error,
      metadata: {},
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
