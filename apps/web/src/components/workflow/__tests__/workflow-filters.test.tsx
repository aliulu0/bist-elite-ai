import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkflowFilters } from '../workflow-filters';

describe('WorkflowFilters', () => {
  const defaultProps = { search: '', onSearchChange: vi.fn(), filterStatus: '' as '' | 'RUNNING', onStatusChange: vi.fn(), filterType: '', onTypeChange: vi.fn() };

  it('renders search input', () => { render(<WorkflowFilters {...defaultProps} />); expect(screen.getByLabelText('Arama')).toBeDefined(); });
  it('renders status select', () => { render(<WorkflowFilters {...defaultProps} />); expect(screen.getByLabelText('Durum filtresi')).toBeDefined(); });
  it('renders type input', () => { render(<WorkflowFilters {...defaultProps} />); expect(screen.getByLabelText('Tür filtresi')).toBeDefined(); });
  it('calls onSearchChange', () => { const fn = vi.fn(); render(<WorkflowFilters {...defaultProps} onSearchChange={fn} />); fireEvent.change(screen.getByLabelText('Arama'), { target: { value: 'test' } }); expect(fn).toHaveBeenCalledWith('test'); });
  it('calls onStatusChange', () => { const fn = vi.fn(); render(<WorkflowFilters {...defaultProps} onStatusChange={fn} />); fireEvent.change(screen.getByLabelText('Durum filtresi'), { target: { value: 'FAILED' } }); expect(fn).toHaveBeenCalledWith('FAILED'); });
  it('calls onTypeChange', () => { const fn = vi.fn(); render(<WorkflowFilters {...defaultProps} onTypeChange={fn} />); fireEvent.change(screen.getByLabelText('Tür filtresi'), { target: { value: 'ANALYSIS' } }); expect(fn).toHaveBeenCalledWith('ANALYSIS'); });
  it('shows default option', () => { render(<WorkflowFilters {...defaultProps} />); expect(screen.getByText('Tüm Durumlar')).toBeDefined(); });
  it('shows status options', () => { render(<WorkflowFilters {...defaultProps} />); expect(screen.getByText('Bekliyor')).toBeDefined(); expect(screen.getByText('Çalışıyor')).toBeDefined(); expect(screen.getByText('Tamamlandı')).toBeDefined(); });
  it('displays current search value', () => { render(<WorkflowFilters {...defaultProps} search="hello" />); expect((screen.getByLabelText('Arama') as HTMLInputElement).value).toBe('hello'); });
});
