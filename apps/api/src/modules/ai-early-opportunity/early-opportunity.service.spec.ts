import { EarlyOpportunityService } from './early-opportunity.service';
import { EarlyOpportunityEngine } from './early-opportunity.engine';
import { PredictionService } from '../prediction/prediction.service';
import { PredictionRegistry } from '../prediction/prediction-registry';
import { AIResearchHubService } from '../ai-research/ai-research-hub.service';
import { EliteScoreRegistry } from '../ai-elite-score/elite-score.registry';
import { OpportunityRegistry } from '../ai-opportunity/opportunity-registry.service';
import { DecisionRegistry } from '../decision/decision-registry.service';
import { SymbolRegistryService } from '../market-data/symbol-registry/symbol-registry.service';
import { PredictionResult, PredictionTimeframe } from '../prediction/prediction.types';
import { AIConsensus } from '../ai-research/ai-research.types';
import { EarlyOpportunityResult } from './early-opportunity.types';

function makePrediction(ticker: string, bullish: number, opts: Partial<PredictionResult> = {}): PredictionResult {
  return {
    ticker,
    timeframe: '1d',
    dataTimeframe: '1d',
    bullishProbability: bullish,
    bearishProbability: 100 - bullish,
    neutralProbability: 0,
    confidence: 80,
    trendStrength: 'strong',
    trendDirection: 'up',
    momentum: 'bullish',
    expectedReturn: 6.4,
    expectedVolatility: 2,
    risk: 'low',
    riskScore: 20,
    liquidityQuality: 'high',
    expectedHoldingPeriod: { value: 4, unit: 'days' },
    entryZone: null,
    stopZone: null,
    target1: null,
    target2: null,
    riskRewardRatio: null,
    scenarios: [],
    signals: [],
    backtestAccuracy: { winRate: 0.6, totalTrades: 10, sharpeRatio: 1, isValid: true },
    verification: null,
    catalystScore: 50,
    smartMoneyScore: 50,
    metadata: {},
    generatedAt: new Date().toISOString(),
    isValid: true,
    ...opts,
  };
}

describe('EarlyOpportunityService', () => {
  let service: EarlyOpportunityService;
  let engine: EarlyOpportunityEngine;
  let predictionService: { getPrediction: jest.Mock };
  let predictionRegistry: { get: jest.Mock };
  let aiResearchHub: { getConsensus: jest.Mock };
  let eliteScoreRegistry: { get: jest.Mock };
  let opportunityRegistry: { get: jest.Mock };
  let decisionRegistry: { get: jest.Mock };
  let symbolRegistry: { getActiveSymbols: jest.Mock; getSymbol: jest.Mock };

  beforeEach(() => {
    predictionService = { getPrediction: jest.fn() };
    predictionRegistry = { get: jest.fn() };
    aiResearchHub = { getConsensus: jest.fn() };
    eliteScoreRegistry = { get: jest.fn().mockReturnValue(null) };
    opportunityRegistry = { get: jest.fn().mockReturnValue(null) };
    decisionRegistry = { get: jest.fn().mockReturnValue(null) };
    symbolRegistry = {
      getActiveSymbols: jest.fn(),
      getSymbol: jest.fn(),
    };
    engine = new EarlyOpportunityEngine();

    service = new EarlyOpportunityService(
      predictionService as unknown as PredictionService,
      predictionRegistry as unknown as PredictionRegistry,
      aiResearchHub as unknown as AIResearchHubService,
      eliteScoreRegistry as unknown as EliteScoreRegistry,
      opportunityRegistry as unknown as OpportunityRegistry,
      decisionRegistry as unknown as DecisionRegistry,
      symbolRegistry as unknown as SymbolRegistryService,
      engine,
    );
  });

  it('scans all active symbols and returns top N sorted by score', async () => {
    symbolRegistry.getActiveSymbols.mockReturnValue([
      { canonicalTicker: 'AAA', companyName: 'AAA Co', sector: 'Banka', active: true, exchange: 'BIST', isin: 'x', delistedAt: null, providers: {} },
      { canonicalTicker: 'BBB', companyName: 'BBB Co', sector: 'Banka', active: true, exchange: 'BIST', isin: 'x', delistedAt: null, providers: {} },
    ]);

    predictionService.getPrediction.mockImplementation(async (ticker: string) =>
      makePrediction(ticker, ticker === 'AAA' ? 85 : 40),
    );
    aiResearchHub.getConsensus.mockResolvedValue(null);

    const results = await service.scanAll({ limit: 10 });

    expect(results).toHaveLength(2);
    expect(results[0].ticker).toBe('AAA');
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it('skips symbols with no valid prediction', async () => {
    symbolRegistry.getActiveSymbols.mockReturnValue([
      { canonicalTicker: 'BAD', companyName: 'Bad Co', sector: 'X', active: true, exchange: 'BIST', isin: 'x', delistedAt: null, providers: {} },
      { canonicalTicker: 'GOOD', companyName: 'Good Co', sector: 'X', active: true, exchange: 'BIST', isin: 'x', delistedAt: null, providers: {} },
    ]);

    predictionService.getPrediction.mockImplementation(async (ticker: string) => {
      if (ticker === 'BAD') return makePrediction(ticker, 10, { isValid: false });
      return makePrediction(ticker, 80);
    });
    aiResearchHub.getConsensus.mockResolvedValue(null);

    const results = await service.scanAll({ limit: 10 });

    expect(results.map((r) => r.ticker)).toEqual(['GOOD']);
  });

  it('does not re-query prediction registry for the primary timeframe (cache-only for extras)', async () => {
    symbolRegistry.getActiveSymbols.mockReturnValue([
      { canonicalTicker: 'AAA', companyName: 'AAA', sector: 'X', active: true, exchange: 'BIST', isin: 'x', delistedAt: null, providers: {} },
    ]);
    predictionService.getPrediction.mockResolvedValue(makePrediction('AAA', 70));
    predictionRegistry.get.mockImplementation((_t: string, tf: string) =>
      makePrediction('AAA', 75, { timeframe: tf as PredictionTimeframe }),
    );
    aiResearchHub.getConsensus.mockResolvedValue(null);

    const [result] = await service.scanAll({ limit: 10 });

    expect(predictionService.getPrediction).toHaveBeenCalledWith('AAA', '1d');
    expect(predictionRegistry.get).toHaveBeenCalledWith('AAA', '1w');
    expect(predictionRegistry.get).toHaveBeenCalledWith('AAA', '1m');
    expect(result.timeframesEvaluated).toContain('1d');
    expect(result.timeframesEvaluated).toContain('1w');
  });

  it('respects the limit option', async () => {
    const symbols = Array.from({ length: 20 }, (_, i) => ({
      canonicalTicker: `S${i}`,
      companyName: `S${i} Co`,
      sector: 'X',
      active: true,
      exchange: 'BIST',
      isin: 'x',
      delistedAt: null,
      providers: {},
    }));
    symbolRegistry.getActiveSymbols.mockReturnValue(symbols);
    predictionService.getPrediction.mockImplementation(async (ticker: string) =>
      makePrediction(ticker, 90),
    );
    aiResearchHub.getConsensus.mockResolvedValue(null);

    const results = await service.scanAll({ limit: 5 });
    expect(results).toHaveLength(5);
  });

  it('scanTicker returns null for unknown ticker', async () => {
    symbolRegistry.getSymbol.mockReturnValue(undefined);
    await expect(service.scanTicker('NOPE')).resolves.toBeNull();
  });

  it('scanTicker returns a scored result', async () => {
    symbolRegistry.getSymbol.mockReturnValue({
      canonicalTicker: 'AAA',
      companyName: 'AAA Co',
      sector: 'Banka',
      active: true,
      exchange: 'BIST',
      isin: 'x',
      delistedAt: null,
      providers: {},
    });
    predictionService.getPrediction.mockResolvedValue(makePrediction('AAA', 75));
    aiResearchHub.getConsensus.mockResolvedValue(null);

    const result = await service.scanTicker('AAA');
    expect(result).not.toBeNull();
    expect(result!.ticker).toBe('AAA');
    expect(result!.score).toBeGreaterThan(0);
  });

  it('reuses cached elite/opportunity/decision registry results when present', async () => {
    symbolRegistry.getActiveSymbols.mockReturnValue([
      { canonicalTicker: 'AAA', companyName: 'AAA', sector: 'X', active: true, exchange: 'BIST', isin: 'x', delistedAt: null, providers: {} },
    ]);
    predictionService.getPrediction.mockResolvedValue(makePrediction('AAA', 70));
    aiResearchHub.getConsensus.mockResolvedValue(null);
    eliteScoreRegistry.get.mockReturnValue({
      ticker: 'AAA',
      input: {},
      result: {
        ticker: 'AAA',
        company: 'AAA',
        horizons: [
          { horizon: 'GUNLUK', etiket: 'G', skor: 90, confidence: 80, reasons: [], warnings: [] },
        ],
        dominantStrategyId: 'm',
        dominantStrategyName: 'M',
        dominantSignals: [],
        decision: 'AL',
        decisionLabel: 'Al',
        opportunityLevel: 'GÜÇLÜ_FIRSAT',
        evaluatedAt: new Date().toISOString(),
      },
      evaluatedAt: new Date().toISOString(),
    });

    const result = await service.scanAll({ limit: 1 });
    expect(result[0].components.eliteScore).toBe(90);
  });
});
