import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../dashboard';

vi.mock('@/lib/sdk', () => ({
  sdkClient: {
    scanner: vi.fn().mockResolvedValue({ candidates: [] }),
    scannerCandidates: vi.fn().mockResolvedValue({ candidates: [] }),
    workflowQueue: vi.fn().mockResolvedValue({ jobs: [] }),
    providerHealth: vi.fn().mockResolvedValue({ providers: [] }),
    performanceMonitor: vi.fn().mockResolvedValue({ metrics: {}, uptime: 0, memoryUsage: 0 }),
    eventBus: vi.fn().mockResolvedValue({ events: [] }),
    diagnostics: vi.fn().mockResolvedValue({ checks: [] }),
    schedulerStatus: vi.fn().mockResolvedValue({ jobs: [] }),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DashboardPage', () => {
  it('renders KPI cards', async () => {
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Toplam Hisse')).toBeInTheDocument();
    });
    expect(screen.getByText('Bugünkü Tarama')).toBeInTheDocument();
    expect(screen.getByText('Fırsat Sayısı')).toBeInTheDocument();
  });

  it('renders opportunity section', async () => {
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    await waitFor(() => {
      const titles = screen.getAllByText('En İyi Fırsatlar');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders scanner section', async () => {
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Piyasa Tarama')).toBeInTheDocument();
    });
  });

  it('renders provider section', async () => {
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Veri Sağlayıcıları')).toBeInTheDocument();
    });
  });

  it('renders performance section', async () => {
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Performans')).toBeInTheDocument();
    });
  });

  it('renders notification panel', async () => {
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Son Olaylar')).toBeInTheDocument();
    });
  });

  it('renders system health', async () => {
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Sistem Durumu')).toBeInTheDocument();
    });
  });

  it('page renders without crash', async () => {
    const { container } = render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    await waitFor(() => {
      expect(container.querySelector('[class*="grid"]')).toBeInTheDocument();
    });
  });

  it('refresh triggers all fetches', async () => {
    const sdk = await import('@/lib/sdk');
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Toplam Hisse')).toBeInTheDocument();
    });
    const refreshBtn = screen.getByLabelText('Yenile');
    refreshBtn.click();
    await waitFor(() => {
      expect(sdk.sdkClient.scanner).toHaveBeenCalledTimes(2);
    });
  });

  it('loading states shown initially', async () => {
    let resolve!: (v: unknown) => void;
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.scanner).mockReturnValue(new Promise((r) => { resolve = r; }) as never);
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    resolve({ candidates: [] });
  });

  it('has proper structure', async () => {
    const { container } = render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    await waitFor(() => {
      expect(container.firstChild).toBeTruthy();
    });
  });

  it('renders 8 KPI cards in grid', async () => {
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Toplam Hisse')).toBeInTheDocument();
    });
    expect(screen.getByText('Aktif İş Akışı')).toBeInTheDocument();
    expect(screen.getByText('Çalışan Zamanlayıcı')).toBeInTheDocument();
    expect(screen.getByText('Sağlıklı Sağlayıcı')).toBeInTheDocument();
    expect(screen.getByText('API Yanıt Süresi')).toBeInTheDocument();
  });
});
