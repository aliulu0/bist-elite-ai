import { DailyScanJob } from './daily-scan.job';
import { DailyMarketScanService } from '../../market-scanner/daily-market-scan.service';

describe('DailyScanJob', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('skips when DAILY_SCAN_ENABLED is not "true"', async () => {
    delete process.env.DAILY_SCAN_ENABLED;
    const service = { runDailyScan: jest.fn() } as unknown as DailyMarketScanService;
    const job = new DailyScanJob(service);
    const result = await job.execute();
    expect(result.success).toBe(true);
    expect(result.metadata?.skipped).toBe(true);
    expect(service.runDailyScan).not.toHaveBeenCalled();
  });

  it('runs the daily scan when DAILY_SCAN_ENABLED is "true"', async () => {
    process.env.DAILY_SCAN_ENABLED = 'true';
    const service = {
      runDailyScan: jest.fn().mockResolvedValue({
        scanId: 'scan-1',
        status: 'COMPLETE',
        timestamp: '2026-01-01T00:00:00.000Z',
        summary: {
          evaluatedCount: 10,
          availableCount: 10,
          signalCount: 5,
          newOpportunities: [],
          strengtheningSignals: [],
          rankImprovements: [],
          scoreSurges: [],
          volumeExpansions: [],
          momentumAccelerations: [],
          breakoutDevelopments: [],
          multiTimeframeAlignments: [],
          weakenedSignals: [],
          lostSignals: [],
        },
      }),
    } as unknown as DailyMarketScanService;
    const job = new DailyScanJob(service);
    const result = await job.execute();
    expect(result.success).toBe(true);
    expect(result.metadata?.scanId).toBe('scan-1');
    expect(service.runDailyScan).toHaveBeenCalledTimes(1);
  });

  it('reports failure when the scan throws', async () => {
    process.env.DAILY_SCAN_ENABLED = 'true';
    const service = {
      runDailyScan: jest.fn().mockRejectedValue(new Error('provider down')),
    } as unknown as DailyMarketScanService;
    const job = new DailyScanJob(service);
    const result = await job.execute();
    expect(result.success).toBe(false);
    expect(result.message).toContain('provider down');
  });
});
