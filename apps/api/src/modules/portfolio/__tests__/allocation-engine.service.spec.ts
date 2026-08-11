import { AllocationEngine } from '../services/allocation-engine.service';
import { Position } from '../types/portfolio.types';

describe('AllocationEngine', () => {
  let engine: AllocationEngine;

  beforeEach(() => {
    engine = new AllocationEngine();
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

  it('should calculate sector allocation', () => {
    const positions = [
      makePos({ sector: 'TECH', currentValue: 3000 }),
      makePos({ sector: 'HEALTH', currentValue: 1000, id: 'p2', symbol: 'Y' }),
      makePos({ sector: 'TECH', currentValue: 1000, id: 'p3', symbol: 'Z' }),
    ];
    const result = engine.calculateSectorAllocation(positions, 5000);
    expect(result.type).toBe('SECTOR');
    expect(result.entries).toHaveLength(2);
    const tech = result.entries.find((e) => e.name === 'TECH')!;
    expect(tech.percentage).toBe(80);
    expect(tech.count).toBe(2);
  });

  it('should calculate cash allocation', () => {
    const result = engine.calculateCashAllocation(2000, 10000);
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0].name).toBe('Cash');
    expect(result.entries[0].percentage).toBe(20);
  });

  it('should calculate market cap allocation', () => {
    const positions = [
      makePos({ marketCap: 'LARGE', currentValue: 5000 }),
      makePos({ marketCap: 'SMALL', currentValue: 5000, id: 'p2', symbol: 'Y' }),
    ];
    const result = engine.calculateMarketCapAllocation(positions, 10000);
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0].percentage).toBe(50);
  });

  it('should calculate risk allocation', () => {
    const positions = [
      makePos({ risk: 80, currentValue: 3000 }),
      makePos({ risk: 20, currentValue: 2000, id: 'p2', symbol: 'Y' }),
    ];
    const result = engine.calculateRiskAllocation(positions, 5000);
    const high = result.entries.find((e) => e.name === 'HIGH')!;
    expect(high.percentage).toBe(60);
  });

  it('should handle empty positions', () => {
    const result = engine.calculateSectorAllocation([], 0);
    expect(result.entries).toHaveLength(0);
  });
});
