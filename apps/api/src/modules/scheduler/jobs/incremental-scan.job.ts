import { Injectable, Logger, Optional } from '@nestjs/common';
import { IJob, JobContext, JobResult } from './job.interface';
import { AnalysisService } from '../../analysis-pipeline/analysis.service';
import { ScannerService } from '../../market-scanner/scanner.service';
import { MarketDataService } from '../../market-data/market-data.service';
import { SymbolAnalysis } from '../../market-scanner/market-scanner.types';
import { Timeframe } from '../../indicators/indicator.types';
import { BIST_TRACKED_SYMBOLS } from './scheduler-symbols.config';
import { mapToSymbolAnalysis } from './analysis-result.mapper';
import { PersistenceService } from '../../persistence/persistence.service';

@Injectable()
export class IncrementalScanJob implements IJob {
  private readonly logger = new Logger(IncrementalScanJob.name);

  constructor(
    private readonly analysisService: AnalysisService,
    private readonly scannerService: ScannerService,
    private readonly marketDataService: MarketDataService,
    @Optional() private readonly persistenceService?: PersistenceService,
  ) {}

  async execute(ctx?: JobContext): Promise<JobResult> {
    this.logger.debug('IncrementalScanJob started');

    try {
      const symbols = BIST_TRACKED_SYMBOLS;
      const timeframe: Timeframe = '1d';
      const analyses: SymbolAnalysis[] = [];
      let successCount = 0;
      let failCount = 0;
      let skippedCount = 0;

      for (const symbol of symbols) {
        try {
          const latest = await this.marketDataService.fetchLatest(symbol);
          if (!latest) {
            skippedCount++;
            this.logger.debug(`No latest data for ${symbol}, skipping`);
            continue;
          }

          const lastResult = this.scannerService.getResult();
          const existing = lastResult?.topCandidates.find((c) => c.symbol === symbol) ??
            lastResult?.watchlist.find((c) => c.symbol === symbol);

          if (existing) {
            const lastUpdate = (lastResult?.metadata?.scannedAt as string) || '';
            if (lastUpdate) {
              const elapsed = Date.now() - new Date(lastUpdate).getTime();
              const thirtyMinutes = 30 * 60 * 1000;
              if (elapsed < thirtyMinutes) {
                skippedCount++;
                continue;
              }
            }
          }

          const result = await this.analysisService.analyzeSymbol(symbol, timeframe);
          const mapped = mapToSymbolAnalysis(result);
          if (mapped) {
            analyses.push(mapped);
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
          this.logger.warn(`Failed incremental analysis for ${symbol}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      if (analyses.length > 0) {
        const scanResult = this.scannerService.runScan(analyses);

        if (this.persistenceService) {
          this.persistenceService.saveScannerRun({ scanType: 'incrementalScan', result: scanResult }).catch((err) => {
            this.logger.warn(`Failed to persist scanner run: ${err instanceof Error ? err.message : String(err)}`);
          });
        }
      }

      this.logger.log(
        `IncrementalScan completed: ${successCount} analyzed, ${failCount} failed, ${skippedCount} skipped`,
      );

      return {
        success: true,
        message: `Incremental scan completed: ${successCount} analyzed, ${failCount} failed, ${skippedCount} skipped`,
        metadata: {
          symbolsScanned: analyses.length,
          successCount,
          failCount,
          skippedCount,
          totalSymbols: symbols.length,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Incremental scan failed: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {},
      };
    }
  }

}
