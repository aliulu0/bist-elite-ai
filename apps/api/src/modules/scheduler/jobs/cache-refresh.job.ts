import { Injectable, Logger } from '@nestjs/common';
import { IJob, JobContext, JobResult } from './job.interface';
import { MarketDataService } from '../../market-data/market-data.service';
import { Timeframe } from '../../indicators/indicator.types';
import { BIST_TRACKED_SYMBOLS } from './scheduler-symbols.config';

@Injectable()
export class CacheRefreshJob implements IJob {
  private readonly logger = new Logger(CacheRefreshJob.name);

  constructor(
    private readonly marketDataService: MarketDataService,
  ) {}

  async execute(ctx?: JobContext): Promise<JobResult> {
    this.logger.debug('CacheRefreshJob started');

    try {
      const symbols = BIST_TRACKED_SYMBOLS;
      const timeframe: Timeframe = '1d';
      let refreshed = 0;
      let failed = 0;

      const concurrency = 5;
      for (let i = 0; i < symbols.length; i += concurrency) {
        const batch = symbols.slice(i, i + concurrency);
        const results = await Promise.allSettled(
          batch.map(async (symbol) => {
            const data = await this.marketDataService.fetchData(symbol, timeframe);
            return { symbol, count: data.length };
          }),
        );

        for (const r of results) {
          if (r.status === 'fulfilled' && r.value.count > 0) {
            refreshed++;
          } else {
            failed++;
          }
        }
      }

      this.logger.log(`CacheRefresh completed: ${refreshed} refreshed, ${failed} failed`);

      return {
        success: refreshed > 0,
        message: `Cache refresh completed: ${refreshed} symbols refreshed, ${failed} failed`,
        metadata: {
          entriesRefreshed: refreshed,
          entriesFailed: failed,
          totalSymbols: symbols.length,
          timeframe,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Cache refresh failed: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {},
      };
    }
  }
}
