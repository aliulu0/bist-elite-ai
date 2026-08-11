import { Injectable, Logger, Optional } from '@nestjs/common';
import { IJob, JobContext, JobResult } from './job.interface';
import { PipelineOrchestratorService } from '../../pipeline-orchestrator/pipeline-orchestrator.service';

@Injectable()
export class FullPipelineRunJob implements IJob {
  private readonly logger = new Logger(FullPipelineRunJob.name);

  constructor(
    @Optional() private readonly pipelineOrchestrator?: PipelineOrchestratorService,
  ) {}

  async execute(ctx?: JobContext): Promise<JobResult> {
    this.logger.debug('FullPipelineRunJob started');

    if (!this.pipelineOrchestrator) {
      this.logger.warn('PipelineOrchestratorService not available');
      return {
        success: false,
        message: 'PipelineOrchestratorService not available',
        metadata: { timestamp: new Date().toISOString() },
      };
    }

    try {
      const result = await this.pipelineOrchestrator.runFullPipeline({
        source: 'scheduler',
        jobRunId: `pipeline-${Date.now()}`,
      });

      const completedSteps = result.steps.filter((s) => s.status === 'completed').length;
      const failedSteps = result.steps.filter((s) => s.status === 'failed').length;

      this.logger.log(
        `FullPipelineRunJob completed: ${completedSteps}/${result.steps.length} steps succeeded, ${failedSteps} failed`,
      );

      return {
        success: failedSteps === 0,
        message: `Pipeline run completed: ${completedSteps}/${result.steps.length} steps OK`,
        metadata: {
          pipelineId: result.metadata?.pipelineId as string ?? `pipeline-${Date.now()}`,
          completedSteps,
          failedSteps,
          totalSteps: result.steps.length,
          durationMs: result.steps.reduce((sum, s) => sum + s.durationMs, 0),
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Full pipeline run failed: ${error instanceof Error ? error.message : String(error)}`,
        metadata: { timestamp: new Date().toISOString() },
      };
    }
  }
}
