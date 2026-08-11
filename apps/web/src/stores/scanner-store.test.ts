import { renderHook, act } from '@testing-library/react';
import { useScannerStore, filterStocks, type ScannerFilters, type RangeFilter } from '@/stores/scanner-store';

beforeEach(() => {
  useScannerStore.setState({
    selectedSymbol: null,
    search: '',
    filters: useScannerStore.getState().filters,
    sortKey: 'score',
    sortDir: 'desc',
    columnVisibility: { symbol: true },
    leftPanelOpen: true,
    rightPanelOpen: false,
  });
});

describe('useScannerStore', () => {
  it('has default state', () => {
    const { result } = renderHook(() => useScannerStore());
    expect(result.current.selectedSymbol).toBeNull();
    expect(result.current.search).toBe('');
    expect(result.current.sortKey).toBe('score');
    expect(result.current.sortDir).toBe('desc');
    expect(result.current.leftPanelOpen).toBe(true);
    expect(result.current.rightPanelOpen).toBe(false);
  });

  it('setSelectedSymbol sets symbol and opens right panel', () => {
    const { result } = renderHook(() => useScannerStore());
    act(() => result.current.setSelectedSymbol('GARAN'));
    expect(result.current.selectedSymbol).toBe('GARAN');
    expect(result.current.rightPanelOpen).toBe(true);
  });

  it('setSelectedSymbol null closes right panel', () => {
    const { result } = renderHook(() => useScannerStore());
    act(() => result.current.setSelectedSymbol('GARAN'));
    act(() => result.current.setSelectedSymbol(null));
    expect(result.current.selectedSymbol).toBeNull();
    expect(result.current.rightPanelOpen).toBe(false);
  });

  it('setSearch updates search', () => {
    const { result } = renderHook(() => useScannerStore());
    act(() => result.current.setSearch('test'));
    expect(result.current.search).toBe('test');
  });

  it('setFilter updates a filter key', () => {
    const { result } = renderHook(() => useScannerStore());
    act(() => result.current.setFilter('sector', 'Bankacılık'));
    expect(result.current.filters.sector).toBe('Bankacılık');
  });

  it('setRangeFilter updates min', () => {
    const { result } = renderHook(() => useScannerStore());
    act(() => result.current.setRangeFilter('eliteScore', 'min', 50));
    expect(result.current.filters.eliteScore.min).toBe(50);
  });

  it('setRangeFilter updates max', () => {
    const { result } = renderHook(() => useScannerStore());
    act(() => result.current.setRangeFilter('beta', 'max', 1.5));
    expect(result.current.filters.beta.max).toBe(1.5);
  });

  it('setSort updates sort key and direction', () => {
    const { result } = renderHook(() => useScannerStore());
    act(() => result.current.setSort('eliteScore', 'asc'));
    expect(result.current.sortKey).toBe('eliteScore');
    expect(result.current.sortDir).toBe('asc');
  });

  it('toggleColumn toggles visibility', () => {
    const { result } = renderHook(() => useScannerStore());
    act(() => result.current.toggleColumn('name'));
    expect(result.current.columnVisibility.name).toBe(true);
    act(() => result.current.toggleColumn('name'));
    expect(result.current.columnVisibility.name).toBe(false);
  });

  it('resetFilters resets to defaults', () => {
    const { result } = renderHook(() => useScannerStore());
    act(() => result.current.setFilter('sector', 'Bankacılık'));
    act(() => result.current.setSearch('test'));
    act(() => result.current.resetFilters());
    expect(result.current.filters.sector).toBe('');
    expect(result.current.search).toBe('');
  });

  it('toggleLeftPanel toggles', () => {
    const { result } = renderHook(() => useScannerStore());
    expect(result.current.leftPanelOpen).toBe(true);
    act(() => result.current.toggleLeftPanel());
    expect(result.current.leftPanelOpen).toBe(false);
    act(() => result.current.toggleLeftPanel());
    expect(result.current.leftPanelOpen).toBe(true);
  });

  it('toggleRightPanel toggles', () => {
    const { result } = renderHook(() => useScannerStore());
    act(() => result.current.toggleRightPanel());
    expect(result.current.rightPanelOpen).toBe(true);
    act(() => result.current.toggleRightPanel());
    expect(result.current.rightPanelOpen).toBe(false);
  });
});

describe('filterStocks', () => {
  const stocks = [
    { symbol: 'GARAN', name: 'Garanti', sector: 'Bankacılık', eliteScore: 85, status: 'TOP_CANDIDATE', beta: 1.2 },
    { symbol: 'AKBNK', name: 'Akbank', sector: 'Bankacılık', eliteScore: 60, status: 'WATCHLIST', beta: 0.8 },
    { symbol: 'EREGL', name: 'Ereğli', sector: 'Demir-Çelik', eliteScore: 40, status: 'REJECTED', beta: 1.5 },
  ] as Record<string, unknown>[];

  it('returns all when no filters', () => {
    expect(filterStocks(stocks, { ...useScannerStore.getState().filters }, '')).toHaveLength(3);
  });

  it('filters by search symbol', () => {
    const filters = { ...useScannerStore.getState().filters };
    expect(filterStocks(stocks, filters, 'GAR')).toHaveLength(1);
  });

  it('filters by search name', () => {
    const filters = { ...useScannerStore.getState().filters };
    expect(filterStocks(stocks, filters, 'Garanti')).toHaveLength(1);
  });

  it('filters by status', () => {
    const filters = { ...useScannerStore.getState().filters, status: 'TOP_CANDIDATE' };
    expect(filterStocks(stocks, filters, '')).toHaveLength(1);
  });

  it('filters by sector', () => {
    const filters = { ...useScannerStore.getState().filters, sector: 'Demir-Çelik' };
    expect(filterStocks(stocks, filters, '')).toHaveLength(1);
  });

  it('filters by eliteScore min', () => {
    const filters = { ...useScannerStore.getState().filters, eliteScore: { min: 70 } };
    expect(filterStocks(stocks, filters, '')).toHaveLength(1);
  });

  it('filters by eliteScore max', () => {
    const filters = { ...useScannerStore.getState().filters, eliteScore: { max: 50 } };
    expect(filterStocks(stocks, filters, '')).toHaveLength(1);
  });

  it('filters by beta range', () => {
    const filters = { ...useScannerStore.getState().filters, beta: { min: 1.0, max: 1.3 } };
    expect(filterStocks(stocks, filters, '')).toHaveLength(1);
  });

  it('filters by multiple criteria', () => {
    const filters = {
      ...useScannerStore.getState().filters,
      sector: 'Bankacılık',
      eliteScore: { min: 70 },
    };
    expect(filterStocks(stocks, filters, '')).toHaveLength(1);
  });

  it('returns empty for unmatched search', () => {
    const filters = { ...useScannerStore.getState().filters };
    expect(filterStocks(stocks, filters, 'ZZZZZ')).toHaveLength(0);
  });
});
