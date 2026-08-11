import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WatchlistTable } from '../watchlist-table';
import { useWatchlistStore } from '@/stores/watchlist-store';
import type { WatchlistItem } from '../watchlist-types';

const items: WatchlistItem[] = [
  { symbol: 'GARAN', name: 'Garanti', sector: 'Bankacılık', eliteScore: 82, eliteRating: 'AA', opportunityLevel: 'Erken', confidence: 0.85, currentPrice: 48.2, dailyChange: 1.2, dailyChangePercent: 2.55, weeklyChangePercent: 5.12, smartMoneyScore: 78, trend: 'YUKARI', status: 'AKTİF', alert: true, alertMessage: '', notes: '' },
  { symbol: 'ASELS', name: 'Aselsan', sector: 'Savunma', eliteScore: 72, eliteRating: 'A', opportunityLevel: 'Yüksek', confidence: 0.78, currentPrice: 58.8, dailyChange: 0.8, dailyChangePercent: 1.38, weeklyChangePercent: -2.15, smartMoneyScore: 65, trend: 'ASAGI', status: 'İZLENEN', alert: false, alertMessage: '', notes: '' },
];

const manyItems: WatchlistItem[] = Array.from({ length: 25 }, (_, i) => ({
  ...items[0], symbol: `SYM${i}`, name: `Company ${i}`,
}));

describe('WatchlistTable additional', () => {
  beforeEach(() => {
    useWatchlistStore.setState({ search: '', page: 0, sortKey: 'eliteScore', sortDir: 'desc', selectedSymbol: null });
  });

  it('sorts when column header is clicked', () => {
    render(<WatchlistTable items={items} />);
    const eliteHeader = screen.getByText('Elite ↓');
    fireEvent.click(eliteHeader);
    expect(screen.getByText('Elite ↑')).toBeDefined();
  });

  it('displays current price formatted', () => {
    const { container } = render(<WatchlistTable items={items} />);
    expect(container.textContent).toContain('48,20');
  });

  it('displays status labels', () => {
    render(<WatchlistTable items={items} />);
    expect(screen.getByText('Aktif')).toBeDefined();
    expect(screen.getByText('İzlenen')).toBeDefined();
  });

  it('shows pagination for many items', () => {
    const { container } = render(<WatchlistTable items={manyItems} />);
    const text = container.textContent || '';
    expect(text).toContain('Sayfa');
  });

  it('shows no results message for empty filter', () => {
    render(<WatchlistTable items={items} />);
    fireEvent.change(screen.getByLabelText('Hisse ara'), { target: { value: 'ZZZZ' } });
    expect(screen.getByText('Sonuç bulunamadı')).toBeDefined();
  });

  it('selects symbol on row click', () => {
    const onSelect = vi.fn();
    render(<WatchlistTable items={items} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('GARAN'));
    expect(onSelect).toHaveBeenCalledWith('GARAN');
  });
});


