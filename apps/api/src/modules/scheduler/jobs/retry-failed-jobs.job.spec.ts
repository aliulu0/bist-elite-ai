import { RetryFailedJobsJob } from './retry-failed-jobs.job';
import { SchedulerEngine } from '../scheduler.engine';
import { DEFAULT_SCHEDULER_CONFIG } from '../scheduler.config';
import { JobName } from '../scheduler.types';

function makeNoRetryConfig() {
  const jobs = { ...DEFAULT_SCHEDULER_CONFIG.jobs } as Record<JobName, any>;
  for (const key of Object.keys(jobs)) {
    jobs[key as JobName] = { ...jobs[key as JobName], retryAttempts: 0, retryDelayMs: 0 };
  }
  return { jobs, maxConsecutiveFailures: 5, maxHistoryPerJob: 100 };
}

describe('RetryFailedJobsJob', () => {
  it('should execute successfully when no failed jobs exist', async () => {
    const engine = new SchedulerEngine(makeNoRetryConfig());
    // register a simple job to avoid empty scheduler
    const job = new RetryFailedJobsJob(engine);
    const result = await job.execute();
    expect(result.success).toBe(true);
    expect(result.metadata).toHaveProperty('totalFailed');
    expect(result.metadata).toHaveProperty('successfullyRetried');
  });

  it('should include timestamp in metadata', async () => {
    const engine = new SchedulerEngine(makeNoRetryConfig());
    const job = new RetryFailedJobsJob(engine);
    const result = await job.execute();
    expect(result.metadata).toHaveProperty('timestamp');
  });
});
