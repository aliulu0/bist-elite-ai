import { act, render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HistoryPage from '../history';
import { useHistoryStore } from '@/stores/history-store';

vi.mock('@/lib/sdk', () => ({
  sdkClient: {
    historyStatus: vi.fn(),
    historySymbolStatus: vi.fn(),
    historyGaps: vi.fn(),
    historyQuality: vi.fn(),
    historyBackfillStatus: vi.fn(),
    historyBackfill: vi.fn(),
    historyBackfillBulk: vi.fn(),
  },
}));

const REPORT = {
  generatedAt: '2026-08-01T00:00:00.000Z',
  timeframe: '1d',
  totalSymbols: 2,
  symbolsWithHistory: 1,
  symbolsWithoutHistory: 1,
  averageCoverage: 50,
  completeSymbols: 1,
  incompleteSymbols: 0,
  staleSymbols: 0,
  invalidSymbols: 0,
  symbols: [
    {
      symbol: 'THYAO',
      timeframe: '1d',
      status: 'complete',
      barCount: 21,
      firstTimestamp: '2026-07-01T15:00:00.000Z',
      lastTimestamp: '2026-07-31T15:00:00.000Z',
      provider: 'yahoo',
      usableForBacktest: true,
    },
    {
      symbol: 'SISE',
      timeframe: '1d',
      status: 'empty',
      barCount: 0,
      firstTimestamp: null,
      lastTimestamp: null,
      provider: 'none',
      usableForBacktest: false,
    },
  ],
};

const SYMBOL_STATUS = {
  symbol: 'THYAO',
  timeframe: '1d',
  status: 'complete',
  hasData: true,
  barCount: 21,
  firstTimestamp: '2026-07-01T15:00:00.000Z',
  lastTimestamp: '2026-07-31T15:00:00.000Z',
  lastUpdated: '2026-07-31T15:00:00.000Z',
  coverage: { expectedBarCount: 21, actualBarCount: 21, coveragePercent: 100, gapCount: 0, largestGap: 0, missingRanges: [] },
  quality: {
    qualityScore: 95,
    validationStatus: 'valid',
    integrityValid: true,
    freshness: 'fresh',
    reason: 'Backtest için yeterli tarihsel veri bulunuyor.',
    usableForBacktest: true,
    lastAssessmentAt: '2026-07-31T15:00:00.000Z',
  },
  source: {
    provider: 'yahoo',
    primaryProvider: 'yahoo',
    fallbackUsed: false,
    providerAttempts: 1,
    cacheHit: true,
    lastUpdated: '2026-07-31T15:00:00.000Z',
  },
  backfill: {
    status: 'completed',
    lastRunAt: null,
    lastError: null,
    fetchedBars: 0,
    requestedRanges: 0,
    completedRanges: 0,
    failedRanges: 0,
    remainingRanges: 0,
    message: 'Backfill tamamlandı.',
  },
};

const GAPS = {
  symbol: 'THYAO',
  timeframe: '1d',
  missingRanges: [],
  gapCount: 0,
  largestGap: 0,
  duplicateTimestamps: 0,
  outOfOrderCount: 0,
  invalidOhlcCount: 0,
  zeroOrNegativePriceCount: 0,
  invalidVolumeCount: 0,
  abnormalGaps: [],
  providerDiscontinuities: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
  useHistoryStore.setState({
    activeTab: 'overview',
    timeframe: '1d',
    report: null,
    selectedSymbol: null,
    symbolStatus: null,
    gaps: null,
    quality: null,
    backfillInfo: null,
    backfillResult: null,
    bulkResult: null,
    loading: false,
    detailLoading: false,
    error: '',
    lastRefresh: null,
  });
});

describe('HistoryPage', () => {
  it('renders page title', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.historyStatus).mockResolvedValue(REPORT as never);
    render(<MemoryRouter><HistoryPage /></MemoryRouter>);
    expect(screen.getByText('Tarihsel Veri')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Toplam Sembol')).toBeInTheDocument();
    });
  });

  it('calls historyStatus on mount', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.historyStatus).mockResolvedValue(REPORT as never);
    render(<MemoryRouter><HistoryPage /></MemoryRouter>);
    await waitFor(() => {
      expect(sdk.sdkClient.historyStatus).toHaveBeenCalledWith('1d');
    });
  });

  it('renders summary cards when data loaded', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.historyStatus).mockResolvedValue(REPORT as never);
    render(<MemoryRouter><HistoryPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Toplam Sembol')).toBeInTheDocument();
    });
    expect(screen.getByText('Tamamlanan')).toBeInTheDocument();
  });

  it('shows error with retry and retry refetches', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.historyStatus).mockRejectedValueOnce(new Error('fail') as never);
    vi.mocked(sdk.sdkClient.historyStatus).mockResolvedValueOnce(REPORT as never);
    render(<MemoryRouter><HistoryPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Tarihsel veri durumu yüklenirken hata oluştu')).toBeInTheDocument();
    });
    await act(async () => {
      screen.getByText('Tekrar Dene').click();
    });
    await waitFor(() => {
      expect(sdk.sdkClient.historyStatus).toHaveBeenCalledTimes(2);
    });
  });

  it('selecting a symbol row loads symbol detail and switches tab', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.historyStatus).mockResolvedValue(REPORT as never);
    vi.mocked(sdk.sdkClient.historySymbolStatus).mockResolvedValue(SYMBOL_STATUS as never);
    vi.mocked(sdk.sdkClient.historyGaps).mockResolvedValue(GAPS as never);
    vi.mocked(sdk.sdkClient.historyQuality).mockResolvedValue(SYMBOL_STATUS.quality as never);
    vi.mocked(sdk.sdkClient.historyBackfillStatus).mockResolvedValue(SYMBOL_STATUS.backfill as never);
    render(<MemoryRouter><HistoryPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Toplam Sembol')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('history-row-THYAO'));
    await waitFor(() => {
      expect(sdk.sdkClient.historySymbolStatus).toHaveBeenCalledWith('THYAO', '1d');
      expect(useHistoryStore.getState().activeTab).toBe('symbol');
    });
    expect(screen.getByText('Beklenen / Mevcut Bar')).toBeInTheDocument();
  });

  it('backfill tab triggers symbol backfill', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.historyStatus).mockResolvedValue(REPORT as never);
    vi.mocked(sdk.sdkClient.historyBackfill).mockResolvedValue({
      symbol: 'THYAO',
      timeframe: '1d',
      status: 'completed',
      fetchedBars: 0,
      requestedRanges: 0,
      completedRanges: 0,
      failedRanges: 0,
      remainingRanges: 0,
      barCount: 21,
      message: 'Veri zaten eksiksiz (boşluk bulunamadı).',
      missingRanges: [],
      warnings: [],
    } as never);
    render(<MemoryRouter><HistoryPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Toplam Sembol')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('Backfill'));
    expect(screen.getByText('Tek Sembol Backfill')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Sembol'), { target: { value: 'THYAO' } });
    fireEvent.click(screen.getByText('Backfill Başlat'));
    await waitFor(() => {
      expect(sdk.sdkClient.historyBackfill).toHaveBeenCalledWith('THYAO', { timeframe: '1d' });
    });
  });

  it('refresh button refetches report', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.historyStatus).mockResolvedValue(REPORT as never);
    render(<MemoryRouter><HistoryPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Toplam Sembol')).toBeInTheDocument();
    });
    await act(async () => {
      screen.getByLabelText('Yenile').click();
    });
    await waitFor(() => {
      expect(sdk.sdkClient.historyStatus).toHaveBeenCalledTimes(2);
      expect(useHistoryStore.getState().loading).toBe(false);
    });
  });
});
