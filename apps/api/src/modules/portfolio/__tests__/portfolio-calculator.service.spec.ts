import { PortfolioCalculator } from '../services/portfolio-calculator.service';
import { Portfolio, Position } from '../types/portfolio.types';

describe('PortfolioCalculator', () => {
  let calculator: PortfolioCalculator;

  beforeEach(() => {
    calculator = new PortfolioCalculator();
  });

  const basePortfolio: Portfolio = {
    id: 'pf-1',
    name: 'Test',
    type: 'MAIN',
    displayName: 'Test',
    description: '',
    cash: 1000,
    currency: 'TRY',
    status: 'ACTIVE',
    metadata: {
      inceptionDate: '2024-01-01T00:00:00.000Z',
      totalInvested: 10000,
      totalWithdrawn: 0,
      tags: [],
      benchmark: 'BIST100',
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const makePos = (overrides: Partial<Position>): Position => ({
    id: 'p1', portfolioId: 'pf-1', symbol: 'X', name: 'X',
    sector: 'TECH', industry: 'SOFTWARE', marketCap: 'LARGE',
    quantity: 10, averageCost: 100, totalCost: 1000,
    currentPrice: 150, currentValue: 1500, profitLoss: 500, profitLossPercent: 50,
    weight: 0, contribution: 0, highestPrice: 150, lowestPrice: 100, risk: 30,
    firstBoughtAt: '', lastBoughtAt: '', updatedAt: '',
    ...overrides,
  });

  it('should calculate portfolio summary', () => {
    const positions = [
      makePos({ currentValue: 4000, totalCost: 2000, profitLoss: 2000, id: 'p1', symbol: 'A' }),
      makePos({ currentValue: 6000, totalCost: 5000, profitLoss: 1000, id: 'p2', symbol: 'B' }),
    ];
    const summary = calculator.calculateSummary(basePortfolio, positions);
    expect(summary.totalValue).toBe(11000);
    expect(summary.marketValue).toBe(10000);
    expect(summary.investedCapital).toBe(7000);
    expect(summary.totalProfitLoss).toBe(3000);
    expect(summary.positionCount).toBe(2);
    expect(summary.cashAllocation).toBeCloseTo(9.09, 1);
    expect(summary.stockAllocation).toBeCloseTo(90.91, 1);
    expect(summary.largestPosition).not.toBeNull();
    expect(summary.largestPosition!.symbol).toBe('B');
  });

  it('should handle empty positions', () => {
    const summary = calculator.calculateSummary(basePortfolio, []);
    expect(summary.totalValue).toBe(1000);
    expect(summary.marketValue).toBe(0);
    expect(summary.positionCount).toBe(0);
    expect(summary.largestPosition).toBeNull();
  });

  it('should calculate cost basis', () => {
    const positions = [
      makePos({ totalCost: 3000, id: 'p1', symbol: 'A' }),
      makePos({ totalCost: 5000, id: 'p2', symbol: 'B' }),
    ];
    expect(calculator.calculateCostBasis(positions)).toBe(8000);
  });
});
