import { Injectable } from '@nestjs/common';
import {
  DashboardConfig,
  DASHBOARD_CONFIG_DEFAULTS,
  DashboardFilter,
  DashboardFilterType,
  FilterOptions,
} from './types';

@Injectable()
export class DashboardFilterService {
  private config: DashboardConfig = { ...DASHBOARD_CONFIG_DEFAULTS };
  private activeFilters: DashboardFilter[] = [];

  setConfig(config: Partial<DashboardConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): DashboardConfig {
    return { ...this.config };
  }

  addFilter(filter: DashboardFilter): void {
    const existing = this.activeFilters.findIndex(f => f.type === filter.type && f.value === filter.value);
    if (existing === -1) {
      this.activeFilters.push(filter);
    }
  }

  removeFilter(type: DashboardFilterType, value: string): void {
    this.activeFilters = this.activeFilters.filter(f => !(f.type === type && f.value === value));
  }

  clearFilters(): void {
    this.activeFilters = [];
  }

  getActiveFilters(): DashboardFilter[] {
    return [...this.activeFilters];
  }

  getFilterOptions(allSymbols: string[], allSectors: string[], allStrategies: string[]): FilterOptions {
    return {
      sectors: [...new Set(allSectors)].sort(),
      industries: [...new Set(allSectors)].sort(),
      strategies: [...new Set(allStrategies)].sort(),
      marketRegimes: ['STRONG_BULL', 'BULL', 'WEAK_BULL', 'SIDEWAYS', 'WEAK_BEAR', 'BEAR', 'STRONG_BEAR', 'HIGH_VOLATILITY', 'LOW_VOLATILITY'],
      opportunityStages: ['DETECTED', 'EMERGING', 'CONFIRMED', 'STRENGTHENING', 'MATURE', 'WEAKENING', 'EXPIRED', 'CANCELLED'],
      timeframes: ['M4', 'D1', 'W1', 'M1'],
      riskLevels: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    };
  }

  applyFilters<T extends Record<string, unknown>>(items: T[], filterMap: (item: T, filter: DashboardFilter) => boolean): T[] {
    if (this.activeFilters.length === 0) return items;
    return items.filter(item => this.activeFilters.every(f => filterMap(item, f)));
  }

  matchesFilter(item: Record<string, unknown>, filter: DashboardFilter): boolean {
    const itemValue = item[filter.type.toLowerCase()] ?? item[filter.type];
    if (itemValue === undefined) return true;
    return String(itemValue) === filter.value;
  }
}
