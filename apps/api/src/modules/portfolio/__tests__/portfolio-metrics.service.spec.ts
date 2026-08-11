import { PortfolioMetricsService } from '../services/portfolio-metrics.service';
import { PortfolioRepository } from '../repositories/portfolio.repository';
import { PositionRepository } from '../repositories/position.repository';
import { Portfolio, Position } from '../types/portfolio.types';

describe('PortfolioMetricsService', () => {
  let metrics: PortfolioMetricsService;
  let portfolioRepo: PortfolioRepository;
  let positionRepo: PositionRepository;

  beforeEach(() => {
    portfolioRepo = new PortfolioRepository();
    positionRepo = new PositionRepository();
    metrics = new PortfolioMetricsService(portfolioRepo, positionRepo);
  });

  const makePortfolio = (id: string, name: string): Portfolio => ({
    id, name, type: 'MAIN', displayName: name, description: '', cash: 5000,
    currency: 'TRY', status: 'ACTIVE',
    metadata: { inceptionDate: '2024-01-01T00:00:00.000Z', totalInvested: 10000, totalWithdrawn: 0, tags: [], benchmark: 'BIST100' },
    createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z',
  });

  const makePosition = (portfolioId: string, symbol: string, overrides: Partial<Position> = {}): Position => ({
    id: `pos-${symbol}`, portfolioId, symbol, name: symbol,
    sector: 'TECH', industry: 'SOFTWARE', marketCap: 'LARGE',
    quantity: 10, averageCost: 100, totalCost: 1000,
    currentPrice: 150, currentValue: 1500, profitLoss: 500, profitLossPercent: 50,
    weight: 0, contribution: 0, highestPrice: 150, lowestPrice: 100,
    risk: 30, firstBoughtAt: '2024-06-01T00:00:00.000Z',
    lastBoughtAt: '2024-06-01T00:00:00.000Z',
    updatedAt: '2024-06-01T00:00:00.000Z',
    ...overrides,
  });

  it('should return metrics for empty state', () => {
    const m = metrics.getObservabilityMetrics();
    expect(m.totalPortfolios).toBe(0);
    expect(m.totalPositions).toBe(0);
    expect(m.averagePositionSize).toBe(0);
  });

  it('should calculate average position size', () => {
    portfolioRepo.create(makePortfolio('pf-1', 'Test'));
    positionRepo.create(makePosition('pf-1', 'A', { currentValue: 2000 }));
    positionRepo.create(makePosition('pf-1', 'B', { currentValue: 4000 }));
    const m = metrics.getObservabilityMetrics();
    expect(m.totalPortfolios).toBe(1);
    expect(m.totalPositions).toBe(2);
    expect(m.averagePositionSize).toBe(3000);
  });

  it('should identify largest gain and loss', () => {
    portfolioRepo.create(makePortfolio('pf-1', 'Test'));
    positionRepo.create(makePosition('pf-1', 'A', { profitLoss: 500 }));
    positionRepo.create(makePosition('pf-1', 'B', { profitLoss: -300 }));
    const m = metrics.getObservabilityMetrics();
    expect(m.largestGain).toBe(500);
    expect(m.largestLoss).toBe(-300);
  });

  it('should calculate average holding time', () => {
    portfolioRepo.create(makePortfolio('pf-1', 'Test'));
    positionRepo.create(makePosition('pf-1', 'A', { firstBoughtAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }));
    positionRepo.create(makePosition('pf-1', 'B', { firstBoughtAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() }));
    const m = metrics.getObservabilityMetrics();
    expect(m.averageHoldingTime).toBeGreaterThan(0);
  });
});
