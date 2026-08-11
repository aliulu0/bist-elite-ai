import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PerformanceHeader } from '../performance-header';

const defaultProps = {
  onRefresh: vi.fn(),
  onExport: vi.fn(),
  onClear: vi.fn(),
};

describe('PerformanceHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title', () => {
    render(<PerformanceHeader {...defaultProps} />);
    expect(screen.getByText('Performans Monitörü')).toBeDefined();
  });

  it('renders refresh button', () => {
    render(<PerformanceHeader {...defaultProps} />);
    expect(screen.getByText('Yenile')).toBeDefined();
  });

  it('renders export button', () => {
    render(<PerformanceHeader {...defaultProps} />);
    expect(screen.getByText('Dışa Aktar')).toBeDefined();
  });

  it('renders clear button', () => {
    render(<PerformanceHeader {...defaultProps} />);
    expect(screen.getByText('Temizle')).toBeDefined();
  });

  it('calls onRefresh when refresh clicked', async () => {
    const onRefresh = vi.fn();
    render(<PerformanceHeader {...defaultProps} onRefresh={onRefresh} />);
    screen.getByText('Yenile').click();
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it('calls onExport when export clicked', async () => {
    const onExport = vi.fn();
    render(<PerformanceHeader {...defaultProps} onExport={onExport} />);
    screen.getByText('Dışa Aktar').click();
    expect(onExport).toHaveBeenCalledOnce();
  });

  it('calls onClear when clear clicked', async () => {
    const onClear = vi.fn();
    render(<PerformanceHeader {...defaultProps} onClear={onClear} />);
    screen.getByText('Temizle').click();
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('disables refresh when loading', () => {
    render(<PerformanceHeader {...defaultProps} loading />);
    const btn = screen.getByText('Yenile').closest('button')!;
    expect(btn.disabled).toBe(true);
  });

  it('shows last refresh time', () => {
    render(<PerformanceHeader {...defaultProps} lastRefresh="2026-01-15T10:30:00Z" />);
    expect(screen.getByText(/Son güncelleme/)).toBeDefined();
  });

  it('hides last refresh when null', () => {
    render(<PerformanceHeader {...defaultProps} lastRefresh={null} />);
    expect(screen.queryByText(/Son güncelleme/)).toBeNull();
  });

  it('has aria-labels', () => {
    render(<PerformanceHeader {...defaultProps} />);
    expect(screen.getByLabelText('Yenile')).toBeDefined();
    expect(screen.getByLabelText('Dışa Aktar')).toBeDefined();
    expect(screen.getByLabelText('Temizle')).toBeDefined();
  });
});
