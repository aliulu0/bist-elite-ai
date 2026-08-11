import { Injectable, Logger } from '@nestjs/common';
import { IJob, JobContext, JobResult } from './job.interface';
import { SchedulerEngine } from '../scheduler.engine';

@Injectable()
export class RetryFailedJobsJob implements IJob {
  private readonly logger = new Logger(RetryFailedJobsJob.name);

  constructor(private readonly scheduler: SchedulerEngine) {}

  async execute(ctx?: JobContext): Promise<JobResult> {
    this.logger.debug('RetryFailedJobsJob started');

    try {
      const status = this.scheduler.getStatus();
      const failedJobs = status.jobs.filter((j) => j.status === 'failed' && j.enabled);
      const retried: string[] = [];

      for (const job of failedJobs) {
        this.logger.log(`Retrying failed job: ${job.jobName}`);
        this.scheduler.enableJob(job.jobName);
        const result = await this.scheduler.executeJob(job.jobName);
        if (result.success) {
          retried.push(job.jobName);
        }
      }

      this.logger.log(`RetryFailedJobsJob completed: ${retried.length}/${failedJobs.length} retried successfully`);

      return {
        success: true,
        message: `Retried ${retried.length}/${failedJobs.length} failed jobs`,
        metadata: {
          totalFailed: failedJobs.length,
          successfullyRetried: retried.length,
          retried,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Retry failed jobs job failed: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {},
      };
    }
  }
}
