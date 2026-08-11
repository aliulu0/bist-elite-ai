import { render, screen } from '@testing-library/react';
import { BacktestSummary } from './backtest-summary';
import type { BacktestResult } from './backtest-types';

const mockResult: BacktestResult = {
  performance: {
    totalTrades: 42, winningTrades: 27, losingTrades: 15, winRate: 0.643,
    averageReturn: 0.023, medianReturn: 0.018, bestTrade: 0.156,
    worstTrade: -0.087, cagr: 0.284, profitFactor: 2.15, totalReturn: 0.284,
  },
  risk: {
    sharpeRatio: 1.82, sortinoRatio: 2.31, maxDrawdown: 0.125,
    maxDrawdownDuration: 45, volatility: 0.18, downsideDeviation: 0.12,
    calmarRatio: 2.27,
  },
  equityCurve: [100000, 101000, 103000],
  trades: [],
  ruleContribution: { entryRule: 'ALWAYS', exitRule: 'HOLD_UNTIL_END', trades: 42, winRate: 0.643, avgReturn: 0.023 },
  metadata: {},
  isValid: true,
};

describe('BacktestSummary', () => {
  it('renders all 6 KPI cards', () => {
    render(<BacktestSummary result={mockResult} />);
    expect(screen.getByText('Toplam Getiri')).toBeInTheDocument();
    expect(screen.getByText('CAGR')).toBeInTheDocument();
    expect(screen.getByText('Sharpe Oranı')).toBeInTheDocument();
    expect(screen.getByText('Sortino Oranı')).toBeInTheDocument();
    expect(screen.getByText('Maks. Drawdown')).toBeInTheDocument();
    expect(screen.getByText('Kazanma Oranı')).toBeInTheDocument();
  });

  it('displays positive total return correctly', () => {
    render(<BacktestSummary result={mockResult} />);
    expect(screen.getByText('+28.40%')).toBeInTheDocument();
  });

  it('displays CAGR', () => {
    render(<BacktestSummary result={mockResult} />);
    expect(screen.getByText('28.40%')).toBeInTheDocument();
  });

  it('displays Sharpe ratio', () => {
    render(<BacktestSummary result={mockResult} />);
    expect(screen.getByText('1.82')).toBeInTheDocument();
  });

  it('displays Sortino ratio', () => {
    render(<BacktestSummary result={mockResult} />);
    expect(screen.getByText('2.31')).toBeInTheDocument();
  });

  it('displays max drawdown', () => {
    render(<BacktestSummary result={mockResult} />);
    expect(screen.getByText('12.50%')).toBeInTheDocument();
  });

  it('displays drawdown duration', () => {
    render(<BacktestSummary result={mockResult} />);
    expect(screen.getByText('45 gün')).toBeInTheDocument();
  });

  it('displays win rate', () => {
    render(<BacktestSummary result={mockResult} />);
    expect(screen.getByText('64.3%')).toBeInTheDocument();
  });

  it('displays win/loss counts', () => {
    render(<BacktestSummary result={mockResult} />);
    expect(screen.getByText('27K / 15Z')).toBeInTheDocument();
  });

  it('handles negative total return', () => {
    const negative = {
      ...mockResult,
      performance: { ...mockResult.performance, totalReturn: -0.15 },
    };
    render(<BacktestSummary result={negative} />);
    expect(screen.getByText('-15.00%')).toBeInTheDocument();
  });

  it('handles zero Sharpe ratio', () => {
    const zero = {
      ...mockResult,
      risk: { ...mockResult.risk, sharpeRatio: 0 },
    };
    render(<BacktestSummary result={zero} />);
    expect(screen.getByText('0.00')).toBeInTheDocument();
  });
});
