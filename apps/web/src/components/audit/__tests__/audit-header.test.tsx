import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuditHeader } from '../audit-header';

describe('AuditHeader', () => {
  const defaultProps = { onRefresh: vi.fn(), onExport: vi.fn(), onClearFilters: vi.fn() };

  it('renders title', () => { render(<AuditHeader {...defaultProps} />); expect(screen.getByText('Denetim Kayıtları')).toBeDefined(); });
  it('renders refresh button', () => { render(<AuditHeader {...defaultProps} />); expect(screen.getByText('Yenile')).toBeDefined(); });
  it('renders export button', () => { render(<AuditHeader {...defaultProps} />); expect(screen.getByText('Dışa Aktar')).toBeDefined(); });
  it('renders clear filters button', () => { render(<AuditHeader {...defaultProps} />); expect(screen.getByText('Filtreleri Temizle')).toBeDefined(); });
  it('calls onRefresh when clicked', () => { const fn = vi.fn(); render(<AuditHeader {...defaultProps} onRefresh={fn} />); fireEvent.click(screen.getByText('Yenile')); expect(fn).toHaveBeenCalledTimes(1); });
  it('calls onExport when clicked', () => { const fn = vi.fn(); render(<AuditHeader {...defaultProps} onExport={fn} />); fireEvent.click(screen.getByText('Dışa Aktar')); expect(fn).toHaveBeenCalledTimes(1); });
  it('calls onClearFilters when clicked', () => { const fn = vi.fn(); render(<AuditHeader {...defaultProps} onClearFilters={fn} />); fireEvent.click(screen.getByText('Filtreleri Temizle')); expect(fn).toHaveBeenCalledTimes(1); });
  it('disables refresh when loading', () => { render(<AuditHeader {...defaultProps} loading />); expect(screen.getByLabelText('Yenile').closest('button')!.disabled).toBe(true); });
  it('shows last refresh timestamp', () => { render(<AuditHeader {...defaultProps} lastRefresh="2026-01-15T10:00:00Z" />); expect(screen.getByText(/Son güncelleme/)).toBeDefined(); });
  it('does not show timestamp when null', () => { render(<AuditHeader {...defaultProps} lastRefresh={null} />); expect(screen.queryByText(/Son güncelleme/)).toBeNull(); });
  it('has aria labels', () => { render(<AuditHeader {...defaultProps} />); expect(screen.getByLabelText('Yenile')).toBeDefined(); expect(screen.getByLabelText('Dışa Aktar')).toBeDefined(); expect(screen.getByLabelText('Filtreleri Temizle')).toBeDefined(); });
});
