import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkflowHeader } from '../workflow-header';

describe('WorkflowHeader', () => {
  const defaultProps = { onRefresh: vi.fn(), onCreateWorkflow: vi.fn(), onExport: vi.fn() };

  it('renders title', () => { render(<WorkflowHeader {...defaultProps} />); expect(screen.getByText('İş Akışları')).toBeDefined(); });
  it('renders refresh button', () => { render(<WorkflowHeader {...defaultProps} />); expect(screen.getByText('Yenile')).toBeDefined(); });
  it('renders create button', () => { render(<WorkflowHeader {...defaultProps} />); expect(screen.getByText('Yeni İş Akışı')).toBeDefined(); });
  it('renders export button', () => { render(<WorkflowHeader {...defaultProps} />); expect(screen.getByText('Dışa Aktar')).toBeDefined(); });
  it('calls onRefresh when clicked', () => { const fn = vi.fn(); render(<WorkflowHeader {...defaultProps} onRefresh={fn} />); fireEvent.click(screen.getByText('Yenile')); expect(fn).toHaveBeenCalledTimes(1); });
  it('calls onCreateWorkflow when clicked', () => { const fn = vi.fn(); render(<WorkflowHeader {...defaultProps} onCreateWorkflow={fn} />); fireEvent.click(screen.getByText('Yeni İş Akışı')); expect(fn).toHaveBeenCalledTimes(1); });
  it('calls onExport when clicked', () => { const fn = vi.fn(); render(<WorkflowHeader {...defaultProps} onExport={fn} />); fireEvent.click(screen.getByText('Dışa Aktar')); expect(fn).toHaveBeenCalledTimes(1); });
  it('disables refresh when loading', () => { render(<WorkflowHeader {...defaultProps} loading />); expect(screen.getByLabelText('Yenile').closest('button')!.disabled).toBe(true); });
  it('shows last refresh timestamp', () => { render(<WorkflowHeader {...defaultProps} lastRefresh="2026-01-15T10:00:00Z" />); expect(screen.getByText(/Son güncelleme/)).toBeDefined(); });
  it('does not show timestamp when null', () => { render(<WorkflowHeader {...defaultProps} lastRefresh={null} />); expect(screen.queryByText(/Son güncelleme/)).toBeNull(); });
  it('has aria labels', () => { render(<WorkflowHeader {...defaultProps} />); expect(screen.getByLabelText('Yenile')).toBeDefined(); expect(screen.getByLabelText('Yeni İş Akışı')).toBeDefined(); expect(screen.getByLabelText('Dışa Aktar')).toBeDefined(); });
});
