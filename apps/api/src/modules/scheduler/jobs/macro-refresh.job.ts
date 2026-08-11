import { Injectable, Logger } from '@nestjs/common';
import { IJob, JobContext, JobResult } from './job.interface';
import { MacroService } from '../../macro/macro.service';

@Injectable()
export class MacroRefreshJob implements IJob {
  private readonly logger = new Logger(MacroRefreshJob.name);

  constructor(private readonly macroService: MacroService) {}

  async execute(ctx?: JobContext): Promise<JobResult> {
    this.logger.debug('MacroRefreshJob started');

    try {
      const analysis = await this.macroService.getFullAnalysis();
      const alerts = await this.macroService.getAlerts();

      this.logger.log(
        `MacroRefreshJob completed: ${analysis.data.healthyCount}/${analysis.data.sourceCount} sources healthy, regime: ${analysis.regime.regime}, score: ${analysis.score.macroScore}`,
      );

      return {
        success: true,
        message: `Macro data refreshed: ${analysis.data.healthyCount} sources, regime: ${analysis.regime.regime}, score: ${analysis.score.macroScore}`,
        metadata: {
          sourceCount: analysis.data.sourceCount,
          healthyCount: analysis.data.healthyCount,
          regime: analysis.regime.regime,
          macroScore: analysis.score.macroScore,
          alertCount: alerts.length,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Macro refresh failed: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {},
      };
    }
  }
}
