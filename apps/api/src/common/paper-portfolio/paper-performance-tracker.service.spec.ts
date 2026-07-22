import { PaperPerformanceTrackerService } from './paper-performance-tracker.service';
import { PortfolioState, PositionStatus, MarketRegime, PositionState } from './types';

describe('PaperPerformanceTrackerService', () => {
  let service: PaperPerformanceTrackerService;

  beforeEach(() => {
    service = new PaperPerformanceTrackerService();
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

  describe('calculatePerformance', () => {
    it('should calculate basic performance', () => {
      const positions = new Map();
      positions.set('THYAO', createPosition({ unrealizedPnl: 10000 }));
      const portfolio = createPortfolio({ cashBalance: 1000000, positions });

      const report = service.calculatePerformance(portfolio);

      expect(report.portfolioId).toBe('portfolio-1');
      expect(report.totalReturn).toBeCloseTo(1, 0);
      expect(report.unrealizedReturn).toBeCloseTo(1, 0);
      expect(report.generatedAt).toBeDefined();
      expect(report.disclaimer).toBeDefined();
    });

    it('should calculate with realized returns', () => {
      const closedPos = createPosition({
        status: PositionStatus.CLOSED,
        realizedPnl: 50000,
        unrealizedPnl: 0,
      });
      const positions = new Map();
      positions.set('THYAO', closedPos);
      const portfolio = createPortfolio({ cashBalance: 1050000, positions });

      const report = service.calculatePerformance(portfolio);

      expect(report.realizedReturn).toBeCloseTo(5, 1);
    });
  });

  describe('calculateRealizedReturn', () => {
    it('should calculate realized return percentage', () => {
      const positions = new Map();
      positions.set('THYAO', createPosition({ realizedPnl: 100000 }));
      const portfolio = createPortfolio({ positions });

      const result = service.calculateRealizedReturn(portfolio);
      expect(result).toBeCloseTo(10, 1);
    });
  });

  describe('calculateUnrealizedReturn', () => {
    it('should calculate unrealized return percentage', () => {
      const positions = new Map();
      positions.set('THYAO', createPosition({ unrealizedPnl: 50000 }));
      const portfolio = createPortfolio({ positions });

      const result = service.calculateUnrealizedReturn(portfolio);
      expect(result).toBeCloseTo(5, 1);
    });
  });

  describe('calculateDailyReturns', () => {
    it('should calculate daily returns', () => {
      const snapshots = [
        { date: '2025-01-01', value: 1000000 },
        { date: '2025-01-02', value: 1010000 },
        { date: '2025-01-03', value: 995000 },
      ];

      const returns = service.calculateDailyReturns(snapshots);

      expect(returns.length).toBe(2);
      expect(returns[0].returnPercent).toBeCloseTo(1, 1);
      expect(returns[1].returnPercent).toBeCloseTo(-1.49, 1);
    });

    it('should handle empty snapshots', () => {
      expect(service.calculateDailyReturns([])).toEqual([]);
    });

    it('should handle single snapshot', () => {
      expect(service.calculateDailyReturns([{ date: '2025-01-01', value: 1000000 }])).toEqual([]);
    });
  });

  describe('calculateAnnualizedReturn', () => {
    it('should annualize return', () => {
      const result = service.calculateAnnualizedReturn(5, 180);
      expect(result).toBeCloseTo(10.14, 1);
    });

    it('should handle zero days', () => {
      expect(service.calculateAnnualizedReturn(5, 0)).toBe(0);
    });
  });

  describe('calculateMaxDrawdown', () => {
    it('should calculate max drawdown', () => {
      const snapshots = [
        { date: '2025-01-01', value: 1000000 },
        { date: '2025-01-02', value: 1050000 },
        { date: '2025-01-03', value: 950000 },
        { date: '2025-01-04', value: 1020000 },
      ];

      const maxDD = service.calculateMaxDrawdown(snapshots);
      expect(maxDD).toBeCloseTo(9.52, 1);
    });

    it('should return 0 for empty snapshots', () => {
      expect(service.calculateMaxDrawdown([])).toBe(0);
    });
  });

  describe('calculateVolatility', () => {
    it('should calculate volatility', () => {
      const returns = [
        { date: '1', returnPercent: 1, portfolioValue: 1000 },
        { date: '2', returnPercent: -1, portfolioValue: 990 },
        { date: '3', returnPercent: 0.5, portfolioValue: 995 },
        { date: '4', returnPercent: -0.5, portfolioValue: 990 },
      ];

      const vol = service.calculateVolatility(returns);
      expect(vol).toBeGreaterThan(0);
    });

    it('should return 0 for empty returns', () => {
      expect(service.calculateVolatility([])).toBe(0);
    });
  });

  describe('calculateWinRate', () => {
    it('should calculate win rate', () => {
      const positions = [
        createPosition({ id: '1', realizedPnl: 1000 }),
        createPosition({ id: '2', realizedPnl: -500 }),
        createPosition({ id: '3', realizedPnl: 2000 }),
      ];

      expect(service.calculateWinRate(positions)).toBeCloseTo(2 / 3, 2);
    });

    it('should return 0 for empty positions', () => {
      expect(service.calculateWinRate([])).toBe(0);
    });
  });

  describe('calculateProfitFactor', () => {
    it('should calculate profit factor', () => {
      const positions = [
        createPosition({ id: '1', realizedPnl: 5000 }),
        createPosition({ id: '2', realizedPnl: -2000 }),
      ];

      expect(service.calculateProfitFactor(positions)).toBeCloseTo(2.5, 1);
    });

    it('should return Infinity for no losses', () => {
      const positions = [
        createPosition({ id: '1', realizedPnl: 5000 }),
        createPosition({ id: '2', realizedPnl: 3000 }),
      ];

      expect(service.calculateProfitFactor(positions)).toBe(Infinity);
    });
  });

  describe('generateSnapshot', () => {
    it('should generate portfolio snapshot', () => {
      const positions = new Map();
      positions.set('THYAO', createPosition());
      const portfolio = createPortfolio({ positions });

      const snapshot = service.generateSnapshot(portfolio);

      expect(snapshot.value).toBeCloseTo(1011000, -2);
      expect(snapshot.cashBalance).toBe(1000000);
      expect(snapshot.investedValue).toBeCloseTo(11000, -2);
    });
  });
});
