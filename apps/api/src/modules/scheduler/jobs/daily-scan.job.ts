import { Injectable, Logger } from '@nestjs/common';
import { IJob, JobContext, JobResult } from './job.interface';
import { DailyMarketScanService } from '../../market-scanner/daily-market-scan.service';

/**
 * R2-078 — Scheduled full BIST daily scan.
 *
 * DISABLED by default (scheduler.config.ts `dailyScan.enabled: false`).
 * Enable via `SCHEDULER_ENABLED=true` + `DAILY_SCAN_ENABLED=true` so the
 * nightly scan runs automatically. Manual triggering stays available through
 * `POST /api/market-scanner/daily-scan`.
 */
@Injectable()
export class DailyScanJob implements IJob {
  private readonly logger = new Logger(DailyScanJob.name);

  constructor(private readonly dailyScanService: DailyMarketScanService) {}

  async execute(_ctx?: JobContext): Promise<JobResult> {
    this.logger.debug('DailyScanJob started');

    if (process.env.DAILY_SCAN_ENABLED !== 'true') {
      this.logger.log('DailyScanJob skipped: DAILY_SCAN_ENABLED is not "true"');
      return {
        success: true,
        message: 'Daily scan skipped (DAILY_SCAN_ENABLED not set to true)',
        metadata: { skipped: true, timestamp: new Date().toISOString() },
      };
    }

    try {
      const response = await this.dailyScanService.runDailyScan();
      return {
        success: response.status !== 'FAILED',
        message: `Daily scan ${response.scanId} completed with status ${response.status}`,
        metadata: {
          scanId: response.scanId,
          status: response.status,
          evaluatedCount: response.summary.evaluatedCount,
          availableCount: response.summary.availableCount,
          signalCount: response.summary.signalCount,
          eventCount:
            response.summary.newOpportunities.length +
            response.summary.strengtheningSignals.length +
            response.summary.rankImprovements.length +
            response.summary.scoreSurges.length +
            response.summary.volumeExpansions.length +
            response.summary.momentumAccelerations.length +
            response.summary.breakoutDevelopments.length +
            response.summary.multiTimeframeAlignments.length +
            response.summary.weakenedSignals.length +
            response.summary.lostSignals.length,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Daily scan failed: ${error instanceof Error ? error.message : String(error)}`,
        metadata: { timestamp: new Date().toISOString() },
      };
    }
  }
}
