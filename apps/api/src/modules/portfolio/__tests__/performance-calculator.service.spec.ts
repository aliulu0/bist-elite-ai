import { PerformanceCalculator } from '../services/performance-calculator.service';
import { Portfolio, PortfolioSnapshot, Position } from '../types/portfolio.types';

describe('PerformanceCalculator', () => {
  let calculator: PerformanceCalculator;

  beforeEach(() => {
    calculator = new PerformanceCalculator();
  });

  const basePortfolio: Portfolio = {
    id: 'pf-1', name: 'Test', type: 'MAIN', displayName: 'Test', description: '',
    cash: 1000, currency: 'TRY', status: 'ACTIVE',
    metadata: { inceptionDate: '2024-01-01T00:00:00.000Z', totalInvested: 10000, totalWithdrawn: 0, tags: [], benchmark: 'BIST100' },
    createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z',
  };

  it('should calculate daily performance', () => {
    const snapshots: PortfolioSnapshot[] = [
      { id: 's1', portfolioId: 'pf-1', totalValue: 10000, cash: 1000, timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
      { id: 's2', portfolioId: 'pf-1', totalValue: 10500, cash: 1000, timestamp: new Date(Date.now() - 86400000).toISOString() },
    ];
    const positions: Position[] = [];
    const result = calculator.calculate(basePortfolio, snapshots, positions, 'DAILY');
    expect(result.period).toBe('DAILY');
    expect(result.endValue).toBe(1000);
    expect(result.volatility).toBeGreaterThanOrEqual(0);
  });

  it('should calculate since inception performance', () => {
    const positions: Position[] = [
      {
        id: 'p1', portfolioId: 'pf-1', symbol: 'A', name: 'A',
        sector: 'TECH', industry: '', marketCap: 'LARGE',
        quantity: 10, averageCost: 100, totalCost: 1000,
        currentPrice: 200, currentValue: 2000, profitLoss: 1000, profitLossPercent: 100,
        weight: 0, contribution: 0, highestPrice: 200, lowestPrice: 100, risk: 0,
        firstBoughtAt: '', lastBoughtAt: '', updatedAt: '',
      },
    ];
    const result = calculator.calculate(basePortfolio, [], positions, 'SINCE_INCEPTION');
    expect(result.period).toBe('SINCE_INCEPTION');
    expect(result.endValue).toBe(3000);
    expect(result.percentReturn).toBeDefined();
  });

  it('should return null sharpe with insufficient data', () => {
    const result = calculator.calculate(basePortfolio, [], [], 'DAILY');
    expect(result.sharpeRatio).toBeNull();
    expect(result.bestDay).toBeNull();
    expect(result.worstDay).toBeNull();
  });
});
