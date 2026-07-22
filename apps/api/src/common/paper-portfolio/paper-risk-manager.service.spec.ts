import { PaperRiskManagerService } from './paper-risk-manager.service';
import { PortfolioState, PositionStatus, PAPER_PORTFOLIO_DEFAULTS, PositionState, MarketRegime } from './types';

describe('PaperRiskManagerService', () => {
  let service: PaperRiskManagerService;
  const defaultConfig = { ...PAPER_PORTFOLIO_DEFAULTS };

  beforeEach(() => {
    service = new PaperRiskManagerService();
  });

  const createPosition = (overrides?: Partial<PositionState>): PositionState => ({
    id: 'pos-1',
    stockSymbol: 'THYAO',
    stockName: 'THY',
    status: PositionStatus.OPEN,
    side: 'BUY',
    quantity: 100,
    avgCost: 100,
    currentPrice: 100,
    unrealizedPnl: 0,
    realizedPnl: 0,
    entryTime: '2025-01-15T10:00:00Z',
    holdingPeriodDays: 0,
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
    name: 'Test',
    type: 'DEFAULT' as any,
    initialCapital: 1000000,
    cashBalance: 1000000,
    positions: new Map(),
    orders: [],
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
    peakValue: 1000000,
    ...overrides,
  });

  describe('checkPositionLimit', () => {
    it('should allow position within limit', () => {
      const portfolio = createPortfolio();
      const result = service.checkPositionLimit(portfolio, 100, 100, defaultConfig);
      expect(result.allowed).toBe(true);
    });

    it('should reject position exceeding limit', () => {
      const portfolio = createPortfolio();
      const result = service.checkPositionLimit(portfolio, 3000, 100, defaultConfig);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Pozisyon büyüklüğü');
    });
  });

  describe('checkSectorExposure', () => {
    it('should allow sector within limit', () => {
      const portfolio = createPortfolio();
      const result = service.checkSectorExposure(portfolio, 'Ulaştırma', 100000, defaultConfig);
      expect(result.allowed).toBe(true);
    });

    it('should reject sector exceeding limit', () => {
      const portfolio = createPortfolio();
      const result = service.checkSectorExposure(portfolio, 'Ulaştırma', 500000, defaultConfig);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Sektör maruziyeti');
    });
  });

  describe('checkCashAllocation', () => {
    it('should allow normal cash allocation', () => {
      const portfolio = createPortfolio({ cashBalance: 500000 });
      const result = service.checkCashAllocation(portfolio, 100000, defaultConfig);
      expect(result.allowed).toBe(true);
    });

    it('should reject when cash drops below minimum', () => {
      const portfolio = createPortfolio({ cashBalance: 100000 });
      const result = service.checkCashAllocation(portfolio, 97000, defaultConfig);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Nakit oranı minimumun altında');
    });
  });

  describe('checkDrawdownLimit', () => {
    it('should report within limit when no drawdown', () => {
      const portfolio = createPortfolio({ cashBalance: 1000000, peakValue: 1000000 });
      const result = service.checkDrawdownLimit(portfolio, defaultConfig);
      expect(result.withinLimit).toBe(true);
      expect(result.currentDrawdown).toBe(0);
    });

    it('should report exceeding limit when drawdown too high', () => {
      const positions = new Map();
      positions.set('THYAO', createPosition({ currentPrice: 50 }));
      const portfolio = createPortfolio({
        cashBalance: 700000,
        positions,
        peakValue: 1000000,
      });
      const result = service.checkDrawdownLimit(portfolio, defaultConfig);
      expect(result.withinLimit).toBe(false);
      expect(result.currentDrawdown).toBeGreaterThan(20);
    });
  });

  describe('shouldStopLoss', () => {
    it('should trigger stop loss', () => {
      const position = createPosition({ avgCost: 100 });
      const result = service.shouldStopLoss(position, 91, defaultConfig);
      expect(result).toBe(true);
    });

    it('should not trigger when price above stop loss', () => {
      const position = createPosition({ avgCost: 100 });
      const result = service.shouldStopLoss(position, 95, defaultConfig);
      expect(result).toBe(false);
    });
  });

  describe('shouldTakeProfit', () => {
    it('should trigger take profit', () => {
      const position = createPosition({ avgCost: 100 });
      const result = service.shouldTakeProfit(position, 117, defaultConfig);
      expect(result).toBe(true);
    });

    it('should not trigger when below target', () => {
      const position = createPosition({ avgCost: 100 });
      const result = service.shouldTakeProfit(position, 110, defaultConfig);
      expect(result).toBe(false);
    });
  });

  describe('evaluatePortfolioRisk', () => {
    it('should evaluate risk for clean portfolio', () => {
      const portfolio = createPortfolio();
      const result = service.evaluatePortfolioRisk(portfolio, defaultConfig);
      expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
      expect(result.withinDrawdownLimit).toBe(true);
    });

    it('should identify risk factors for risky portfolio', () => {
      const positions = new Map();
      positions.set('THYAO', createPosition({ currentPrice: 50 }));
      const portfolio = createPortfolio({
        cashBalance: 100000,
        positions,
        peakValue: 1000000,
      });
      const result = service.evaluatePortfolioRisk(portfolio, defaultConfig);
      expect(result.riskFactors.length).toBeGreaterThan(0);
    });
  });
});
