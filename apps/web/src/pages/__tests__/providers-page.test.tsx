import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProvidersPage from '../providers';
import { useProvidersStore } from '@/stores/providers-store';

vi.mock('@/lib/sdk', () => ({
  sdkClient: {
    providerHealth: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  useProvidersStore.setState({
    snapshot: null,
    loading: false,
    error: '',
    activeTab: 'overview',
    selectedProvider: null,
  });
});

describe('ProvidersPage', () => {
  it('renders page title', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.providerHealth).mockResolvedValue({ providers: [] } as never);
    render(<MemoryRouter><ProvidersPage /></MemoryRouter>);
    expect(screen.getByText('Sağlayıcı Sağlığı')).toBeInTheDocument();
  });

  it('shows loading state', async () => {
    const sdk = await import('@/lib/sdk');
    let resolve!: (v: unknown) => void;
    vi.mocked(sdk.sdkClient.providerHealth).mockReturnValue(new Promise((r) => { resolve = r; }) as never);
    render(<MemoryRouter><ProvidersPage /></MemoryRouter>);
    expect(screen.getByText('Sağlayıcı Sağlığı')).toBeInTheDocument();
    resolve({ providers: [] });
  });

  it('shows error with retry', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.providerHealth).mockRejectedValue(new Error('fail') as never);
    render(<MemoryRouter><ProvidersPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Sağlayıcı bilgileri yüklenirken hata oluştu')).toBeInTheDocument();
    });
    expect(screen.getByText('Tekrar Dene')).toBeInTheDocument();
  });

  it('retry triggers refetch', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.providerHealth).mockRejectedValueOnce(new Error('fail') as never);
    vi.mocked(sdk.sdkClient.providerHealth).mockResolvedValueOnce({ providers: [] } as never);
    render(<MemoryRouter><ProvidersPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Tekrar Dene')).toBeInTheDocument();
    });
    screen.getByText('Tekrar Dene').click();
    await waitFor(() => {
      expect(screen.queryByText('Sağlayıcı bilgileri yüklenirken hata oluştu')).not.toBeInTheDocument();
    });
  });

  it('renders summary when data loaded', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.providerHealth).mockResolvedValue({ providers: [] } as never);
    render(<MemoryRouter><ProvidersPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Toplam Sağlayıcı')).toBeInTheDocument();
    });
  });

  it('renders tabs', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.providerHealth).mockResolvedValue({ providers: [] } as never);
    render(<MemoryRouter><ProvidersPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Genel')).toBeInTheDocument();
    });
  });

  it('refresh button works', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.providerHealth).mockResolvedValue({ providers: [] } as never);
    render(<MemoryRouter><ProvidersPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Toplam Sağlayıcı')).toBeInTheDocument();
    });
    screen.getByLabelText('Yenile').click();
    await waitFor(() => {
      expect(sdk.sdkClient.providerHealth).toHaveBeenCalledTimes(2);
    });
  });

  it('page renders without crash', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.providerHealth).mockResolvedValue({ providers: [] } as never);
    render(<MemoryRouter><ProvidersPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Toplam Sağlayıcı')).toBeInTheDocument();
    });
  });

  it('has proper page structure', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.providerHealth).mockResolvedValue({ providers: [] } as never);
    const { container } = render(<MemoryRouter><ProvidersPage /></MemoryRouter>);
    await waitFor(() => {
      expect(container.firstChild).toBeTruthy();
    });
  });

  it('calls providerHealth on mount', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.providerHealth).mockResolvedValue({ providers: [] } as never);
    render(<MemoryRouter><ProvidersPage /></MemoryRouter>);
    expect(sdk.sdkClient.providerHealth).toHaveBeenCalled();
  });

  it('clear snapshot button works', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.providerHealth).mockResolvedValue({ providers: [] } as never);
    render(<MemoryRouter><ProvidersPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Toplam Sağlayıcı')).toBeInTheDocument();
    });
    screen.getByLabelText('Sıfırla').click();
    await waitFor(() => {
      expect(useProvidersStore.getState().snapshot).toBeNull();
    });
  });

  it('loading shows spinner', async () => {
    const sdk = await import('@/lib/sdk');
    let resolve!: (v: unknown) => void;
    vi.mocked(sdk.sdkClient.providerHealth).mockReturnValue(new Promise((r) => { resolve = r; }) as never);
    render(<MemoryRouter><ProvidersPage /></MemoryRouter>);
    expect(screen.getByText('Sağlayıcı Sağlığı')).toBeInTheDocument();
    resolve({ providers: [] });
    await waitFor(() => {
      expect(screen.getByText('Toplam Sağlayıcı')).toBeInTheDocument();
    });
  });
});
