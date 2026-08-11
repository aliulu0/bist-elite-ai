import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WatchlistFilters } from '../watchlist-filters';

describe('WatchlistFilters', () => {
  const sectors = ['Bankacılık', 'Savunma', 'Enerji'];

  it('renders filter toggle button', () => {
    render(<WatchlistFilters sectors={sectors} onFilterChange={vi.fn()} />);
    expect(screen.getByText('Filtreler')).toBeDefined();
  });

  it('expands filters on click', () => {
    render(<WatchlistFilters sectors={sectors} onFilterChange={vi.fn()} />);
    fireEvent.click(screen.getByText('Filtreler'));
    expect(screen.getByText('Sektör')).toBeDefined();
    expect(screen.getByText('Durum')).toBeDefined();
    expect(screen.getByText('Alarm')).toBeDefined();
    expect(screen.getByText('Trend')).toBeDefined();
  });

  it('shows sector options', () => {
    render(<WatchlistFilters sectors={sectors} onFilterChange={vi.fn()} />);
    fireEvent.click(screen.getByText('Filtreler'));
    expect(screen.getByText('Bankacılık')).toBeDefined();
    expect(screen.getByText('Savunma')).toBeDefined();
    expect(screen.getByText('Enerji')).toBeDefined();
  });

  it('calls onFilterChange when sector changes', () => {
    const onChange = vi.fn();
    render(<WatchlistFilters sectors={sectors} onFilterChange={onChange} />);
    fireEvent.click(screen.getByText('Filtreler'));
    const selects = screen.getAllByDisplayValue('Tümü');
    fireEvent.change(selects[0], { target: { value: 'Bankacılık' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('has default options for each filter', () => {
    render(<WatchlistFilters sectors={sectors} onFilterChange={vi.fn()} />);
    fireEvent.click(screen.getByText('Filtreler'));
    const defaultOptions = screen.getAllByDisplayValue('Tümü');
    expect(defaultOptions.length).toBe(4);
  });

  it('collapses on second click', () => {
    render(<WatchlistFilters sectors={sectors} onFilterChange={vi.fn()} />);
    fireEvent.click(screen.getByText('Filtreler'));
    fireEvent.click(screen.getByText('Filtreler'));
    expect(screen.queryByText('Sektör')).toBeNull();
  });
});
