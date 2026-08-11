import { describe, it, expect, beforeEach } from 'vitest';
import { useWatchlistStore, filterItems, sortItems, computeWatchlistSummary } from '../watchlist-store';
import type { WatchlistItem, WatchlistAlert } from '@/components/watchlist/watchlist-types';

const mockItems: WatchlistItem[] = [
  { symbol: 'GARAN', name: 'Garanti', sector: 'Bankacılık', eliteScore: 82, eliteRating: 'AA', opportunityLevel: 'Erken', confidence: 0.85, currentPrice: 48, dailyChange: 1, dailyChangePercent: 2.55, weeklyChangePercent: 5, smartMoneyScore: 78, trend: 'YUKARI', status: 'AKTİF', alert: true, alertMessage: '', notes: '' },
  { symbol: 'ASELS', name: 'Aselsan', sector: 'Savunma', eliteScore: 72, eliteRating: 'A', opportunityLevel: 'Yüksek', confidence: 0.78, currentPrice: 58, dailyChange: -1, dailyChangePercent: -1.5, weeklyChangePercent: -2, smartMoneyScore: 65, trend: 'ASAGI', status: 'İZLENEN', alert: false, alertMessage: '', notes: '' },
  { symbol: 'THYAO', name: 'THY', sector: 'Ulaştırma', eliteScore: 88, eliteRating: 'AAA', opportunityLevel: 'Orta', confidence: 0.92, currentPrice: 310, dailyChange: 3, dailyChangePercent: 1.0, weeklyChangePercent: 3, smartMoneyScore: 85, trend: 'YUKARI', status: 'AKTİF', alert: false, alertMessage: '', notes: '' },
];

describe('useWatchlistStore', () => {
  beforeEach(() => {
    useWatchlistStore.setState({
      items: [], alerts: [], notes: [], performance: [], summary: null,
      search: '', sortKey: 'eliteScore', sortDir: 'desc', page: 0,
      pageSize: 20, selectedSymbol: null, compactMode: false, loading: false, error: '',
    });
  });

  it('has correct initial state', () => {
    const state = useWatchlistStore.getState();
    expect(state.items).toEqual([]);
    expect(state.alerts).toEqual([]);
    expect(state.search).toBe('');
    expect(state.loading).toBe(false);
    expect(state.compactMode).toBe(false);
  });

  it('setItems updates items and computes summary', () => {
    useWatchlistStore.getState().setItems(mockItems);
    const state = useWatchlistStore.getState();
    expect(state.items).toHaveLength(3);
    expect(state.summary?.totalWatched).toBe(3);
  });

  it('setAlerts updates alerts and recomputes summary', () => {
    const alerts: WatchlistAlert[] = [
      { id: '1', symbol: 'GARAN', type: 'ERKEN_FIRSAT', message: 'test', timestamp: '2024-01-01', severity: 'INFO' },
    ];
    useWatchlistStore.getState().setItems(mockItems);
    useWatchlistStore.getState().setAlerts(alerts);
    expect(useWatchlistStore.getState().alerts).toHaveLength(1);
    expect(useWatchlistStore.getState().summary?.newAlerts).toBe(1);
  });

  it('setNotes updates notes', () => {
    useWatchlistStore.getState().setNotes([{ symbol: 'GARAN', text: 'test', createdAt: '2024-01-01', updatedAt: '2024-01-01' }]);
    expect(useWatchlistStore.getState().notes).toHaveLength(1);
  });

  it('setPerformance updates performance', () => {
    useWatchlistStore.getState().setPerformance([{ symbol: 'GARAN', change1w: 5, change1m: 10, change3m: 15, volatility: 0.2, avgVolume: 100000 }]);
    expect(useWatchlistStore.getState().performance).toHaveLength(1);
  });

  it('setSearch updates search and resets page', () => {
    useWatchlistStore.getState().setPage(5);
    useWatchlistStore.getState().setSearch('test');
    expect(useWatchlistStore.getState().search).toBe('test');
    expect(useWatchlistStore.getState().page).toBe(0);
  });

  it('setSort updates sort key and direction', () => {
    useWatchlistStore.getState().setSort('currentPrice', 'asc');
    const state = useWatchlistStore.getState();
    expect(state.sortKey).toBe('currentPrice');
    expect(state.sortDir).toBe('asc');
  });

  it('setPage updates page', () => {
    useWatchlistStore.getState().setPage(3);
    expect(useWatchlistStore.getState().page).toBe(3);
  });

  it('setSelectedSymbol updates selected symbol', () => {
    useWatchlistStore.getState().setSelectedSymbol('GARAN');
    expect(useWatchlistStore.getState().selectedSymbol).toBe('GARAN');
  });

  it('setCompactMode updates compact mode', () => {
    useWatchlistStore.getState().setCompactMode(true);
    expect(useWatchlistStore.getState().compactMode).toBe(true);
  });

  it('toggleCompact toggles compact mode', () => {
    expect(useWatchlistStore.getState().compactMode).toBe(false);
    useWatchlistStore.getState().toggleCompact();
    expect(useWatchlistStore.getState().compactMode).toBe(true);
    useWatchlistStore.getState().toggleCompact();
    expect(useWatchlistStore.getState().compactMode).toBe(false);
  });

  it('setLoading updates loading', () => {
    useWatchlistStore.getState().setLoading(true);
    expect(useWatchlistStore.getState().loading).toBe(true);
  });

  it('setError updates error', () => {
    useWatchlistStore.getState().setError('test error');
    expect(useWatchlistStore.getState().error).toBe('test error');
  });

  it('setSummary updates summary', () => {
    useWatchlistStore.getState().setSummary({ totalWatched: 5, earlyOpportunities: 1, aaaCount: 0, risingCount: 3, fallingCount: 2, newAlerts: 0, avgEliteScore: 70, avgConfidence: 0.7 });
    expect(useWatchlistStore.getState().summary?.totalWatched).toBe(5);
  });

  it('summary correctly counts early opportunities', () => {
    useWatchlistStore.getState().setItems(mockItems);
    expect(useWatchlistStore.getState().summary?.earlyOpportunities).toBe(1);
  });

  it('summary correctly counts AAA', () => {
    useWatchlistStore.getState().setItems(mockItems);
    expect(useWatchlistStore.getState().summary?.aaaCount).toBe(1);
  });

  it('summary correctly counts rising and falling', () => {
    useWatchlistStore.getState().setItems(mockItems);
    expect(useWatchlistStore.getState().summary?.risingCount).toBe(2);
    expect(useWatchlistStore.getState().summary?.fallingCount).toBe(1);
  });

  it('summary computes average elite score', () => {
    useWatchlistStore.getState().setItems(mockItems);
    const expected = (82 + 72 + 88) / 3;
    expect(useWatchlistStore.getState().summary?.avgEliteScore).toBeCloseTo(expected);
  });

  it('summary computes average confidence', () => {
    useWatchlistStore.getState().setItems(mockItems);
    const expected = (0.85 + 0.78 + 0.92) / 3;
    expect(useWatchlistStore.getState().summary?.avgConfidence).toBeCloseTo(expected);
  });

  it('refresh sets loading then unsets', async () => {
    await useWatchlistStore.getState().refresh();
    expect(useWatchlistStore.getState().loading).toBe(false);
  });
});

describe('filterItems', () => {
  it('returns all items when search is empty', () => {
    expect(filterItems(mockItems, '')).toHaveLength(3);
  });

  it('filters by symbol', () => {
    expect(filterItems(mockItems, 'GAR')).toHaveLength(1);
    expect(filterItems(mockItems, 'GAR')[0].symbol).toBe('GARAN');
  });

  it('filters by name', () => {
    expect(filterItems(mockItems, 'Asel')).toHaveLength(1);
  });

  it('filters by sector', () => {
    expect(filterItems(mockItems, 'Banka')).toHaveLength(1);
  });

  it('returns empty for no match', () => {
    expect(filterItems(mockItems, 'ZZZZZ')).toHaveLength(0);
  });

  it('is case insensitive', () => {
    expect(filterItems(mockItems, 'garan')).toHaveLength(1);
  });

  it('handles whitespace-only search', () => {
    expect(filterItems(mockItems, '   ')).toHaveLength(3);
  });
});

describe('sortItems', () => {
  it('sorts by eliteScore descending', () => {
    const sorted = sortItems(mockItems, 'eliteScore', 'desc');
    expect(sorted[0].symbol).toBe('THYAO');
  });

  it('sorts by eliteScore ascending', () => {
    const sorted = sortItems(mockItems, 'eliteScore', 'asc');
    expect(sorted[0].symbol).toBe('ASELS');
  });

  it('sorts by symbol ascending', () => {
    const sorted = sortItems(mockItems, 'symbol', 'asc');
    expect(sorted[0].symbol).toBe('ASELS');
  });

  it('sorts by dailyChangePercent descending', () => {
    const sorted = sortItems(mockItems, 'dailyChangePercent', 'desc');
    expect(sorted[0].symbol).toBe('GARAN');
  });

  it('does not mutate original array', () => {
    const original = [...mockItems];
    sortItems(mockItems, 'eliteScore', 'desc');
    expect(mockItems).toEqual(original);
  });
});

describe('computeWatchlistSummary', () => {
  it('computes correct summary', () => {
    const summary = computeWatchlistSummary(mockItems, []);
    expect(summary.totalWatched).toBe(3);
    expect(summary.earlyOpportunities).toBe(1);
    expect(summary.aaaCount).toBe(1);
  });

  it('computes alerts count', () => {
    const alerts: WatchlistAlert[] = [
      { id: '1', symbol: 'GARAN', type: 'ERKEN_FIRSAT', message: '', timestamp: '', severity: 'INFO' },
      { id: '2', symbol: 'ASELS', type: 'ELITE_YUKSELDI', message: '', timestamp: '', severity: 'WARNING' },
    ];
    expect(computeWatchlistSummary(mockItems, alerts).newAlerts).toBe(2);
  });

  it('handles empty inputs', () => {
    const summary = computeWatchlistSummary([], []);
    expect(summary.totalWatched).toBe(0);
    expect(summary.avgEliteScore).toBe(0);
    expect(summary.avgConfidence).toBe(0);
  });
});
