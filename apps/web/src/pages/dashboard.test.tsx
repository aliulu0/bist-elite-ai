import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from './dashboard';

vi.mock('@/lib/sdk', () => ({
  sdkClient: {
    scanner: vi.fn().mockResolvedValue({
      success: true,
      topCandidates: [{ symbol: 'GARAN', status: 'TOP_CANDIDATE', eliteScore: 92, compositeScore: 92, rank: 1, reasons: ['Test'] }],
      watchlist: [],
      rejected: [],
      statistics: { totalSymbols: 3, topCandidateCount: 1, watchlistCount: 0, rejectedCount: 0 },
      timestamp: '',
    }),
    scannerCandidates: vi.fn().mockResolvedValue({
      success: true,
      data: { items: [{ symbol: 'GARAN', status: 'TOP_CANDIDATE', eliteScore: 88, compositeScore: 92, rank: 1, reasons: ['Test'] }], total: 1, offset: 0, limit: 10 },
      timestamp: '',
    }),
    workflowQueue: vi.fn().mockResolvedValue({
      success: true,
      data: { jobs: [{ id: '1', workflowId: 'wf-1', state: 'RUNNING', priority: 'HIGH', createdAt: '2025-01-01T10:00:00Z' }], total: 1, limit: 50, offset: 0 },
      timestamp: '',
    }),
    providerHealth: vi.fn().mockResolvedValue({
      success: true,
      data: {
        providers: [{ provider: 'Yahoo Finance', status: 'healthy', avgLatencyMs: 120, reliabilityScore: 98, lastRequestTime: 1760000000000, totalRequests: 10 }],
        overallStatus: 'healthy',
        totalProviders: 1,
        healthyCount: 1,
        degradedCount: 0,
        unhealthyCount: 0,
      },
      timestamp: '',
    }),
    performanceMonitor: vi.fn().mockResolvedValue({
      success: true,
      data: { metrics: [{ name: 'api_response_test', category: 'api_response', count: 10, avg: 45, rollingAvg: 45 }], system: { uptimeMs: 99900, memoryUsageBytes: 68157440, cpuUsagePercent: 10 }, cache: { hits: 1, misses: 1, hitRate: 50, totalOperations: 2 }, health: { status: 'healthy' }, totalRecorded: 10 },
      timestamp: '',
    }),
    eventBus: vi.fn().mockResolvedValue({
      success: true,
      data: { events: [{ id: '1', type: 'WORKFLOW_COMPLETED', timestamp: 1760000000000, correlationId: null, source: 'workflow', severity: 'info', category: 'workflow', payload: {}, metadata: {} }], total: 1, limit: 50, offset: 0 },
      timestamp: '',
    }),
    diagnostics: vi.fn().mockResolvedValue({ status: 'healthy', version: '1', uptime: 1000, timestamp: '', components: [{ name: 'PostgreSQL', status: 'healthy', message: 'OK', duration: 10 }] }),
    schedulerStatus: vi.fn().mockResolvedValue({ success: true, running: true, jobs: [{ jobName: 'scanner', status: 'running', enabled: true, intervalMs: 60000, lastExecution: null, totalExecutions: 1, consecutiveFailures: 0 }], uptime: 1000, totalExecutions: 1, timestamp: '' }),
  },
}));

const renderPage = () => render(
  <BrowserRouter>
    <DashboardPage />
  </BrowserRouter>,
);

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard header', () => {
    renderPage();
    expect(screen.getByText(/Günaydın|İyi günler|İyi akşamlar|İyi geceler/i)).toBeInTheDocument();
  });

  it('renders KPI cards', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Toplam Hisse')).toBeInTheDocument();
    });
    expect(screen.getByText('Bugünkü Tarama')).toBeInTheDocument();
    expect(screen.getByText('Sağlıklı Sağlayıcı')).toBeInTheDocument();
  });

  it('renders scanner results', async () => {
    renderPage();
    await waitFor(() => {
      const garanElements = screen.getAllByText('GARAN');
      expect(garanElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders opportunities', async () => {
    renderPage();
    await waitFor(() => {
      const titles = screen.getAllByText('En İyi Fırsatlar');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders workflow card', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('İş Akışları')).toBeInTheDocument();
    });
  });

  it('renders provider card', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Veri Sağlayıcıları')).toBeInTheDocument();
    });
  });

  it('renders performance card', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Performans')).toBeInTheDocument();
    });
  });

  it('renders notification panel', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Son Olaylar')).toBeInTheDocument();
    });
  });

  it('renders system health card', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Sistem Durumu')).toBeInTheDocument();
    });
  });

  it('calls all SDK endpoints on mount', async () => {
    const sdk = await import('@/lib/sdk');
    renderPage();
    await waitFor(() => {
      expect(sdk.sdkClient.scanner).toHaveBeenCalled();
      expect(sdk.sdkClient.scannerCandidates).toHaveBeenCalled();
      expect(sdk.sdkClient.workflowQueue).toHaveBeenCalled();
      expect(sdk.sdkClient.providerHealth).toHaveBeenCalled();
      expect(sdk.sdkClient.performanceMonitor).toHaveBeenCalled();
      expect(sdk.sdkClient.eventBus).toHaveBeenCalled();
      expect(sdk.sdkClient.diagnostics).toHaveBeenCalled();
      expect(sdk.sdkClient.schedulerStatus).toHaveBeenCalled();
    });
  });
});
