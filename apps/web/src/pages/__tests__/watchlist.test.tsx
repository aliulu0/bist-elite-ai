import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WatchlistPage from '@/pages/watchlist';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div className="recharts-responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => null,
  Cell: () => null,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => null,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => null,
}));

const mockWatchlist = vi.fn();
const mockScanner = vi.fn();
const mockAlerts = vi.fn();

vi.mock('@/lib/sdk', () => ({
  sdkClient: {
    watchlist: () => mockWatchlist(),
    scanner: () => mockScanner(),
    alerts: () => mockAlerts(),
  },
}));

function setupSdk() {
  mockWatchlist.mockResolvedValue({
    success: true,
    data: {
      lists: [
        { name: 'FAVORITES', entries: [{ symbol: 'GARAN' }, { symbol: 'THYAO' }, { symbol: 'AKBNK' }] },
      ],
    },
    timestamp: '',
  });
  mockScanner.mockResolvedValue({
    success: true,
    topCandidates: [],
    watchlist: [
      { symbol: 'GARAN', status: 'WATCHLIST', eliteScore: 82, eliteRating: 'AA', opportunityLevel: 'HIGH', candidateScore: 85, compositeScore: 84, rank: 1, reasons: [] },
      { symbol: 'THYAO', status: 'WATCHLIST', eliteScore: 88, eliteRating: 'AAA', opportunityLevel: 'VERY_HIGH', candidateScore: 92, compositeScore: 90, rank: 2, reasons: [] },
    ],
    rejected: [],
    statistics: { totalSymbols: 2, topCandidateCount: 0, watchlistCount: 2, rejectedCount: 0, avgEliteScore: 85, avgOpportunityScore: 88, avgCandidateScore: 88, scoreDistribution: {} },
    metadata: {},
    timestamp: '',
  });
  mockAlerts.mockResolvedValue({
    success: true,
    data: {
      alerts: [
        { id: 'a1', type: 'OPPORTUNITY', priority: 'HIGH', title: 'Erken fırsat', message: 'GARAN elite skoru yükseldi', symbol: 'GARAN', channels: ['APPLICATION'], status: 'ACTIVE', createdAt: '2026-08-01T09:15:00Z', deliveredChannels: ['APPLICATION'], failedChannels: [], durationMs: 12, timestamp: '2026-08-01T09:15:00Z' },
      ],
      total: 1,
      limit: 50,
      offset: 0,
    },
    timestamp: '',
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <WatchlistPage />
    </MemoryRouter>,
  );
}

describe('WatchlistPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSdk();
  });

  it('renders page title', async () => {
    renderPage();
    expect(await screen.findByText('Canlı İzleme')).toBeDefined();
  });

  it('renders all tab buttons', async () => {
    renderPage();
    await screen.findByText('Canlı İzleme');
    expect(screen.getByText('İzleme Listesi')).toBeDefined();
    expect(screen.getByText('Alarmlar')).toBeDefined();
    expect(screen.getByText('Notlar')).toBeDefined();
    expect(screen.getByText('Performans')).toBeDefined();
  });

  it('shows watchlist table tab by default', async () => {
    renderPage();
    expect(await screen.findByText('İzleme Listesi')).toBeDefined();
  });

  it('renders KPI summary cards', async () => {
    renderPage();
    expect(await screen.findByText('Toplam İzlenen Hisse')).toBeDefined();
    expect(screen.getByText('Erken Fırsat')).toBeDefined();
    expect(screen.getByText('Ort. Elite Skoru')).toBeDefined();
  });

  it('fetches stock symbols from the API', async () => {
    renderPage();
    expect((await screen.findAllByText('GARAN')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('THYAO').length).toBeGreaterThan(0);
    expect(screen.getAllByText('AKBNK').length).toBeGreaterThan(0);
    expect(mockWatchlist).toHaveBeenCalled();
    expect(mockScanner).toHaveBeenCalled();
  });

  it('switches to alerts tab', async () => {
    renderPage();
    fireEvent.click(await screen.findByText('Alarmlar'));
    expect(screen.getByText('Alarmlar')).toBeDefined();
  });

  it('switches to notes tab', async () => {
    renderPage();
    fireEvent.click(await screen.findByText('Notlar'));
    expect(screen.getAllByText('Notlar').length).toBeGreaterThanOrEqual(1);
  });

  it('switches to performance tab', async () => {
    renderPage();
    await screen.findByText('Canlı İzleme');
    fireEvent.click(screen.getByText('Performans').closest('button')!);
    expect(screen.getAllByText('Performans').length).toBeGreaterThanOrEqual(1);
  });

  it('renders action buttons', async () => {
    renderPage();
    await screen.findByText('Canlı İzleme');
    expect(screen.getByLabelText('Liste ekle')).toBeDefined();
    expect(screen.getByLabelText('Yenile')).toBeDefined();
    expect(screen.getByLabelText('Dışa aktar')).toBeDefined();
  });

  it('renders filters section', async () => {
    renderPage();
    expect(await screen.findByText('Filtreler')).toBeDefined();
  });

  it('renders export buttons', async () => {
    renderPage();
    await screen.findByText('Canlı İzleme');
    expect(screen.getByText('CSV')).toBeDefined();
    expect(screen.getByText('JSON')).toBeDefined();
  });

  it('renders alert count badge', async () => {
    renderPage();
    expect(await screen.findByText('Alarmlar')).toBeDefined();
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
  });

  it('renders search input', async () => {
    renderPage();
    expect(await screen.findByLabelText('Hisse ara')).toBeDefined();
  });

  it('filters items by search', async () => {
    renderPage();
    fireEvent.change(await screen.findByLabelText('Hisse ara'), { target: { value: 'GAR' } });
    expect(screen.getAllByText('GARAN').length).toBeGreaterThan(0);
  });

  it('shows error card when API fails', async () => {
    mockWatchlist.mockRejectedValue(new Error('Network error'));
    renderPage();
    expect(await screen.findByText('İzleme Listesi Yüklenemedi')).toBeDefined();
  });
});
