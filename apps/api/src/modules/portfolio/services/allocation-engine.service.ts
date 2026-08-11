import { Injectable } from '@nestjs/common';
import { Position, AllocationBreakdown, AllocationEntry } from '../types/portfolio.types';

@Injectable()
export class AllocationEngine {
  calculateSectorAllocation(positions: Position[], totalValue: number): AllocationBreakdown {
    const sectorMap = new Map<string, { value: number; count: number }>();
    for (const pos of positions) {
      const key = pos.sector || 'Unknown';
      const existing = sectorMap.get(key) ?? { value: 0, count: 0 };
      sectorMap.set(key, { value: existing.value + pos.currentValue, count: existing.count + 1 });
    }
    return {
      type: 'SECTOR',
      entries: this.toEntries(sectorMap, totalValue),
      timestamp: new Date().toISOString(),
    };
  }

  calculateIndustryAllocation(positions: Position[], totalValue: number): AllocationBreakdown {
    const industryMap = new Map<string, { value: number; count: number }>();
    for (const pos of positions) {
      const key = pos.industry || 'Unknown';
      const existing = industryMap.get(key) ?? { value: 0, count: 0 };
      industryMap.set(key, { value: existing.value + pos.currentValue, count: existing.count + 1 });
    }
    return {
      type: 'INDUSTRY',
      entries: this.toEntries(industryMap, totalValue),
      timestamp: new Date().toISOString(),
    };
  }

  calculateMarketCapAllocation(positions: Position[], totalValue: number): AllocationBreakdown {
    const mcMap = new Map<string, { value: number; count: number }>();
    for (const pos of positions) {
      const key = pos.marketCap;
      const existing = mcMap.get(key) ?? { value: 0, count: 0 };
      mcMap.set(key, { value: existing.value + pos.currentValue, count: existing.count + 1 });
    }
    return {
      type: 'MARKET_CAP',
      entries: this.toEntries(mcMap, totalValue),
      timestamp: new Date().toISOString(),
    };
  }

  calculateRiskAllocation(positions: Position[], totalValue: number): AllocationBreakdown {
    const riskMap = new Map<string, { value: number; count: number }>();
    for (const pos of positions) {
      const key = pos.risk > 70 ? 'HIGH' : pos.risk > 40 ? 'MEDIUM' : 'LOW';
      const existing = riskMap.get(key) ?? { value: 0, count: 0 };
      riskMap.set(key, { value: existing.value + pos.currentValue, count: existing.count + 1 });
    }
    return {
      type: 'RISK',
      entries: this.toEntries(riskMap, totalValue),
      timestamp: new Date().toISOString(),
    };
  }

  calculateCashAllocation(cash: number, totalValue: number): AllocationBreakdown {
    const entries: AllocationEntry[] = [
      { name: 'Cash', value: cash, percentage: totalValue > 0 ? this.round((cash / totalValue) * 100) : 100, count: 1 },
      { name: 'Stocks', value: totalValue - cash, percentage: totalValue > 0 ? this.round(((totalValue - cash) / totalValue) * 100) : 0, count: 0 },
    ];
    return { type: 'CASH', entries, timestamp: new Date().toISOString() };
  }

  private toEntries(
    map: Map<string, { value: number; count: number }>,
    totalValue: number,
  ): AllocationEntry[] {
    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        value: this.round(data.value),
        percentage: totalValue > 0 ? this.round((data.value / totalValue) * 100) : 0,
        count: data.count,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
