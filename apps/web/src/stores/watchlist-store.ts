import { create } from 'zustand';
import type {
  WatchlistItem,
  WatchlistAlert,
  WatchlistNote,
  WatchlistPerformance,
  WatchlistSummary,
} from '@/components/watchlist/watchlist-types';

export interface WatchlistState {
  items: WatchlistItem[];
  alerts: WatchlistAlert[];
  notes: WatchlistNote[];
  performance: WatchlistPerformance[];
  summary: WatchlistSummary | null;
  search: string;
  sortKey: string;
  sortDir: 'asc' | 'desc';
  page: number;
  pageSize: number;
  selectedSymbol: string | null;
  compactMode: boolean;
  loading: boolean;
  error: string;

  setItems: (items: WatchlistItem[]) => void;
  setAlerts: (alerts: WatchlistAlert[]) => void;
  setNotes: (notes: WatchlistNote[]) => void;
  setPerformance: (p: WatchlistPerformance[]) => void;
  setSummary: (s: WatchlistSummary | null) => void;
  setSearch: (s: string) => void;
  setSort: (key: string, dir: 'asc' | 'desc') => void;
  setPage: (p: number) => void;
  setSelectedSymbol: (s: string | null) => void;
  setCompactMode: (m: boolean) => void;
  toggleCompact: () => void;
  setLoading: (l: boolean) => void;
  setError: (e: string) => void;
  refresh: () => void;
}

function computeSummary(items: WatchlistItem[], alerts: WatchlistAlert[]): WatchlistSummary {
  return {
    totalWatched: items.length,
    earlyOpportunities: items.filter((i) => i.opportunityLevel === 'Erken').length,
    aaaCount: items.filter((i) => i.eliteRating === 'AAA').length,
    risingCount: items.filter((i) => i.dailyChangePercent > 0).length,
    fallingCount: items.filter((i) => i.dailyChangePercent < 0).length,
    newAlerts: alerts.length,
    avgEliteScore: items.length ? items.reduce((s, i) => s + i.eliteScore, 0) / items.length : 0,
    avgConfidence: items.length ? items.reduce((s, i) => s + i.confidence, 0) / items.length : 0,
  };
}

export function filterItems(items: WatchlistItem[], search: string): WatchlistItem[] {
  if (!search.trim()) return items;
  const q = search.toLowerCase();
  return items.filter(
    (i) =>
      i.symbol.toLowerCase().includes(q) ||
      i.name.toLowerCase().includes(q) ||
      i.sector.toLowerCase().includes(q),
  );
}

export function sortItems(items: WatchlistItem[], sortKey: string, sortDir: 'asc' | 'desc'): WatchlistItem[] {
  return [...items].sort((a, b) => {
    const aVal = a[sortKey as keyof WatchlistItem];
    const bVal = b[sortKey as keyof WatchlistItem];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return sortDir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });
}

export function computeWatchlistSummary(items: WatchlistItem[], alerts: WatchlistAlert[]): WatchlistSummary {
  return computeSummary(items, alerts);
}

export const useWatchlistStore = create<WatchlistState>((set) => ({
  items: [],
  alerts: [],
  notes: [],
  performance: [],
  summary: null,
  search: '',
  sortKey: 'eliteScore',
  sortDir: 'desc',
  page: 0,
  pageSize: 20,
  selectedSymbol: null,
  compactMode: false,
  loading: false,
  error: '',

  setItems: (items) => set((s) => ({ items, summary: computeSummary(items, s.alerts) })),
  setAlerts: (alerts) => set((s) => ({ alerts, summary: computeSummary(s.items, alerts) })),
  setNotes: (notes) => set({ notes }),
  setPerformance: (performance) => set({ performance }),
  setSummary: (summary) => set({ summary }),
  setSearch: (search) => set({ search, page: 0 }),
  setSort: (key, dir) => set({ sortKey: key, sortDir: dir }),
  setPage: (page) => set({ page }),
  setSelectedSymbol: (selectedSymbol) => set({ selectedSymbol }),
  setCompactMode: (compactMode) => set({ compactMode }),
  toggleCompact: () => set((s) => ({ compactMode: !s.compactMode })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  refresh: async () => {
    set({ loading: true, error: '' });
    set({ loading: false });
  },
}));
