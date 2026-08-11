import { Injectable, Logger, Optional } from '@nestjs/common';
import { IJob, JobContext, JobResult } from './job.interface';
import { AnalysisService } from '../../analysis-pipeline/analysis.service';
import { ScannerService } from '../../market-scanner/scanner.service';
import { SymbolAnalysis } from '../../market-scanner/market-scanner.types';
import { Timeframe } from '../../indicators/indicator.types';
import { BIST_TRACKED_SYMBOLS } from './scheduler-symbols.config';
import { mapToSymbolAnalysis } from './analysis-result.mapper';
import { PersistenceService } from '../../persistence/persistence.service';

@Injectable()
export class MarketOpenScanJob implements IJob {
  private readonly logger = new Logger(MarketOpenScanJob.name);

  constructor(
    private readonly analysisService: AnalysisService,
    private readonly scannerService: ScannerService,
    @Optional() private readonly persistenceService?: PersistenceService,
  ) {}

  async execute(ctx?: JobContext): Promise<JobResult> {
    this.logger.debug('MarketOpenScanJob started');

    try {
      const symbols = BIST_TRACKED_SYMBOLS;
      const timeframe: Timeframe = '1d';
      const analyses: SymbolAnalysis[] = [];
      let successCount = 0;
      let failCount = 0;

      const concurrency = 5;
      for (let i = 0; i < symbols.length; i += concurrency) {
        const batch = symbols.slice(i, i + concurrency);
        const results = await Promise.allSettled(
          batch.map(async (symbol) => {
            const result = await this.analysisService.analyzeSymbol(symbol, timeframe);
            return mapToSymbolAnalysis(result);
          }),
        );

        for (let j = 0; j < results.length; j++) {
          const r = results[j];
          if (r.status === 'fulfilled' && r.value) {
            analyses.push(r.value);
            successCount++;
          } else {
            failCount++;
            const err = r.status === 'rejected' ? r.reason : 'null result';
            this.logger.warn(`Failed to analyze ${batch[j]}: ${err}`);
          }
        }
      }

      if (analyses.length > 0) {
        const scanResult = this.scannerService.runScan(analyses);

        if (this.persistenceService) {
          this.persistenceService.saveScannerRun({ scanType: 'marketOpenScan', result: scanResult }).catch((err) => {
            this.logger.warn(`Failed to persist scanner run: ${err instanceof Error ? err.message : String(err)}`);
          });
        }
      }

      this.logger.log(
        `MarketOpenScan completed: ${successCount} analyzed, ${failCount} failed, ` +
        `${analyses.length} total fed to scanner`,
      );

      return {
        success: analyses.length > 0,
        message: `Market open scan completed: ${successCount} analyzed, ${failCount} failed`,
        metadata: {
          symbolsScanned: analyses.length,
          successCount,
          failCount,
          totalSymbols: symbols.length,
          timeframe,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Market open scan failed: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {},
      };
    }
  }

}
