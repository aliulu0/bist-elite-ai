import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkflowProgress } from '../workflow-progress';
import type { WorkflowItem } from '../workflow-types';

const mockWorkflow: WorkflowItem = {
  id: 'wf-1', type: 'ANALYSIS', status: 'RUNNING', symbol: 'GARAN',
  steps: [
    { step: 'Veri Çekme', status: 'completed', durationMs: 1000 },
    { step: 'Analiz', status: 'running' },
    { step: 'Rapor', status: 'waiting' },
  ],
  currentStep: 'Analiz', progress: 33, createdAt: '2026-01-15T09:00:00Z',
};

describe('WorkflowProgress', () => {
  it('shows empty state when null', () => { render(<WorkflowProgress workflow={null} />); expect(screen.getByText('Adım bilgisi yok')).toBeDefined(); });
  it('shows empty state when no steps', () => { render(<WorkflowProgress workflow={{ ...mockWorkflow, steps: [] }} />); expect(screen.getByText('Adım bilgisi yok')).toBeDefined(); });
  it('renders progress card', () => { render(<WorkflowProgress workflow={mockWorkflow} />); expect(screen.getByText('İş Akışı İlerlemesi')).toBeDefined(); });
  it('shows step names', () => { render(<WorkflowProgress workflow={mockWorkflow} />); expect(screen.getByText('Veri Çekme')).toBeDefined(); expect(screen.getByText('Analiz')).toBeDefined(); expect(screen.getByText('Rapor')).toBeDefined(); });
  it('shows step statuses', () => { render(<WorkflowProgress workflow={mockWorkflow} />); const text = document.body.textContent || ''; expect(text).toContain('Veri'); expect(text).toContain('Analiz'); expect(text).toContain('Rapor'); });
  it('shows duration for completed steps', () => { render(<WorkflowProgress workflow={mockWorkflow} />); expect(screen.getByText(/1\.0s/)).toBeDefined(); });
  it('shows progress percentage', () => { render(<WorkflowProgress workflow={mockWorkflow} />); expect(screen.getByText(/%33/)).toBeDefined(); });
});
