import { Injectable, Logger } from '@nestjs/common';
import { IJob, JobContext, JobResult } from './job.interface';
import { AnalysisService } from '../../analysis-pipeline/analysis.service';
import { Timeframe } from '../../indicators/indicator.types';
import { BIST_ANALYTICS_SYMBOLS } from './scheduler-symbols.config';

@Injectable()
export class RuleAnalyticsJob implements IJob {
  private readonly logger = new Logger(RuleAnalyticsJob.name);

  constructor(
    private readonly analysisService: AnalysisService,
  ) {}

  async execute(ctx?: JobContext): Promise<JobResult> {
    this.logger.debug('RuleAnalyticsJob started');

    try {
      let rulesAnalyzed = 0;
      let failed = 0;
      const timeframe: Timeframe = '1d';

      const results: Array<{
        symbol: string;
        technicalPassRate: number;
        financialPassRate: number;
        totalRules: number;
      }> = [];

      for (const symbol of BIST_ANALYTICS_SYMBOLS) {
        try {
          const result = await this.analysisService.analyzeSymbol(symbol, timeframe);

          const techRules = result.technicalRules?.rules ?? [];
          const finRules = result.financialRules?.rules ?? [];

          const techPassed = techRules.filter((r) => r.status === 'PASS').length;
          const finPassed = finRules.filter((r) => r.status === 'PASS').length;

          const totalRules = techRules.length + finRules.length;
          const totalPassed = techPassed + finPassed;

          results.push({
            symbol,
            technicalPassRate: techRules.length > 0 ? techPassed / techRules.length : 0,
            financialPassRate: finRules.length > 0 ? finPassed / finRules.length : 0,
            totalRules,
          });

          rulesAnalyzed += totalRules;
        } catch (error) {
          failed++;
          this.logger.warn(`Rule analytics failed for ${symbol}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      this.logger.log(
        `RuleAnalytics completed: ${rulesAnalyzed} rules analyzed across ${results.length} symbols`,
      );

      return {
        success: results.length > 0,
        message: `Rule analytics completed: ${rulesAnalyzed} rules analyzed across ${results.length} symbols`,
        metadata: {
          rulesAnalyzed,
          symbolsAnalyzed: results.length,
          symbolsFailed: failed,
          results,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Rule analytics failed: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {},
      };
    }
  }
}
