import { DashboardReportGeneratorService } from './dashboard-report-generator.service';
import {
  PortfolioSummaryWidget,
  IntelligencePanelWidget,
  PerformanceAnalyticsWidget,
  RiskCenterWidget,
  RiskLevel,
  TrendDirection,
} from './types';

describe('DashboardReportGeneratorService', () => {
  let service: DashboardReportGeneratorService;

  beforeEach(() => {
    service = new DashboardReportGeneratorService();
  });

  const mockPortfolio = (): PortfolioSummaryWidget => ({
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
    riskLevel: RiskLevel.MEDIUM,
    cashAllocation: 20,
    investedAllocation: 80,
    lastUpdated: new Date().toISOString(),
  });

  const mockIntelligence = (): IntelligencePanelWidget => ({
    topOpportunities: [{ id: '1', symbol: 'THYAO', stage: 'CONFIRMED', eliteScore: 80, confidence: 0.9, consensusScore: 85, healthScore: 75, detectedAt: new Date().toISOString(), ageHours: 48, direction: 'BULLISH', trend: 'IMPROVING', sector: 'Ulastirma', strategy: 'momentum' }],
    highestEliteScores: [],
    highestConfidence: [],
    strongestConsensus: [],
    emergingOpportunities: [{ id: '2', symbol: 'GARAN', stage: 'EMERGING', eliteScore: 65, confidence: 0.7, consensusScore: 60, healthScore: 55, detectedAt: new Date().toISOString(), ageHours: 12, direction: 'BULLISH', trend: 'STABLE', sector: 'Bankacilik', strategy: 'value' }],
    weakeningOpportunities: [],
    currentMarketRegime: 'BULL',
    marketRegimeConfidence: 80,
    totalActiveOpportunities: 2,
    lastUpdated: new Date().toISOString(),
  });

  const mockPerformance = (): PerformanceAnalyticsWidget => ({
    overallMetrics: [],
    recommendationSuccessRate: 72.5,
    strategyPerformance: [{ strategy: 'momentum', winRate: 70, totalTrades: 20, avgReturn: 3.5, sharpeRatio: 1.8, maxDrawdown: 10 }],
    sectorPerformance: [{ sector: 'Bankacilik', avgReturn: 5, winRate: 65, exposure: 30, opportunityCount: 12 }],
    timeframePerformance: [],
    historicalPerformance: [],
    benchmarkComparison: { benchmark: 'XU100', portfolioReturn: 15.5, benchmarkReturn: 12, alpha: 3.5 },
    lastUpdated: new Date().toISOString(),
  });

  const mockRisk = (): RiskCenterWidget => ({
    overallRiskScore: 45,
    overallRiskLevel: RiskLevel.MEDIUM,
    riskMetrics: [
      { label: 'Portfoy Riski', value: 45, threshold: 60, level: RiskLevel.MEDIUM, description: 'Genel risk' },
    ],
    sectorConcentration: [{ sector: 'Bankacilik', weight: 30, riskLevel: RiskLevel.HIGH }],
    maxDrawdown: 15,
    currentDrawdown: 5,
    volatility: 18,
    liquidityRisk: RiskLevel.LOW,
    timeframeConflicts: 1,
    regimeRisk: RiskLevel.MEDIUM,
    riskAlerts: ['Test alert'],
    lastUpdated: new Date().toISOString(),
  });

  describe('generateSummaryReport', () => {
    it('should generate report with all sections', () => {
      const report = service.generateSummaryReport(mockPortfolio(), mockIntelligence(), mockPerformance(), mockRisk());
      expect(report).toContain('PORTFOY INTELIGENCE DASHBOARD');
      expect(report).toContain('Portfolio Ozeti');
      expect(report).toContain('Zeka Paneli');
      expect(report).toContain('Performans');
      expect(report).toContain('Risk');
    });

    it('should include portfolio values', () => {
      const report = service.generateSummaryReport(mockPortfolio(), mockIntelligence(), mockPerformance(), mockRisk());
      expect(report).toContain('₺');
      expect(report).toContain('15.50');
    });

    it('should include intelligence data', () => {
      const report = service.generateSummaryReport(mockPortfolio(), mockIntelligence(), mockPerformance(), mockRisk());
      expect(report).toContain('Aktif Firsatlar: 2');
      expect(report).toContain('BULL');
    });
  });

  describe('generatePortfolioReport', () => {
    it('should generate portfolio report', () => {
      const report = service.generatePortfolioReport(mockPortfolio());
      expect(report).toContain('PORTFOZ OZETI');
      expect(report).toContain('₺');
      expect(report).toContain('15.50');
    });
  });

  describe('generateRiskReport', () => {
    it('should generate risk report', () => {
      const report = service.generateRiskReport(mockRisk());
      expect(report).toContain('RISK MERKEZI');
      expect(report).toContain('Genel Risk: MEDIUM (45.0)');
      expect(report).toContain('Bankacilik');
    });

    it('should include risk alerts', () => {
      const report = service.generateRiskReport(mockRisk());
      expect(report).toContain('Test alert');
    });
  });

  describe('generateIntelligenceReport', () => {
    it('should generate intelligence report', () => {
      const report = service.generateIntelligenceReport(mockIntelligence());
      expect(report).toContain('ZEKA PANELI');
      expect(report).toContain('BULL');
      expect(report).toContain('THYAO');
    });
  });

  describe('generatePerformanceReport', () => {
    it('should generate performance report', () => {
      const report = service.generatePerformanceReport(mockPerformance());
      expect(report).toContain('PERFORMANS ANALITIGI');
      expect(report).toContain('72.5');
      expect(report).toContain('momentum');
    });
  });
});
