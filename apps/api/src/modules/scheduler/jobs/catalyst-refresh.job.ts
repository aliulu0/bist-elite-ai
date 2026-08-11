import { Injectable, Logger } from '@nestjs/common';
import { IJob, JobContext, JobResult } from './job.interface';
import { CatalystEngineService } from '../../research/catalyst-engine.service';
import { CatalystRepository } from '../../research/catalyst-repository.service';
import { VerificationEngine } from '../../research/verification-engine.service';
import { AgentReachProvider } from '../../research/providers/agent-reach.provider';
import { SymbolRegistryService } from '../../market-data/symbol-registry/symbol-registry.service';
import { ResearchEvidenceDto } from '../../research/verified-evidence.dto';
import { VerifiedEvidenceDto } from '../../research/verified-evidence.dto';

@Injectable()
export class CatalystRefreshJob implements IJob {
  private readonly logger = new Logger(CatalystRefreshJob.name);

  constructor(
    private readonly catalystEngine: CatalystEngineService,
    private readonly catalystRepository: CatalystRepository,
    private readonly verificationEngine: VerificationEngine,
    private readonly agentReach: AgentReachProvider,
    private readonly symbolRegistry: SymbolRegistryService,
  ) {}

  async execute(ctx?: JobContext): Promise<JobResult> {
    this.logger.debug('CatalystRefreshJob started');

    try {
      const tickers = this.symbolRegistry.getActiveSymbols().map((symbol) => symbol.canonicalTicker);
      let detected = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const ticker of tickers) {
        try {
          const agentReachResult = await this.agentReach.getCompanyResearch(ticker);
          if (!agentReachResult) {
            failed++;
            errors.push(`No agent reach result for ${ticker}`);
            continue;
          }

          const evidenceDto: ResearchEvidenceDto = {
            ticker: agentReachResult.ticker,
            companyName: agentReachResult.companyName,
            sector: agentReachResult.sector,
            officialWebsite: agentReachResult.officialWebsite ?? undefined,
            investorRelationsUrl: agentReachResult.investorRelationsUrl ?? undefined,
            annualReports: agentReachResult.annualReports,
            quarterlyReports: agentReachResult.quarterlyReports,
            investorPresentations: agentReachResult.investorPresentations,
            sustainabilityReports: agentReachResult.sustainabilityReports,
            governanceDocuments: agentReachResult.governanceDocuments,
            esgReports: agentReachResult.esgReports,
            pressReleases: agentReachResult.pressReleases,
            newsUrls: agentReachResult.newsUrls,
            rssUrls: agentReachResult.rssUrls,
            sources: agentReachResult.sources,
            evidenceCount: agentReachResult.evidenceCount,
            officialCount: agentReachResult.officialCount,
            discoveredAt: agentReachResult.discoveredAt,
            expiresAt: agentReachResult.expiresAt,
          };

          const verificationResult = this.verificationEngine.verify(evidenceDto);
          const catalystResults = this.catalystEngine.verify(verificationResult);

          await this.catalystRepository.setCatalysts(ticker, catalystResults);
          detected += catalystResults.length;
        } catch (error) {
          failed++;
          const msg = error instanceof Error ? error.message : String(error);
          errors.push(`${ticker}: ${msg}`);
          this.logger.warn(`Catalyst detection failed for ${ticker}: ${msg}`);
        }
      }

      const allCatalysts = await this.catalystRepository.getDashboard();
      const dashboard = this.catalystEngine.buildDashboard(allCatalysts?.catalysts ?? []);
      await this.catalystRepository.setDashboard(dashboard);

      this.logger.log(
        `CatalystRefreshJob completed: ${detected} catalysts detected across ${tickers.length} companies, ${failed} failed`,
      );

      return {
        success: failed === 0,
        message: `Catalyst refresh completed: ${detected} catalysts detected, ${failed} failed`,
        metadata: {
          total: tickers.length,
          detected,
          failed,
          errors: errors.slice(0, 10),
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Catalyst refresh failed: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {},
      };
    }
  }
}