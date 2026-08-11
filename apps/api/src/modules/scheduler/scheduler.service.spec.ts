import { SchedulerService } from './scheduler.service';
import { SchedulerEngine } from './scheduler.engine';
import { JobName } from './scheduler.types';
import { IJob, JobResult } from './jobs/job.interface';

function makeNoRetryConfig() {
  const jobs: Record<string, any> = {};
  for (const name of [
    'marketOpenScan', 'incrementalScan', 'nightlyBacktest', 'benchmark',
    'ruleAnalytics', 'weightOptimization', 'cacheRefresh', 'providerHealthCheck',
    'macroRefresh', 'portfolioRefresh', 'alertRefresh', 'retryFailedJobs',
  ]) {
    jobs[name] = { enabled: true, intervalMs: 900000, retryAttempts: 0, retryDelayMs: 0 };
  }
  return { jobs, maxConsecutiveFailures: 5, maxHistoryPerJob: 100 };
}

class MockJob implements IJob {
  private result: JobResult;
  private callCount = 0;

  constructor(result: JobResult = { success: true, message: 'ok', metadata: {} }) {
    this.result = result;
  }

  async execute(): Promise<JobResult> {
    this.callCount++;
    return this.result;
  }

  getCallCount(): number {
    return this.callCount;
  }

  setResult(result: JobResult): void {
    this.result = result;
  }
}

describe('SchedulerService', () => {
  let service: SchedulerService;
  let engine: SchedulerEngine;

  beforeEach(() => {
    engine = new SchedulerEngine(makeNoRetryConfig());
    service = new SchedulerService(engine);
  });

  afterEach(() => {
    engine.stop();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStatus', () => {
    it('should return scheduler status', () => {
      const status = service.getStatus();
      expect(status.running).toBe(false);
      expect(status.jobs).toHaveLength(17);
      expect(status.totalExecutions).toBe(0);
    });

    it('should reflect running state', () => {
      engine.start();
      const status = service.getStatus();
      expect(status.running).toBe(true);
    });
  });

  describe('getJobState', () => {
    it('should return state for valid job', () => {
      const state = service.getJobState('marketOpenScan');
      expect(state).toBeDefined();
      expect(state!.jobName).toBe('marketOpenScan');
    });

    it('should return undefined for invalid job', () => {
      const state = service.getJobState('nonexistent' as JobName);
      expect(state).toBeUndefined();
    });
  });

  describe('getJobHistory', () => {
    it('should return empty history initially', () => {
      const history = service.getJobHistory('marketOpenScan');
      expect(history).toEqual([]);
    });

    it('should return history after execution', async () => {
      engine.registerJob('marketOpenScan', new MockJob());
      await service.executeJob('marketOpenScan');
      const history = service.getJobHistory('marketOpenScan');
      expect(history.length).toBe(1);
    });

    it('should respect limit parameter', async () => {
      engine.registerJob('marketOpenScan', new MockJob());
      await service.executeJob('marketOpenScan');
      await service.executeJob('marketOpenScan');
      await service.executeJob('marketOpenScan');
      const history = service.getJobHistory('marketOpenScan', 2);
      expect(history.length).toBe(2);
    });
  });

  describe('executeJob', () => {
    it('should execute a registered job', async () => {
      const job = new MockJob();
      engine.registerJob('marketOpenScan', job);
      const execution = await service.executeJob('marketOpenScan');
      expect(execution.success).toBe(true);
      expect(job.getCallCount()).toBe(1);
    });

    it('should return execution result', async () => {
      const job = new MockJob({ success: false, message: 'Bad data', metadata: {} });
      engine.registerJob('marketOpenScan', job);
      const execution = await service.executeJob('marketOpenScan');
      expect(execution.success).toBe(false);
      expect(execution.error).toBe('Bad data');
    });

    it('should handle unregistered job', async () => {
      const execution = await service.executeJob('marketOpenScan');
      expect(execution.success).toBe(false);
      expect(execution.error).toBe('Job not registered');
    });
  });

  describe('startScheduler', () => {
    it('should start the scheduler', () => {
      const result = service.startScheduler();
      expect(result.running).toBe(true);
      expect(result.activeJobs).toBeGreaterThanOrEqual(0);
    });

    it('should count active jobs', () => {
      const result = service.startScheduler();
      expect(typeof result.activeJobs).toBe('number');
    });
  });

  describe('stopScheduler', () => {
    it('should stop the scheduler', () => {
      engine.start();
      const result = service.stopScheduler();
      expect(result.running).toBe(false);
    });

    it('should handle stop when already stopped', () => {
      const result = service.stopScheduler();
      expect(result.running).toBe(false);
    });
  });

  describe('enableJob', () => {
    it('should enable a disabled job', () => {
      engine.registerJob('marketOpenScan', new MockJob());
      engine.disableJob('marketOpenScan');
      const state = service.enableJob('marketOpenScan');
      expect(state).toBeDefined();
      expect(state!.enabled).toBe(true);
    });

    it('should return undefined for invalid job', () => {
      const state = service.enableJob('nonexistent' as JobName);
      expect(state).toBeUndefined();
    });
  });

  describe('disableJob', () => {
    it('should disable an enabled job', () => {
      engine.registerJob('marketOpenScan', new MockJob());
      const state = service.disableJob('marketOpenScan');
      expect(state).toBeDefined();
      expect(state!.enabled).toBe(false);
    });

    it('should return undefined for invalid job', () => {
      const state = service.disableJob('nonexistent' as JobName);
      expect(state).toBeUndefined();
    });
  });
});
