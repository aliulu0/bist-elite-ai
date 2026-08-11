import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AuditPage from '@/pages/audit';
import { useAuditStore } from '@/stores/audit-store';

vi.mock('@/lib/sdk', () => ({
  sdkClient: {
    auditLog: vi.fn(),
  },
}));

import { sdkClient } from '@/lib/sdk';

describe('AuditPage', () => {
  beforeEach(() => {
    useAuditStore.setState({
      activeTab: 'all',
      snapshot: null,
      loading: false,
      error: '',
      lastRefresh: null,
      search: '',
      sortKey: 'timestamp',
      sortDir: 'desc',
      selectedLogId: null,
      page: 0,
      pageSize: 25,
      filterSeverity: '',
      filterModule: '',
      filterAction: '',
    });
    vi.mocked(sdkClient.auditLog).mockResolvedValue({
      logs: [
        { id: '1', timestamp: '2026-01-15T10:00:00Z', module: 'Workflow', action: 'STARTED', severity: 'INFO', details: 'Workflow started' },
        { id: '2', timestamp: '2026-01-15T11:00:00Z', module: 'Scheduler', action: 'FAILED', severity: 'ERROR', details: 'Scheduler failed' },
        { id: '3', timestamp: '2026-01-15T12:00:00Z', module: 'Config', action: 'UPDATED', severity: 'WARNING', details: 'Config updated' },
      ],
    } as never);
  });

  it('renders page title', async () => {
    render(<AuditPage />);
    await waitFor(() => {
      expect(screen.getByText('Denetim Kayıtları')).toBeDefined();
    });
  });

  it('renders refresh button', async () => {
    render(<AuditPage />);
    await waitFor(() => {
      expect(screen.getByText('Yenile')).toBeDefined();
    });
  });

  it('renders export button', async () => {
    render(<AuditPage />);
    await waitFor(() => {
      expect(screen.getByText('Dışa Aktar')).toBeDefined();
    });
  });

  it('renders clear filters button', async () => {
    render(<AuditPage />);
    await waitFor(() => {
      expect(screen.getByText('Filtreleri Temizle')).toBeDefined();
    });
  });

  it('renders summary cards', async () => {
    render(<AuditPage />);
    await waitFor(() => {
      expect(screen.getByText('Toplam Kayıt')).toBeDefined();
    });
  });

  it('renders tabs', async () => {
    render(<AuditPage />);
    await waitFor(() => {
      expect(screen.getByText('Tümü')).toBeDefined();
      expect(screen.getByText('İş Akışı')).toBeDefined();
    });
  });

  it('renders search input', async () => {
    render(<AuditPage />);
    await waitFor(() => {
      expect(screen.getByLabelText('Arama')).toBeDefined();
    });
  });

  it('renders table', async () => {
    render(<AuditPage />);
    await waitFor(() => {
      expect(screen.getByText('Zaman')).toBeDefined();
      expect(screen.getByText('Modül')).toBeDefined();
    });
  });

  it('renders severity chart', async () => {
    render(<AuditPage />);
    await waitFor(() => {
      expect(screen.getByText('Önem Dağılımı')).toBeDefined();
    });
  });

  it('shows error on failure', async () => {
    vi.mocked(sdkClient.auditLog).mockRejectedValue(new Error('Network error'));
    render(<AuditPage />);
    await waitFor(() => {
      expect(screen.getByText('Denetim günlükleri yüklenirken hata oluştu')).toBeDefined();
    });
  });
});
