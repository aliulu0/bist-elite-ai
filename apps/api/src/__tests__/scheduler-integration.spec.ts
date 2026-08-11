import { SchedulerEngine } from '../modules/scheduler/scheduler.engine';
import { DEFAULT_SCHEDULER_CONFIG } from '../modules/scheduler/scheduler.config';
import { IJob, JobResult } from '../modules/scheduler/jobs/job.interface';
import { JobName } from '../modules/scheduler/scheduler.types';

function makeJob(success = true, message = 'OK'): IJob {
  return {
    execute: jest.fn().mockResolvedValue({ success, message, metadata: {} } as JobResult),
  };
}

function makeFailingJob(failCount: number): IJob {
  let callCount = 0;
  return {
    execute: jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount <= failCount) {
        return Promise.resolve({ success: false, message: `fail-${callCount}`, metadata: {} });
      }
      return Promise.resolve({ success: true, message: 'recovered', metadata: {} });
    }),
  };
}

describe('SchedulerEngine Integration', () => {
  let engine: SchedulerEngine;

  beforeEach(() => {
    jest.useFakeTimers();
    engine = new SchedulerEngine({
      maxConsecutiveFailures: 3,
      jobs: {
        ...DEFAULT_SCHEDULER_CONFIG.jobs,
        marketOpenScan: { enabled: true, intervalMs: 1000, retryAttempts: 0, retryDelayMs: 0 },
        incrementalScan: { enabled: false, intervalMs: 5000, retryAttempts: 0, retryDelayMs: 0 },
      },
    });
  });

  afterEach(() => {
    engine.stop();
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with job states from config', () => {
      const status = engine.getStatus();
      const expectedCount = Object.keys(DEFAULT_SCHEDULER_CONFIG.jobs).length;
      expect(status.jobs).toHaveLength(expectedCount);
      expect(status.running).toBe(false);
      expect(status.totalExecutions).toBe(0);
    });

    it('should set correct initial state for each job', () => {
      const status = engine.getStatus();
      const marketJob = status.jobs.find(j => j.jobName === 'marketOpenScan');
      expect(marketJob).toBeDefined();
      expect(marketJob!.enabled).toBe(true);
      expect(marketJob!.status).toBe('idle');
      expect(marketJob!.totalExecutions).toBe(0);
      expect(marketJob!.consecutiveFailures).toBe(0);
      expect(marketJob!.lastExecution).toBeNull();
    });

    it('should mark disabled jobs correctly', () => {
      const status = engine.getStatus();
      const disabledJob = status.jobs.find(j => j.jobName === 'incrementalScan');
      expect(disabledJob!.enabled).toBe(false);
      expect(disabledJob!.status).toBe('disabled');
    });
  });

  describe('Job registration', () => {
    it('should register a job', () => {
      const job = makeJob();
      engine.registerJob('marketOpenScan', job);
      const result = engine.getResult();
      expect(result.metadata.registeredJobs).toContain('marketOpenScan');
    });
  });

  describe('Manual job execution', () => {
    it('should execute a registered job', async () => {
      const job = makeJob();
      engine.registerJob('marketOpenScan', job);

      const execution = await engine.executeJob('marketOpenScan');

      expect(execution.success).toBe(true);
      expect(execution.jobName).toBe('marketOpenScan');
      expect(execution.durationMs).toBeGreaterThanOrEqual(0);
      expect(execution.error).toBeNull();
      expect(job.execute).toHaveBeenCalledTimes(1);
    });

    it('should return failure for unregistered jobs', async () => {
      const execution = await engine.executeJob('marketOpenScan');

      expect(execution.success).toBe(false);
      expect(execution.error).toBe('Job not registered');
    });

    it('should return failure for disabled jobs', async () => {
      const job = makeJob();
      engine.registerJob('marketOpenScan', job);
      engine.disableJob('marketOpenScan');

      const execution = await engine.executeJob('marketOpenScan');

      expect(execution.success).toBe(false);
      expect(execution.error).toBe('Job disabled');
    });

    it('should update job state after execution', async () => {
      const job = makeJob();
      engine.registerJob('marketOpenScan', job);

      await engine.executeJob('marketOpenScan');

      const state = engine.getJobState('marketOpenScan');
      expect(state!.totalExecutions).toBe(1);
      expect(state!.status).toBe('idle');
      expect(state!.lastExecution).not.toBeNull();
      expect(state!.lastExecution!.success).toBe(true);
    });

    it('should increment execution count on failure', async () => {
      const job = makeJob(false);
      engine.registerJob('marketOpenScan', job);

      await engine.executeJob('marketOpenScan');

      const state = engine.getJobState('marketOpenScan');
      expect(state!.totalExecutions).toBe(1);
      expect(state!.status).toBe('failed');
      expect(state!.consecutiveFailures).toBe(1);
    });
  });

  describe('Concurrent execution prevention', () => {
    it('should skip concurrent execution of the same job', async () => {
      let resolveFirst!: (value: JobResult) => void;
      const blockingJob: IJob = {
        execute: () => new Promise<JobResult>(r => { resolveFirst = r; }) as any,
      };
      engine.registerJob('marketOpenScan', blockingJob);

      const p1 = engine.executeJob('marketOpenScan');
      const p2 = engine.executeJob('marketOpenScan');

      resolveFirst({ success: true, message: 'done', metadata: {} });

      const [e1, e2] = await Promise.all([p1, p2]);
      expect(e1.success).toBe(true);
      expect(e2.success).toBe(false);
      expect(e2.error).toBe('Already running');
    });
  });

  describe('Retry logic', () => {
    it('should retry failed jobs up to retryAttempts', async () => {
      jest.useRealTimers();
      const retryEngine = new SchedulerEngine({
        maxConsecutiveFailures: 10,
        jobs: {
          ...DEFAULT_SCHEDULER_CONFIG.jobs,
          marketOpenScan: { enabled: true, intervalMs: 1000, retryAttempts: 2, retryDelayMs: 0 },
        },
      });

      const job = makeFailingJob(2);
      retryEngine.registerJob('marketOpenScan', job);

      const execution = await retryEngine.executeJob('marketOpenScan');

      expect(execution.success).toBe(true);
      expect(job.execute).toHaveBeenCalledTimes(3);
      retryEngine.stop();
      jest.useFakeTimers();
    });

    it('should fail after exhausting all retries', async () => {
      jest.useRealTimers();
      const retryEngine = new SchedulerEngine({
        maxConsecutiveFailures: 10,
        jobs: {
          ...DEFAULT_SCHEDULER_CONFIG.jobs,
          marketOpenScan: { enabled: true, intervalMs: 1000, retryAttempts: 1, retryDelayMs: 0 },
        },
      });

      const job = makeJob(false);
      retryEngine.registerJob('marketOpenScan', job);

      const execution = await retryEngine.executeJob('marketOpenScan');

      expect(execution.success).toBe(false);
      expect(job.execute).toHaveBeenCalledTimes(2);
      retryEngine.stop();
      jest.useFakeTimers();
    });
  });

  describe('Auto-disable on consecutive failures', () => {
    it('should disable job after maxConsecutiveFailures', async () => {
      const job = makeJob(false);
      engine.registerJob('marketOpenScan', job);

      for (let i = 0; i < 3; i++) {
        await engine.executeJob('marketOpenScan');
      }

      const state = engine.getJobState('marketOpenScan');
      expect(state!.enabled).toBe(false);
      expect(state!.status).toBe('disabled');
      expect(state!.consecutiveFailures).toBe(3);
    });

    it('should reset consecutive failures on success', async () => {
      let callCount = 0;
      const job: IJob = {
        execute: jest.fn().mockImplementation(() => {
          callCount++;
          const succeeds = callCount === 2;
          return Promise.resolve({
            success: succeeds,
            message: `call-${callCount}`,
            metadata: {},
          });
        }),
      };
      engine.registerJob('marketOpenScan', job);

      await engine.executeJob('marketOpenScan'); // callCount=1, fail
      expect(engine.getJobState('marketOpenScan')!.consecutiveFailures).toBe(1);

      await engine.executeJob('marketOpenScan'); // callCount=2, success
      expect(engine.getJobState('marketOpenScan')!.consecutiveFailures).toBe(0);
    });
  });

  describe('Execution history', () => {
    it('should track execution history', async () => {
      const job = makeJob();
      engine.registerJob('marketOpenScan', job);

      await engine.executeJob('marketOpenScan');
      await engine.executeJob('marketOpenScan');

      const history = engine.getJobHistory('marketOpenScan');
      expect(history).toHaveLength(2);
      expect(history[0].jobName).toBe('marketOpenScan');
      expect(history[1].jobName).toBe('marketOpenScan');
    });

    it('should cap history at maxHistoryPerJob', async () => {
      const cappedEngine = new SchedulerEngine({
        maxHistoryPerJob: 5,
        maxConsecutiveFailures: 100,
        jobs: DEFAULT_SCHEDULER_CONFIG.jobs,
      });

      const job = makeJob();
      cappedEngine.registerJob('marketOpenScan', job);

      for (let i = 0; i < 10; i++) {
        await cappedEngine.executeJob('marketOpenScan');
      }

      const history = cappedEngine.getJobHistory('marketOpenScan');
      expect(history).toHaveLength(5);
      cappedEngine.stop();
    });

    it('should return empty history for unexecuted jobs', () => {
      const history = engine.getJobHistory('marketOpenScan');
      expect(history).toEqual([]);
    });
  });

  describe('Enable/Disable lifecycle', () => {
    it('should enable and disable jobs', () => {
      engine.disableJob('marketOpenScan');
      expect(engine.getJobState('marketOpenScan')!.enabled).toBe(false);
      expect(engine.getJobState('marketOpenScan')!.status).toBe('disabled');

      engine.enableJob('marketOpenScan');
      expect(engine.getJobState('marketOpenScan')!.enabled).toBe(true);
      expect(engine.getJobState('marketOpenScan')!.status).toBe('idle');
    });

    it('should reset consecutiveFailures on enable', async () => {
      const job = makeJob(false);
      engine.registerJob('marketOpenScan', job);

      await engine.executeJob('marketOpenScan');
      await engine.executeJob('marketOpenScan');
      await engine.executeJob('marketOpenScan');

      engine.enableJob('marketOpenScan');
      expect(engine.getJobState('marketOpenScan')!.consecutiveFailures).toBe(0);
    });
  });

  describe('Start/Stop lifecycle', () => {
    it('should start and set running state', () => {
      engine.registerJob('marketOpenScan', makeJob());
      engine.start();
      expect(engine.getStatus().running).toBe(true);
    });

    it('should stop and clear timers', () => {
      engine.registerJob('marketOpenScan', makeJob());
      engine.start();
      engine.stop();
      expect(engine.getStatus().running).toBe(false);
    });

    it('should ignore duplicate start calls', () => {
      engine.registerJob('marketOpenScan', makeJob());
      engine.start();
      engine.start(); // second call
      expect(engine.getStatus().running).toBe(true);
    });

    it('should ignore stop when not running', () => {
      engine.stop(); // not started
      expect(engine.getStatus().running).toBe(false);
    });

    it('should execute jobs on timer interval', () => {
      const job = makeJob();
      engine.registerJob('marketOpenScan', job);

      engine.start();
      jest.advanceTimersByTime(1100);

      expect(job.execute).toHaveBeenCalledTimes(1);
    });

    it('should stop executing after stop()', () => {
      const job = makeJob();
      engine.registerJob('marketOpenScan', job);

      engine.start();
      jest.advanceTimersByTime(500);
      engine.stop();
      jest.advanceTimersByTime(1000);

      expect(job.execute).toHaveBeenCalledTimes(0);
    });

    it('should clean up on module destroy', () => {
      engine.registerJob('marketOpenScan', makeJob());
      engine.start();
      engine.onModuleDestroy();
      expect(engine.getStatus().running).toBe(false);
    });
  });

  describe('getResult()', () => {
    it('should return full scheduler result with metadata', () => {
      const job = makeJob();
      engine.registerJob('marketOpenScan', job);

      const result = engine.getResult();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('config');
      expect(result.metadata).toHaveProperty('registeredJobs');
      expect(result.metadata).toHaveProperty('activeTimers');
      expect(Array.isArray(result.metadata.registeredJobs as string[])).toBe(true);
    });
  });
});
