import { PortfolioIntelligenceEngine } from '../portfolio-intelligence.engine';
import { PORTFOLIO_INTELLIGENCE_WEIGHTS } from '../portfolio-intelligence.config';
import { makePositionAnalysis } from './test-helpers';

describe('PortfolioIntelligenceEngine', () => {
  let engine: PortfolioIntelligenceEngine;

  beforeEach(() => {
    engine = new PortfolioIntelligenceEngine();
  });

  describe('classifyStatusKey', () => {
    it('classifies very strong scores', () => {
      expect(engine.classifyStatusKey(80)).toBe('VERY_STRONG');
    });

    it('classifies strong scores', () => {
      expect(engine.classifyStatusKey(65)).toBe('STRONG');
    });

    it('classifies balanced scores', () => {
      expect(engine.classifyStatusKey(50)).toBe('BALANCED');
    });

    it('classifies warning scores', () => {
      expect(engine.classifyStatusKey(35)).toBe('WARNING');
    });

    it('classifies high risk scores', () => {
      expect(engine.classifyStatusKey(10)).toBe('HIGH_RISK');
    });

    it('is deterministic', () => {
      const a = engine.classifyStatusKey(42);
      const b = engine.classifyStatusKey(42);
      expect(a).toBe(b);
    });
  });

  describe('analyzePortfolio', () => {
    it('handles empty portfolio', () => {
      const analysis = engine.analyzePortfolio([], 0, '2025-01-01T00:00:00.000Z');
      expect(analysis.positions).toHaveLength(0);
      expect(analysis.risk.totalValue).toBe(0);
      expect(analysis.score).toBeGreaterThanOrEqual(0);
      expect(analysis.statusLabel).toBeDefined();
      expect(analysis.risk.warnings.some((w) => w.includes('pozisyon'))).toBe(true);
    });

    it('handles a single position', () => {
      const position = makePositionAnalysis({ portfolioWeight: 100, sectorWeight: 100 });
      const analysis = engine.analyzePortfolio([position], 0, '2025-01-01T00:00:00.000Z');
      expect(analysis.positions).toHaveLength(1);
      expect(analysis.risk.maxPositionWeight).toBe(100);
      expect(analysis.risk.maxPositionTicker).toBe('THYAO');
      expect(analysis.risk.top3Concentration).toBe(100);
      expect(analysis.rebalance).toHaveLength(1);
      expect(analysis.scenarios.bull).toBeDefined();
      expect(analysis.scenarios.base).toBeDefined();
      expect(analysis.scenarios.bear).toBeDefined();
      expect(analysis.horizons.best).toBeDefined();
    });

    it('handles multiple positions with sector concentration', () => {
      const a = makePositionAnalysis({
        ticker: 'THYAO',
        sector: 'Havacılık',
        positionValue: 6000,
        investedCapital: 5000,
        portfolioWeight: 50,
        sectorWeight: 50,
        expectedReturn: 10,
        earlyOpportunityScore: 70,
      });
      const b = makePositionAnalysis({
        ticker: 'PGSUS',
        company: 'Pegasus',
        sector: 'Havacılık',
        positionValue: 3000,
        investedCapital: 2500,
        portfolioWeight: 25,
        sectorWeight: 50,
        expectedReturn: 5,
        earlyOpportunityScore: 60,
      });
      const c = makePositionAnalysis({
        ticker: 'ASELS',
        company: 'Aselsan',
        sector: 'Savunma',
        positionValue: 3000,
        investedCapital: 3000,
        portfolioWeight: 25,
        sectorWeight: 25,
        expectedReturn: -3,
        earlyOpportunityScore: 40,
      });
      const analysis = engine.analyzePortfolio([a, b, c], 0, '2025-01-01T00:00:00.000Z');
      expect(analysis.risk.totalValue).toBe(12000);
      expect(analysis.risk.investedCapital).toBe(10500);
      expect(analysis.risk.sectorConcentration).toBe(75);
      expect(analysis.risk.top3Concentration).toBe(100);
      const havacilik = analysis.sectorAllocation.find((s) => s.sector === 'Havacılık');
      expect(havacilik?.weight).toBe(75);
      expect(analysis.rebalance).toHaveLength(3);
    });

    it('produces deterministic output for identical input', () => {
      const positions = [makePositionAnalysis(), makePositionAnalysis({ ticker: 'PGSUS' })];
      const a = engine.analyzePortfolio(positions, 0, '2025-01-01T00:00:00.000Z');
      const b = engine.analyzePortfolio(positions, 0, '2025-01-01T00:00:00.000Z');
      expect(a.score).toBe(b.score);
      expect(a.risk).toEqual(b.risk);
      expect(a.rebalance).toEqual(b.rebalance);
      expect(a.scenarios).toEqual(b.scenarios);
    });
  });

  describe('computePortfolioRisk', () => {
    it('detects single-stock concentration warning', () => {
      const position = makePositionAnalysis({ portfolioWeight: 31 });
      const risk = engine.computePortfolioRisk([position], 0);
      expect(risk.warnings.some((w) => w.includes('tek hissede'))).toBe(true);
    });

    it('detects sector concentration warning', () => {
      const a = makePositionAnalysis({ sector: 'Bankacılık', portfolioWeight: 40, positionValue: 4000 });
      const b = makePositionAnalysis({ ticker: 'GARAN', sector: 'Bankacılık', portfolioWeight: 30, positionValue: 3000 });
      const risk = engine.computePortfolioRisk([a, b], 0);
      expect(risk.sectorConcentration).toBe(70);
      expect(risk.warnings.some((w) => w.includes('sektörde'))).toBe(true);
    });

    it('computes P&L correctly', () => {
      const position = makePositionAnalysis({
        positionValue: 12000,
        investedCapital: 10000,
        unrealizedPnl: 2000,
        unrealizedPnlPercent: 20,
      });
      const risk = engine.computePortfolioRisk([position], 0);
      expect(risk.unrealizedPnl).toBe(2000);
      expect(risk.unrealizedPnlPercent).toBe(20);
    });

    it('computes diversification score', () => {
      const single = makePositionAnalysis({ portfolioWeight: 100 });
      const many = [
        makePositionAnalysis({ portfolioWeight: 20, positionValue: 2000 }),
        makePositionAnalysis({ ticker: 'B', portfolioWeight: 20, positionValue: 2000 }),
        makePositionAnalysis({ ticker: 'C', portfolioWeight: 20, positionValue: 2000 }),
        makePositionAnalysis({ ticker: 'D', portfolioWeight: 20, positionValue: 2000 }),
        makePositionAnalysis({ ticker: 'E', portfolioWeight: 20, positionValue: 2000 }),
      ];
      const singleRisk = engine.computePortfolioRisk([single], 0);
      const manyRisk = engine.computePortfolioRisk(many, 0);
      expect(manyRisk.diversificationScore).toBeGreaterThan(singleRisk.diversificationScore);
    });
  });

  describe('computeRebalance', () => {
    it('flags oversized position as REDUCE_CONCENTRATION', () => {
      const position = makePositionAnalysis({ portfolioWeight: 35, earlyOpportunityScore: 60 });
      const [reco] = engine.computeRebalance([position], [{ sector: 'Havacılık', weight: 35 }]);
      expect(reco.status).toBe('REDUCE_CONCENTRATION');
      expect(reco.currentWeight).toBe(35);
      expect(reco.recommendedMax).toBeLessThan(35);
      expect(reco.reason).toContain('%');
    });

    it('flags undersized position as CONSIDER_INCREASE', () => {
      const position = makePositionAnalysis({ portfolioWeight: 4, earlyOpportunityScore: 75 });
      const [reco] = engine.computeRebalance([position], [{ sector: 'Havacılık', weight: 4 }]);
      expect(reco.status).toBe('CONSIDER_INCREASE');
      expect(reco.recommendedMin).toBeGreaterThan(4);
    });

    it('flags in-range position as IN_RANGE', () => {
      const position = makePositionAnalysis({ portfolioWeight: 15, earlyOpportunityScore: 60 });
      const [reco] = engine.computeRebalance([position], [{ sector: 'Havacılık', weight: 15 }]);
      expect(reco.status).toBe('IN_RANGE');
    });

    it('gives HIGH priority to extreme concentration', () => {
      const position = makePositionAnalysis({ portfolioWeight: 45, earlyOpportunityScore: 60 });
      const [reco] = engine.computeRebalance([position], [{ sector: 'Havacılık', weight: 45 }]);
      expect(reco.priority).toBe('HIGH');
    });
  });

  describe('computeScenarios', () => {
    it('builds bull/base/bear scenarios', () => {
      const positions = [
        makePositionAnalysis({ expectedReturn: 12, target1: 135, stop: 88, currentPrice: 120 }),
        makePositionAnalysis({ ticker: 'PGSUS', expectedReturn: -5, target1: 110, stop: 80, currentPrice: 100 }),
      ];
      const risk = engine.computePortfolioRisk(positions, 0);
      const scenarios = engine.computeScenarios(positions, risk);
      expect(scenarios.bull.expectedPortfolioReturn).toBeGreaterThan(scenarios.base.expectedPortfolioReturn);
      expect(scenarios.bear.expectedPortfolioReturn).toBeLessThan(scenarios.base.expectedPortfolioReturn);
      expect(scenarios.bull.mostSensitivePositions.length).toBeGreaterThan(0);
      expect(scenarios.bear.mostSensitivePositions.length).toBeGreaterThan(0);
      expect(scenarios.bull.explanation).toContain('Bull');
    });

    it('is deterministic', () => {
      const positions = [makePositionAnalysis()];
      const risk = engine.computePortfolioRisk(positions, 0);
      const a = engine.computeScenarios(positions, risk);
      const b = engine.computeScenarios(positions, risk);
      expect(a).toEqual(b);
    });
  });

  describe('computeHorizons', () => {
    it('identifies best and worst horizon', () => {
      const positions = [
        makePositionAnalysis({ expectedReturn: 15, portfolioWeight: 50, holdingPeriod: { value: 5, unit: 'days' } }),
        makePositionAnalysis({ ticker: 'PGSUS', expectedReturn: 3, portfolioWeight: 50, holdingPeriod: { value: 90, unit: 'months' } }),
      ];
      const horizons = engine.computeHorizons(positions);
      expect(horizons.best).toBeDefined();
      expect(horizons.worst).toBeDefined();
      expect(horizons.swing).not.toBeNull();
      expect(horizons.position).not.toBeNull();
    });

    it('returns defaults for empty portfolio', () => {
      const horizons = engine.computeHorizons([]);
      expect(horizons.best.return).toBe(0);
      expect(horizons.best.label).toBeDefined();
    });
  });

  describe('classifyPositionStatus', () => {
    it('classifies strong positions as STRONG_HOLD', () => {
      const result = engine.classifyPositionStatus({
        pnlPercent: 10,
        riskScore: 20,
        earlyOpportunityScore: 75,
        confidence: 70,
        smartMoneyScore: 80,
      });
      expect(result.status).toBe('STRONG_HOLD');
      expect(result.recommendation).toBe('hold');
    });

    it('classifies weak positions as REDUCE', () => {
      const result = engine.classifyPositionStatus({
        pnlPercent: 0,
        riskScore: 20,
        earlyOpportunityScore: 20,
        confidence: 40,
        smartMoneyScore: 30,
      });
      expect(result.status).toBe('REDUCE');
      expect(result.recommendationReason).toContain('Smart Money');
    });

    it('classifies deep-loss positions as EXIT_REVIEW', () => {
      const result = engine.classifyPositionStatus({
        pnlPercent: -20,
        riskScore: 20,
        earlyOpportunityScore: 70,
        confidence: 80,
        smartMoneyScore: 80,
      });
      expect(result.status).toBe('EXIT_REVIEW');
    });

    it('classifies high-risk positions as EXIT_REVIEW', () => {
      const result = engine.classifyPositionStatus({
        pnlPercent: 5,
        riskScore: 70,
        earlyOpportunityScore: 70,
        confidence: 80,
        smartMoneyScore: 80,
      });
      expect(result.status).toBe('EXIT_REVIEW');
    });

    it('classifies medium positions as HOLD', () => {
      const result = engine.classifyPositionStatus({
        pnlPercent: 5,
        riskScore: 30,
        earlyOpportunityScore: 55,
        confidence: 50,
        smartMoneyScore: 60,
      });
      expect(result.status).toBe('HOLD');
    });

    it('classifies low-medium positions as WATCH', () => {
      const result = engine.classifyPositionStatus({
        pnlPercent: 5,
        riskScore: 30,
        earlyOpportunityScore: 38,
        confidence: 50,
        smartMoneyScore: 60,
      });
      expect(result.status).toBe('WATCH');
    });
  });

  describe('buildOpportunitiesSection', () => {
    it('splits improving and deteriorating holdings', () => {
      const improving = makePositionAnalysis({ status: 'STRONG_HOLD', earlyOpportunityScore: 80 });
      const deteriorating = makePositionAnalysis({ ticker: 'PGSUS', status: 'REDUCE', earlyOpportunityScore: 30 });
      const risk = engine.computePortfolioRisk([improving, deteriorating], 0);
      const opportunities = engine.buildOpportunitiesSection([improving, deteriorating], risk);
      expect(opportunities.improvingHoldings.map((p) => p.ticker)).toContain('THYAO');
      expect(opportunities.deterioratingHoldings.map((p) => p.ticker)).toContain('PGSUS');
      expect(opportunities.summary).toContain('İyileşen');
    });
  });

  describe('computeScoreBreakdown / computePortfolioScore', () => {
    it('computes score in range 0-100', () => {
      const position = makePositionAnalysis();
      const risk = engine.computePortfolioRisk([position], 0);
      const breakdown = engine.computeScoreBreakdown([position], risk);
      const score = engine.computePortfolioScore(breakdown);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('weights sum to 1', () => {
      const sum = Object.values(PORTFOLIO_INTELLIGENCE_WEIGHTS).reduce((a: number, b: number) => a + b, 0);
      expect(Math.abs(sum - 1)).toBeLessThan(0.001);
    });
  });
});
