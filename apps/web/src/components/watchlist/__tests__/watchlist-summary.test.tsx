import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WatchlistSummaryCards } from '../watchlist-summary';
import type { WatchlistSummary } from '../watchlist-types';

const mockSummary: WatchlistSummary = {
  totalWatched: 8, earlyOpportunities: 2, aaaCount: 1,
  risingCount: 5, fallingCount: 3, newAlerts: 3,
  avgEliteScore: 76, avgConfidence: 0.78,
};

describe('WatchlistSummaryCards', () => {
  it('returns null when summary is null', () => {
    const { container } = render(<WatchlistSummaryCards summary={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders all 8 KPI cards', () => {
    render(<WatchlistSummaryCards summary={mockSummary} />);
    expect(screen.getByText('Toplam İzlenen Hisse')).toBeDefined();
    expect(screen.getByText('Erken Fırsat')).toBeDefined();
    expect(screen.getByText('AAA')).toBeDefined();
    expect(screen.getByText('Yükselen')).toBeDefined();
    expect(screen.getByText('Düşen')).toBeDefined();
    expect(screen.getByText('Yeni Alarm')).toBeDefined();
    expect(screen.getByText('Ort. Elite Skoru')).toBeDefined();
    expect(screen.getByText('Ort. Güven')).toBeDefined();
  });

  it('displays correct values via container text', () => {
    const { container } = render(<WatchlistSummaryCards summary={mockSummary} />);
    const text = container.textContent || '';
    expect(text).toContain('8');
    expect(text).toContain('2');
    expect(text).toContain('1');
    expect(text).toContain('5');
    expect(text).toContain('78%');
  });

  it('displays avg elite score', () => {
    render(<WatchlistSummaryCards summary={mockSummary} />);
    expect(screen.getByText('76')).toBeDefined();
  });

  it('handles zero values via container', () => {
    const zero: WatchlistSummary = { totalWatched: 0, earlyOpportunities: 0, aaaCount: 0, risingCount: 0, fallingCount: 0, newAlerts: 0, avgEliteScore: 0, avgConfidence: 0 };
    const { container } = render(<WatchlistSummaryCards summary={zero} />);
    const text = container.textContent || '';
    expect(text).toContain('0');
  });
});
