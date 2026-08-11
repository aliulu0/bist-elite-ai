import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkflowHistoryTable } from '../workflow-history-table';
import type { WorkflowItem } from '../workflow-types';

const sampleHistory: WorkflowItem[] = [
  { id: 'wf-1', type: 'ANALYSIS', status: 'COMPLETED', symbol: 'GARAN', steps: [], currentStep: '', progress: 100, createdAt: '2026-01-15T09:00:00Z', completedAt: '2026-01-15T10:00:00Z', durationMs: 3600000 },
  { id: 'wf-2', type: 'SCANNING', status: 'FAILED', symbol: 'THYAO', steps: [], currentStep: '', progress: 0, createdAt: '2026-01-15T08:00:00Z', retryCount: 2 },
];

describe('WorkflowHistoryTable', () => {
  it('shows empty state', () => { render(<WorkflowHistoryTable workflows={[]} onSelectWorkflow={vi.fn()} page={0} pageSize={10} onPageChange={vi.fn()} totalCount={0} />); expect(screen.getByText('Geçmiş bulunamadı')).toBeDefined(); });
  it('renders table headers', () => { render(<WorkflowHistoryTable workflows={sampleHistory} onSelectWorkflow={vi.fn()} page={0} pageSize={10} onPageChange={vi.fn()} totalCount={2} />); expect(screen.getByText('Sonuç')).toBeDefined(); expect(screen.getByText('Toplam Süre')).toBeDefined(); expect(screen.getByText('Yeniden Deneme')).toBeDefined(); expect(screen.getByText('Bitiş')).toBeDefined(); });
  it('renders history rows', () => { render(<WorkflowHistoryTable workflows={sampleHistory} onSelectWorkflow={vi.fn()} page={0} pageSize={10} onPageChange={vi.fn()} totalCount={2} />); expect(screen.getByText('GARAN')).toBeDefined(); expect(screen.getByText('THYAO')).toBeDefined(); });
  it('shows retry count', () => { render(<WorkflowHistoryTable workflows={sampleHistory} onSelectWorkflow={vi.fn()} page={0} pageSize={10} onPageChange={vi.fn()} totalCount={2} />); expect(screen.getByText('2')).toBeDefined(); });
  it('shows pagination when > 1 page', () => { render(<WorkflowHistoryTable workflows={sampleHistory} onSelectWorkflow={vi.fn()} page={0} pageSize={1} onPageChange={vi.fn()} totalCount={2} />); expect(screen.getByText('Sonraki')).toBeDefined(); expect(screen.getByText('Önceki')).toBeDefined(); });
  it('calls onPageChange on next click', () => { const fn = vi.fn(); render(<WorkflowHistoryTable workflows={sampleHistory} onSelectWorkflow={vi.fn()} page={0} pageSize={1} onPageChange={fn} totalCount={2} />); fireEvent.click(screen.getByText('Sonraki')); expect(fn).toHaveBeenCalledWith(1); });
  it('disables previous on first page', () => { render(<WorkflowHistoryTable workflows={sampleHistory} onSelectWorkflow={vi.fn()} page={0} pageSize={1} onPageChange={vi.fn()} totalCount={2} />); expect(screen.getByText('Önceki').closest('button')!.disabled).toBe(true); });
  it('calls onSelectWorkflow when row clicked', () => { const fn = vi.fn(); render(<WorkflowHistoryTable workflows={sampleHistory} onSelectWorkflow={fn} page={0} pageSize={10} onPageChange={vi.fn()} totalCount={2} />); fireEvent.click(screen.getByText('GARAN').closest('tr')!); expect(fn).toHaveBeenCalledWith(sampleHistory[0]); });
});
