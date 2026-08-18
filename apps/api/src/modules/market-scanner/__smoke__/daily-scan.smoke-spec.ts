import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../../common/database/prisma.module';
import { MarketScannerModule } from '../market-scanner.module';
import { DailyMarketScanService } from '../daily-market-scan.service';
import { CacheService } from '../../../common/cache/cache.service';
import { DailyScanResponse, ScannerRankingSnapshot } from '../daily-scan.types';

const RUN_SMOKE = process.env.SMOKE_TEST === '1';
const describeOrSkip = RUN_SMOKE ? describe : describe.skip;

/**
 * R2-078 real-provider smoke: boots the real MarketScannerModule graph
 * (MarketDataModule + AnalysisPipelineModule) and runs a small bounded
 * daily scan (maxSymbols=6) against LIVE Yahoo Finance data.
 *
 * Gates verified with real data:
 *   - no fabricated prices: AVAILABLE => finite close > 0, UNAVAILABLE => null
 *   - snapshot is persisted under the `scannerSnapshots` cache namespace
 *   - contiguous deterministic ranking (1..N, no ties)
 *   - status COMPLETE/PARTIAL (never FAILED when data is served)
 *
 * Requires repo-root `.env` (loaded via env.loader.ts). Gated behind
 * `test:smoke` (SMOKE_TEST=1).
 */
describeOrSkip('Daily Scan with real providers (SMOKE)', () => {
  jest.setTimeout(300_000);

  let module: TestingModule;
  let dailyScan: DailyMarketScanService;
  let cacheService: CacheService;
  let response: DailyScanResponse | null;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, MarketScannerModule],
    }).compile();

    dailyScan = module.get(DailyMarketScanService);
    cacheService = module.get(CacheService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('runs a bounded daily scan with live market data', async () => {
    response = await dailyScan.runDailyScan({ maxSymbols: 6 });

    expect(response).toBeDefined();
    expect(response!.scanId).toBeTruthy();
    expect(['COMPLETE', 'PARTIAL', 'FAILED', 'DEGRADED']).toContain(response!.status);
    expect(response!.summary.evaluatedCount).toBeLessThanOrEqual(6);
    expect(response!.summary.universeSize).toBeGreaterThan(0);

    // eslint-disable-next-line no-console
    console.log(
      `[smoke] daily scan: id=${response!.scanId} status=${response!.status} universe=${response!.summary.universeSize} ` +
        `evaluated=${response!.summary.evaluatedCount} available=${response!.summary.availableCount} ` +
        `eligible=${response!.summary.eligibleCount} signals=${response!.summary.signalCount}`,
    );
  });

  it('persists the snapshot under the scannerSnapshots cache namespace', () => {
    const snapshot = cacheService.get<ScannerRankingSnapshot>('current', 'scannerSnapshots');
    expect(snapshot).not.toBeNull();
    expect(snapshot!.scanId).toBe(response!.scanId);
    expect(snapshot!.schemaVersion).toBe(1);
    expect(Array.isArray(snapshot!.results)).toBe(true);
    expect(Array.isArray(snapshot!.providerSummary)).toBe(true);
  });

  it('never fabricates prices: AVAILABLE => finite close > 0, UNAVAILABLE => null', async () => {
    const snapshot = cacheService.get<ScannerRankingSnapshot>('current', 'scannerSnapshots');
    expect(snapshot).not.toBeNull();

    const served = snapshot!.results.filter((r) => r.dataStatus === 'AVAILABLE');
    const unavailable = snapshot!.results.filter((r) => r.dataStatus === 'UNAVAILABLE');

    for (const entry of served) {
      expect(Number.isFinite(entry.currentPrice)).toBe(true);
      expect(entry.currentPrice!).toBeGreaterThan(0);
      expect(Number.isFinite(entry.eliteScore)).toBe(true);
      expect(entry.eliteScore).toBeGreaterThanOrEqual(0);
      expect(entry.eliteScore).toBeLessThanOrEqual(100);
    }
    for (const entry of unavailable) {
      expect(entry.currentPrice).toBeNull();
    }

    // eslint-disable-next-line no-console
    console.log(
      `[smoke] daily scan data: served=${served.length} unavailable=${unavailable.length} of ${snapshot!.results.length} ranked`,
    );

    // Real-data gate: the majority of the bounded sample must be served.
    expect(snapshot!.results.length).toBeGreaterThan(0);
    expect(served.length).toBeGreaterThanOrEqual(Math.ceil(snapshot!.results.length / 2));
  });

  it('produces contiguous, tie-free deterministic ranking', async () => {
    const snapshot = cacheService.get<ScannerRankingSnapshot>('current', 'scannerSnapshots');
    const ranks = snapshot!.results.map((r) => r.rank).sort((a, b) => a - b);
    for (let i = 0; i < ranks.length; i++) {
      expect(ranks[i]).toBe(i + 1);
    }
    const symbols = snapshot!.results.map((r) => r.symbol);
    expect(new Set(symbols).size).toBe(symbols.length);
  });

  it('reports COMPLETE or PARTIAL (not FAILED) when data was served', async () => {
    const snapshot = cacheService.get<ScannerRankingSnapshot>('current', 'scannerSnapshots');
    if (snapshot!.results.length > 0) {
      expect(['COMPLETE', 'PARTIAL']).toContain(snapshot!.status);
      expect(snapshot!.availableCount).toBe(snapshot!.results.length);
      expect(snapshot!.dataQuality).toBe('VALID');
    }
  });

  it('exposes provider accounting for the scan', async () => {
    const snapshot = cacheService.get<ScannerRankingSnapshot>('current', 'scannerSnapshots');
    expect(snapshot!.providerSummary.length).toBeGreaterThan(0);
    const yahoo = snapshot!.providerSummary.find((p) => p.provider.toLowerCase().includes('yahoo'));
    expect(yahoo).toBeDefined();
    // `available` reflects universe-discovery accounting, not the bounded scan count.
    expect(yahoo!.requested).toBeGreaterThanOrEqual(0);
    expect(yahoo!.available).toBeGreaterThanOrEqual(snapshot!.availableCount);
    expect(yahoo!.unavailable).toBeGreaterThanOrEqual(0);
  });
});
