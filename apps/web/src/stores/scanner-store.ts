import { create } from 'zustand';

export interface RangeFilter {
  min?: number;
  max?: number;
}

export interface ScannerFilters {
  sector: string;
  eliteScore: RangeFilter;
  opportunityScore: RangeFilter;
  financialScore: RangeFilter;
  technicalScore: RangeFilter;
  smartMoneyScore: RangeFilter;
  pdRatio: RangeFilter;
  pbRatio: RangeFilter;
  fdFavok: RangeFilter;
  netIncomeGrowth: RangeFilter;
  volume: RangeFilter;
  liquidity: RangeFilter;
  beta: RangeFilter;
  dividendYield: RangeFilter;
  marketCap: RangeFilter;
  status: string;
}

const defaultFilters: ScannerFilters = {
  sector: '',
  eliteScore: {},
  opportunityScore: {},
  financialScore: {},
  technicalScore: {},
  smartMoneyScore: {},
  pdRatio: {},
  pbRatio: {},
  fdFavok: {},
  netIncomeGrowth: {},
  volume: {},
  liquidity: {},
  beta: {},
  dividendYield: {},
  marketCap: {},
  status: 'all',
};

interface ColumnVisibility {
  [key: string]: boolean;
}

export interface ScannerState {
  selectedSymbol: string | null;
  search: string;
  filters: ScannerFilters;
  sortKey: string;
  sortDir: 'asc' | 'desc';
  columnVisibility: ColumnVisibility;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;

  setSelectedSymbol: (symbol: string | null) => void;
  setSearch: (search: string) => void;
  setFilter: <K extends keyof ScannerFilters>(key: K, value: ScannerFilters[K]) => void;
  setRangeFilter: <K extends keyof ScannerFilters>(
    key: K,
    field: 'min' | 'max',
    value: number | undefined,
  ) => void;
  setSort: (key: string, dir: 'asc' | 'desc') => void;
  toggleColumn: (key: string) => void;
  resetFilters: () => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
}

export const useScannerStore = create<ScannerState>((set) => ({
  selectedSymbol: null,
  search: '',
  filters: { ...defaultFilters },
  sortKey: 'score',
  sortDir: 'desc',
  columnVisibility: {
    symbol: true,
    name: false,
    eliteScore: true,
    opportunityScore: true,
    financialScore: true,
    technicalScore: true,
    smartMoneyScore: true,
    totalScore: true,
    status: true,
  },
  leftPanelOpen: true,
  rightPanelOpen: false,

  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol, rightPanelOpen: symbol !== null }),
  setSearch: (search) => set({ search }),
  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),
  setRangeFilter: (key, field, value) =>
    set((s) => ({
      filters: {
        ...s.filters,
        [key]: { ...s.filters[key] as RangeFilter, [field]: value },
      },
    })),
  setSort: (key, dir) => set({ sortKey: key, sortDir: dir }),
  toggleColumn: (key) =>
    set((s) => ({
      columnVisibility: { ...s.columnVisibility, [key]: !s.columnVisibility[key] },
    })),
  resetFilters: () => set({ filters: { ...defaultFilters }, search: '' }),
  toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
}));

export function filterStocks<T extends Record<string, unknown>>(
  stocks: T[],
  filters: ScannerFilters,
  search: string,
): T[] {
  return stocks.filter((s) => {
    if (search) {
      const q = search.toLowerCase();
      const sym = String(s.symbol || '').toLowerCase();
      const name = String(s.name || '').toLowerCase();
      if (!sym.includes(q) && !name.includes(q)) return false;
    }

    if (filters.status !== 'all' && s.status !== filters.status) return false;
    if (filters.sector && s.sector !== filters.sector) return false;

    const rangeChecks: [keyof ScannerFilters, string][] = [
      ['eliteScore', 'eliteScore'],
      ['opportunityScore', 'opportunityScore'],
      ['financialScore', 'financialScore'],
      ['technicalScore', 'technicalScore'],
      ['smartMoneyScore', 'smartMoneyScore'],
      ['pdRatio', 'pdRatio'],
      ['pbRatio', 'pbRatio'],
      ['fdFavok', 'fdFavok'],
      ['netIncomeGrowth', 'netIncomeGrowth'],
      ['volume', 'volume'],
      ['liquidity', 'liquidity'],
      ['beta', 'beta'],
      ['dividendYield', 'dividendYield'],
      ['marketCap', 'marketCap'],
    ];

    for (const [filterKey, dataKey] of rangeChecks) {
      const range = filters[filterKey] as RangeFilter;
      const val = s[dataKey] as number | undefined;
      if (range === undefined || range === null) continue;
      if (range.min !== undefined && range.min !== null && (val === undefined || val === null || val < range.min)) return false;
      if (range.max !== undefined && range.max !== null && (val === undefined || val === null || val > range.max)) return false;
    }

    return true;
  });
}
