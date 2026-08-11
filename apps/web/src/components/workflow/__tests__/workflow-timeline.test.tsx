import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkflowTimeline } from '../workflow-timeline';
import type { WorkflowItem } from '../workflow-types';

const mockWorkflow: WorkflowItem = {
  id: 'wf-1', type: 'ANALYSIS', status: 'COMPLETED', symbol: 'GARAN',
  steps: [{ step: 'Step1', status: 'completed', completedAt: '2026-01-15T10:30:00Z' }],
  currentStep: '', progress: 100,
  createdAt: '2026-01-15T09:00:00Z', startedAt: '2026-01-15T09:05:00Z', completedAt: '2026-01-15T11:00:00Z',
};

describe('WorkflowTimeline', () => {
  it('shows empty state when null', () => { render(<WorkflowTimeline workflow={null} />); expect(screen.getByText('Zaman çizelgesi yok')).toBeDefined(); });
  it('renders timeline card', () => { render(<WorkflowTimeline workflow={mockWorkflow} />); expect(screen.getByText('Zaman Çizelgesi')).toBeDefined(); });
  it('shows created event', () => { render(<WorkflowTimeline workflow={mockWorkflow} />); expect(screen.getByText('Oluşturuldu')).toBeDefined(); });
  it('shows started event', () => { render(<WorkflowTimeline workflow={mockWorkflow} />); expect(screen.getByText('Başlatıldı')).toBeDefined(); });
  it('shows completed step event', () => { render(<WorkflowTimeline workflow={mockWorkflow} />); expect(screen.getByText('Step1 tamamlandı')).toBeDefined(); });
  it('shows completed event', () => { render(<WorkflowTimeline workflow={mockWorkflow} />); expect(screen.getByText('Tamamlandı')).toBeDefined(); });
});
