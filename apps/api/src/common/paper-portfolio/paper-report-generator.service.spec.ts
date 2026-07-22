import { PaperReportGeneratorService } from './paper-report-generator.service';
import {
  PortfolioState, PerformanceReport, RiskAssessment,
  PositionStatus, PositionState, MarketRegime,
} from './types';

describe('PaperReportGeneratorService', () => {
  let service: PaperReportGeneratorService;

  beforeEach(() => {
    service = new PaperReportGeneratorService();
  });

  const createPosition = (overrides?: Partial<PositionState>): PositionState => ({
    id: 'pos-1',
    stockSymbol: 'THYAO',
    stockName: 'THY',
    status: PositionStatus.OPEN,
    side: 'BUY',
    quantity: 100,
    avgCost: 100,
    currentPrice: 110,
    unrealizedPnl: 1000,
    realizedPnl: 0,
    entryTime: '2025-01-15T10:00:00Z',
    holdingPeriodDays: 5,
    notes: [],
    entryEliteScore: 70,
    entryConfidence: 0.7,
    entryConsensusScore: 70,
    strategyUsed: 'test',
    marketRegime: MarketRegime.BULL,
    timeframeConsensus: 'strong',
    sector: 'Ulaştırma',
    ...overrides,
  });

  const createPortfolio = (overrides?: Partial<PortfolioState>): PortfolioState => ({
    id: 'portfolio-1',
    name: 'Test Portföy',
    type: 'DEFAULT' as any,
    initialCapital: 1000000,
    cashBalance: 900000,
    positions: new Map(),
    orders: [],
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
    peakValue: 1000000,
    ...overrides,
  });

  const createPerformance = (overrides?: Partial<PerformanceReport>): PerformanceReport => ({
    portfolioId: 'portfolio-1',
    portfolioName: 'Test',
    totalReturn: 5.5,
    realizedReturn: 2.0,
    unrealizedReturn: 3.5,
    dailyReturns: [],
    monthlyReturn: 5.5,
    annualizedReturn: 66,
    maxDrawdown: 8.5,
    currentDrawdown: 2.3,
    portfolioVolatility: 15.2,
    sharpeRatio: 0.85,
    winRate: 0.65,
    lossRate: 0.35,
    profitFactor: 2.1,
    avgWinningTrade: 15000,
    avgLosingTrade: -8000,
    avgHoldingPeriod: 12.5,
    sectorExposure: { 'Ulaştırma': 0.3, 'Bankacılık': 0.2 },
    cashAllocation: 0.45,
    concentrationRisk: 0.3,
    generatedAt: '2025-01-15T10:00:00Z',
    disclaimer: 'Test',
    ...overrides,
  });

  const createRisk = (overrides?: Partial<RiskAssessment>): RiskAssessment => ({
    portfolioId: 'portfolio-1',
    overallRiskScore: 35,
    cashAllocation: 0.45,
    sectorExposure: { 'Ulaştırma': 0.3 },
    maxConcentration: 0.3,
    positionCount: 2,
    drawdown: 2.3,
    withinDrawdownLimit: true,
    riskFactors: [
      { type: 'SEKTOR_RISKI', severity: 'Orta', description: 'Ulaştırma yüksek' },
    ],
    generatedAt: '2025-01-15T10:00:00Z',
    ...overrides,
  });

  describe('generateSummaryReport', () => {
    it('should generate summary report', () => {
      const portfolio = createPortfolio();
      const performance = createPerformance();
      const risk = createRisk();

      const report = service.generateSummaryReport(portfolio, performance, risk);

      expect(report).toContain('KAĞIT PORTFÖY ÖZET RAPORU');
      expect(report).toContain('Test Portföy');
      expect(report).toContain('Toplam Getiri');
      expect(report).toContain('Risk Skoru');
      expect(report).toContain('Kazanma Oranı');
    });

    it('should include risk factors', () => {
      const portfolio = createPortfolio();
      const performance = createPerformance();
      const risk = createRisk();

      const report = service.generateSummaryReport(portfolio, performance, risk);

      expect(report).toContain('Risk Faktörleri');
      expect(report).toContain('Ulaştırma yüksek');
    });
  });

  describe('generatePositionReport', () => {
    it('should generate report with positions', () => {
      const positions = new Map();
      positions.set('THYAO', createPosition());
      const portfolio = createPortfolio({ positions });

      const report = service.generatePositionReport(portfolio);

      expect(report).toContain('POZİSYON DETAY RAPORU');
      expect(report).toContain('THYAO');
      expect(report).toContain('AÇIK POZİSYONLAR');
    });

    it('should show empty message when no positions', () => {
      const portfolio = createPortfolio();
      const report = service.generatePositionReport(portfolio);

      expect(report).toContain('Henüz pozisyon bulunmuyor');
    });
  });

  describe('generateRiskReport', () => {
    it('should generate risk report', () => {
      const risk = createRisk();
      const report = service.generateRiskReport(risk);

      expect(report).toContain('RİSK ANALİZ RAPORU');
      expect(report).toContain('Risk Skoru');
      expect(report).toContain('RİSK FAKTÖRLERİ');
    });

    it('should show no risk factors message', () => {
      const risk = createRisk({ riskFactors: [] });
      const report = service.generateRiskReport(risk);

      expect(report).toContain('Belirgin risk faktörü tespit edilmedi');
    });
  });
});
