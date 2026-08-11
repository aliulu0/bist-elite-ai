import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ProvidersPage from '@/pages/providers';
import { useProvidersStore } from '@/stores/providers-store';

vi.mock('@/lib/sdk', () => ({
  sdkClient: {
    providerHealth: vi.fn(),
  },
}));

import { sdkClient } from '@/lib/sdk';

describe('ProvidersPage', () => {
  beforeEach(() => {
    useProvidersStore.setState({
      activeTab: 'overview',
      snapshot: null,
      loading: false,
      error: '',
      lastRefresh: null,
      search: '',
      sortKey: 'name',
      sortDir: 'asc',
      selectedProvider: null,
      page: 0,
      pageSize: 10,
    });
    vi.mocked(sdkClient.providerHealth).mockResolvedValue({
      providers: [
        { name: 'Yahoo Finance', status: 'HEALTHY', latencyMs: 120, successRate: 98.5, errorRate: 1.5, reliabilityScore: 97.2, consecutiveFailures: 0, totalRequests: 1240, failedRequests: 18, timeoutCount: 2, lastSuccessAt: '2026-01-15T10:00:00Z', lastFailureAt: null, lastRecoveryAt: null, recoveryTimeMs: null },
        { name: 'Fintables', status: 'DEGRADED', latencyMs: 850, successRate: 82.3, errorRate: 17.7, reliabilityScore: 80.1, consecutiveFailures: 5, totalRequests: 430, failedRequests: 76, timeoutCount: 12, lastSuccessAt: null, lastFailureAt: null, lastRecoveryAt: null, recoveryTimeMs: null },
      ],
      latencyHistory: {},
      alerts: [],
      failoverOrder: ['Yahoo Finance', 'Fintables'],
      lastUpdate: '2026-01-15T10:00:00Z',
    } as never);
  });

  it('renders page title', async () => {
    render(<ProvidersPage />);
    await waitFor(() => {
      expect(screen.getByText('Sağlayıcı Sağlığı')).toBeDefined();
    });
  });

  it('renders summary cards', async () => {
    render(<ProvidersPage />);
    await waitFor(() => {
      expect(screen.getByText('Toplam Sağlayıcı')).toBeDefined();
    });
  });

  it('renders tabs', async () => {
    render(<ProvidersPage />);
    await waitFor(() => {
      expect(screen.getByText('Genel')).toBeDefined();
      expect(screen.getByText('Yahoo')).toBeDefined();
    });
  });

  it('renders overview panel', async () => {
    render(<ProvidersPage />);
    await waitFor(() => {
      expect(screen.getByText('Genel Durum')).toBeDefined();
    });
  });

  it('renders export panel', async () => {
    render(<ProvidersPage />);
    await waitFor(() => {
      expect(screen.getByText('Sağlayıcı verilerini dışa aktarın')).toBeDefined();
    });
  });

  it('shows error state on failure', async () => {
    vi.mocked(sdkClient.providerHealth).mockRejectedValue(new Error('Network error'));
    render(<ProvidersPage />);
    await waitFor(() => {
      expect(screen.getByText('Sağlayıcı bilgileri yüklenirken hata oluştu')).toBeDefined();
    });
  });
});
