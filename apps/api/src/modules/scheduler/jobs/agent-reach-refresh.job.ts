import { Injectable, Logger } from '@nestjs/common';
import { IJob, JobContext, JobResult } from './job.interface';
import { ResearchRepository } from '../../research/research-repository.service';
import { AgentReachProvider } from '../../research/providers/agent-reach.provider';
import { SymbolRegistryService } from '../../market-data/symbol-registry/symbol-registry.service';

@Injectable()
export class AgentReachRefreshJob implements IJob {
  private readonly logger = new Logger(AgentReachRefreshJob.name);

  constructor(
    private readonly agentReach: AgentReachProvider,
    private readonly researchRepository: ResearchRepository,
    private readonly symbolRegistry: SymbolRegistryService,
  ) {}

  async execute(ctx?: JobContext): Promise<JobResult> {
    this.logger.debug('AgentReachRefreshJob started');

    try {
      const tickers = this.symbolRegistry.getActiveSymbols().map((symbol) => symbol.canonicalTicker);
      let refreshed = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const ticker of tickers) {
        try {
          const result = await this.agentReach.getCompanyResearch(ticker);
          if (result) {
            await this.researchRepository.setCompanyResearch(ticker, result);
            refreshed++;
          } else {
            failed++;
            errors.push(`No result for ${ticker}`);
          }
        } catch (error) {
          failed++;
          const msg = error instanceof Error ? error.message : String(error);
          errors.push(`${ticker}: ${msg}`);
          this.logger.warn(`Agent reach refresh failed for ${ticker}: ${msg}`);
        }
      }

      this.logger.log(
        `AgentReachRefreshJob completed: ${refreshed}/${tickers.length} companies refreshed, ${failed} failed`,
      );

      return {
        success: failed === 0,
        message: `Agent reach research refreshed: ${refreshed}/${tickers.length} companies, ${failed} failed`,
        metadata: {
          total: tickers.length,
          refreshed,
          failed,
          errors: errors.slice(0, 10),
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Agent reach refresh failed: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {},
      };
    }
  }
}