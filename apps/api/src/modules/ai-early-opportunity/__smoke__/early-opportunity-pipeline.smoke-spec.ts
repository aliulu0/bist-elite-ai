import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { EarlyOpportunityModule } from '../early-opportunity.module';
import { EarlyOpportunityService } from '../early-opportunity.service';
import { PredictionService } from '../../prediction/prediction.service';
import { AIResearchHubService } from '../../ai-research/ai-research-hub.service';
import { SearchController } from '../search.controller';

const RUN_SMOKE = process.env.SMOKE_TEST === '1';
const describeOrSkip = RUN_SMOKE ? describe : describe.skip;

/**
 * Real end-to-end smoke: boots the full Early Opportunity module graph
 * (prediction -> smart money -> catalyst -> verification -> AI research
 * consensus -> early opportunity engine) and drives it with REAL market data
 * (Yahoo Finance live quotes). Requires the repo-root `.env` to be populated
 * (auto-loaded via env.loader.ts). Gated behind `test:smoke:e2e`.
 */
describeOrSkip('Early Opportunity Pipeline (SMOKE / E2E)', () => {
  jest.setTimeout(300_000);

  let module: TestingModule;
  let predictionService: PredictionService;
  let earlyOpportunityService: EarlyOpportunityService;
  let researchHub: AIResearchHubService;
  let searchController: SearchController;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), EarlyOpportunityModule],
    }).compile();

    predictionService = module.get(PredictionService);
    earlyOpportunityService = module.get(EarlyOpportunityService);
    researchHub = module.get(AIResearchHubService);
    searchController = module.get(SearchController);
  });

  it('produces a valid 1d prediction for THYAO from real market data', async () => {
    const prediction = await predictionService.getPrediction('THYAO', '1d', false);

    expect(prediction).toBeDefined();
    expect(prediction.isValid).toBe(true);
    expect(prediction.ticker).toBe('THYAO');
    expect(prediction.dataTimeframe).toBe('1d');
    expect(prediction.bullishProbability).toBeGreaterThanOrEqual(0);
    expect(prediction.bullishProbability).toBeLessThanOrEqual(100);
    expect(prediction.confidence).toBeGreaterThanOrEqual(0);
    expect(prediction.confidence).toBeLessThanOrEqual(100);
    expect(prediction.bearishProbability).toBeGreaterThanOrEqual(0);
    expect(prediction.neutralProbability).toBeGreaterThanOrEqual(0);
    expect(typeof prediction.generatedAt).toBe('string');

    // eslint-disable-next-line no-console
    console.log(
      `[smoke] THYAO 1d: bullish=${prediction.bullishProbability.toFixed(1)}% confidence=${prediction.confidence.toFixed(1)}% expectedReturn=${prediction.expectedReturn} trend=${prediction.trendDirection} momentum=${prediction.momentum}`,
    );
  });

  it('runs the early-opportunity scan for THYAO with real data', async () => {
    const result = await earlyOpportunityService.scanTicker('THYAO');

    expect(result).not.toBeNull();
    expect(result!.ticker).toBe('THYAO');
    expect(result!.score).toBeGreaterThanOrEqual(0);
    expect(result!.score).toBeLessThanOrEqual(100);
    expect(['ÇOK_GÜÇLÜ_FIRSAT', 'GÜÇLÜ_FIRSAT', 'FIRSAT', 'İZLEME_LISTESI', 'BEKLE']).toContain(result!.level);
    expect(result!.timeframesEvaluated).toContain('1d');
    expect(Array.isArray(result!.reasons)).toBe(true);

    // eslint-disable-next-line no-console
    console.log(
      `[smoke] THYAO early-opportunity: score=${result!.score} level=${result!.level} confidence=${result!.confidence} timeframes=[${result!.timeframesEvaluated.join(', ')}] reasons=${result!.reasons.length}`,
    );
  });

  it('collects an AI research consensus (or reports it unavailable)', async () => {
    const consensus = await researchHub.getConsensus('THYAO', false).catch(() => null);

    if (consensus) {
      expect(typeof consensus.agreementLevel).toBe('number');
      expect(consensus.agreementLevel).toBeGreaterThanOrEqual(0);
      expect(typeof consensus.newsSummary).toBe('string');
      expect(typeof consensus.totalEvidence).toBe('number');
      // eslint-disable-next-line no-console
      console.log(
        `[smoke] THYAO consensus: agreement=${consensus.agreementLevel} score=${consensus.consensusScore} evidence=${consensus.totalEvidence}`,
      );
    } else {
      // eslint-disable-next-line no-console
      console.log('[smoke] THYAO consensus: UNAVAILABLE (no AI research provider configured/online)');
    }
  });

  it('serves the quick-search endpoint with real prediction data', async () => {
    const quick = await searchController.search('THYAO');

    expect(quick).not.toBeNull();
    expect(quick!.ticker).toBe('THYAO');
    expect(quick!.prediction.bullishPercent).toBeGreaterThanOrEqual(0);
    expect(quick!.prediction.bullishPercent).toBeLessThanOrEqual(100);
    expect(quick!.prediction.confidence).toBeGreaterThanOrEqual(0);
    expect(quick!.prediction.confidence).toBeLessThanOrEqual(100);

    // eslint-disable-next-line no-console
    console.log(
      `[smoke] search THYAO: bullish=${quick!.prediction.bullishPercent}% confidence=${quick!.prediction.confidence}% trend=${quick!.prediction.trend} consensus=${String(quick!.research.consensus).slice(0, 80)}`,
    );
  });
});
