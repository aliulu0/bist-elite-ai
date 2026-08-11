import { Injectable, Logger } from '@nestjs/common';
import { IJob, JobContext, JobResult } from './job.interface';
import { ResearchIntelligenceService } from '../../research/research-intelligence.service';

@Injectable()
export class ResearchRefreshJob implements IJob {
  private readonly logger = new Logger(ResearchRefreshJob.name);

  constructor(private readonly researchIntelligence: ResearchIntelligenceService) {}

  async execute(ctx?: JobContext): Promise<JobResult> {
    this.logger.debug('ResearchRefreshJob started');

    try {
      const dashboard = await this.researchIntelligence.refreshResearch();

      this.logger.log(
        `ResearchRefreshJob completed: ${dashboard.latestResearch.length} evidence items, ${dashboard.catalysts.length} catalysts, score: ${dashboard.researchScore?.score ?? 0}`,
      );

      return {
        success: true,
        message: `Research intelligence refreshed: ${dashboard.latestResearch.length} items, ${dashboard.catalysts.length} catalysts, score: ${dashboard.researchScore?.score ?? 0}`,
        metadata: {
          researchItems: dashboard.latestResearch.length,
          catalysts: dashboard.catalysts.length,
          researchScore: dashboard.researchScore?.score ?? 0,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Research refresh failed: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {},
      };
    }
  }
}
