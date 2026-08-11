import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ScannerPage from '../scanner';

vi.mock('@/lib/sdk', () => ({
  sdkClient: {
    scanner: vi.fn(),
    scannerCandidates: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ScannerPage', () => {
  it('renders page header', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.scanner).mockResolvedValue({ candidates: [] } as never);
    vi.mocked(sdk.sdkClient.scannerCandidates).mockResolvedValue({ candidates: [] } as never);
    render(<MemoryRouter><ScannerPage /></MemoryRouter>);
    expect(screen.getByText('Piyasa Tarayıcı')).toBeInTheDocument();
  });

  it('renders KPI section', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.scanner).mockResolvedValue({ candidates: [] } as never);
    vi.mocked(sdk.sdkClient.scannerCandidates).mockResolvedValue({ candidates: [] } as never);
    render(<MemoryRouter><ScannerPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Toplam Taranan')).toBeInTheDocument();
    });
  });

  it('renders empty state', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.scanner).mockResolvedValue({ candidates: [] } as never);
    vi.mocked(sdk.sdkClient.scannerCandidates).mockResolvedValue({ candidates: [] } as never);
    render(<MemoryRouter><ScannerPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Filtrelere uygun hisse bulunamadı')).toBeInTheDocument();
    });
  });

  it('CSV export button exists', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.scanner).mockResolvedValue({ candidates: [] } as never);
    vi.mocked(sdk.sdkClient.scannerCandidates).mockResolvedValue({ candidates: [] } as never);
    render(<MemoryRouter><ScannerPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByLabelText('CSV dışa aktar')).toBeInTheDocument();
    });
  });

  it('filter toggle button exists', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.scanner).mockResolvedValue({ candidates: [] } as never);
    vi.mocked(sdk.sdkClient.scannerCandidates).mockResolvedValue({ candidates: [] } as never);
    render(<MemoryRouter><ScannerPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByLabelText('Filtre panelini aç/kapat')).toBeInTheDocument();
    });
  });

  it('refresh button exists', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.scanner).mockResolvedValue({ candidates: [] } as never);
    vi.mocked(sdk.sdkClient.scannerCandidates).mockResolvedValue({ candidates: [] } as never);
    render(<MemoryRouter><ScannerPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByLabelText('Tazele')).toBeInTheDocument();
    });
  });

  it('loading state shown', async () => {
    const sdk = await import('@/lib/sdk');
    let resolve!: (v: unknown) => void;
    vi.mocked(sdk.sdkClient.scanner).mockReturnValue(new Promise((r) => { resolve = r; }) as never);
    vi.mocked(sdk.sdkClient.scannerCandidates).mockResolvedValue({ candidates: [] } as never);
    render(<MemoryRouter><ScannerPage /></MemoryRouter>);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    resolve({ candidates: [] });
  });

  it('shows error with retry', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.scanner).mockRejectedValue(new Error('fail') as never);
    vi.mocked(sdk.sdkClient.scannerCandidates).mockResolvedValue({ candidates: [] } as never);
    render(<MemoryRouter><ScannerPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Tarama sonuçları yüklenirken hata oluştu')).toBeInTheDocument();
    });
    expect(screen.getByText('Tekrar Dene')).toBeInTheDocument();
  });

  it('page has proper structure', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.scanner).mockResolvedValue({ candidates: [] } as never);
    vi.mocked(sdk.sdkClient.scannerCandidates).mockResolvedValue({ candidates: [] } as never);
    const { container } = render(<MemoryRouter><ScannerPage /></MemoryRouter>);
    await waitFor(() => {
      expect(container.firstChild).toBeTruthy();
    });
  });

  it('shows description text', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.scanner).mockResolvedValue({ candidates: [] } as never);
    vi.mocked(sdk.sdkClient.scannerCandidates).mockResolvedValue({ candidates: [] } as never);
    render(<MemoryRouter><ScannerPage /></MemoryRouter>);
    expect(screen.getByText("BIST hisselerini tarayın ve fırsatları tespit edin")).toBeInTheDocument();
  });
});
