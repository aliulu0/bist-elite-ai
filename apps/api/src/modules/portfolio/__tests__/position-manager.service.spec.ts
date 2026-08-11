import { PositionManager } from '../services/position-manager.service';
import { Position, Transaction } from '../types/portfolio.types';

describe('PositionManager', () => {
  let manager: PositionManager;

  beforeEach(() => {
    manager = new PositionManager();
  });

  const baseTransaction: Transaction = {
    id: 'tx-1',
    portfolioId: 'pf-1',
    symbol: 'AAPL',
    type: 'BUY',
    quantity: 10,
    price: 150,
    total: 1500,
    commission: 0,
    executedAt: '2025-01-01T00:00:00.000Z',
    notes: '',
  };

  describe('executeBuy', () => {
    it('should create a new position when none exists', () => {
      const pos = manager.executeBuy(undefined, baseTransaction, 'pf-1');
      expect(pos.portfolioId).toBe('pf-1');
      expect(pos.symbol).toBe('AAPL');
      expect(pos.quantity).toBe(10);
      expect(pos.averageCost).toBe(150);
      expect(pos.totalCost).toBe(1500);
      expect(pos.currentValue).toBe(1500);
      expect(pos.profitLoss).toBe(0);
    });

    it('should update existing position with new buy', () => {
      const existing: Position = {
        id: 'pos-1',
        portfolioId: 'pf-1',
        symbol: 'AAPL',
        name: 'AAPL',
        sector: 'TECH',
        industry: 'HARDWARE',
        marketCap: 'LARGE',
        quantity: 10,
        averageCost: 100,
        totalCost: 1000,
        currentPrice: 150,
        currentValue: 1500,
        profitLoss: 500,
        profitLossPercent: 50,
        weight: 80,
        contribution: 10,
        highestPrice: 150,
        lowestPrice: 90,
        risk: 30,
        firstBoughtAt: '2024-01-01T00:00:00.000Z',
        lastBoughtAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      const newTx: Transaction = { ...baseTransaction, quantity: 5, price: 200, total: 1000 };
      const pos = manager.executeBuy(existing, newTx, 'pf-1');
      expect(pos.quantity).toBe(15);
      expect(pos.averageCost).toBeCloseTo(133.33, 1);
      expect(pos.totalCost).toBe(2000);
      expect(pos.updatedAt).not.toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('executeSell', () => {
    it('should reduce position on partial sell', () => {
      const position: Position = {
        id: 'pos-1',
        portfolioId: 'pf-1',
        symbol: 'AAPL',
        name: 'AAPL',
        sector: 'TECH',
        industry: 'HARDWARE',
        marketCap: 'LARGE',
        quantity: 100,
        averageCost: 100,
        totalCost: 10000,
        currentPrice: 150,
        currentValue: 15000,
        profitLoss: 5000,
        profitLossPercent: 50,
        weight: 80,
        contribution: 10,
        highestPrice: 160,
        lowestPrice: 90,
        risk: 30,
        firstBoughtAt: '2024-01-01T00:00:00.000Z',
        lastBoughtAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      const sellTx: Transaction = {
        ...baseTransaction,
        type: 'SELL',
        quantity: 30,
        price: 180,
        total: 5400,
      };
      const result = manager.executeSell(position, sellTx);
      expect(result.closed).toBe(false);
      expect(result.realizedPnL).toBeCloseTo(2400, 0);
      expect(result.updatedPosition.quantity).toBe(70);
      expect(result.updatedPosition.totalCost).toBeCloseTo(7000, 0);
    });

    it('should close position on full sell', () => {
      const position: Position = {
        id: 'pos-1',
        portfolioId: 'pf-1',
        symbol: 'AAPL',
        name: 'AAPL',
        sector: 'TECH',
        industry: 'HARDWARE',
        marketCap: 'LARGE',
        quantity: 50,
        averageCost: 100,
        totalCost: 5000,
        currentPrice: 150,
        currentValue: 7500,
        profitLoss: 2500,
        profitLossPercent: 50,
        weight: 80,
        contribution: 10,
        highestPrice: 160,
        lowestPrice: 90,
        risk: 30,
        firstBoughtAt: '2024-01-01T00:00:00.000Z',
        lastBoughtAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      const sellTx: Transaction = {
        ...baseTransaction,
        type: 'SELL',
        quantity: 50,
        price: 200,
        total: 10000,
      };
      const result = manager.executeSell(position, sellTx);
      expect(result.closed).toBe(true);
      expect(result.updatedPosition.quantity).toBe(0);
      expect(result.realizedPnL).toBe(5000);
    });
  });

  describe('updatePrices', () => {
    it('should update position prices from price map', () => {
      const positions: Position[] = [
        {
          id: 'pos-1', portfolioId: 'pf-1', symbol: 'AAPL', name: 'AAPL',
          sector: '', industry: '', marketCap: 'LARGE',
          quantity: 10, averageCost: 100, totalCost: 1000,
          currentPrice: 100, currentValue: 1000, profitLoss: 0, profitLossPercent: 0,
          weight: 0, contribution: 0, highestPrice: 100, lowestPrice: 100, risk: 0,
          firstBoughtAt: '', lastBoughtAt: '', updatedAt: '',
        },
      ];
      const prices = new Map([['AAPL', 200]]);
      const updated = manager.updatePrices(positions, prices);
      expect(updated[0].currentPrice).toBe(200);
      expect(updated[0].currentValue).toBe(2000);
      expect(updated[0].profitLoss).toBe(1000);
    });
  });

  describe('calculateWeights', () => {
    it('should calculate weights relative to total value', () => {
      const positions: Position[] = [
        { id: 'p1', portfolioId: 'pf-1', symbol: 'A', name: 'A', sector: '', industry: '', marketCap: 'LARGE', quantity: 10, averageCost: 100, totalCost: 1000, currentPrice: 200, currentValue: 2000, profitLoss: 1000, profitLossPercent: 100, weight: 0, contribution: 0, highestPrice: 200, lowestPrice: 100, risk: 0, firstBoughtAt: '', lastBoughtAt: '', updatedAt: '' },
        { id: 'p2', portfolioId: 'pf-1', symbol: 'B', name: 'B', sector: '', industry: '', marketCap: 'LARGE', quantity: 10, averageCost: 50, totalCost: 500, currentPrice: 100, currentValue: 1000, profitLoss: 500, profitLossPercent: 100, weight: 0, contribution: 0, highestPrice: 100, lowestPrice: 50, risk: 0, firstBoughtAt: '', lastBoughtAt: '', updatedAt: '' },
      ];
      const result = manager.calculateWeights(positions, 3000);
      expect(result[0].weight).toBeCloseTo(66.67, 1);
      expect(result[0].contribution).toBe(100);
      expect(result[1].weight).toBeCloseTo(33.33, 1);
    });
  });
});
