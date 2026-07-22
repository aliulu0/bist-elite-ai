import { DashboardDataService } from './dashboard-data.service';
import { IntelligencePanelService } from './intelligence-panel.service';
import { PerformanceAnalyticsService } from './performance-analytics.service';
import { RiskCenterService } from './risk-center.service';
import { ExplainabilityCenterService } from './explainability-center.service';
import { NotificationCenterService } from './notification-center.service';
import { DashboardTimelineService } from './dashboard-timeline.service';
import { DashboardFilterService } from './dashboard-filter.service';
import { DashboardReportGeneratorService } from './dashboard-report-generator.service';
import { RiskLevel, AlertPriority, DashboardFilterType, DASHBOARD_CONFIG_DEFAULTS } from './types';

describe('DashboardDataService', () => {
  let service: DashboardDataService;

  beforeEach(() => {
    service = new DashboardDataService(
      new IntelligencePanelService(),
      new PerformanceAnalyticsService(),
      new RiskCenterService(),
      new ExplainabilityCenterService(),
      new NotificationCenterService(),
      new DashboardTimelineService(),
      new DashboardFilterService(),
      new DashboardReportGeneratorService(),
    );
  });

  describe('setConfig / getConfig', () => {
    it('should update config', () => {
      service.setConfig({ maxAlerts: 100 });
      expect(service.getConfig().maxAlerts).toBe(100);
    });

    it('should preserve defaults', () => {
      const config = service.getConfig();
      expect(config.maxOpportunities).toBe(DASHBOARD_CONFIG_DEFAULTS.maxOpportunities);
    });
  });

  describe('getPortfolioSummary', () => {
    it('should return portfolio summary with risk level', () => {
      const result = service.getPortfolioSummary({
        totalValue: 1000000,
        cashBalance: 200000,
        investedValue: 800000,
        totalReturn: 15.5,
        totalReturnPercent: 15.5,
        todayReturn: 1200,
        todayReturnPercent: 0.12,
        weekReturn: 3500,
        weekReturnPercent: 0.35,
        monthReturn: 8000,
        monthReturnPercent: 0.8,
        openPositionsCount: 5,
        closedPositionsCount: 12,
        winRate: 72.5,
        portfolioRiskScore: 45,
      });

      expect(result.riskLevel).toBe(RiskLevel.MEDIUM);
      expect(result.cashAllocation).toBeCloseTo(20, 1);
      expect(result.investedAllocation).toBeCloseTo(80, 1);
      expect(result.lastUpdated).toBeDefined();
    });

    it('should set LOW risk for low score', () => {
      const result = service.getPortfolioSummary({
        totalValue: 500000, cashBalance: 100000, investedValue: 400000,
        totalReturn: 5, totalReturnPercent: 5, todayReturn: 0, todayReturnPercent: 0,
        weekReturn: 0, weekReturnPercent: 0, monthReturn: 0, monthReturnPercent: 0,
        openPositionsCount: 3, closedPositionsCount: 5, winRate: 65, portfolioRiskScore: 20,
      });

      expect(result.riskLevel).toBe(RiskLevel.LOW);
    });

    it('should set CRITICAL risk for high score', () => {
      const result = service.getPortfolioSummary({
        totalValue: 500000, cashBalance: 100000, investedValue: 400000,
        totalReturn: -20, totalReturnPercent: -20, todayReturn: -5000, todayReturnPercent: -1,
        weekReturn: -10000, weekReturnPercent: -2, monthReturn: -30000, monthReturnPercent: -6,
        openPositionsCount: 8, closedPositionsCount: 15, winRate: 35, portfolioRiskScore: 90,
      });

      expect(result.riskLevel).toBe(RiskLevel.CRITICAL);
    });
  });

  describe('getIntelligencePanel', () => {
    it('should return intelligence panel', () => {
      const result = service.getIntelligencePanel({
        opportunities: [],
        marketRegime: 'SIDEWAYS',
        regimeConfidence: 70,
      });

      expect(result.currentMarketRegime).toBe('SIDEWAYS');
      expect(result.totalActiveOpportunities).toBe(0);
    });

    it('should include opportunities', () => {
      const result = service.getIntelligencePanel({
        opportunities: [
          { id: '1', symbol: 'THYAO', stage: 'CONFIRMED', eliteScore: 80, confidence: 0.9, consensusScore: 85, healthScore: 75, detectedAt: new Date().toISOString(), direction: 'BULLISH', trend: 'IMPROVING', sector: 'Ulastirma', strategy: 'momentum' },
        ],
        marketRegime: 'BULL',
        regimeConfidence: 85,
      });

      expect(result.totalActiveOpportunities).toBe(1);
      expect(result.topOpportunities[0].symbol).toBe('THYAO');
    });
  });

  describe('getPerformanceAnalytics', () => {
    it('should return performance analytics', () => {
      const result = service.getPerformanceAnalytics({
        winRate: 72.5, totalReturn: 15, todayReturn: 0.5, weekReturn: 2, monthReturn: 5,
        sharpeRatio: 1.8, maxDrawdown: 12, strategyPerformance: [], sectorPerformance: [],
        timeframePerformance: [], historicalPerformance: [],
      });

      expect(result.recommendationSuccessRate).toBe(72.5);
      expect(result.benchmarkComparison.alpha).toBe(15);
    });
  });

  describe('getRiskCenter', () => {
    it('should return risk center', () => {
      const result = service.getRiskCenter({
        overallRiskScore: 50,
        sectorExposures: [{ sector: 'Bankacilik', weight: 30 }],
        maxDrawdown: 15, currentDrawdown: 5, volatility: 18,
        liquidityRiskLevel: RiskLevel.LOW, timeframeConflicts: 1, regimeRiskLevel: RiskLevel.MEDIUM,
      });

      expect(result.overallRiskScore).toBe(50);
      expect(result.sectorConcentration).toHaveLength(1);
    });
  });

  describe('getNotificationCenter', () => {
    it('should return notification center', () => {
      const result = service.getNotificationCenter();
      expect(result.totalAlerts).toBe(0);
    });
  });

  describe('getTimeline', () => {
    it('should return timeline', () => {
      const result = service.getTimeline();
      expect(result).toHaveProperty('opportunityTimeline');
      expect(result).toHaveProperty('recommendationTimeline');
    });
  });

  describe('filter operations', () => {
    it('should add and get active filters', () => {
      service.addFilter({ type: DashboardFilterType.SECTOR, value: 'Bankacilik', label: 'Bankacilik' });
      expect(service.getActiveFilters()).toHaveLength(1);
    });

    it('should remove filter', () => {
      service.addFilter({ type: DashboardFilterType.SECTOR, value: 'Bankacilik', label: 'Bankacilik' });
      service.removeFilter(DashboardFilterType.SECTOR, 'Bankacilik');
      expect(service.getActiveFilters()).toHaveLength(0);
    });

    it('should clear filters', () => {
      service.addFilter({ type: DashboardFilterType.SECTOR, value: 'A', label: 'A' });
      service.addFilter({ type: DashboardFilterType.STRATEGY, value: 'B', label: 'B' });
      service.clearFilters();
      expect(service.getActiveFilters()).toHaveLength(0);
    });

    it('should get filter options', () => {
      const options = service.getFilterOptions(['THYAO'], ['Bankacilik'], ['momentum']);
      expect(options.sectors).toContain('Bankacilik');
      expect(options.strategies).toContain('momentum');
    });
  });

  describe('alert operations', () => {
    it('should add opportunity alert', () => {
      service.addOpportunityAlert('THYAO', 'Yeni firsat', AlertPriority.HIGH);
      const center = service.getNotificationCenter();
      expect(center.totalAlerts).toBe(1);
      expect(center.alerts[0].symbol).toBe('THYAO');
    });

    it('should add risk alert', () => {
      service.addRiskAlert('Cekilme', AlertPriority.CRITICAL);
      const center = service.getNotificationCenter();
      expect(center.totalAlerts).toBe(1);
    });

    it('should add portfolio alert', () => {
      service.addPortfolioAlert('GARAN', 'Dikkat', AlertPriority.MEDIUM);
      const center = service.getNotificationCenter();
      expect(center.totalAlerts).toBe(1);
    });
  });

  describe('report generation', () => {
    it('should generate portfolio report', () => {
      const report = service.generatePortfolioReport(service.getPortfolioSummary({
        totalValue: 1000000, cashBalance: 200000, investedValue: 800000,
        totalReturn: 15, totalReturnPercent: 15, todayReturn: 1000, todayReturnPercent: 0.1,
        weekReturn: 3000, weekReturnPercent: 0.3, monthReturn: 7000, monthReturnPercent: 0.7,
        openPositionsCount: 5, closedPositionsCount: 10, winRate: 70, portfolioRiskScore: 40,
      }));

      expect(report).toContain('PORTFOZ OZETI');
    });

    it('should generate risk report', () => {
      const report = service.generateRiskReport(service.getRiskCenter({
        overallRiskScore: 50, sectorExposures: [], maxDrawdown: 10, currentDrawdown: 3,
        volatility: 15, liquidityRiskLevel: RiskLevel.LOW, timeframeConflicts: 0, regimeRiskLevel: RiskLevel.LOW,
      }));

      expect(report).toContain('RISK MERKEZI');
    });

    it('should generate intelligence report', () => {
      const report = service.generateIntelligenceReport(service.getIntelligencePanel({
        opportunities: [], marketRegime: 'BULL', regimeConfidence: 80,
      }));

      expect(report).toContain('ZEKA PANELI');
    });

    it('should generate performance report', () => {
      const report = service.generatePerformanceReport(service.getPerformanceAnalytics({
        winRate: 70, totalReturn: 15, todayReturn: 0, weekReturn: 0, monthReturn: 0,
        sharpeRatio: 1.5, maxDrawdown: 10, strategyPerformance: [], sectorPerformance: [],
        timeframePerformance: [], historicalPerformance: [],
      }));

      expect(report).toContain('PERFORMANS ANALITIGI');
    });
  });

  describe('getExplainabilityCenter', () => {
    it('should return explainability center service', () => {
      const center = service.getExplainabilityCenter();
      expect(center).toBeInstanceOf(ExplainabilityCenterService);
    });
  });
});
