import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiagnosticsHeader } from '../diagnostics-header';

describe('DiagnosticsHeader', () => {
  const defaultProps = {
    onRefresh: vi.fn(),
    onExport: vi.fn(),
    onClear: vi.fn(),
  };

  it('renders title', () => {
    render(<DiagnosticsHeader {...defaultProps} />);
    expect(screen.getByText('Sistem Tanılama')).toBeDefined();
  });

  it('renders refresh button', () => {
    render(<DiagnosticsHeader {...defaultProps} />);
    expect(screen.getByText('Yenile')).toBeDefined();
  });

  it('renders export button', () => {
    render(<DiagnosticsHeader {...defaultProps} />);
    expect(screen.getByText('Dışa Aktar')).toBeDefined();
  });

  it('renders clear button', () => {
    render(<DiagnosticsHeader {...defaultProps} />);
    expect(screen.getByText('Sıfırla')).toBeDefined();
  });

  it('calls onRefresh when refresh clicked', () => {
    const onRefresh = vi.fn();
    render(<DiagnosticsHeader {...defaultProps} onRefresh={onRefresh} />);
    fireEvent.click(screen.getByText('Yenile'));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('calls onExport when export clicked', () => {
    const onExport = vi.fn();
    render(<DiagnosticsHeader {...defaultProps} onExport={onExport} />);
    fireEvent.click(screen.getByText('Dışa Aktar'));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it('calls onClear when clear clicked', () => {
    const onClear = vi.fn();
    render(<DiagnosticsHeader {...defaultProps} onClear={onClear} />);
    fireEvent.click(screen.getByText('Sıfırla'));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<DiagnosticsHeader {...defaultProps} loading={true} />);
    const refreshBtn = screen.getByText('Yenile').closest('button')!;
    expect(refreshBtn.disabled).toBe(true);
  });

  it('shows last refresh timestamp', () => {
    render(<DiagnosticsHeader {...defaultProps} lastRefresh="2026-01-15T10:00:00Z" />);
    expect(screen.getByText(/Son güncelleme/)).toBeDefined();
  });

  it('does not show timestamp when null', () => {
    render(<DiagnosticsHeader {...defaultProps} lastRefresh={null} />);
    expect(screen.queryByText(/Son güncelleme/)).toBeNull();
  });

  it('has aria labels', () => {
    render(<DiagnosticsHeader {...defaultProps} />);
    expect(screen.getByLabelText('Yenile')).toBeDefined();
    expect(screen.getByLabelText('Dışa Aktar')).toBeDefined();
    expect(screen.getByLabelText('Sıfırla')).toBeDefined();
  });
});
