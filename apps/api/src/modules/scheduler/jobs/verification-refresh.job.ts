import { Injectable, Logger } from '@nestjs/common';
import { IJob, JobContext, JobResult } from './job.interface';
import { VerificationEngine } from '../../research/verification-engine.service';
import { VerificationRepository } from '../../research/verification-repository.service';
import { AgentReachProvider } from '../../research/providers/agent-reach.provider';
import { SymbolRegistryService } from '../../market-data/symbol-registry/symbol-registry.service';
import { ResearchEvidenceDto } from '../../research/verified-evidence.dto';

@Injectable()
export class VerificationRefreshJob implements IJob {
  private readonly logger = new Logger(VerificationRefreshJob.name);

  constructor(
    private readonly verificationEngine: VerificationEngine,
    private readonly verificationRepository: VerificationRepository,
    private readonly agentReach: AgentReachProvider,
    private readonly symbolRegistry: SymbolRegistryService,
  ) {}

  async execute(ctx?: JobContext): Promise<JobResult> {
    this.logger.debug('VerificationRefreshJob started');

    try {
      const tickers = this.symbolRegistry.getActiveSymbols().map((symbol) => symbol.canonicalTicker);
      let verified = 0;
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
          await this.verificationRepository.setVerificationResult(ticker, verificationResult);
          verified++;
        } catch (error) {
          failed++;
          const msg = error instanceof Error ? error.message : String(error);
          errors.push(`${ticker}: ${msg}`);
          this.logger.warn(`Verification failed for ${ticker}: ${msg}`);
        }
      }

      const dashboard = this.verificationEngine.buildDashboard([]);
      await this.verificationRepository.setDashboard(dashboard);

      this.logger.log(
        `VerificationRefreshJob completed: ${verified}/${tickers.length} companies verified, ${failed} failed`,
      );

      return {
        success: failed === 0,
        message: `Verification refresh completed: ${verified}/${tickers.length} companies, ${failed} failed`,
        metadata: {
          total: tickers.length,
          verified,
          failed,
          errors: errors.slice(0, 10),
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Verification refresh failed: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {},
      };
    }
  }
}