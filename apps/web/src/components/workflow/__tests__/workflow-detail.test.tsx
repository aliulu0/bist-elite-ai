import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkflowDetail } from '../workflow-detail';
import type { WorkflowItem } from '../workflow-types';

const mockWorkflow: WorkflowItem = { id: 'wf-1', type: 'ANALYSIS', status: 'RUNNING', symbol: 'GARAN', steps: [{ step: 'Step1', status: 'running' }], currentStep: 'Step1', progress: 50, startedAt: '2026-01-15T10:00:00Z', createdAt: '2026-01-15T09:00:00Z', worker: 'worker-1', retryCount: 1, priority: 'HIGH' };

describe('WorkflowDetail', () => {
  const onClose = vi.fn();

  it('renders null when workflow is null', () => { const { container } = render(<WorkflowDetail workflow={null} onClose={onClose} />); expect(container.innerHTML).toBe(''); });
  it('renders detail card when workflow provided', () => { render(<WorkflowDetail workflow={mockWorkflow} onClose={onClose} />); expect(screen.getByText('İş Akışı Detayı')).toBeDefined(); });
  it('shows workflow id', () => { render(<WorkflowDetail workflow={mockWorkflow} onClose={onClose} />); expect(screen.getByText('wf-1')).toBeDefined(); });
  it('shows type label', () => { render(<WorkflowDetail workflow={mockWorkflow} onClose={onClose} />); expect(screen.getByText('Analiz')).toBeDefined(); });
  it('shows status label', () => { render(<WorkflowDetail workflow={mockWorkflow} onClose={onClose} />); expect(screen.getByText('Çalışıyor')).toBeDefined(); });
  it('shows priority', () => { render(<WorkflowDetail workflow={mockWorkflow} onClose={onClose} />); expect(screen.getByText('HIGH')).toBeDefined(); });
  it('shows retry count', () => { render(<WorkflowDetail workflow={mockWorkflow} onClose={onClose} />); expect(screen.getByText('1')).toBeDefined(); });
  it('shows worker', () => { render(<WorkflowDetail workflow={mockWorkflow} onClose={onClose} />); expect(screen.getByText('worker-1')).toBeDefined(); });
  it('calls onClose when close button clicked', () => { const fn = vi.fn(); render(<WorkflowDetail workflow={mockWorkflow} onClose={fn} />); fireEvent.click(screen.getByLabelText('Kapat')); expect(fn).toHaveBeenCalledTimes(1); });
  it('shows all field labels', () => { render(<WorkflowDetail workflow={mockWorkflow} onClose={onClose} />); expect(screen.getByText('İş Akışı ID')).toBeDefined(); expect(screen.getByText('İş Akışı Türü')).toBeDefined(); expect(screen.getByText('Durum')).toBeDefined(); expect(screen.getByText('Öncelik')).toBeDefined(); expect(screen.getByText('Yeniden Deneme Sayısı')).toBeDefined(); });
});
