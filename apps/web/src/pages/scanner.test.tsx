import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ScannerPage from './scanner';

vi.mock('@/lib/sdk', () => ({
  sdkClient: {
    scanner: vi.fn().mockResolvedValue({
      success: true,
      topCandidates: [
        { symbol: 'GARAN', status: 'TOP_CANDIDATE', eliteScore: 85, compositeScore: 85, rank: 1, reasons: [] },
        { symbol: 'AKBNK', status: 'WATCHLIST', eliteScore: 60, compositeScore: 60, rank: 10, reasons: [] },
        { symbol: 'EREGL', status: 'REJECTED', eliteScore: 40, compositeScore: 40, rank: 30, reasons: [] },
      ],
      watchlist: [],
      rejected: [],
      statistics: { totalSymbols: 3, topCandidateCount: 1, watchlistCount: 1, rejectedCount: 1 },
      timestamp: '',
    }),
    scannerCandidates: vi.fn().mockResolvedValue({
      success: true,
      data: { items: [{ symbol: 'GARAN', status: 'TOP_CANDIDATE', eliteScore: 78, compositeScore: 85, rank: 1, reasons: ['Test reason'] }], total: 1, offset: 0, limit: 10 },
      timestamp: '',
    }),
  },
}));

const renderPage = () => render(
  <BrowserRouter>
    <ScannerPage />
  </BrowserRouter>,
);

describe('ScannerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title', () => {
    renderPage();
    expect(screen.getByText('Piyasa Tarayıcı')).toBeInTheDocument();
  });

  it('renders description', () => {
    renderPage();
    expect(screen.getByText('BIST hisselerini tarayın ve fırsatları tespit edin')).toBeInTheDocument();
  });

  it('renders KPI cards after load', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Toplam Taranan')).toBeInTheDocument();
    });
  });

  it('renders scanner results', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('GARAN')).toBeInTheDocument();
    });
    expect(screen.getByText('AKBNK')).toBeInTheDocument();
    expect(screen.getByText('EREGL')).toBeInTheDocument();
  });

  it('renders filter controls after load', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Filtreler').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders CSV button', () => {
    renderPage();
    expect(screen.getByText('CSV')).toBeInTheDocument();
  });

  it('renders refresh button', () => {
    renderPage();
    expect(screen.getByText('Tazele')).toBeInTheDocument();
  });

  it('calls SDK on mount', async () => {
    const sdk = await import('@/lib/sdk');
    renderPage();
    await waitFor(() => {
      expect(sdk.sdkClient.scanner).toHaveBeenCalled();
      expect(sdk.sdkClient.scannerCandidates).toHaveBeenCalled();
    });
  });

  it('shows error state on failure', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.scanner).mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Tarama sonuçları yüklenirken hata oluştu')).toBeInTheDocument();
    });
  });

  it('shows retry link on error', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.scanner).mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Tekrar Dene')).toBeInTheDocument();
    });
  });

  it('shows Filtreler toggle button', () => {
    renderPage();
    expect(screen.getByLabelText('Filtre panelini aç/kapat')).toBeInTheDocument();
  });

  it('merges scan and candidate data', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('3 hisse')).toBeInTheDocument();
    });
  });
});
