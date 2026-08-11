import { Injectable, Logger, Optional } from '@nestjs/common';
import { SchedulerEngine } from './scheduler.engine';
import { JobName, JobExecution, JobState, SchedulerStatus } from './scheduler.types';
import { PersistenceService } from '../persistence/persistence.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly engine: SchedulerEngine,
    @Optional() private readonly persistenceService?: PersistenceService,
  ) {}

  getStatus(): SchedulerStatus {
    return this.engine.getStatus();
  }

  getJobState(jobName: JobName): JobState | undefined {
    return this.engine.getJobState(jobName);
  }

  getJobHistory(jobName: JobName, limit = 50): JobExecution[] {
    const history = this.engine.getJobHistory(jobName);
    return history.slice(-limit);
  }

  async executeJob(jobName: JobName): Promise<JobExecution> {
    this.logger.debug(`Manual execution requested for: ${jobName}`);
    const execution = await this.engine.executeJob(jobName);

    if (this.persistenceService) {
      const meta = execution.metadata as Record<string, unknown>;
      const symbolsProcessed = typeof meta?.symbolsScanned === 'number' ? meta.symbolsScanned : 0;
      const symbolsSucceeded = typeof meta?.successCount === 'number' ? meta.successCount : 0;
      const symbolsFailed = typeof meta?.failCount === 'number' ? meta.failCount : 0;

      this.persistenceService.saveJobRun({
        jobName,
        status: execution.success ? 'completed' : 'failed',
        symbolsProcessed,
        symbolsSucceeded,
        symbolsFailed,
        durationMs: execution.durationMs,
        error: execution.error,
        metadata: execution.metadata,
        startedAt: new Date(execution.startedAt),
        completedAt: execution.completedAt ? new Date(execution.completedAt) : null,
      }).catch((err) => {
        this.logger.warn(`Failed to persist job run for ${jobName}: ${err instanceof Error ? err.message : String(err)}`);
      });
    }

    return execution;
  }

  startScheduler(): { running: boolean; activeJobs: number } {
    this.engine.start();
    const status = this.engine.getStatus();
    return { running: status.running, activeJobs: status.jobs.filter((j) => j.enabled).length };
  }

  stopScheduler(): { running: boolean } {
    this.engine.stop();
    return { running: false };
  }

  enableJob(jobName: JobName): JobState | undefined {
    this.engine.enableJob(jobName);
    return this.engine.getJobState(jobName);
  }

  disableJob(jobName: JobName): JobState | undefined {
    this.engine.disableJob(jobName);
    return this.engine.getJobState(jobName);
  }
}
