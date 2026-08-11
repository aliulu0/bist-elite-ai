import { RiskCalculator } from '../services/risk-calculator.service';
import { Position, PortfolioSnapshot } from '../types/portfolio.types';

describe('RiskCalculator', () => {
  let calculator: RiskCalculator;

  beforeEach(() => {
    calculator = new RiskCalculator();
  });

  const makePos = (overrides: Partial<Position>): Position => ({
    id: 'p1', portfolioId: 'pf-1', symbol: 'X', name: 'X',
    sector: 'TECH', industry: 'SOFTWARE', marketCap: 'LARGE',
    quantity: 10, averageCost: 100, totalCost: 1000,
    currentPrice: 150, currentValue: 1500, profitLoss: 500, profitLossPercent: 50,
    weight: 0, contribution: 0, highestPrice: 150, lowestPrice: 100, risk: 30,
    firstBoughtAt: '', lastBoughtAt: '', updatedAt: '',
    ...overrides,
  });

  it('should calculate risk metrics', () => {
    const positions = [
      makePos({ sector: 'TECH', currentValue: 8000, risk: 40, id: 'p1', symbol: 'A' }),
      makePos({ sector: 'TECH', currentValue: 2000, risk: 60, id: 'p2', symbol: 'B' }),
    ];
    const snapshots: PortfolioSnapshot[] = [
      { id: 's1', portfolioId: 'pf-1', totalValue: 9000, cash: 0, timestamp: '2025-01-01' },
      { id: 's2', portfolioId: 'pf-1', totalValue: 9500, cash: 0, timestamp: '2025-01-02' },
      { id: 's3', portfolioId: 'pf-1', totalValue: 10000, cash: 0, timestamp: '2025-01-03' },
    ];
    const risk = calculator.calculate('pf-1', positions, 1000, snapshots);
    expect(risk.sectorConcentration).toBeCloseTo(90.91, 1);
    expect(risk.cashRatio).toBeCloseTo(9.09, 1);
    expect(risk.diversificationScore).toBeGreaterThan(0);
    expect(risk.topRiskyPositions).toHaveLength(2);
  });

  it('should generate risk warnings', () => {
    const risk = {
      portfolioId: 'pf-1',
      portfolioRisk: 70,
      sectorConcentration: 90,
      largestPositionPercent: 60,
      cashRatio: 2,
      diversificationScore: 30,
      currentDrawdown: 15,
      maxDrawdown: 35,
      volatility: 50,
      topRiskyPositions: [],
      timestamp: '',
    };
    const warnings = calculator.checkRiskLimits(risk);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((w) => w.includes('Sector concentration'))).toBe(true);
    expect(warnings.some((w) => w.includes('Max drawdown'))).toBe(true);
  });

  it('should handle single position risk', () => {
    const positions = [makePos({ currentValue: 10000, risk: 50 })];
    const risk = calculator.calculate('pf-1', positions, 0, []);
    expect(risk.sectorConcentration).toBe(100);
    expect(risk.largestPositionPercent).toBe(100);
  });
});
