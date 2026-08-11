import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WatchlistTable } from '../watchlist-table';
import { useWatchlistStore } from '@/stores/watchlist-store';
import type { WatchlistItem } from '../watchlist-types';

const mockItems: WatchlistItem[] = [
  { symbol: 'GARAN', name: 'Garanti Bankası', sector: 'Bankacılık', eliteScore: 82, eliteRating: 'AA', opportunityLevel: 'Erken', confidence: 0.85, currentPrice: 48.2, dailyChange: 1.2, dailyChangePercent: 2.55, weeklyChangePercent: 5.12, smartMoneyScore: 78, trend: 'YUKARI', status: 'AKTİF', alert: true, alertMessage: '', notes: '' },
  { symbol: 'ASELS', name: 'Aselsan', sector: 'Savunma', eliteScore: 72, eliteRating: 'A', opportunityLevel: 'Yüksek', confidence: 0.78, currentPrice: 58.8, dailyChange: 0.8, dailyChangePercent: 1.38, weeklyChangePercent: -2.15, smartMoneyScore: 65, trend: 'ASAGI', status: 'İZLENEN', alert: false, alertMessage: '', notes: '' },
];

describe('WatchlistTable', () => {
  beforeEach(() => {
    useWatchlistStore.setState({ search: '', page: 0, sortKey: 'eliteScore', sortDir: 'desc', selectedSymbol: null });
  });

  it('returns empty state when no items', () => {
    render(<WatchlistTable items={[]} />);
    expect(screen.getByText('Henüz izleme listesi bulunmuyor')).toBeDefined();
  });

  it('renders title with count', () => {
    render(<WatchlistTable items={mockItems} />);
    expect(screen.getByText('İzleme Listesi (2)')).toBeDefined();
  });

  it('displays symbols', () => {
    render(<WatchlistTable items={mockItems} />);
    expect(screen.getByText('GARAN')).toBeDefined();
    expect(screen.getByText('ASELS')).toBeDefined();
  });

  it('displays company names', () => {
    render(<WatchlistTable items={mockItems} />);
    expect(screen.getByText('Garanti Bankası')).toBeDefined();
    expect(screen.getByText('Aselsan')).toBeDefined();
  });

  it('displays elite scores', () => {
    render(<WatchlistTable items={mockItems} />);
    expect(screen.getByText('82')).toBeDefined();
    expect(screen.getByText('72')).toBeDefined();
  });

  it('displays search input', () => {
    render(<WatchlistTable items={mockItems} />);
    expect(screen.getByLabelText('Hisse ara')).toBeDefined();
  });

  it('filters by symbol', () => {
    render(<WatchlistTable items={mockItems} />);
    fireEvent.change(screen.getByLabelText('Hisse ara'), { target: { value: 'GAR' } });
    expect(screen.getByText('GARAN')).toBeDefined();
    expect(screen.queryByText('ASELS')).toBeNull();
  });

  it('displays alert indicator', () => {
    render(<WatchlistTable items={mockItems} />);
    expect(screen.getByLabelText('Alarm var')).toBeDefined();
  });

  it('displays daily change with color', () => {
    const { container } = render(<WatchlistTable items={mockItems} />);
    expect(container.textContent).toContain('+2.55%');
  });

  it('displays weekly change', () => {
    const { container } = render(<WatchlistTable items={mockItems} />);
    expect(container.textContent).toContain('+5.12%');
    expect(container.textContent).toContain('-2.15%');
  });

  it('displays smart money scores', () => {
    render(<WatchlistTable items={mockItems} />);
    expect(screen.getByText('78')).toBeDefined();
    expect(screen.getByText('65')).toBeDefined();
  });

  it('displays trend', () => {
    render(<WatchlistTable items={mockItems} />);
    expect(screen.getByText('YUKARI')).toBeDefined();
    expect(screen.getByText('ASAGI')).toBeDefined();
  });
});
