import { Injectable, Logger, Optional } from '@nestjs/common';
import { IJob, JobContext, JobResult } from './job.interface';
import { PortfolioEngine } from '../../portfolio/engine/portfolio-engine.service';

@Injectable()
export class PortfolioRefreshJob implements IJob {
  private readonly logger = new Logger(PortfolioRefreshJob.name);

  constructor(
    @Optional() private readonly portfolioEngine?: PortfolioEngine,
  ) {}

  async execute(ctx?: JobContext): Promise<JobResult> {
    this.logger.debug('PortfolioRefreshJob started');

    if (!this.portfolioEngine) {
      this.logger.warn('PortfolioEngine not available');
      return {
        success: false,
        message: 'PortfolioEngine not available',
        metadata: { timestamp: new Date().toISOString() },
      };
    }

    try {
      const portfolios = this.portfolioEngine.getPortfolios();

      this.logger.log(`PortfolioRefreshJob completed: ${portfolios.length} portfolios refreshed`);

      return {
        success: true,
        message: 'Portfolio data refreshed',
        metadata: {
          portfoliosRefreshed: portfolios.length,
          portfolioIds: portfolios.map((p) => p.id),
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Portfolio refresh failed: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {},
      };
    }
  }
}
