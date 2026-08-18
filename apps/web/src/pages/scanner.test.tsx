import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ScannerPage from './scanner';

vi.mock('@/lib/sdk', () => ({
  sdkClient: {
    scanner: vi.fn().mockResolvedValue({
      baslik: 'Tarama Genel Bakış',
      toplamHisse: 795,
      aktifHisse: 643,
      sektorSayisi: 10,
      stratejiSayisi: 9,
      stratejiler: [],
      sonTarama: null,
    }),
    scannerCandidates: vi.fn().mockResolvedValue({
      baslik: 'En Yüksek AI Puanlı Hisse Senetleri',
      toplamHisse: 3,
      ortalamaYapayZekaPuani: 68,
      ortalamaYapayZekaGuveni: 55,
      sonuclar: [
        {
          ticker: 'GARAN',
          company: 'Garanti BBVA',
          sector: 'Finans',
          aiScore: 85,
          aiConfidence: 70,
          strategyId: 'value-hunter',
          strategyName: 'Değer Avcısı',
          scannedAt: '',
        },
        {
          ticker: 'AKBNK',
          company: 'Akbank',
          sector: 'Finans',
          aiScore: 60,
          aiConfidence: 55,
          strategyId: 'value-hunter',
          strategyName: 'Değer Avcısı',
          scannedAt: '',
        },
        {
          ticker: 'EREGL',
          company: 'Ereğli Demir Çelik',
          sector: 'Metal',
          aiScore: 40,
          aiConfidence: 40,
          strategyId: 'momentum',
          strategyName: 'Momentum',
          scannedAt: '',
        },
      ],
    }),
  },
}));

const renderPage = () =>
  render(
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
    expect(
      screen.getByText('BIST hisselerini tarayın ve fırsatları tespit edin'),
    ).toBeInTheDocument();
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
      expect(sdk.sdkClient.scannerCandidates).toHaveBeenCalled();
    });
  });

  it('shows error state on failure', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.scannerCandidates).mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Tarama sonuçları yüklenirken hata oluştu')).toBeInTheDocument();
    });
  });

  it('shows retry link on error', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.scannerCandidates).mockRejectedValueOnce(new Error('fail'));
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
