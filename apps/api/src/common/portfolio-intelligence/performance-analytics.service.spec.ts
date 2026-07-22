import { PerformanceAnalyticsService } from './performance-analytics.service';

describe('PerformanceAnalyticsService', () => {
  let service: PerformanceAnalyticsService;

  beforeEach(() => {
    service = new PerformanceAnalyticsService();
  });

  describe('getPerformanceWidget', () => {
    it('should return widget with correct structure', () => {
      const result = service.getPerformanceWidget({
        winRate: 65,
        totalReturn: 15.5,
        todayReturn: 1.2,
        weekReturn: 3.5,
        monthReturn: 8.2,
        sharpeRatio: 1.8,
        maxDrawdown: 12.5,
        strategyPerformance: [],
        sectorPerformance: [],
        timeframePerformance: [],
        historicalPerformance: [],
      });

      expect(result).toHaveProperty('overallMetrics');
      expect(result).toHaveProperty('recommendationSuccessRate');
      expect(result).toHaveProperty('strategyPerformance');
      expect(result).toHaveProperty('sectorPerformance');
      expect(result).toHaveProperty('timeframePerformance');
      expect(result).toHaveProperty('historicalPerformance');
      expect(result).toHaveProperty('benchmarkComparison');
      expect(result).toHaveProperty('lastUpdated');
    });

    it('should set recommendationSuccessRate', () => {
      const result = service.getPerformanceWidget({
        winRate: 72.5,
        totalReturn: 10,
        todayReturn: 0,
        weekReturn: 0,
        monthReturn: 0,
        sharpeRatio: 1,
        maxDrawdown: 5,
        strategyPerformance: [],
        sectorPerformance: [],
        timeframePerformance: [],
        historicalPerformance: [],
      });

      expect(result.recommendationSuccessRate).toBe(72.5);
    });

    it('should calculate benchmark comparison with default', () => {
      const result = service.getPerformanceWidget({
        winRate: 60,
        totalReturn: 20,
        todayReturn: 0,
        weekReturn: 0,
        monthReturn: 0,
        sharpeRatio: 1,
        maxDrawdown: 10,
        strategyPerformance: [],
        sectorPerformance: [],
        timeframePerformance: [],
        historicalPerformance: [],
      });

      expect(result.benchmarkComparison.portfolioReturn).toBe(20);
      expect(result.benchmarkComparison.benchmarkReturn).toBe(0);
      expect(result.benchmarkComparison.alpha).toBe(20);
    });

    it('should calculate benchmark comparison with custom return', () => {
      const result = service.getPerformanceWidget({
        winRate: 60,
        totalReturn: 20,
        todayReturn: 0,
        weekReturn: 0,
        monthReturn: 0,
        sharpeRatio: 1,
        maxDrawdown: 10,
        strategyPerformance: [],
        sectorPerformance: [],
        timeframePerformance: [],
        historicalPerformance: [],
        benchmarkReturn: 15,
      });

      expect(result.benchmarkComparison.alpha).toBe(5);
    });

    it('should have 7 overall metrics', () => {
      const result = service.getPerformanceWidget({
        winRate: 60,
        totalReturn: 10,
        todayReturn: 1,
        weekReturn: 2,
        monthReturn: 5,
        sharpeRatio: 1.5,
        maxDrawdown: 8,
        strategyPerformance: [],
        sectorPerformance: [],
        timeframePerformance: [],
        historicalPerformance: [],
      });

      expect(result.overallMetrics).toHaveLength(7);
    });

    it('should map strategy performance', () => {
      const result = service.getPerformanceWidget({
        winRate: 60,
        totalReturn: 10,
        todayReturn: 0,
        weekReturn: 0,
        monthReturn: 0,
        sharpeRatio: 1,
        maxDrawdown: 5,
        strategyPerformance: [
          { strategy: 'momentum', winRate: 70, totalTrades: 20, avgReturn: 3.5, sharpeRatio: 1.8, maxDrawdown: 10 },
        ],
        sectorPerformance: [],
        timeframePerformance: [],
        historicalPerformance: [],
      });

      expect(result.strategyPerformance).toHaveLength(1);
      expect(result.strategyPerformance[0].strategy).toBe('momentum');
    });

    it('should map sector performance', () => {
      const result = service.getPerformanceWidget({
        winRate: 60,
        totalReturn: 10,
        todayReturn: 0,
        weekReturn: 0,
        monthReturn: 0,
        sharpeRatio: 1,
        maxDrawdown: 5,
        strategyPerformance: [],
        sectorPerformance: [
          { sector: 'Bankacilik', avgReturn: 5, winRate: 65, exposure: 30, opportunityCount: 12 },
        ],
        timeframePerformance: [],
        historicalPerformance: [],
      });

      expect(result.sectorPerformance).toHaveLength(1);
      expect(result.sectorPerformance[0].sector).toBe('Bankacilik');
    });
  });

  describe('calculateSharpeRatio', () => {
    it('should calculate Sharpe ratio for positive returns', () => {
      const returns = [0.05, 0.08, 0.03, 0.06, 0.04];
      const sharpe = service.calculateSharpeRatio(returns, 0.02);
      expect(sharpe).toBeGreaterThan(0);
    });

    it('should return 0 for empty returns', () => {
      expect(service.calculateSharpeRatio([])).toBe(0);
    });

    it('should return 0 for zero standard deviation', () => {
      const result = service.calculateSharpeRatio([0.05, 0.05, 0.05]);
      expect(result).toBe(0);
    });
  });

  describe('calculateMaxDrawdown', () => {
    it('should calculate max drawdown', () => {
      const equity = [100, 110, 105, 95, 100, 90];
      const dd = service.calculateMaxDrawdown(equity);
      expect(dd).toBeCloseTo(18.18, 1);
    });

    it('should return 0 for monotonically increasing', () => {
      const equity = [100, 110, 120, 130];
      expect(service.calculateMaxDrawdown(equity)).toBe(0);
    });

    it('should return 0 for empty array', () => {
      expect(service.calculateMaxDrawdown([])).toBe(0);
    });
  });

  describe('calculateWinRate', () => {
    it('should calculate win rate', () => {
      const outcomes: ('WIN' | 'LOSS' | 'BREAKEVEN')[] = ['WIN', 'LOSS', 'WIN', 'WIN', 'LOSS'];
      expect(service.calculateWinRate(outcomes)).toBe(60);
    });

    it('should return 0 for empty outcomes', () => {
      expect(service.calculateWinRate([])).toBe(0);
    });

    it('should return 100 for all wins', () => {
      const outcomes: ('WIN' | 'LOSS' | 'BREAKEVEN')[] = ['WIN', 'WIN', 'WIN'];
      expect(service.calculateWinRate(outcomes)).toBe(100);
    });
  });

  describe('getTrendFromChange', () => {
    it('should return UP for positive change', () => {
      expect(service.getTrendFromChange(2)).toBe('UP');
    });

    it('should return DOWN for negative change', () => {
      expect(service.getTrendFromChange(-2)).toBe('DOWN');
    });

    it('should return FLAT for small change', () => {
      expect(service.getTrendFromChange(0.1)).toBe('FLAT');
    });
  });
});
