import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WatchlistNotes } from '../watchlist-notes';
import type { WatchlistNote } from '../watchlist-types';

describe('WatchlistNotes', () => {
  const notes: WatchlistNote[] = [
    { symbol: 'THYAO', text: 'Uzun vadeli potansiyel yüksek', createdAt: '2024-03-15', updatedAt: '2024-03-20' },
    { symbol: 'GARAN', text: 'Temettü verimi iyi', createdAt: '2024-03-10', updatedAt: '2024-03-18' },
  ];

  it('renders empty state when no notes', () => {
    render(<WatchlistNotes notes={[]} />);
    expect(screen.getByText('Not bulunmuyor')).toBeDefined();
  });

  it('renders title with count', () => {
    render(<WatchlistNotes notes={notes} />);
    expect(screen.getByText('Notlar (2)')).toBeDefined();
  });

  it('displays symbols', () => {
    render(<WatchlistNotes notes={notes} />);
    expect(screen.getByText('THYAO')).toBeDefined();
    expect(screen.getByText('GARAN')).toBeDefined();
  });

  it('displays note text', () => {
    render(<WatchlistNotes notes={notes} />);
    expect(screen.getByText('Uzun vadeli potansiyel yüksek')).toBeDefined();
    expect(screen.getByText('Temettü verimi iyi')).toBeDefined();
  });

  it('displays dates', () => {
    render(<WatchlistNotes notes={notes} />);
    expect(screen.getByText('2024-03-20')).toBeDefined();
    expect(screen.getByText('2024-03-18')).toBeDefined();
  });
});
