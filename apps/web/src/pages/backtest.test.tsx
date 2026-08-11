import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BacktestPage from './backtest';
import { useBacktestStore } from '@/stores/backtest-store';

vi.mock('@/lib/sdk', () => ({
  sdkClient: {
    backtestCreate: vi.fn().mockResolvedValue({ id: 'wf-1', type: 'backtest' }),
    backtestWorkflows: vi.fn().mockResolvedValue({ data: [] }),
    backtestHistory: vi.fn().mockResolvedValue({ data: [] }),
    backtestStats: vi.fn().mockResolvedValue({ totalCreated: 0 }),
  },
}));

const renderPage = () =>
  render(
    <BrowserRouter>
      <BacktestPage />
    </BrowserRouter>,
  );

describe('BacktestPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBacktestStore.setState({
      symbol: '', timeframe: '1d', activeTab: 'ozet',
      loading: false, error: '', result: null,
      benchmark: null, ruleAnalytics: null, weightOptimization: null,
      workflows: [], historicalData: null, workflowLoading: false,
      config: {
        entryRules: [{ signal: 'ALWAYS', threshold: 0, lookback: 0 }],
        exitRules: [{ signal: 'HOLD_UNTIL_END', stopLossPercent: 5, takeProfitPercent: 15, trailingStopPercent: 10, maxHoldingDays: 365, lookback: 20, threshold: 70 }],
        initialCapital: 100000, positionSizePercent: 100, riskFreeRate: 0.15,
        tradingDaysPerYear: 252, minTradesRequired: 5,
      },
    });
  });

  it('renders page header', () => {
    renderPage();
    expect(screen.getByText('Geri Test')).toBeInTheDocument();
  });

  it('renders description', () => {
    renderPage();
    expect(screen.getByText('Stratejileri geçmiş verilerle test edin')).toBeInTheDocument();
  });

  it('renders Backtest Motoru title', () => {
    renderPage();
    expect(screen.getByText('Backtest Motoru')).toBeInTheDocument();
  });

  it('renders empty state initially', () => {
    renderPage();
    expect(screen.getByText('Backtest başlatın')).toBeInTheDocument();
  });

  it('renders empty state description', () => {
    renderPage();
    expect(screen.getByText('Yukarıdaki alana bir hisse kodu girerek backtest çalıştırın')).toBeInTheDocument();
  });

  it('renders tab buttons when result is present', () => {
    useBacktestStore.setState({
      result: {
        performance: { totalTrades: 42, winningTrades: 27, losingTrades: 15, winRate: 0.643, averageReturn: 0.023, medianReturn: 0.018, bestTrade: 0.156, worstTrade: -0.087, cagr: 0.284, profitFactor: 2.15, totalReturn: 0.284 },
        risk: { sharpeRatio: 1.82, sortinoRatio: 2.31, maxDrawdown: 0.125, maxDrawdownDuration: 45, volatility: 0.18, downsideDeviation: 0.12, calmarRatio: 2.27 },
        equityCurve: [100000, 101000],
        trades: [],
        ruleContribution: { entryRule: 'ALWAYS', exitRule: 'HOLD_UNTIL_END', trades: 42, winRate: 0.643, avgReturn: 0.023 },
        metadata: {}, isValid: true,
      },
    });
    renderPage();
    expect(screen.getByText('Özet')).toBeInTheDocument();
    expect(screen.getByText('Grafik')).toBeInTheDocument();
    expect(screen.getByText('İşlemler')).toBeInTheDocument();
    expect(screen.getByText('Kural Analizi')).toBeInTheDocument();
    expect(screen.getByText('Karşılaştırma')).toBeInTheDocument();
    expect(screen.getByText('Optimizasyon')).toBeInTheDocument();
  });

  it('renders settings toggle', () => {
    renderPage();
    expect(screen.getByText('Backtest Ayarları')).toBeInTheDocument();
  });

  it('renders timeframe selector', () => {
    renderPage();
    expect(screen.getByText('Günlük')).toBeInTheDocument();
    expect(screen.getByText('Haftalık')).toBeInTheDocument();
    expect(screen.getByText('Aylık')).toBeInTheDocument();
  });

  it('renders symbol input', () => {
    renderPage();
    expect(screen.getByLabelText('Hisse kodu')).toBeInTheDocument();
  });

  it('renders run button', () => {
    renderPage();
    expect(screen.getByText('Backtest Çalıştır')).toBeInTheDocument();
  });

  it('renders reset button', () => {
    renderPage();
    expect(screen.getByText('Sıfırla')).toBeInTheDocument();
  });

  it('renders export buttons', () => {
    renderPage();
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
  });

  it('shows workflow section when result present', () => {
    useBacktestStore.setState({
      result: {
        performance: { totalTrades: 42, winningTrades: 27, losingTrades: 15, winRate: 0.643, averageReturn: 0.023, medianReturn: 0.018, bestTrade: 0.156, worstTrade: -0.087, cagr: 0.284, profitFactor: 2.15, totalReturn: 0.284 },
        risk: { sharpeRatio: 1.82, sortinoRatio: 2.31, maxDrawdown: 0.125, maxDrawdownDuration: 45, volatility: 0.18, downsideDeviation: 0.12, calmarRatio: 2.27 },
        equityCurve: [100000, 101000],
        trades: [],
        ruleContribution: { entryRule: 'ALWAYS', exitRule: 'HOLD_UNTIL_END', trades: 42, winRate: 0.643, avgReturn: 0.023 },
        metadata: {}, isValid: true,
      },
    });
    renderPage();
    expect(screen.getByText('Backtest İş Akışları')).toBeInTheDocument();
  });

  it('shows empty Kural Analizi when no analytics', () => {
    useBacktestStore.setState({
      activeTab: 'kurallar',
      result: {
        performance: { totalTrades: 42, winningTrades: 27, losingTrades: 15, winRate: 0.643, averageReturn: 0.023, medianReturn: 0.018, bestTrade: 0.156, worstTrade: -0.087, cagr: 0.284, profitFactor: 2.15, totalReturn: 0.284 },
        risk: { sharpeRatio: 1.82, sortinoRatio: 2.31, maxDrawdown: 0.125, maxDrawdownDuration: 45, volatility: 0.18, downsideDeviation: 0.12, calmarRatio: 2.27 },
        equityCurve: [100000, 101000],
        trades: [],
        ruleContribution: { entryRule: 'ALWAYS', exitRule: 'HOLD_UNTIL_END', trades: 42, winRate: 0.643, avgReturn: 0.023 },
        metadata: {}, isValid: true,
      },
      ruleAnalytics: null,
    });
    renderPage();
    expect(screen.getByText('Kural analizi bulunamadı')).toBeInTheDocument();
  });

  it('shows empty Karşılaştırma when no benchmark', () => {
    useBacktestStore.setState({
      activeTab: 'karsilastirma',
      result: {
        performance: { totalTrades: 42, winningTrades: 27, losingTrades: 15, winRate: 0.643, averageReturn: 0.023, medianReturn: 0.018, bestTrade: 0.156, worstTrade: -0.087, cagr: 0.284, profitFactor: 2.15, totalReturn: 0.284 },
        risk: { sharpeRatio: 1.82, sortinoRatio: 2.31, maxDrawdown: 0.125, maxDrawdownDuration: 45, volatility: 0.18, downsideDeviation: 0.12, calmarRatio: 2.27 },
        equityCurve: [100000, 101000],
        trades: [],
        ruleContribution: { entryRule: 'ALWAYS', exitRule: 'HOLD_UNTIL_END', trades: 42, winRate: 0.643, avgReturn: 0.023 },
        metadata: {}, isValid: true,
      },
      benchmark: null,
    });
    renderPage();
    expect(screen.getByText('Benchmark verisi bulunamadı')).toBeInTheDocument();
  });

  it('shows empty Optimizasyon when no optimization', () => {
    useBacktestStore.setState({
      activeTab: 'optimize',
      result: {
        performance: { totalTrades: 42, winningTrades: 27, losingTrades: 15, winRate: 0.643, averageReturn: 0.023, medianReturn: 0.018, bestTrade: 0.156, worstTrade: -0.087, cagr: 0.284, profitFactor: 2.15, totalReturn: 0.284 },
        risk: { sharpeRatio: 1.82, sortinoRatio: 2.31, maxDrawdown: 0.125, maxDrawdownDuration: 45, volatility: 0.18, downsideDeviation: 0.12, calmarRatio: 2.27 },
        equityCurve: [100000, 101000],
        trades: [],
        ruleContribution: { entryRule: 'ALWAYS', exitRule: 'HOLD_UNTIL_END', trades: 42, winRate: 0.643, avgReturn: 0.023 },
        metadata: {}, isValid: true,
      },
      weightOptimization: null,
    });
    renderPage();
    expect(screen.getByText('Optimizasyon verisi bulunamadı')).toBeInTheDocument();
  });
});
