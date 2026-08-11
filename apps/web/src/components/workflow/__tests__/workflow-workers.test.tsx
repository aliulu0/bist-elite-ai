import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkflowWorkers } from '../workflow-workers';
import type { WorkerInfo } from '../workflow-types';

const mockWorkers: WorkerInfo[] = [
  { id: 'worker-1', status: 'active', runningJobs: 2, completedJobs: 10, failedJobs: 1, utilization: 75 },
  { id: 'worker-2', status: 'idle', runningJobs: 0, completedJobs: 5, failedJobs: 0, utilization: 0 },
];

describe('WorkflowWorkers', () => {
  it('shows empty state when no workers', () => { render(<WorkflowWorkers workers={[]} />); expect(screen.getByText('İşçi bilgisi yok')).toBeDefined(); });
  it('renders table', () => { render(<WorkflowWorkers workers={mockWorkers} />); expect(screen.getByText('İşçi Durumu')).toBeDefined(); });
  it('shows table headers', () => { render(<WorkflowWorkers workers={mockWorkers} />); expect(screen.getByText('İşçi ID')).toBeDefined(); expect(screen.getByText('Durum')).toBeDefined(); expect(screen.getByText('Çalışan İş')).toBeDefined(); expect(screen.getByText('Tamamlanan')).toBeDefined(); expect(screen.getByText('Başarısız')).toBeDefined(); expect(screen.getByText('Kullanım')).toBeDefined(); });
  it('shows worker status', () => { render(<WorkflowWorkers workers={mockWorkers} />); expect(screen.getByText('Aktif')).toBeDefined(); expect(screen.getByText('Boşta')).toBeDefined(); });
  it('shows utilization', () => { render(<WorkflowWorkers workers={mockWorkers} />); expect(screen.getByText('%75')).toBeDefined(); expect(screen.getByText('%0')).toBeDefined(); });
  it('shows running jobs count', () => { render(<WorkflowWorkers workers={mockWorkers} />); expect(screen.getByText('2')).toBeDefined(); expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1); });
});
