import { PositionManagerService } from './position-manager.service';
import { PositionState, PositionStatus, OrderStatus, MarketRegime } from './types';

describe('PositionManagerService', () => {
  let service: PositionManagerService;

  beforeEach(() => {
    service = new PositionManagerService();
  });

  const createTestOrder = (overrides?: Partial<any>) => ({
    id: 'ord-1',
    stockSymbol: 'THYAO',
    stockName: 'Türk Hava Yolları',
    side: 'BUY' as const,
    quantity: 100,
    price: 100,
    status: OrderStatus.FILLED,
    executionPrice: 100,
    executionTime: '2025-01-15T10:00:00Z',
    slippage: 0.05,
    transactionCost: 10,
    signalSource: 'elite-score',
    eliteScore: 75,
    consensusScore: 80,
    confidenceScore: 0.8,
    notes: 'Test trade',
    createdAt: '2025-01-15T09:59:00Z',
    ...overrides,
  });

  describe('openPosition', () => {
    it('should create a new position from order', () => {
      const order = createTestOrder();
      const position = service.openPosition(
        order, 100, '2025-01-15T10:00:00Z',
        'Türk Hava Yolları', MarketRegime.BULL, 'Strong Consensus', 'momentum',
      );

      expect(position.stockSymbol).toBe('THYAO');
      expect(position.status).toBe(PositionStatus.OPEN);
      expect(position.quantity).toBe(100);
      expect(position.avgCost).toBe(100);
      expect(position.currentPrice).toBe(100);
      expect(position.unrealizedPnl).toBe(0);
      expect(position.realizedPnl).toBe(0);
      expect(position.entryEliteScore).toBe(75);
      expect(position.entryConfidence).toBe(0.8);
      expect(position.entryConsensusScore).toBe(80);
      expect(position.marketRegime).toBe(MarketRegime.BULL);
    });

    it('should track sector when provided', () => {
      const order = createTestOrder();
      const position = service.openPosition(
        order, 100, '2025-01-15T10:00:00Z',
        'THYAO', MarketRegime.BULL, 'Consensus', 'strategy', 'Ulaştırma',
      );

      expect(position.sector).toBe('Ulaştırma');
    });
  });

  describe('closePosition', () => {
    it('should close position with profit', () => {
      const order = createTestOrder();
      const position = service.openPosition(
        order, 100, '2025-01-15T10:00:00Z',
        'THYAO', MarketRegime.BULL, 'Consensus', 'strategy',
      );
      const closed = service.closePosition(position, 120, '2025-01-20T10:00:00Z');

      expect(closed.status).toBe(PositionStatus.CLOSED);
      expect(closed.exitPrice).toBe(120);
      expect(closed.realizedPnl).toBe(2000);
      expect(closed.holdingPeriodDays).toBe(5);
    });

    it('should close position with loss', () => {
      const order = createTestOrder();
      const position = service.openPosition(
        order, 100, '2025-01-15T10:00:00Z',
        'THYAO', MarketRegime.BULL, 'Consensus', 'strategy',
      );
      const closed = service.closePosition(position, 90, '2025-01-20T10:00:00Z');

      expect(closed.realizedPnl).toBe(-1000);
    });

    it('should add notes', () => {
      const order = createTestOrder();
      const position = service.openPosition(
        order, 100, '2025-01-15T10:00:00Z',
        'THYAO', MarketRegime.BULL, 'Consensus', 'strategy',
      );
      const closed = service.closePosition(position, 110, '2025-01-20T10:00:00Z', 'Take profit');

      expect(closed.notes).toContain('Take profit');
    });
  });

  describe('partialClose', () => {
    it('should partially close position', () => {
      const order = createTestOrder();
      const position = service.openPosition(
        order, 100, '2025-01-15T10:00:00Z',
        'THYAO', MarketRegime.BULL, 'Consensus', 'strategy',
      );
      const { closed, remaining } = service.partialClose(position, 50, 120, '2025-01-20T10:00:00Z');

      expect(closed.quantity).toBe(50);
      expect(closed.realizedPnl).toBe(1000);
      expect(remaining.quantity).toBe(50);
      expect(remaining.unrealizedPnl).toBe(1000);
    });
  });

  describe('updateCurrentPrice', () => {
    it('should update price and unrealized P&L', () => {
      const order = createTestOrder();
      const position = service.openPosition(
        order, 100, '2025-01-15T10:00:00Z',
        'THYAO', MarketRegime.BULL, 'Consensus', 'strategy',
      );
      const updated = service.updateCurrentPrice(position, 115);

      expect(updated.currentPrice).toBe(115);
      expect(updated.unrealizedPnl).toBe(1500);
    });
  });

  describe('getOpenPositions', () => {
    it('should return only open positions', () => {
      const positions = new Map<string, PositionState>();
      const order = createTestOrder();
      const pos1 = service.openPosition(
        order, 100, '2025-01-15T10:00:00Z',
        'THYAO', MarketRegime.BULL, 'Consensus', 'strategy',
      );
      const pos2 = service.openPosition(
        { ...createTestOrder(), stockSymbol: 'GARAN' }, 50, '2025-01-15T10:00:00Z',
        'Garanti Bankası', MarketRegime.BULL, 'Consensus', 'strategy',
      );
      const closedPos = service.closePosition(pos1, 110, '2025-01-20T10:00:00Z');

      positions.set('THYAO', closedPos);
      positions.set('GARAN', pos2);

      const open = service.getOpenPositions(positions);
      expect(open.length).toBe(1);
      expect(open[0].stockSymbol).toBe('GARAN');
    });
  });

  describe('calculateHoldingPeriod', () => {
    it('should calculate days between dates', () => {
      const days = service.calculateHoldingPeriod('2025-01-15T10:00:00Z', '2025-01-25T10:00:00Z');
      expect(days).toBe(10);
    });

    it('should return 0 for same day', () => {
      const days = service.calculateHoldingPeriod('2025-01-15T10:00:00Z', '2025-01-15T15:00:00Z');
      expect(days).toBe(0);
    });
  });
});
