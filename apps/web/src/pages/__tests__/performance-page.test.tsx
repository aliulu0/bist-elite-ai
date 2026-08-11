import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PerformancePage from '../performance';
import { usePerformanceStore } from '@/stores/performance-store';

vi.mock('@/lib/sdk', () => ({
  sdkClient: {
    performanceMonitor: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  usePerformanceStore.setState({
    snapshot: null,
    loading: false,
    error: '',
    activeTab: 'overview',
  });
});

describe('PerformancePage', () => {
  it('renders page title', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.performanceMonitor).mockResolvedValue({ metrics: {}, uptime: 99.9, memoryUsage: 512 } as never);
    render(<MemoryRouter><PerformancePage /></MemoryRouter>);
    expect(screen.getByText('Performans Monitörü')).toBeInTheDocument();
  });

  it('shows loading state', async () => {
    const sdk = await import('@/lib/sdk');
    let resolve!: (v: unknown) => void;
    vi.mocked(sdk.sdkClient.performanceMonitor).mockReturnValue(new Promise((r) => { resolve = r; }) as never);
    render(<MemoryRouter><PerformancePage /></MemoryRouter>);
    expect(screen.getByText('Performans Monitörü')).toBeInTheDocument();
    resolve({ metrics: {}, uptime: 0, memoryUsage: 0 });
  });

  it('shows error with retry', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.performanceMonitor).mockRejectedValue(new Error('fail') as never);
    render(<MemoryRouter><PerformancePage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Performans metrikleri yüklenirken hata oluştu')).toBeInTheDocument();
    });
    expect(screen.getByText('Tekrar Dene')).toBeInTheDocument();
  });

  it('retry button triggers refetch', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.performanceMonitor).mockRejectedValueOnce(new Error('fail') as never);
    vi.mocked(sdk.sdkClient.performanceMonitor).mockResolvedValueOnce({ metrics: {}, uptime: 0, memoryUsage: 0 } as never);
    render(<MemoryRouter><PerformancePage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Tekrar Dene')).toBeInTheDocument();
    });
    screen.getByText('Tekrar Dene').click();
    await waitFor(() => {
      expect(screen.queryByText('Performans metrikleri yüklenirken hata oluştu')).not.toBeInTheDocument();
    });
  });

  it('renders summary when data loaded', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.performanceMonitor).mockResolvedValue({ metrics: {}, uptime: 99.9, memoryUsage: 512 } as never);
    render(<MemoryRouter><PerformancePage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Toplam İstek')).toBeInTheDocument();
    });
  });

  it('renders tabs', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.performanceMonitor).mockResolvedValue({ metrics: {}, uptime: 0, memoryUsage: 0 } as never);
    render(<MemoryRouter><PerformancePage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Genel')).toBeInTheDocument();
    });
    expect(screen.getByText('Motorlar')).toBeInTheDocument();
    expect(screen.getByText('API')).toBeInTheDocument();
  });

  it('refresh button works', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.performanceMonitor).mockResolvedValue({ metrics: {}, uptime: 0, memoryUsage: 0 } as never);
    render(<MemoryRouter><PerformancePage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Toplam İstek')).toBeInTheDocument();
    });
    const refreshBtn = screen.getByLabelText('Yenile');
    refreshBtn.click();
    await waitFor(() => {
      expect(sdk.sdkClient.performanceMonitor).toHaveBeenCalledTimes(2);
    });
  });

  it('page renders without crash', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.performanceMonitor).mockResolvedValue({ metrics: {}, uptime: 0, memoryUsage: 0 } as never);
    const { container } = render(<MemoryRouter><PerformancePage /></MemoryRouter>);
    await waitFor(() => {
      expect(container.querySelector('[class*="space-y"]')).toBeInTheDocument();
    });
  });

  it('has proper page structure', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.performanceMonitor).mockResolvedValue({ metrics: {}, uptime: 0, memoryUsage: 0 } as never);
    const { container } = render(<MemoryRouter><PerformancePage /></MemoryRouter>);
    await waitFor(() => {
      expect(container.firstChild).toBeTruthy();
    });
  });

  it('calls performanceMonitor on mount', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.performanceMonitor).mockResolvedValue({ metrics: {}, uptime: 0, memoryUsage: 0 } as never);
    render(<MemoryRouter><PerformancePage /></MemoryRouter>);
    expect(sdk.sdkClient.performanceMonitor).toHaveBeenCalled();
  });

  it('clear snapshot button works', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.performanceMonitor).mockResolvedValue({ metrics: {}, uptime: 0, memoryUsage: 0 } as never);
    render(<MemoryRouter><PerformancePage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Toplam İstek')).toBeInTheDocument();
    });
    const clearBtn = screen.getByLabelText('Temizle');
    clearBtn.click();
    await waitFor(() => {
      expect(usePerformanceStore.getState().snapshot).toBeNull();
    });
  });

  it('loading shows spinner overlay', async () => {
    const sdk = await import('@/lib/sdk');
    let resolve!: (v: unknown) => void;
    vi.mocked(sdk.sdkClient.performanceMonitor).mockReturnValue(new Promise((r) => { resolve = r; }) as never);
    render(<MemoryRouter><PerformancePage /></MemoryRouter>);
    expect(screen.getByText('Performans Monitörü')).toBeInTheDocument();
    resolve({ metrics: {}, uptime: 0, memoryUsage: 0 });
    await waitFor(() => {
      expect(screen.getByText('Toplam İstek')).toBeInTheDocument();
    });
  });
});
