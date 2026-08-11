import { render, screen } from '@testing-library/react';
import { BacktestEquityChart } from './backtest-equity-chart';
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
  equityCurve: [100000, 101000, 103000, 102500, 105000],
  trades: [],
  ruleContribution: { entryRule: 'ALWAYS', exitRule: 'HOLD_UNTIL_END', trades: 42, winRate: 0.643, avgReturn: 0.023 },
  metadata: {},
  isValid: true,
};

describe('BacktestEquityChart', () => {
  it('renders title', () => {
    render(<BacktestEquityChart result={mockResult} />);
    expect(screen.getByText('Özkaynak Eğrisi')).toBeInTheDocument();
  });

  it('renders chart container div', () => {
    const { container } = render(<BacktestEquityChart result={mockResult} />);
    expect(container.querySelector('.h-72')).toBeInTheDocument();
  });

  it('renders without crashing with minimal data', () => {
    const minimal = { ...mockResult, equityCurve: [100000] };
    render(<BacktestEquityChart result={minimal} />);
    expect(screen.getByText('Özkaynak Eğrisi')).toBeInTheDocument();
  });

  it('renders with long equity curve', () => {
    const long = { ...mockResult, equityCurve: Array.from({ length: 100 }, (_, i) => 100000 + i * 100) };
    render(<BacktestEquityChart result={long} />);
    expect(screen.getByText('Özkaynak Eğrisi')).toBeInTheDocument();
  });

  it('renders with declining equity curve', () => {
    const declining = { ...mockResult, equityCurve: [100000, 99000, 98000, 97000] };
    render(<BacktestEquityChart result={declining} />);
    expect(screen.getByText('Özkaynak Eğrisi')).toBeInTheDocument();
  });
});
