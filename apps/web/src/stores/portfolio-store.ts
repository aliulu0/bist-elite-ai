import { create } from 'zustand';
import type {
  PortfolioState,
  PortfolioSummary,
  Holding,
  Transaction,
  CashBalance,
  DividendInfo,
  RiskMetrics,
  AIAnalysis,
  AllocationItem,
} from '@/components/portfolio/portfolio-types';
import { createDefaultAdapter, buildAllocationFromHoldings, buildSectorAllocation, type IPortfolioAdapter } from '@/components/portfolio/portfolio-adapter';

let adapter: IPortfolioAdapter = createDefaultAdapter();

export function setPortfolioAdapter(a: IPortfolioAdapter) {
  adapter = a;
}

export function getPortfolioAdapter(): IPortfolioAdapter {
  return adapter;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  summary: null,
  holdings: [],
  transactions: [],
  cash: { available: 0, reserved: 0, total: 0 },
  dividends: { totalReceived: 0, expectedAnnual: 0, yieldPercent: 0, lastPaymentDate: '', lastPaymentAmount: 0, history: [] },
  risk: { beta: 0, volatility: 0, sharpeRatio: 0, sortinoRatio: 0, maxDrawdown: 0, valueAtRisk: 0, diversificationScore: 0, riskScore: 0 },
  aiAnalysis: { portfolioQuality: '', riskLevel: '', concentrationRisk: '', sectorRisk: '', liquidity: '', diversification: '', recommendations: [], warnings: [] },
  performanceHistory: [],
  allocation: [],
  sectorAllocation: [],
  loading: false,
  error: '',
  search: '',
  sortKey: 'marketValue',
  sortDir: 'desc',
  page: 0,
  pageSize: 20,
  selectedSymbol: null,
  compactMode: false,

  setSummary: (s) => set({ summary: s }),
  setHoldings: (h) => {
    set({
      holdings: h,
      allocation: buildAllocationFromHoldings(h),
      sectorAllocation: buildSectorAllocation(h),
    });
  },
  setTransactions: (t) => set({ transactions: t }),
  setCash: (c) => set({ cash: c }),
  setDividends: (d) => set({ dividends: d }),
  setRisk: (r) => set({ risk: r }),
  setAiAnalysis: (a) => set({ aiAnalysis: a }),
  setPerformanceHistory: (p) => set({ performanceHistory: p }),
  setAllocation: (a) => set({ allocation: a }),
  setSectorAllocation: (a) => set({ sectorAllocation: a }),
  setLoading: (l) => set({ loading: l }),
  setError: (e) => set({ error: e }),
  setSearch: (s) => set({ search: s, page: 0 }),
  setSort: (key, dir) => set({ sortKey: key, sortDir: dir }),
  setPage: (p) => set({ page: p }),
  setSelectedSymbol: (s) => set({ selectedSymbol: s }),
  setCompactMode: (m) => set({ compactMode: m }),
  toggleCompact: () => set((s) => ({ compactMode: !s.compactMode })),
  refresh: async () => {
    set({ loading: true, error: '' });
    try {
      const [summary, holdings, transactions, cash, dividends, risk, aiAnalysis, performanceHistory] = await Promise.all([
        adapter.getSummary(),
        adapter.getHoldings(),
        adapter.getTransactions(),
        adapter.getCash(),
        adapter.getDividends(),
        adapter.getRisk(),
        adapter.getAIAnalysis(),
        adapter.getPerformanceHistory(),
      ]);
      const allocation = buildAllocationFromHoldings(holdings);
      const sectorAllocation = buildSectorAllocation(holdings);
      set({
        summary, holdings, transactions, cash, dividends, risk, aiAnalysis,
        performanceHistory, allocation, sectorAllocation, loading: false,
      });
    } catch {
      set({ error: 'Portföy verileri yüklenirken hata oluştu', loading: false });
    }
  },
}));

export function filterHoldings(holdings: Holding[], search: string): Holding[] {
  if (!search.trim()) return holdings;
  const q = search.toLowerCase();
  return holdings.filter(
    (h) =>
      h.symbol.toLowerCase().includes(q) ||
      h.name.toLowerCase().includes(q) ||
      h.sector.toLowerCase().includes(q),
  );
}

export function sortHoldings(holdings: Holding[], sortKey: string, sortDir: 'asc' | 'desc'): Holding[] {
  return [...holdings].sort((a, b) => {
    const aVal = a[sortKey as keyof Holding];
    const bVal = b[sortKey as keyof Holding];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return sortDir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });
}
