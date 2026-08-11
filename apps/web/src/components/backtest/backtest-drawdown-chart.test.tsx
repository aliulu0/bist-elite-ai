import { render, screen } from '@testing-library/react';
import { BacktestDrawdownChart } from './backtest-drawdown-chart';
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
  equityCurve: [100000, 101000, 99000, 98000, 100500],
  trades: [],
  ruleContribution: { entryRule: 'ALWAYS', exitRule: 'HOLD_UNTIL_END', trades: 42, winRate: 0.643, avgReturn: 0.023 },
  metadata: {},
  isValid: true,
};

describe('BacktestDrawdownChart', () => {
  it('renders title', () => {
    render(<BacktestDrawdownChart result={mockResult} />);
    expect(screen.getByText('Drawdown Grafiği')).toBeInTheDocument();
  });

  it('renders chart container div', () => {
    const { container } = render(<BacktestDrawdownChart result={mockResult} />);
    expect(container.querySelector('.h-48')).toBeInTheDocument();
  });

  it('handles flat equity curve', () => {
    const flat = { ...mockResult, equityCurve: [100000, 100000, 100000] };
    render(<BacktestDrawdownChart result={flat} />);
    expect(screen.getByText('Drawdown Grafiği')).toBeInTheDocument();
  });

  it('handles all-time high equity curve (no drawdown)', () => {
    const upOnly = { ...mockResult, equityCurve: [100000, 101000, 102000, 103000] };
    render(<BacktestDrawdownChart result={upOnly} />);
    expect(screen.getByText('Drawdown Grafiği')).toBeInTheDocument();
  });

  it('handles single point equity curve', () => {
    const single = { ...mockResult, equityCurve: [100000] };
    render(<BacktestDrawdownChart result={single} />);
    expect(screen.getByText('Drawdown Grafiği')).toBeInTheDocument();
  });
});
