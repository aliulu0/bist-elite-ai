import { PaperTradeExecutorService } from './paper-trade-executor.service';
import { PaperPortfolioConfig, PAPER_PORTFOLIO_DEFAULTS, PortfolioState, PositionStatus } from './types';

describe('PaperTradeExecutorService', () => {
  let service: PaperTradeExecutorService;

  beforeEach(() => {
    service = new PaperTradeExecutorService();
  });

  const defaultConfig = { ...PAPER_PORTFOLIO_DEFAULTS };

  const createTestPortfolio = (overrides?: Partial<PortfolioState>): PortfolioState => ({
    id: 'portfolio-1',
    name: 'Test Portfolio',
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

  describe('executeBuy', () => {
    it('should create a filled buy order with slippage and costs', () => {
      const order = service.executeBuy(
        'THYAO', 'Türk Hava Yolları', 100, 100,
        75, 80, 0.8, 'elite-score', 'Test', defaultConfig,
      );

      expect(order.status).toBe('FILLED');
      expect(order.side).toBe('BUY');
      expect(order.executionPrice).toBeGreaterThan(100);
      expect(order.slippage).toBeGreaterThan(0);
      expect(order.transactionCost).toBeGreaterThan(0);
      expect(order.stockSymbol).toBe('THYAO');
    });
  });

  describe('executeSell', () => {
    it('should create a filled sell order with slippage', () => {
      const order = service.executeSell(
        'THYAO', 'THY', 100, 120,
        75, 80, 0.8, 'elite-score', 'Test', defaultConfig,
      );

      expect(order.status).toBe('FILLED');
      expect(order.side).toBe('SELL');
      expect(order.executionPrice).toBeLessThan(120);
    });
  });

  describe('calculateSlippage', () => {
    it('should calculate slippage for BUY', () => {
      const slippage = service.calculateSlippage(100, 'BUY', defaultConfig);
      expect(slippage).toBe(0.05);
    });

    it('should calculate slippage for SELL', () => {
      const slippage = service.calculateSlippage(100, 'SELL', defaultConfig);
      expect(slippage).toBe(0.05);
    });
  });

  describe('calculateTransactionCost', () => {
    it('should calculate transaction cost', () => {
      const cost = service.calculateTransactionCost(100000, defaultConfig);
      expect(cost).toBe(100);
    });
  });

  describe('validateBuyOrder', () => {
    it('should reject when insufficient cash', () => {
      const portfolio = createTestPortfolio({ cashBalance: 500 });
      const result = service.validateBuyOrder(portfolio, 100, 10, defaultConfig);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Yetersiz nakit');
    });

    it('should reject when below minimum position size', () => {
      const portfolio = createTestPortfolio();
      const result = service.validateBuyOrder(portfolio, 1, 100, defaultConfig);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Minimum pozisyon');
    });

    it('should accept valid buy order', () => {
      const portfolio = createTestPortfolio();
      const result = service.validateBuyOrder(portfolio, 100, 100, defaultConfig);
      expect(result.valid).toBe(true);
    });

    it('should reject when max positions exceeded', () => {
      const positions = new Map();
      for (let i = 0; i < 20; i++) {
        positions.set(`STOCK${i}`, {
          id: `pos-${i}`,
          stockSymbol: `STOCK${i}`,
          stockName: `Stock ${i}`,
          status: PositionStatus.OPEN,
          side: 'BUY',
          quantity: 10,
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
          marketRegime: 'BULL' as any,
          timeframeConsensus: 'strong',
        });
      }
      const portfolio = createTestPortfolio({ positions });
      const result = service.validateBuyOrder(portfolio, 10, 100, defaultConfig);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Maksimum pozisyon');
    });
  });

  describe('validateSellOrder', () => {
    it('should reject when no open position', () => {
      const portfolio = createTestPortfolio();
      const result = service.validateSellOrder(portfolio, 'THYAO', 100);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('açık pozisyon bulunamadı');
    });

    it('should reject when quantity exceeds position', () => {
      const positions = new Map();
      positions.set('THYAO', {
        id: 'pos-1',
        stockSymbol: 'THYAO',
        stockName: 'THY',
        status: PositionStatus.OPEN,
        side: 'BUY',
        quantity: 50,
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
        marketRegime: 'BULL' as any,
        timeframeConsensus: 'strong',
      });
      const portfolio = createTestPortfolio({ positions });
      const result = service.validateSellOrder(portfolio, 'THYAO', 100);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Yetersiz pozisyon');
    });

    it('should accept valid sell order', () => {
      const positions = new Map();
      positions.set('THYAO', {
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
        marketRegime: 'BULL' as any,
        timeframeConsensus: 'strong',
      });
      const portfolio = createTestPortfolio({ positions });
      const result = service.validateSellOrder(portfolio, 'THYAO', 100);
      expect(result.valid).toBe(true);
    });
  });

  describe('rejectOrder', () => {
    it('should create a rejected order', () => {
      const order = service.rejectOrder(
        'THYAO', 'THY', 'BUY', 100, 100, 'Yetersiz nakit', 75, 80, 0.8,
      );
      expect(order.status).toBe('REJECTED');
      expect(order.notes).toContain('Reddedildi');
    });
  });
});
