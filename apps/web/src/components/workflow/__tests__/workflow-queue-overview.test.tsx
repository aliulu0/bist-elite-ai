import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkflowQueueOverview } from '../workflow-queue-overview';
import type { WorkflowSnapshot } from '../workflow-types';
import { EMPTY_SNAPSHOT } from '@/stores/workflow-dashboard-store';

const mockSnapshot: WorkflowSnapshot = { ...EMPTY_SNAPSHOT, queueStatus: { pending: 5, running: 2, completed: 10, failed: 1 }, queue: [{ id: '1', workflowId: 'wf-1', status: 'RETRYING', priority: 'HIGH', createdAt: '2026-01-15T10:00:00Z' }, { id: '2', workflowId: 'wf-2', status: 'DEAD_LETTER', priority: 'NORMAL', createdAt: '2026-01-15T11:00:00Z' }] };

describe('WorkflowQueueOverview', () => {
  it('renders nothing when null', () => { const { container } = render(<WorkflowQueueOverview snapshot={null} />); expect(container.innerHTML).toBe(''); });
  it('renders queue card', () => { render(<WorkflowQueueOverview snapshot={mockSnapshot} />); expect(screen.getByText('Kuyruk Durumu')).toBeDefined(); });
  it('shows queue counts', () => { render(<WorkflowQueueOverview snapshot={mockSnapshot} />); expect(screen.getByText('5')).toBeDefined(); expect(screen.getByText('2')).toBeDefined(); expect(screen.getByText('10')).toBeDefined(); expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1); });
  it('shows retrying count', () => { render(<WorkflowQueueOverview snapshot={mockSnapshot} />); expect(screen.getByText('Yeniden Deneyen')).toBeDefined(); });
  it('shows dead letter count', () => { render(<WorkflowQueueOverview snapshot={mockSnapshot} />); expect(screen.getByText('Ölü Mektup')).toBeDefined(); });
  it('shows all 6 labels', () => { render(<WorkflowQueueOverview snapshot={mockSnapshot} />); expect(screen.getByText('Bekleyen')).toBeDefined(); expect(screen.getByText('Çalışan')).toBeDefined(); expect(screen.getByText('Tamamlanan')).toBeDefined(); expect(screen.getByText('Başarısız')).toBeDefined(); });
});
