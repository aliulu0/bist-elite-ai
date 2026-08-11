import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkflowRunningTable } from '../workflow-running-table';
import type { WorkflowItem } from '../workflow-types';

const sampleRunning: WorkflowItem[] = [
  { id: 'wf-1', type: 'ANALYSIS', status: 'RUNNING', symbol: 'GARAN', steps: [{ step: 'Step1', status: 'running' }], currentStep: 'Step1', progress: 50, startedAt: '2026-01-15T10:00:00Z', createdAt: '2026-01-15T09:00:00Z', worker: 'worker-1' },
  { id: 'wf-2', type: 'SCANNING', status: 'QUEUED', symbol: 'THYAO', steps: [], currentStep: '', progress: 0, createdAt: '2026-01-15T08:00:00Z' },
];

describe('WorkflowRunningTable', () => {
  it('shows empty state when no running workflows', () => { render(<WorkflowRunningTable workflows={[]} onSelectWorkflow={vi.fn()} />); expect(screen.getByText('Çalışan iş akışı yok')).toBeDefined(); });
  it('renders table headers', () => { render(<WorkflowRunningTable workflows={sampleRunning} onSelectWorkflow={vi.fn()} />); expect(screen.getByText('İş Akışı ID')).toBeDefined(); expect(screen.getByText('Tür')).toBeDefined(); expect(screen.getByText('Hisse')).toBeDefined(); expect(screen.getByText('Durum')).toBeDefined(); expect(screen.getByText('İlerleme')).toBeDefined(); });
  it('renders workflow rows', () => { render(<WorkflowRunningTable workflows={sampleRunning} onSelectWorkflow={vi.fn()} />); expect(screen.getByText('GARAN')).toBeDefined(); expect(screen.getByText('THYAO')).toBeDefined(); });
  it('shows progress percentage', () => { render(<WorkflowRunningTable workflows={sampleRunning} onSelectWorkflow={vi.fn()} />); expect(screen.getByText('50%')).toBeDefined(); });
  it('shows worker', () => { render(<WorkflowRunningTable workflows={sampleRunning} onSelectWorkflow={vi.fn()} />); expect(screen.getByText('worker-1')).toBeDefined(); });
  it('calls onSelectWorkflow when row clicked', () => { const fn = vi.fn(); render(<WorkflowRunningTable workflows={sampleRunning} onSelectWorkflow={fn} />); fireEvent.click(screen.getByText('GARAN').closest('tr')!); expect(fn).toHaveBeenCalledWith(sampleRunning[0]); });
  it('shows detail button', () => { render(<WorkflowRunningTable workflows={sampleRunning} onSelectWorkflow={vi.fn()} />); expect(screen.getAllByText('Detay').length).toBeGreaterThan(0); });
});
