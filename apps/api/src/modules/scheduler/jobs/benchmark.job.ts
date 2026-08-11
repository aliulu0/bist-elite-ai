import { Injectable, Logger } from '@nestjs/common';
import { IJob, JobContext, JobResult } from './job.interface';
import { MarketDataService } from '../../market-data/market-data.service';
import { Timeframe } from '../../indicators/indicator.types';
import { BIST_BENCHMARK_INDEX, BIST_BENCHMARK_STOCKS } from './scheduler-symbols.config';

@Injectable()
export class BenchmarkJob implements IJob {
  private readonly logger = new Logger(BenchmarkJob.name);

  constructor(
    private readonly marketDataService: MarketDataService,
  ) {}

  async execute(ctx?: JobContext): Promise<JobResult> {
    this.logger.debug('BenchmarkJob started');

    try {
      let benchmarksCalculated = 0;
      let failed = 0;

      const allSymbols = [BIST_BENCHMARK_INDEX, ...BIST_BENCHMARK_STOCKS];

      for (const symbol of allSymbols) {
        try {
          const data = await this.marketDataService.fetchData(symbol, '1d' as Timeframe);
          if (data.length > 0) {
            const closes = data.map((d) => d.close);
            const totalReturn = closes.length > 1
              ? ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100
              : 0;

            this.logger.debug(
              `Benchmark ${symbol}: ${data.length} bars, return: ${totalReturn.toFixed(2)}%`,
            );
            benchmarksCalculated++;
          } else {
            failed++;
          }
        } catch (error) {
          failed++;
          this.logger.warn(`Benchmark calculation failed for ${symbol}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      this.logger.log(`Benchmark completed: ${benchmarksCalculated} calculated, ${failed} failed`);

      return {
        success: benchmarksCalculated > 0,
        message: `Benchmark completed: ${benchmarksCalculated} calculated, ${failed} failed`,
        metadata: {
          benchmarksCalculated,
          benchmarksFailed: failed,
          symbols: allSymbols,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Benchmark calculation failed: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {},
      };
    }
  }
}
