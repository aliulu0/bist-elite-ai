import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import WorkflowsPage from '@/pages/workflows';
import { useWorkflowDashboardStore } from '@/stores/workflow-dashboard-store';

vi.mock('@/lib/sdk', () => ({
  sdkClient: {
    workflows: vi.fn(),
    workflowQueue: vi.fn(),
    workflowsStats: vi.fn(),
    workflowsHistory: vi.fn(),
  },
}));

import { sdkClient } from '@/lib/sdk';

describe('WorkflowsPage', () => {
  beforeEach(() => {
    useWorkflowDashboardStore.setState({
      activeTab: 'overview',
      snapshot: null,
      loading: false,
      error: '',
      lastRefresh: null,
      search: '',
      sortKey: 'createdAt',
      sortDir: 'desc',
      selectedWorkflow: null,
      page: 0,
      pageSize: 10,
      filterStatus: '',
      filterType: '',
    });
    vi.mocked(sdkClient.workflows).mockResolvedValue({
      data: [
        { id: 'wf-1', type: 'ANALYSIS', status: 'RUNNING', symbol: 'GARAN', steps: [{ step: 'Step1', status: 'running' }], currentStep: 'Step1', progress: 50, createdAt: '2026-01-15T09:00:00Z' },
        { id: 'wf-2', type: 'SCANNING', status: 'COMPLETED', symbol: 'THYAO', steps: [], currentStep: '', progress: 100, createdAt: '2026-01-15T08:00:00Z' },
      ],
    } as never);
    vi.mocked(sdkClient.workflowQueue).mockResolvedValue({ jobs: [] } as never);
    vi.mocked(sdkClient.workflowsStats).mockResolvedValue({ totalCreated: 2, totalCompleted: 1, totalFailed: 0, totalCancelled: 0, activeWorkflows: 1, avgDurationMs: 0, byType: {} } as never);
    vi.mocked(sdkClient.workflowsHistory).mockResolvedValue({ data: [] } as never);
  });

  it('renders page title', async () => {
    render(<WorkflowsPage />);
    await waitFor(() => { expect(screen.getByText('İş Akışları')).toBeDefined(); });
  });

  it('renders refresh button', async () => {
    render(<WorkflowsPage />);
    await waitFor(() => { expect(screen.getByText('Yenile')).toBeDefined(); });
  });

  it('renders summary cards', async () => {
    render(<WorkflowsPage />);
    await waitFor(() => { expect(screen.getByText('Toplam İş Akışı')).toBeDefined(); });
  });

  it('renders tabs', async () => {
    render(<WorkflowsPage />);
    await waitFor(() => { expect(screen.getByText('Genel')).toBeDefined(); expect(screen.getByText('Kuyruk')).toBeDefined(); });
  });

  it('renders queue overview', async () => {
    render(<WorkflowsPage />);
    await waitFor(() => { expect(screen.getByText('Kuyruk Durumu')).toBeDefined(); });
  });

  it('shows error on failure', async () => {
    vi.mocked(sdkClient.workflows).mockRejectedValue(new Error('Network error'));
    render(<WorkflowsPage />);
    await waitFor(() => { expect(screen.getByText('İş akışları yüklenirken hata oluştu')).toBeDefined(); });
  });

  it('handles Promise.allSettled partial failure', async () => {
    vi.mocked(sdkClient.workflows).mockRejectedValue(new Error('fail'));
    render(<WorkflowsPage />);
    await waitFor(() => { expect(screen.getByText('İş akışları yüklenirken hata oluştu')).toBeDefined(); });
  });

  it('renders export button', async () => {
    render(<WorkflowsPage />);
    await waitFor(() => { expect(screen.getByText('Dışa Aktar')).toBeDefined(); });
  });

  it('renders create workflow button', async () => {
    render(<WorkflowsPage />);
    await waitFor(() => { expect(screen.getByText('Yeni İş Akışı')).toBeDefined(); });
  });

  it('renders search input', async () => {
    render(<WorkflowsPage />);
    await waitFor(() => { expect(screen.getByLabelText('Arama')).toBeDefined(); });
  });
});
