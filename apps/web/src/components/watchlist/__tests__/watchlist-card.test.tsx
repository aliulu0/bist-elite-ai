import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WatchlistCard } from '../watchlist-card';
import type { WatchlistItem } from '../watchlist-types';

const mockItem: WatchlistItem = {
  symbol: 'GARAN', name: 'Garanti Bankası', sector: 'Bankacılık', eliteScore: 82,
  eliteRating: 'AA', opportunityLevel: 'Erken', confidence: 0.85, currentPrice: 48.2,
  dailyChange: 1.2, dailyChangePercent: 2.55, weeklyChangePercent: 5.12,
  smartMoneyScore: 78, trend: 'YUKARI', status: 'AKTİF', alert: true,
  alertMessage: 'Test alert', notes: '',
};

describe('WatchlistCard', () => {
  it('renders symbol', () => {
    render(<WatchlistCard item={mockItem} />);
    expect(screen.getByText('GARAN')).toBeDefined();
  });

  it('renders elite score', () => {
    render(<WatchlistCard item={mockItem} />);
    expect(screen.getByText('82')).toBeDefined();
  });

  it('renders opportunity level', () => {
    render(<WatchlistCard item={mockItem} />);
    expect(screen.getByText('Erken')).toBeDefined();
  });

  it('renders confidence', () => {
    render(<WatchlistCard item={mockItem} />);
    expect(screen.getByText('85%')).toBeDefined();
  });

  it('renders daily change', () => {
    render(<WatchlistCard item={mockItem} />);
    expect(screen.getByText('+2.55%')).toBeDefined();
  });

  it('renders alert indicator when alert is true', () => {
    render(<WatchlistCard item={mockItem} />);
    expect(screen.getByText('Alarm')).toBeDefined();
  });

  it('does not render alert indicator when alert is false', () => {
    const noAlert = { ...mockItem, alert: false };
    render(<WatchlistCard item={noAlert} />);
    expect(screen.queryByText('Alarm')).toBeNull();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn();
    render(<WatchlistCard item={mockItem} onSelect={onSelect} />);
    fireEvent.click(screen.getByLabelText('GARAN detayı'));
    expect(onSelect).toHaveBeenCalledWith('GARAN');
  });

  it('renders status', () => {
    render(<WatchlistCard item={mockItem} />);
    expect(screen.getByText('AKTİF')).toBeDefined();
  });
});
