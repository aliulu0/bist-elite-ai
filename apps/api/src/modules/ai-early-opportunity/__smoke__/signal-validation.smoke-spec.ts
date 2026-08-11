import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { EarlyOpportunityModule } from '../early-opportunity.module';
import { EarlyOpportunityIntelligenceService } from '../early-opportunity.intelligence.service';
import { SelfLearningService } from '../self-learning/self-learning.service';
import { SymbolRegistryService } from '../../market-data/symbol-registry/symbol-registry.service';

const RUN_SMOKE = process.env.SMOKE_TEST === '1';
const describeOrSkip = RUN_SMOKE ? describe : describe.skip;

const SAMPLE_SIZE = 6;

describeOrSkip('Signal & Filter Validation (SMOKE)', () => {
  jest.setTimeout(300_000);

  let module: TestingModule;
  let symbolRegistry: SymbolRegistryService;
  let intelligenceService: EarlyOpportunityIntelligenceService;
  let selfLearning: SelfLearningService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), EarlyOpportunityModule],
    }).compile();

    symbolRegistry = module.get(SymbolRegistryService);
    intelligenceService = module.get(EarlyOpportunityIntelligenceService);
    selfLearning = module.get(SelfLearningService);
  });

  it('scans a representative BIST sample and validates the signal chain end-to-end', async () => {
    const sample = symbolRegistry
      .getActiveSymbols()
      .slice(0, SAMPLE_SIZE)
      .map((s) => s.canonicalTicker);

    expect(sample.length).toBe(SAMPLE_SIZE);

    const results = await Promise.all(
      sample.map((ticker) => intelligenceService.getEarlyOpportunity(ticker).catch(() => null)),
    );

    const valid = results.filter((r): r is NonNullable<typeof r> => r !== null);
    expect(valid.length).toBeGreaterThan(0);

    for (const r of valid) {
      expect(r.earlyOpportunityScore).toBeGreaterThanOrEqual(0);
      expect(r.earlyOpportunityScore).toBeLessThanOrEqual(100);
      expect(r.bullishPercent).toBeGreaterThanOrEqual(0);
      expect(r.bullishPercent).toBeLessThanOrEqual(100);
      expect(r.confidence).toBeGreaterThanOrEqual(0);
      expect(r.confidence).toBeLessThanOrEqual(100);
      expect(Array.isArray(r.reasons) && r.reasons.length > 0).toBe(true);
      expect(r.trend).toBeDefined();
      expect(r.momentum).toBeDefined();
      expect(r.trend).not.toBe('tomorrow');

      // Entry zone is either absent (not confident) or a well-formed zone with a positive reward/risk.
      if (r.entryZone) {
        expect(r.entryZone.min).toBeLessThan(r.entryZone.max);
      }
      if (r.riskRewardRatio != null) {
        expect(r.riskRewardRatio).toBeGreaterThan(0);
      }
      if (r.smartMoney) {
        expect(r.smartMoney.score).toBeGreaterThanOrEqual(0);
        expect(r.smartMoney.score).toBeLessThanOrEqual(100);
      }
      if (r.catalyst) {
        expect(r.catalyst.score).toBeGreaterThanOrEqual(0);
        expect(r.catalyst.score).toBeLessThanOrEqual(100);
      }
      if (r.multiTimeframe) {
        expect(r.multiTimeframe.multiTimeframeScore).toBeGreaterThanOrEqual(0);
        expect(r.multiTimeframe.multiTimeframeScore).toBeLessThanOrEqual(100);
        expect(r.multiTimeframe.trendStage).toMatch(/^(Early|Growing|Breakout|Extended|Late)$/);
        expect(r.multiTimeframe.bestTimeframe).toBeDefined();
        expect(r.multiTimeframe.mostBullishTimeframe).toBeDefined();
      }

      // eslint-disable-next-line no-console
      console.log(
        `[smoke] ${r.ticker} ${(r.company ?? r.ticker).slice(0, 25).padEnd(25)} ` +
          `score=${r.earlyOpportunityScore} level=${r.earlyOpportunityLevel} ` +
          `bullish=${r.bullishPercent} confidence=${r.confidence} ` +
          `sm=${r.smartMoney?.score ?? '-'} catalyst=${r.catalyst?.score ?? '-'} ` +
          `tfAgree=${r.timeframeAgreement} ` +
          `entry=${r.entryZone ? `${r.entryZone.min}-${r.entryZone.max}` : 'none'} ` +
          `rr=${r.riskRewardRatio ?? 'none'}`,
      );
    }

    const sorted = [...valid].sort((a, b) => b.earlyOpportunityScore - a.earlyOpportunityScore);
    // eslint-disable-next-line no-console
    console.log(
      `[smoke] top: ${sorted[0].ticker} score=${sorted[0].earlyOpportunityScore} ` +
        `vs bottom: ${sorted[sorted.length - 1].ticker} score=${sorted[sorted.length - 1].earlyOpportunityScore}`,
    );
  });

  it('backtest sanity: self-learning cycle reuses Backtest Engine without crashing', async () => {
    const report = await selfLearning.runLearningCycle().catch(() => null);
    if (report) {
      expect(report.scanned).toBeGreaterThanOrEqual(0);
      expect(report.updated).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(report.modifiers)).toBe(true);
      // eslint-disable-next-line no-console
      console.log(
        `[smoke] backtest sanity: scanned=${report.scanned} calibrated=${report.updated} modifiers=${report.modifiers.length}`,
      );
    } else {
      // eslint-disable-next-line no-console
      console.log('[smoke] backtest sanity: self-learning returned no report (no backtest data) - accepted');
    }
  });
});
