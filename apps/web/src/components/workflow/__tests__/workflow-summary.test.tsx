import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkflowSummary } from '../workflow-summary';
import type { WorkflowSnapshot } from '../workflow-types';
import { EMPTY_SNAPSHOT } from '@/stores/workflow-dashboard-store';

const mockSnapshot: WorkflowSnapshot = { ...EMPTY_SNAPSHOT, statistics: { totalCreated: 10, totalCompleted: 8, totalFailed: 1, totalCancelled: 1, activeWorkflows: 2, avgDurationMs: 5000, byType: {} }, queueStatus: { pending: 3, running: 2, completed: 5, failed: 1 }, activeCount: 2 };

describe('WorkflowSummary', () => {
  it('renders nothing when null', () => { const { container } = render(<WorkflowSummary snapshot={null} />); expect(container.innerHTML).toBe(''); });
  it('renders all summary cards', () => { render(<WorkflowSummary snapshot={mockSnapshot} />); expect(screen.getByText('Toplam İş Akışı')).toBeDefined(); expect(screen.getByText('Bekleyen')).toBeDefined(); expect(screen.getByText('Çalışıyor')).toBeDefined(); expect(screen.getByText('Tamamlandı')).toBeDefined(); expect(screen.getByText('Başarısız')).toBeDefined(); expect(screen.getByText('İptal')).toBeDefined(); expect(screen.getByText('Ortalama Süre')).toBeDefined(); expect(screen.getByText('Başarı Oranı')).toBeDefined(); });
  it('shows correct counts', () => { render(<WorkflowSummary snapshot={mockSnapshot} />); expect(screen.getByText('10')).toBeDefined(); expect(screen.getByText('8')).toBeDefined(); expect(screen.getByText('3')).toBeDefined(); });
  it('shows success rate', () => { render(<WorkflowSummary snapshot={mockSnapshot} />); expect(screen.getByText('%80')).toBeDefined(); });
  it('shows average duration', () => { render(<WorkflowSummary snapshot={mockSnapshot} />); expect(screen.getByText('5.0s')).toBeDefined(); });
});
