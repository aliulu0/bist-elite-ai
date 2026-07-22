import { PaperPortfolioOrchestratorService } from './paper-portfolio-orchestrator.service';
import { PaperRiskManagerService } from './paper-risk-manager.service';
import { PaperPerformanceTrackerService } from './paper-performance-tracker.service';
import { PaperReportGeneratorService } from './paper-report-generator.service';
import { PaperTradeExecutorService } from './paper-trade-executor.service';
import { PositionManagerService } from './position-manager.service';
import {
  PAPER_PORTFOLIO_DEFAULTS, ExecuteSignalInput, MarketRegime, PositionStatus,
} from './types';

describe('PaperPortfolioOrchestratorService', () => {
  let orchestrator: PaperPortfolioOrchestratorService;
  let riskManager: PaperRiskManagerService;
  let performanceTracker: PaperPerformanceTrackerService;
  let reportGenerator: PaperReportGeneratorService;
  let tradeExecutor: PaperTradeExecutorService;
  let positionManager: PositionManagerService;

  beforeEach(() => {
    riskManager = new PaperRiskManagerService();
    performanceTracker = new PaperPerformanceTrackerService();
    reportGenerator = new PaperReportGeneratorService();
    tradeExecutor = new PaperTradeExecutorService();
    positionManager = new PositionManagerService();

    orchestrator = new PaperPortfolioOrchestratorService(
      riskManager,
      performanceTracker,
      reportGenerator,
      tradeExecutor,
      positionManager,
      PAPER_PORTFOLIO_DEFAULTS,
    );
  });

  const createSignal = (overrides?: Partial<ExecuteSignalInput>): ExecuteSignalInput => ({
    portfolioId: 'portfolio-1',
    stockSymbol: 'THYAO',
    stockName: 'Türk Hava Yolları',
    action: 'BUY',
    quantity: 100,
    currentPrice: 100,
    eliteScore: 75,
    consensusScore: 70,
    confidenceScore: 0.8,
    strategyUsed: 'elite-score',
    marketRegime: MarketRegime.BULL,
    timeframeConsensus: 'strong',
    notes: 'Test alımı',
    ...overrides,
  });

  describe('executeSignal', () => {
    it('should execute a buy signal successfully', () => {
      const result = orchestrator.executeSignal(createSignal());

      expect(result.success).toBe(true);
      expect(result.orderId).toBeDefined();
      expect(result.message).toContain('THYAO');
    });

    it('should reject when position limit exceeded', () => {
      const result = orchestrator.executeSignal(createSignal({
        quantity: 3000,
        currentPrice: 100,
      }));

      expect(result.success).toBe(false);
      expect(result.message).toContain('Pozisyon büyüklüğü');
    });

    it('should reject when max positions exceeded', () => {
      for (let i = 0; i < 20; i++) {
        orchestrator.executeSignal(createSignal({
          stockSymbol: `STOCK${i}`,
          stockName: `Stock ${i}`,
          quantity: 10,
          currentPrice: 10,
        }));
      }

      const result = orchestrator.executeSignal(createSignal({
        stockSymbol: 'STOCK20',
        stockName: 'Stock 20',
        quantity: 10,
        currentPrice: 10,
      }));

      expect(result.success).toBe(false);
      expect(result.message).toContain('Maksimum pozisyon');
    });

    it('should update cash balance after buy', () => {
      const before = orchestrator.getSummary().cashBalance;
      orchestrator.executeSignal(createSignal());
      const after = orchestrator.getSummary().cashBalance;
      expect(after).toBeLessThan(before);
    });
  });

  describe('closePosition', () => {
    it('should close an open position', () => {
      orchestrator.executeSignal(createSignal());
      const result = orchestrator.closePosition({
        portfolioId: 'portfolio-1',
        stockSymbol: 'THYAO',
        exitPrice: 110,
        notes: 'Kâr alma',
      });

      expect(result.success).toBe(true);
      expect(result.realizedPnl).toBeGreaterThan(0);
    });

    it('should fail for non-existent position', () => {
      const result = orchestrator.closePosition({
        portfolioId: 'portfolio-1',
        stockSymbol: 'XYZ',
        exitPrice: 100,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('bulunamadı');
    });
  });

  describe('partialClose', () => {
    it('should partially close a position', () => {
      orchestrator.executeSignal(createSignal({ quantity: 200 }));
      const result = orchestrator.partialClose({
        portfolioId: 'portfolio-1',
        stockSymbol: 'THYAO',
        quantity: 100,
        exitPrice: 110,
      });

      expect(result.success).toBe(true);
      expect(result.realizedPnl).toBeGreaterThan(0);
    });

    it('should fail when quantity exceeds position', () => {
      orchestrator.executeSignal(createSignal({ quantity: 100 }));
      const result = orchestrator.partialClose({
        portfolioId: 'portfolio-1',
        stockSymbol: 'THYAO',
        quantity: 200,
        exitPrice: 110,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('getSummary', () => {
    it('should return portfolio summary', () => {
      orchestrator.executeSignal(createSignal());
      const summary = orchestrator.getSummary();

      expect(summary.id).toBeDefined();
      expect(summary.totalValue).toBeGreaterThan(0);
      expect(summary.openPositionsCount).toBe(1);
    });
  });

  describe('getPerformanceReport', () => {
    it('should return performance report', () => {
      const report = orchestrator.getPerformanceReport();
      expect(report.totalReturn).toBeDefined();
      expect(report.generatedAt).toBeDefined();
    });
  });

  describe('getRiskAssessment', () => {
    it('should return risk assessment', () => {
      const risk = orchestrator.getRiskAssessment();
      expect(risk.overallRiskScore).toBeGreaterThanOrEqual(0);
      expect(risk.withinDrawdownLimit).toBe(true);
    });
  });

  describe('getFullReport', () => {
    it('should generate full report', () => {
      orchestrator.executeSignal(createSignal());
      const report = orchestrator.getFullReport();
      expect(report).toContain('KAĞIT PORTFÖY ÖZET RAPORU');
    });
  });

  describe('getPositionReport', () => {
    it('should generate position report', () => {
      orchestrator.executeSignal(createSignal());
      const report = orchestrator.getPositionReport();
      expect(report).toContain('POZİSYON DETAY RAPORU');
    });
  });

  describe('getRiskReport', () => {
    it('should generate risk report', () => {
      const report = orchestrator.getRiskReport();
      expect(report).toContain('RİSK ANALİZ RAPORU');
    });
  });

  describe('updatePrices', () => {
    it('should update position prices', () => {
      orchestrator.executeSignal(createSignal());
      orchestrator.updatePrices({ THYAO: 120 });

      const summary = orchestrator.getSummary();
      expect(summary.investedValue).toBeGreaterThan(0);
    });
  });
});
