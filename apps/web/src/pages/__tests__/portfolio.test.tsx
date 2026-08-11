import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PortfolioPage from '@/pages/portfolio';

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
}));

const mockPortfolio = vi.fn();
const mockReport = vi.fn();
const mockPositions = vi.fn();
const mockTransactions = vi.fn();

vi.mock('@/lib/sdk', () => ({
  sdkClient: {
    portfolio: () => mockPortfolio(),
    portfolioReport: (id: string) => mockReport(id),
    portfolioPositions: (id: string) => mockPositions(id),
    portfolioTransactions: (id: string) => mockTransactions(id),
  },
}));

const GARAN_POSITION = {
  id: 'pos-1', portfolioId: 'pf-1', symbol: 'GARAN', name: 'Garanti Bankası', sector: 'Bankacılık',
  industry: 'Banka', marketCap: 'LARGE', quantity: 100, averageCost: 42.5, totalCost: 4250,
  currentPrice: 48.2, currentValue: 4820, profitLoss: 570, profitLossPercent: 13.41,
  weight: 25.1, contribution: 10, highestPrice: 50, lowestPrice: 40, risk: 20,
  firstBoughtAt: '2026-01-15', lastBoughtAt: '2026-01-15', updatedAt: '2026-01-15',
};

const THYAO_POSITION = {
  id: 'pos-2', portfolioId: 'pf-1', symbol: 'THYAO', name: 'Türk Hava Yolları', sector: 'Ulaştırma',
  industry: 'Havayolu', marketCap: 'LARGE', quantity: 30, averageCost: 285, totalCost: 8550,
  currentPrice: 310, currentValue: 9300, profitLoss: 750, profitLossPercent: 8.77,
  weight: 32.2, contribution: 10, highestPrice: 320, lowestPrice: 270, risk: 25,
  firstBoughtAt: '2026-02-10', lastBoughtAt: '2026-02-10', updatedAt: '2026-02-10',
};

function setupSdk() {
  mockPortfolio.mockResolvedValue({
    success: true,
    data: [{ id: 'pf-1', name: 'Test', type: 'MAIN', cash: 3500, currency: 'TRY', status: 'ACTIVE' }],
    timestamp: '',
  });
  mockReport.mockResolvedValue({
    success: true,
    data: {
      summary: {
        portfolioId: 'pf-1', portfolioName: 'Test', totalValue: 17620, cash: 3500,
        investedCapital: 12800, marketValue: 14120, totalProfitLoss: 1320,
        totalProfitLossPercent: 10.3, totalReturn: 10.3, dailyReturn: 1.72, positionCount: 2,
      },
      performance: {
        portfolioId: 'pf-1', period: 'MONTHLY', startValue: 16000, endValue: 17620,
        percentReturn: 10.1, volatility: 22, sharpeRatio: 1.85, maxDrawdown: 8,
        startDate: '2026-07-01', endDate: '2026-08-01',
      },
      risk: {
        portfolioId: 'pf-1', portfolioRisk: 18.9, sectorConcentration: 30,
        largestPositionPercent: 32.2, cashRatio: 20, diversificationScore: 68,
        currentDrawdown: 2, maxDrawdown: 8, volatility: 22,
      },
      riskWarnings: ['Tek hisse ağırlığı yüksek'],
      generatedAt: '',
    },
    timestamp: '',
  });
  mockPositions.mockResolvedValue({ success: true, data: [GARAN_POSITION, THYAO_POSITION], timestamp: '' });
  mockTransactions.mockResolvedValue({
    success: true,
    data: [
      { id: 'tx-1', portfolioId: 'pf-1', symbol: 'GARAN', type: 'BUY', quantity: 100, price: 42.5, total: 4250, executedAt: '2026-01-15T00:00:00Z' },
      { id: 'tx-2', portfolioId: 'pf-1', symbol: 'THYAO', type: 'BUY', quantity: 30, price: 285, total: 8550, executedAt: '2026-02-10T00:00:00Z' },
    ],
    timestamp: '',
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <PortfolioPage />
    </MemoryRouter>,
  );
}

describe('PortfolioPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSdk();
  });

  it('renders page title', async () => {
    renderPage();
    expect(await screen.findByText('Portföy Yönetimi')).toBeDefined();
  });

  it('renders all tab buttons', async () => {
    renderPage();
    await screen.findByText('Portföy Yönetimi');
    expect(screen.getByText('Portföy Özeti')).toBeDefined();
    expect(screen.getByText('Dağılım')).toBeDefined();
    expect(screen.getByText('Hisseler')).toBeDefined();
    expect(screen.getByText('İşlemler')).toBeDefined();
    expect(screen.getByText('Risk & Analiz')).toBeDefined();
    expect(screen.getByText('Temettü')).toBeDefined();
  });

  it('shows portfolio summary tab by default', async () => {
    renderPage();
    expect(await screen.findByText('Toplam Portföy Değeri')).toBeDefined();
  });

  it('switches to allocation tab', async () => {
    renderPage();
    fireEvent.click(await screen.findByText('Dağılım'));
    expect(screen.getByText('Varlık Dağılımı')).toBeDefined();
    expect(screen.getByText('Sektör Dağılımı')).toBeDefined();
  });

  it('switches to holdings tab', async () => {
    renderPage();
    fireEvent.click(await screen.findByText('Hisseler'));
    expect(screen.getByText(/Hisse Senetleri/)).toBeDefined();
  });

  it('switches to transactions tab', async () => {
    renderPage();
    fireEvent.click(await screen.findByText('İşlemler'));
    expect(screen.getByText('Nakit Durumu')).toBeDefined();
  });

  it('switches to risk tab', async () => {
    renderPage();
    fireEvent.click(await screen.findByText('Risk & Analiz'));
    expect(screen.getByText('Risk Metrikleri')).toBeDefined();
    expect(screen.getByText('Yapay Zeka Analizi')).toBeDefined();
  });

  it('switches to dividend tab', async () => {
    renderPage();
    fireEvent.click(await screen.findByText('Temettü'));
    expect(screen.getByText('Temettü Bilgisi')).toBeDefined();
  });

  it('toggles compact mode', async () => {
    renderPage();
    await screen.findByText('Portföy Yönetimi');
    fireEvent.click(screen.getByLabelText('Kompakt görünüm'));
    expect(screen.getByText('Normal')).toBeDefined();
  });

  it('fetches holdings from the API', async () => {
    renderPage();
    expect(await screen.findByText('GARAN')).toBeDefined();
    expect(screen.getByText('THYAO')).toBeDefined();
    expect(mockReport).toHaveBeenCalledWith('pf-1');
    expect(mockPositions).toHaveBeenCalledWith('pf-1');
  });

  it('renders action buttons', async () => {
    renderPage();
    await screen.findByText('Portföy Yönetimi');
    expect(screen.getByLabelText('Yenile')).toBeDefined();
    expect(screen.getByLabelText('Dışa aktar')).toBeDefined();
    expect(screen.getByLabelText('Portföy ekle')).toBeDefined();
    expect(screen.getByLabelText('İşlem ekle')).toBeDefined();
  });

  it('shows empty state when no portfolios exist', async () => {
    mockPortfolio.mockResolvedValue({ success: true, data: [], timestamp: '' });
    renderPage();
    expect(await screen.findByText('Henüz portföy oluşturulmadı')).toBeDefined();
  });

  it('shows error card when API fails', async () => {
    mockPortfolio.mockRejectedValue(new Error('Network error'));
    renderPage();
    expect(await screen.findByText('Portföy Yüklenemedi')).toBeDefined();
  });
});
