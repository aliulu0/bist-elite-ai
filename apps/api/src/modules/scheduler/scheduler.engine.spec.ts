import { SchedulerEngine } from './scheduler.engine';
import { DEFAULT_SCHEDULER_CONFIG, SchedulerConfig } from './scheduler.config';
import { JobName, JobExecution } from './scheduler.types';
import { IJob, JobResult } from './jobs/job.interface';

function makeNoRetryConfig(): Partial<SchedulerConfig> {
  const jobs = { ...DEFAULT_SCHEDULER_CONFIG.jobs } as Record<JobName, any>;
  for (const key of Object.keys(jobs)) {
    jobs[key as JobName] = { ...jobs[key as JobName], retryAttempts: 0, retryDelayMs: 0 };
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

class FailingJob implements IJob {
  private callCount = 0;

  async execute(): Promise<JobResult> {
    this.callCount++;
    throw new Error(`Fail #${this.callCount}`);
  }

  getCallCount(): number {
    return this.callCount;
  }
}

describe('SchedulerEngine', () => {
  let engine: SchedulerEngine;

  beforeEach(() => {
    engine = new SchedulerEngine(makeNoRetryConfig());
  });

  afterEach(() => {
    engine.stop();
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('registration', () => {
    it('should register jobs', () => {
      const job = new MockJob();
      engine.registerJob('marketOpenScan', job);
      expect(engine.getJobState('marketOpenScan')).toBeDefined();
    });

    it('should register multiple jobs', () => {
      const names: JobName[] = ['marketOpenScan', 'incrementalScan', 'nightlyBacktest'];
      for (const name of names) {
        engine.registerJob(name, new MockJob());
      }
      for (const name of names) {
        expect(engine.getJobState(name)).toBeDefined();
      }
    });
  });

  describe('start/stop', () => {
    it('should start scheduler', () => {
      expect(engine.getStatus().running).toBe(false);
      engine.start();
      expect(engine.getStatus().running).toBe(true);
    });

    it('should stop scheduler', () => {
      engine.start();
      engine.stop();
      expect(engine.getStatus().running).toBe(false);
    });

    it('should not start twice', () => {
      engine.start();
      engine.start();
      expect(engine.getStatus().running).toBe(true);
    });

    it('should handle stop when not running', () => {
      engine.stop();
      expect(engine.getStatus().running).toBe(false);
    });
  });

  describe('job execution', () => {
    it('should execute a registered job', async () => {
      const job = new MockJob();
      engine.registerJob('marketOpenScan', job);
      const execution = await engine.executeJob('marketOpenScan');
      expect(execution.success).toBe(true);
      expect(job.getCallCount()).toBe(1);
    });

    it('should record execution in history', async () => {
      const job = new MockJob();
      engine.registerJob('marketOpenScan', job);
      await engine.executeJob('marketOpenScan');
      const history = engine.getJobHistory('marketOpenScan');
      expect(history.length).toBe(1);
      expect(history[0].success).toBe(true);
    });

    it('should track total executions', async () => {
      const job = new MockJob();
      engine.registerJob('marketOpenScan', job);
      await engine.executeJob('marketOpenScan');
      await engine.executeJob('marketOpenScan');
      expect(engine.getJobState('marketOpenScan')!.totalExecutions).toBe(2);
    });

    it('should handle unregistered job', async () => {
      const execution = await engine.executeJob('marketOpenScan');
      expect(execution.success).toBe(false);
      expect(execution.error).toBe('Job not registered');
    });

    it('should handle disabled job', async () => {
      const job = new MockJob();
      engine.registerJob('marketOpenScan', job);
      engine.disableJob('marketOpenScan');
      const execution = await engine.executeJob('marketOpenScan');
      expect(execution.success).toBe(false);
      expect(execution.error).toBe('Job disabled');
      expect(job.getCallCount()).toBe(0);
    });

    it('should retry on failure', async () => {
      const job = new FailingJob();
      engine.registerJob('marketOpenScan', job);
      const execution = await engine.executeJob('marketOpenScan');
      expect(execution.success).toBe(false);
      expect(job.getCallCount()).toBe(1);
    });

    it('should handle job returning failure', async () => {
      const job = new MockJob({ success: false, message: 'Bad data', metadata: {} });
      engine.registerJob('marketOpenScan', job);
      const execution = await engine.executeJob('marketOpenScan');
      expect(execution.success).toBe(false);
      expect(execution.error).toBe('Bad data');
    });

    it('should update state after execution', async () => {
      const job = new MockJob();
      engine.registerJob('marketOpenScan', job);
      await engine.executeJob('marketOpenScan');
      const state = engine.getJobState('marketOpenScan');
      expect(state!.lastExecution).not.toBeNull();
      expect(state!.consecutiveFailures).toBe(0);
    });

    it('should track consecutive failures', async () => {
      const job = new MockJob({ success: false, message: 'fail', metadata: {} });
      engine.registerJob('marketOpenScan', job);
      await engine.executeJob('marketOpenScan');
      await engine.executeJob('marketOpenScan');
      expect(engine.getJobState('marketOpenScan')!.consecutiveFailures).toBe(2);
    });

    it('should disable job after max consecutive failures', async () => {
      const config: Partial<SchedulerConfig> = {
        ...makeNoRetryConfig(),
        maxConsecutiveFailures: 2,
      };
      engine = new SchedulerEngine(config);
      const job = new MockJob({ success: false, message: 'fail', metadata: {} });
      engine.registerJob('marketOpenScan', job);
      await engine.executeJob('marketOpenScan');
      await engine.executeJob('marketOpenScan');
      const state = engine.getJobState('marketOpenScan');
      expect(state!.status).toBe('disabled');
      expect(state!.enabled).toBe(false);
    });

    it('should reset consecutive failures on success', async () => {
      const job = new MockJob({ success: false, message: 'fail', metadata: {} });
      engine.registerJob('marketOpenScan', job);
      await engine.executeJob('marketOpenScan');
      expect(engine.getJobState('marketOpenScan')!.consecutiveFailures).toBe(1);
      job.setResult({ success: true, message: 'ok', metadata: {} });
      await engine.executeJob('marketOpenScan');
      expect(engine.getJobState('marketOpenScan')!.consecutiveFailures).toBe(0);
    });
  });

  describe('enable/disable', () => {
    it('should enable a disabled job', () => {
      engine.registerJob('marketOpenScan', new MockJob());
      engine.disableJob('marketOpenScan');
      expect(engine.getJobState('marketOpenScan')!.enabled).toBe(false);
      engine.enableJob('marketOpenScan');
      expect(engine.getJobState('marketOpenScan')!.enabled).toBe(true);
      expect(engine.getJobState('marketOpenScan')!.status).toBe('idle');
    });

    it('should disable an enabled job', () => {
      engine.registerJob('marketOpenScan', new MockJob());
      engine.disableJob('marketOpenScan');
      expect(engine.getJobState('marketOpenScan')!.enabled).toBe(false);
    });

    it('should handle enable/disable for unregistered job', () => {
      expect(() => engine.enableJob('marketOpenScan')).not.toThrow();
      expect(() => engine.disableJob('marketOpenScan')).not.toThrow();
    });
  });

  describe('history', () => {
    it('should limit history size', async () => {
      const config: Partial<SchedulerConfig> = {
        ...makeNoRetryConfig(),
        maxHistoryPerJob: 3,
      };
      engine = new SchedulerEngine(config);
      const job = new MockJob();
      engine.registerJob('marketOpenScan', job);

      for (let i = 0; i < 5; i++) {
        await engine.executeJob('marketOpenScan');
      }

      const history = engine.getJobHistory('marketOpenScan');
      expect(history.length).toBe(3);
    });

    it('should return empty history for unregistered job', () => {
      expect(engine.getJobHistory('marketOpenScan')).toEqual([]);
    });
  });

  describe('status', () => {
    it('should return status', () => {
      const status = engine.getStatus();
      expect(status.running).toBe(false);
      expect(status.jobs).toBeDefined();
      expect(status.totalExecutions).toBe(0);
    });

    it('should count total executions', async () => {
      engine.registerJob('marketOpenScan', new MockJob());
      engine.registerJob('incrementalScan', new MockJob());
      await engine.executeJob('marketOpenScan');
      await engine.executeJob('incrementalScan');
      expect(engine.getStatus().totalExecutions).toBe(2);
    });
  });

  describe('lifecycle', () => {
    it('should clean up on module destroy', () => {
      engine.registerJob('marketOpenScan', new MockJob());
      engine.start();
      engine.onModuleDestroy();
      expect(engine.getStatus().running).toBe(false);
    });
  });

  describe('concurrent execution prevention', () => {
    it('should skip if job already running', async () => {
      let resolve!: () => void;
      const blocking = new Promise<void>((r) => { resolve = r; });
      const slowJob: IJob = {
        execute: async () => {
          await blocking;
          return { success: true, message: 'done', metadata: {} };
        },
      };
      engine.registerJob('marketOpenScan', slowJob);
      const p1 = engine.executeJob('marketOpenScan');
      const exec2 = await engine.executeJob('marketOpenScan');
      expect(exec2.success).toBe(false);
      expect(exec2.error).toBe('Already running');
      resolve();
      await p1;
    });
  });
});
