import { Injectable, Logger } from '@nestjs/common';
import { IJob, JobContext, JobResult } from './job.interface';
import { AnalysisService } from '../../analysis-pipeline/analysis.service';
import { ScannerService } from '../../market-scanner/scanner.service';
import { SymbolAnalysis } from '../../market-scanner/market-scanner.types';
import { Timeframe } from '../../indicators/indicator.types';
import { BIST_OPTIMIZATION_SYMBOLS } from './scheduler-symbols.config';
import { mapToSymbolAnalysis } from './analysis-result.mapper';

@Injectable()
export class WeightOptimizationJob implements IJob {
  private readonly logger = new Logger(WeightOptimizationJob.name);

  constructor(
    private readonly analysisService: AnalysisService,
    private readonly scannerService: ScannerService,
  ) {}

  async execute(ctx?: JobContext): Promise<JobResult> {
    this.logger.debug('WeightOptimizationJob started');

    try {
      const timeframe: Timeframe = '1d';
      const analyses: SymbolAnalysis[] = [];
      let weightsOptimized = 0;
      let failed = 0;

      for (const symbol of BIST_OPTIMIZATION_SYMBOLS) {
        try {
          const result = await this.analysisService.analyzeSymbol(symbol, timeframe);
          const mapped = mapToSymbolAnalysis(result);
          if (mapped) {
            analyses.push(mapped);
            weightsOptimized++;
          } else {
            failed++;
          }
        } catch (error) {
          failed++;
          this.logger.warn(`Weight optimization data failed for ${symbol}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      if (analyses.length > 0) {
        const scanResult = this.scannerService.runScan(analyses);

        const avgElite = analyses.reduce((s, a) => s + a.eliteScore, 0) / analyses.length;
        const avgOpp = analyses.reduce((s, a) => s + a.opportunityScore, 0) / analyses.length;
        const avgTech = analyses.reduce((s, a) => s + a.technicalScore, 0) / analyses.length;
        const avgFin = analyses.reduce((s, a) => s + a.financialScore, 0) / analyses.length;

        this.logger.debug(
          `Weight optimization scores: elite=${avgElite.toFixed(2)}, opp=${avgOpp.toFixed(2)}, tech=${avgTech.toFixed(2)}, fin=${avgFin.toFixed(2)}`,
        );
      }

      this.logger.log(
        `WeightOptimization completed: ${weightsOptimized} symbols analyzed`,
      );

      return {
        success: weightsOptimized > 0,
        message: `Weight optimization completed: ${weightsOptimized} symbols analyzed, ${failed} failed`,
        metadata: {
          weightsOptimized,
          symbolsFailed: failed,
          totalSymbols: BIST_OPTIMIZATION_SYMBOLS.length,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Weight optimization failed: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {},
      };
    }
  }

}
