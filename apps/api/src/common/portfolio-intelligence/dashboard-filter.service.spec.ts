import { DashboardFilterService } from './dashboard-filter.service';
import { DashboardFilterType, DASHBOARD_CONFIG_DEFAULTS } from './types';

describe('DashboardFilterService', () => {
  let service: DashboardFilterService;

  beforeEach(() => {
    service = new DashboardFilterService();
  });

  describe('setConfig / getConfig', () => {
    it('should update config partially', () => {
      service.setConfig({ maxAlerts: 100 });
      expect(service.getConfig().maxAlerts).toBe(100);
      expect(service.getConfig().maxOpportunities).toBe(DASHBOARD_CONFIG_DEFAULTS.maxOpportunities);
    });
  });

  describe('addFilter', () => {
    it('should add a filter', () => {
      service.addFilter({ type: DashboardFilterType.SECTOR, value: 'Bankacilik', label: 'Bankacilik' });
      expect(service.getActiveFilters()).toHaveLength(1);
    });

    it('should not add duplicate filter', () => {
      service.addFilter({ type: DashboardFilterType.SECTOR, value: 'Bankacilik', label: 'Bankacilik' });
      service.addFilter({ type: DashboardFilterType.SECTOR, value: 'Bankacilik', label: 'Bankacilik' });
      expect(service.getActiveFilters()).toHaveLength(1);
    });

    it('should add different types', () => {
      service.addFilter({ type: DashboardFilterType.SECTOR, value: 'A', label: 'A' });
      service.addFilter({ type: DashboardFilterType.STRATEGY, value: 'B', label: 'B' });
      expect(service.getActiveFilters()).toHaveLength(2);
    });
  });

  describe('removeFilter', () => {
    it('should remove filter by type and value', () => {
      service.addFilter({ type: DashboardFilterType.SECTOR, value: 'Bankacilik', label: 'Bankacilik' });
      service.removeFilter(DashboardFilterType.SECTOR, 'Bankacilik');
      expect(service.getActiveFilters()).toHaveLength(0);
    });

    it('should not remove other filters', () => {
      service.addFilter({ type: DashboardFilterType.SECTOR, value: 'A', label: 'A' });
      service.addFilter({ type: DashboardFilterType.SECTOR, value: 'B', label: 'B' });
      service.removeFilter(DashboardFilterType.SECTOR, 'A');
      expect(service.getActiveFilters()).toHaveLength(1);
      expect(service.getActiveFilters()[0].value).toBe('B');
    });
  });

  describe('clearFilters', () => {
    it('should clear all filters', () => {
      service.addFilter({ type: DashboardFilterType.SECTOR, value: 'A', label: 'A' });
      service.addFilter({ type: DashboardFilterType.STRATEGY, value: 'B', label: 'B' });
      service.clearFilters();
      expect(service.getActiveFilters()).toHaveLength(0);
    });
  });

  describe('getFilterOptions', () => {
    it('should return all filter categories', () => {
      const options = service.getFilterOptions(['THYAO', 'GARAN'], ['Bankacilik', 'Teknoloji'], ['momentum']);
      expect(options.sectors).toContain('Bankacilik');
      expect(options.sectors).toContain('Teknoloji');
      expect(options.strategies).toContain('momentum');
      expect(options.marketRegimes.length).toBeGreaterThan(0);
      expect(options.opportunityStages.length).toBeGreaterThan(0);
      expect(options.timeframes.length).toBeGreaterThan(0);
      expect(options.riskLevels.length).toBeGreaterThan(0);
    });

    it('should deduplicate sectors', () => {
      const options = service.getFilterOptions([], ['A', 'A', 'B'], []);
      expect(options.sectors).toHaveLength(2);
    });

    it('should sort sectors', () => {
      const options = service.getFilterOptions([], ['C', 'A', 'B'], []);
      expect(options.sectors).toEqual(['A', 'B', 'C']);
    });
  });

  describe('applyFilters', () => {
    it('should return all items when no filters active', () => {
      const items = [{ sector: 'A' }, { sector: 'B' }];
      const result = service.applyFilters(items, (item, filter) => item.sector === filter.value);
      expect(result).toHaveLength(2);
    });

    it('should filter items when filters active', () => {
      service.addFilter({ type: DashboardFilterType.SECTOR, value: 'A', label: 'A' });
      const items = [{ sector: 'A' }, { sector: 'B' }];
      const result = service.applyFilters(items, (item, filter) => item.sector === filter.value);
      expect(result).toHaveLength(1);
      expect(result[0].sector).toBe('A');
    });
  });

  describe('matchesFilter', () => {
    it('should match correct value', () => {
      const item = { sector: 'Bankacilik' };
      expect(service.matchesFilter(item, { type: DashboardFilterType.SECTOR, value: 'Bankacilik', label: '' })).toBe(true);
    });

    it('should not match wrong value', () => {
      const item = { sector: 'Teknoloji' };
      expect(service.matchesFilter(item, { type: DashboardFilterType.SECTOR, value: 'Bankacilik', label: '' })).toBe(false);
    });

    it('should return true for missing key', () => {
      const item = { symbol: 'THYAO' };
      expect(service.matchesFilter(item, { type: DashboardFilterType.SECTOR, value: 'Bankacilik', label: '' })).toBe(true);
    });
  });
});
