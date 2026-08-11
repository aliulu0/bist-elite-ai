import { Injectable, Logger } from '@nestjs/common';
import { IJob, JobContext, JobResult } from './job.interface';
import { ResearchIntelligenceService } from '../../research/research-intelligence.service';
import { SymbolRegistryService } from '../../market-data/symbol-registry/symbol-registry.service';

@Injectable()
export class CompanyResearchJob implements IJob {
  private readonly logger = new Logger(CompanyResearchJob.name);

  constructor(
    private readonly researchIntelligence: ResearchIntelligenceService,
    private readonly symbolRegistry: SymbolRegistryService,
  ) {}

  async execute(ctx?: JobContext): Promise<JobResult> {
    this.logger.debug('CompanyResearchJob started');

    try {
      const tickers = this.symbolRegistry.getActiveSymbols().map((symbol) => symbol.canonicalTicker);
      const result = await this.researchIntelligence.refreshCompanyResearch(tickers);

      this.logger.log(
        `CompanyResearchJob completed: ${result.refreshed}/${tickers.length} companies refreshed, ${result.failed} failed`,
      );

      return {
        success: result.failed === 0,
        message: `Company research refreshed: ${result.refreshed}/${tickers.length} companies, ${result.failed} failed`,
        metadata: {
          total: tickers.length,
          refreshed: result.refreshed,
          failed: result.failed,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Company research failed: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {},
      };
    }
  }
}
