import { Injectable, Logger, Optional } from '@nestjs/common';
import { IJob, JobContext, JobResult } from './job.interface';
import { MacroService } from '../../macro/macro.service';
import { AlertEngine } from '../../alerts/engine/alert-engine.service';
import { PipelineOrchestratorService } from '../../pipeline-orchestrator/pipeline-orchestrator.service';

@Injectable()
export class AlertRefreshJob implements IJob {
  private readonly logger = new Logger(AlertRefreshJob.name);

  constructor(
    @Optional() private readonly macroService?: MacroService,
    @Optional() private readonly alertEngine?: AlertEngine,
    @Optional() private readonly pipelineOrchestrator?: PipelineOrchestratorService,
  ) {}

  async execute(ctx?: JobContext): Promise<JobResult> {
    this.logger.debug('AlertRefreshJob started');

    let totalAlerts = 0;
    const alertSources: string[] = [];

    try {
      if (this.macroService) {
        const macroAlerts = await this.macroService.getAlerts();
        totalAlerts += macroAlerts.length;
        alertSources.push(`macro:${macroAlerts.length}`);
      }

      if (this.alertEngine && this.pipelineOrchestrator) {
        const ranked = this.pipelineOrchestrator.getLastRanked();
        if (ranked.length > 0) {
          const alerts = await this.alertEngine.processRankedOpportunities(ranked);
          totalAlerts += alerts.length;
          alertSources.push(`opportunity:${alerts.length}`);
        }
      }

      this.logger.log(`AlertRefreshJob completed: ${totalAlerts} alerts from [${alertSources.join(', ')}]`);

      return {
        success: true,
        message: `Alert refresh completed: ${totalAlerts} alerts`,
        metadata: {
          alertCount: totalAlerts,
          alertSources,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Alert refresh failed: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {},
      };
    }
  }
}
