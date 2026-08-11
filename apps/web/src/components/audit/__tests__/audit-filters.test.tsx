import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuditFilters } from '../audit-filters';

describe('AuditFilters', () => {
  const defaultProps = { search: '', onSearchChange: vi.fn(), filterSeverity: '' as '' | 'INFO', onSeverityChange: vi.fn(), filterModule: '', onModuleChange: vi.fn(), filterAction: '', onActionChange: vi.fn() };

  it('renders search input', () => { render(<AuditFilters {...defaultProps} />); expect(screen.getByLabelText('Arama')).toBeDefined(); });
  it('renders severity select', () => { render(<AuditFilters {...defaultProps} />); expect(screen.getByLabelText('Önem filtresi')).toBeDefined(); });
  it('renders module input', () => { render(<AuditFilters {...defaultProps} />); expect(screen.getByLabelText('Modül filtresi')).toBeDefined(); });
  it('renders action input', () => { render(<AuditFilters {...defaultProps} />); expect(screen.getByLabelText('İşlem filtresi')).toBeDefined(); });
  it('calls onSearchChange', () => { const fn = vi.fn(); render(<AuditFilters {...defaultProps} onSearchChange={fn} />); fireEvent.change(screen.getByLabelText('Arama'), { target: { value: 'test' } }); expect(fn).toHaveBeenCalledWith('test'); });
  it('calls onSeverityChange', () => { const fn = vi.fn(); render(<AuditFilters {...defaultProps} onSeverityChange={fn} />); fireEvent.change(screen.getByLabelText('Önem filtresi'), { target: { value: 'ERROR' } }); expect(fn).toHaveBeenCalledWith('ERROR'); });
  it('calls onModuleChange', () => { const fn = vi.fn(); render(<AuditFilters {...defaultProps} onModuleChange={fn} />); fireEvent.change(screen.getByLabelText('Modül filtresi'), { target: { value: 'Workflow' } }); expect(fn).toHaveBeenCalledWith('Workflow'); });
  it('calls onActionChange', () => { const fn = vi.fn(); render(<AuditFilters {...defaultProps} onActionChange={fn} />); fireEvent.change(screen.getByLabelText('İşlem filtresi'), { target: { value: 'STARTED' } }); expect(fn).toHaveBeenCalledWith('STARTED'); });
  it('shows default "Tüm Önemler" option', () => { render(<AuditFilters {...defaultProps} />); expect(screen.getByText('Tüm Önemler')).toBeDefined(); });
  it('shows severity options', () => { render(<AuditFilters {...defaultProps} />); expect(screen.getByText('Bilgi')).toBeDefined(); expect(screen.getByText('Uyarı')).toBeDefined(); expect(screen.getByText('Hata')).toBeDefined(); expect(screen.getByText('Kritik')).toBeDefined(); });
  it('displays current search value', () => { render(<AuditFilters {...defaultProps} search="hello" />); expect((screen.getByLabelText('Arama') as HTMLInputElement).value).toBe('hello'); });
});
