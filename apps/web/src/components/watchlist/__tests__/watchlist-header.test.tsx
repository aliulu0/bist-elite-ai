import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WatchlistHeader } from '../watchlist-header';

describe('WatchlistHeader', () => {
  const defaultProps = {
    onAddList: vi.fn(),
    onRefresh: vi.fn(),
    onExport: vi.fn(),
    loading: false,
  };

  it('renders title', () => {
    render(<WatchlistHeader {...defaultProps} />);
    expect(screen.getByText('Canlı İzleme')).toBeDefined();
  });

  it('calls onAddList when clicked', () => {
    render(<WatchlistHeader {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Liste ekle'));
    expect(defaultProps.onAddList).toHaveBeenCalledOnce();
  });

  it('calls onRefresh when clicked', () => {
    render(<WatchlistHeader {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Yenile'));
    expect(defaultProps.onRefresh).toHaveBeenCalledOnce();
  });

  it('calls onExport when clicked', () => {
    render(<WatchlistHeader {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Dışa aktar'));
    expect(defaultProps.onExport).toHaveBeenCalledOnce();
  });

  it('disables refresh when loading', () => {
    render(<WatchlistHeader {...defaultProps} loading={true} />);
    const btn = screen.getByLabelText('Yenile');
    expect(btn.hasAttribute('disabled')).toBe(true);
  });

  it('enables refresh when not loading', () => {
    render(<WatchlistHeader {...defaultProps} loading={false} />);
    const btn = screen.getByLabelText('Yenile');
    expect(btn.hasAttribute('disabled')).toBe(false);
  });
});
