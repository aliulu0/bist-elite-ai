import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DiagnosticsPage from '@/pages/diagnostics';
import { useDiagnosticsStore } from '@/stores/diagnostics-store';

vi.mock('@/lib/sdk', () => ({
  sdkClient: {
    diagnostics: vi.fn(),
  },
}));

import { sdkClient } from '@/lib/sdk';

describe('DiagnosticsPage', () => {
  beforeEach(() => {
    useDiagnosticsStore.setState({
      activeTab: 'overview',
      snapshot: null,
      loading: false,
      error: '',
      lastRefresh: null,
      search: '',
      sortKey: 'name',
      sortDir: 'asc',
      selectedModule: null,
      page: 0,
      pageSize: 10,
    });
    vi.mocked(sdkClient.diagnostics).mockResolvedValue({
      checks: [
        { name: 'Database', status: 'pass', message: 'OK', duration: 12 },
        { name: 'Redis', status: 'warning', message: 'Slow', duration: 80 },
      ],
      modules: [],
      alerts: [],
      history: [],
      lastRun: '2026-01-15T10:00:00Z',
    } as never);
  });

  it('renders page title', async () => {
    render(<DiagnosticsPage />);
    await waitFor(() => {
      expect(screen.getByText('Sistem Tanılama')).toBeDefined();
    });
  });

  it('renders summary cards', async () => {
    render(<DiagnosticsPage />);
    await waitFor(() => {
      const genelDurum = screen.getAllByText('Genel Durum');
      expect(genelDurum.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders tabs', async () => {
    render(<DiagnosticsPage />);
    await waitFor(() => {
      expect(screen.getByText('Genel')).toBeDefined();
      expect(screen.getByText('İş Akışı')).toBeDefined();
    });
  });

  it('renders overview panel', async () => {
    render(<DiagnosticsPage />);
    await waitFor(() => {
      expect(screen.getByText('Son Olaylar')).toBeDefined();
    });
  });

  it('renders export panel', async () => {
    render(<DiagnosticsPage />);
    await waitFor(() => {
      expect(screen.getByText('Tanılama verilerini dışa aktarın')).toBeDefined();
    });
  });

  it('shows error state on failure', async () => {
    vi.mocked(sdkClient.diagnostics).mockRejectedValue(new Error('Network error'));
    render(<DiagnosticsPage />);
    await waitFor(() => {
      expect(screen.getByText('Tanılama bilgileri yüklenirken hata oluştu')).toBeDefined();
    });
  });
});
