import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WatchlistExport } from '../watchlist-export';
import type { WatchlistItem } from '../watchlist-types';

const mockItems: WatchlistItem[] = [
  { symbol: 'GARAN', name: 'Garanti Bankası', sector: 'Bankacılık', eliteScore: 82, eliteRating: 'AA', opportunityLevel: 'Erken', confidence: 0.85, currentPrice: 48.2, dailyChange: 1.2, dailyChangePercent: 2.55, weeklyChangePercent: 5.12, smartMoneyScore: 78, trend: 'YUKARI', status: 'AKTİF', alert: true, alertMessage: '', notes: '' },
];

describe('WatchlistExport', () => {
  it('renders CSV button', () => {
    render(<WatchlistExport items={mockItems} />);
    expect(screen.getByText('CSV')).toBeDefined();
  });

  it('renders JSON button', () => {
    render(<WatchlistExport items={mockItems} />);
    expect(screen.getByText('JSON')).toBeDefined();
  });

  it('disables buttons when no items', () => {
    render(<WatchlistExport items={[]} />);
    const csv = screen.getByText('CSV');
    const json = screen.getByText('JSON');
    expect(csv.hasAttribute('disabled')).toBe(true);
    expect(json.hasAttribute('disabled')).toBe(true);
  });

  it('enables buttons when items exist', () => {
    render(<WatchlistExport items={mockItems} />);
    const csv = screen.getByText('CSV');
    const json = screen.getByText('JSON');
    expect(csv.hasAttribute('disabled')).toBe(false);
    expect(json.hasAttribute('disabled')).toBe(false);
  });
});
