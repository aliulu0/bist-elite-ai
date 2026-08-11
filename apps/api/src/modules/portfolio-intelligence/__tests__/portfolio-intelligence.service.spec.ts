import { PortfolioIntelligenceService } from '../portfolio-intelligence.service';
import { PortfolioIntelligenceEngine } from '../portfolio-intelligence.engine';
import { PortfolioIntelligenceRegistry } from '../portfolio-intelligence.registry';
import { EarlyOpportunityIntelligenceService } from '../../ai-early-opportunity/early-opportunity.intelligence.service';
import { SelfLearningService } from '../../ai-early-opportunity/self-learning/self-learning.service';
import { MarketDataOrchestrator } from '../../market-data/orchestrator/market-data-orchestrator';
import { LatestPriceIncrementalService } from '../../market-data/incremental/latest-price-incremental.service';
import { SymbolRegistryService } from '../../market-data/symbol-registry/symbol-registry.service';
import { BacktestService } from '../../backtest/backtest.service';
import { CacheService } from '../../../common/cache/cache.service';
import { EarlyOpportunityIntelligenceResult } from '../../ai-early-opportunity/early-opportunity.types';
import { MultiTimeframeOpportunityResult } from '../../ai-early-opportunity/multi-timeframe/multi-timeframe.types';

function makeMultiTimeframe(ticker: string): MultiTimeframeOpportunityResult {
  return {
    ticker,
    company: `${ticker} A.Ş.`,
    sector: 'Bankacılık',
    multiTimeframeScore: 72,
    strength: 'Strong',
    strengthLabel: 'Güçlü',
    trendStage: 'Growing',
    holdingType: 'Swing',
    bestTimeframe: '1d',
    worstTimeframe: '6m',
    mostBullishTimeframe: '1d',
    highestConfidenceTimeframe: '1d',
    timeframesAnalyzed: ['1d', '1w'],
    alignments: {
      timeframeAgreement: 90,
      trendAlignment: 80,
      momentumAlignment: 75,
      riskAlignment: 70,
      confidenceAlignment: 80,
      smartMoneyAlignment: 78,
      catalystAlignment: 70,
      macroAlignment: 60,
      marketStructureAlignment: 65,
    },
    riskSummary: {
      avgRiskScore: 25,
      distribution: { low: 3, medium: 2, high: 0 },
      maxRisk: 'medium',
      summary: 'Düşük risk',
    },
    expectedReturn: 12,
    bullishPercent: 70,
    confidence: 80,
    entryZone: { min: 95, max: 105 },
    stop: 88,
    target1: 135,
    target2: 150,
    riskRewardRatio: 2.5,
    reasons: ['reason'],
    evaluatedAt: new Date().toISOString(),
  };
}

function makeIntelligence(ticker: string, score = 75): EarlyOpportunityIntelligenceResult {
  return {
    ticker,
    company: `${ticker} A.Ş.`,
    sector: 'Bankacılık',
    marketCap: 50_000_000_000,
    earlyOpportunityScore: score,
    earlyOpportunityLevel: 'GÜÇLÜ_FIRSAT' as EarlyOpportunityIntelligenceResult['earlyOpportunityLevel'],
    eliteScore: 80,
    confidence: 80,
    bullishPercent: 70,
    risk: 'low',
    expectedReturn: 12,
    entryZone: { min: 95, max: 105 },
    stop: 88,
    target1: 135,
    target2: 150,
    riskRewardRatio: 2.5,
    holdingPeriod: { value: 30, unit: 'days' },
    catalyst: { score: 70, verified: true },
    smartMoney: { score: 78, accumulation: 'rising' },
    verificationStatus: 'verified',
    researchConsensus: { agreementLevel: 75, confidence: 70, consensusScore: 75, summary: 'positive', evidenceCount: 3 },
    momentum: 'bullish',
    trend: 'up',
    liquidityQuality: 'high',
    timeframeAgreement: 90,
    reasons: ['reason'],
    evaluatedAt: new Date().toISOString(),
    multiTimeframe: makeMultiTimeframe(ticker),
    fundamentals: null,
    financialDataQuality: null,
    signals: [],
    signalConvergenceScore: 0,
    earlySignalCount: 0,
    confirmedSignalCount: 0,
    topSignals: [],
  };
}

function createService(): {
  service: PortfolioIntelligenceService;
  earlyOpportunityIntelligenceService: {
    getEarlyOpportunity: jest.Mock;
    getEarlyOpportunities: jest.Mock;
  };
  latestPrice: { getLatestPriceIncremental: jest.Mock };
  symbolRegistry: { getSymbol: jest.Mock };
  backtestService: { getReport: jest.Mock };
  cacheService: {
    get: jest.Mock;
    set: jest.Mock;
    delete: jest.Mock;
  };
  registry: PortfolioIntelligenceRegistry;
} {
  const registry = new PortfolioIntelligenceRegistry();
  const earlyOpportunityIntelligenceService = {
    getEarlyOpportunity: jest.fn(),
    getEarlyOpportunities: jest.fn(),
  };
  const selfLearningService = {
    getModifier: jest.fn().mockReturnValue(1),
    getAllModifiers: jest.fn().mockReturnValue([]),
  };
  const latestPrice = {
    getLatestPriceIncremental: jest.fn().mockResolvedValue({
      symbol: 'THYAO',
      timeframe: '1d',
      price: 105,
      previousPrice: 100,
      change: 5,
      changePercent: 5,
      timestamp: new Date().toISOString(),
      provider: 'yahoo',
      sourceTimeframe: '1d',
      dataFreshness: 'fresh',
      lastSuccessfulUpdate: new Date().toISOString(),
      volume: 1000000,
    }),
  };
  const symbolRegistry = {
    getSymbol: jest.fn(),
  };
  const backtestService = {
    getReport: jest.fn(),
  };
  const cacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  };

  const service = new PortfolioIntelligenceService(
    new PortfolioIntelligenceEngine(),
    registry,
    earlyOpportunityIntelligenceService as unknown as EarlyOpportunityIntelligenceService,
    selfLearningService as unknown as SelfLearningService,
    latestPrice as unknown as LatestPriceIncrementalService,
    symbolRegistry as unknown as SymbolRegistryService,
    backtestService as unknown as BacktestService,
    cacheService as unknown as CacheService,
  );

  return {
    service,
    earlyOpportunityIntelligenceService,
    latestPrice,
    symbolRegistry,
    backtestService,
    cacheService,
    registry,
  };
}

describe('PortfolioIntelligenceService', () => {
  describe('positions', () => {
    it('adds a position', () => {
      const { service, registry } = createService();
      const view = service.addPosition({ ticker: 'THYAO', quantity: 100, averageCost: 100 });
      expect(view.ticker).toBe('THYAO');
      expect(registry.countPositions()).toBe(1);
    });

    it('updates a position', () => {
      const { service } = createService();
      service.addPosition({ ticker: 'THYAO', quantity: 100, averageCost: 100 });
      const updated = service.updatePosition('THYAO', { quantity: 200 });
      expect(updated.quantity).toBe(200);
    });

    it('throws when updating a missing position', () => {
      const { service } = createService();
      expect(() => service.updatePosition('XXXX', { quantity: 1 })).toThrow();
    });

    it('removes a position', () => {
      const { service, registry } = createService();
      service.addPosition({ ticker: 'THYAO', quantity: 1, averageCost: 10 });
      const result = service.removePosition('THYAO');
      expect(result.removed).toBe(true);
      expect(registry.countPositions()).toBe(0);
    });

    it('lists positions', () => {
      const { service } = createService();
      service.addPosition({ ticker: 'THYAO', quantity: 1, averageCost: 10 });
      const list = service.listPositions();
      expect(list).toHaveLength(1);
      expect(list[0].ticker).toBe('THYAO');
    });
  });

  describe('analysis', () => {
    it('analyzes positions using existing engines', async () => {
      const ctx = createService();
      ctx.registry.upsertPosition({ ticker: 'THYAO', quantity: 100, averageCost: 100 });
      ctx.earlyOpportunityIntelligenceService.getEarlyOpportunity.mockResolvedValue(
        makeIntelligence('THYAO'),
      );
      ctx.latestPrice.getLatestPriceIncremental.mockResolvedValue({
        symbol: 'THYAO',
        timeframe: '1d',
        price: 120,
        previousPrice: 100,
        change: 20,
        changePercent: 20,
        timestamp: new Date().toISOString(),
        provider: 'yahoo',
        sourceTimeframe: '1d',
        dataFreshness: 'fresh',
        lastSuccessfulUpdate: new Date().toISOString(),
        volume: 1000000,
      });
      ctx.symbolRegistry.getSymbol.mockReturnValue({ sector: 'Bankacılık' });

      const analysis = await ctx.service.getAnalysis(false);
      expect(analysis.positions).toHaveLength(1);
      expect(analysis.positions[0].ticker).toBe('THYAO');
      expect(analysis.positions[0].currentPrice).toBe(120);
      expect(analysis.positions[0].positionValue).toBe(12000);
      expect(analysis.risk.totalValue).toBe(12000);
      expect(analysis.opportunities).toBeDefined();
      expect(ctx.cacheService.set).toHaveBeenCalled();
    });

    it('reuses cached analysis', async () => {
      const ctx = createService();
      ctx.registry.upsertPosition({ ticker: 'THYAO', quantity: 100, averageCost: 100 });
      const cached = { score: 42, statusKey: 'BALANCED', statusLabel: 'DENGELİ' } as never;
      ctx.cacheService.get.mockReturnValue(cached);

      const analysis = await ctx.service.getAnalysis(true);
      expect(analysis).toBe(cached);
      expect(ctx.earlyOpportunityIntelligenceService.getEarlyOpportunity).not.toHaveBeenCalled();
    });

    it('handles missing intelligence gracefully', async () => {
      const ctx = createService();
      ctx.registry.upsertPosition({ ticker: 'THYAO', quantity: 100, averageCost: 100 });
      ctx.earlyOpportunityIntelligenceService.getEarlyOpportunity.mockResolvedValue(null);
      ctx.latestPrice.getLatestPriceIncremental.mockResolvedValue(null);
      ctx.symbolRegistry.getSymbol.mockReturnValue(null);

      const analysis = await ctx.service.getAnalysis(false);
      expect(analysis.positions).toHaveLength(1);
      expect(analysis.positions[0].earlyOpportunityScore).toBe(0);
    });

    it('does not duplicate early-opportunity or price provider calls', async () => {
      const ctx = createService();
      ctx.registry.upsertPosition({ ticker: 'THYAO', quantity: 10, averageCost: 100 });
      ctx.registry.upsertPosition({ ticker: 'GARAN', quantity: 10, averageCost: 100 });
      ctx.earlyOpportunityIntelligenceService.getEarlyOpportunity.mockResolvedValue(
        makeIntelligence('THYAO'),
      );
      ctx.latestPrice.getLatestPriceIncremental.mockResolvedValue({
        symbol: 'THYAO',
        timeframe: '1d',
        price: 120,
        previousPrice: 100,
        change: 20,
        changePercent: 20,
        timestamp: new Date().toISOString(),
        provider: 'yahoo',
        sourceTimeframe: '1d',
        dataFreshness: 'fresh',
        lastSuccessfulUpdate: new Date().toISOString(),
        volume: 1000000,
      });
      ctx.symbolRegistry.getSymbol.mockReturnValue({ sector: 'Bankacılık' });

      await ctx.service.getAnalysis(false);

      expect(ctx.earlyOpportunityIntelligenceService.getEarlyOpportunity).toHaveBeenCalledTimes(2);
      expect(ctx.latestPrice.getLatestPriceIncremental).toHaveBeenCalledTimes(2);
      expect(ctx.symbolRegistry.getSymbol).toHaveBeenCalledTimes(2);
    });

    it('refresh bypasses cache and recomputes', async () => {
      const ctx = createService();
      ctx.registry.upsertPosition({ ticker: 'THYAO', quantity: 10, averageCost: 100 });
      ctx.earlyOpportunityIntelligenceService.getEarlyOpportunity.mockResolvedValue(
        makeIntelligence('THYAO'),
      );
      ctx.latestPrice.getLatestPriceIncremental.mockResolvedValue({
        symbol: 'THYAO',
        timeframe: '1d',
        price: 120,
        previousPrice: 100,
        change: 20,
        changePercent: 20,
        timestamp: new Date().toISOString(),
        provider: 'yahoo',
        sourceTimeframe: '1d',
        dataFreshness: 'fresh',
        lastSuccessfulUpdate: new Date().toISOString(),
        volume: 1000000,
      });

      const analysis = await ctx.service.refresh();
      expect(analysis.positions).toHaveLength(1);
      expect(ctx.cacheService.delete).toHaveBeenCalled();
    });
  });

  describe('opportunities', () => {
    it('returns opportunities and caches them', async () => {
      const ctx = createService();
      ctx.earlyOpportunityIntelligenceService.getEarlyOpportunities.mockResolvedValue([
        makeIntelligence('ASELS'),
        makeIntelligence('GARAN'),
      ]);
      const opportunities = await ctx.service.getOpportunities();
      expect(opportunities.newOpportunities).toHaveLength(2);
      expect(ctx.cacheService.set).toHaveBeenCalled();
    });

    it('does not offer held tickers as new opportunities', async () => {
      const ctx = createService();
      ctx.registry.upsertPosition({ ticker: 'ASELS', quantity: 10, averageCost: 50 });
      ctx.earlyOpportunityIntelligenceService.getEarlyOpportunity.mockResolvedValue(
        makeIntelligence('ASELS'),
      );
      ctx.latestPrice.getLatestPriceIncremental.mockResolvedValue({
        symbol: 'ASELS',
        timeframe: '1d',
        price: 60,
        previousPrice: 50,
        change: 10,
        changePercent: 20,
        timestamp: new Date().toISOString(),
        provider: 'yahoo',
        sourceTimeframe: '1d',
        dataFreshness: 'fresh',
        lastSuccessfulUpdate: new Date().toISOString(),
        volume: 1000000,
      });
      ctx.symbolRegistry.getSymbol.mockReturnValue({ sector: 'Savunma' });
      ctx.earlyOpportunityIntelligenceService.getEarlyOpportunities.mockResolvedValue([
        makeIntelligence('ASELS'),
        makeIntelligence('GARAN'),
      ]);
      const opportunities = await ctx.service.getOpportunities();
      expect(opportunities.newOpportunities.map((o) => o.ticker)).not.toContain('ASELS');
      expect(opportunities.newOpportunities.map((o) => o.ticker)).toContain('GARAN');
    });
  });

  describe('sub-reports', () => {
    it('returns risk report from analysis', async () => {
      const ctx = createService();
      ctx.registry.upsertPosition({ ticker: 'THYAO', quantity: 10, averageCost: 100 });
      ctx.earlyOpportunityIntelligenceService.getEarlyOpportunity.mockResolvedValue(
        makeIntelligence('THYAO'),
      );
      ctx.latestPrice.getLatestPriceIncremental.mockResolvedValue({
        symbol: 'THYAO',
        timeframe: '1d',
        price: 120,
        previousPrice: 100,
        change: 20,
        changePercent: 20,
        timestamp: new Date().toISOString(),
        provider: 'yahoo',
        sourceTimeframe: '1d',
        dataFreshness: 'fresh',
        lastSuccessfulUpdate: new Date().toISOString(),
        volume: 1000000,
      });

      const risk = await ctx.service.getRisk();
      expect(risk.totalValue).toBeGreaterThan(0);
    });

    it('returns rebalance report', async () => {
      const ctx = createService();
      ctx.registry.upsertPosition({ ticker: 'THYAO', quantity: 10, averageCost: 100 });
      ctx.earlyOpportunityIntelligenceService.getEarlyOpportunity.mockResolvedValue(
        makeIntelligence('THYAO'),
      );
      ctx.latestPrice.getLatestPriceIncremental.mockResolvedValue({
        symbol: 'THYAO',
        timeframe: '1d',
        price: 120,
        previousPrice: 100,
        change: 20,
        changePercent: 20,
        timestamp: new Date().toISOString(),
        provider: 'yahoo',
        sourceTimeframe: '1d',
        dataFreshness: 'fresh',
        lastSuccessfulUpdate: new Date().toISOString(),
        volume: 1000000,
      });

      const rebalance = await ctx.service.getRebalance();
      expect(rebalance).toHaveLength(1);
    });
  });

  describe('history', () => {
    it('returns snapshot history', async () => {
      const ctx = createService();
      expect(await ctx.service.getHistory()).toEqual([]);
    });
  });

  describe('learning', () => {
    it('returns empty learning when no snapshots', async () => {
      const ctx = createService();
      const learning = await ctx.service.getLearning();
      expect(learning.snapshotCount).toBe(0);
      expect(learning.recommendationAccuracy).toBeNull();
    });
  });

  describe('telegram report', () => {
    it('generates portfolio telegram report', async () => {
      const ctx = createService();
      ctx.registry.upsertPosition({ ticker: 'THYAO', quantity: 10, averageCost: 100 });
      ctx.earlyOpportunityIntelligenceService.getEarlyOpportunity.mockResolvedValue(
        makeIntelligence('THYAO'),
      );
      ctx.latestPrice.getLatestPriceIncremental.mockResolvedValue({
        symbol: 'THYAO',
        timeframe: '1d',
        price: 120,
        previousPrice: 100,
        change: 20,
        changePercent: 20,
        timestamp: new Date().toISOString(),
        provider: 'yahoo',
        sourceTimeframe: '1d',
        dataFreshness: 'fresh',
        lastSuccessfulUpdate: new Date().toISOString(),
        volume: 1000000,
      });

      const report = await ctx.service.getTelegramReport('portfolio');
      expect(report).toContain('Portföy');
      expect(report).toContain('Skor');
    });
  });
});
