import { render, screen, fireEvent } from '@testing-library/react';
import { BacktestExport } from './backtest-export';
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
  equityCurve: [100000, 101000],
  trades: [
    { entryIndex: 0, entryTimestamp: '2024-01-01', entryPrice: 50, exitIndex: 3, exitTimestamp: '2024-01-04', exitPrice: 55, holdingDays: 3, returnPercent: 0.1, returnAbsolute: 5000, exitReason: 'TAKE_PROFIT' },
  ],
  ruleContribution: { entryRule: 'ALWAYS', exitRule: 'HOLD_UNTIL_END', trades: 42, winRate: 0.643, avgReturn: 0.023 },
  metadata: {},
  isValid: true,
};

const defaultProps = {
  result: mockResult,
  benchmark: null,
  ruleAnalytics: null,
  weightOptimization: null,
  symbol: 'GARAN',
};

describe('BacktestExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('renders CSV button', () => {
    render(<BacktestExport {...defaultProps} />);
    expect(screen.getByText('CSV')).toBeInTheDocument();
  });

  it('renders JSON button', () => {
    render(<BacktestExport {...defaultProps} />);
    expect(screen.getByText('JSON')).toBeInTheDocument();
  });

  it('disables CSV when no result', () => {
    render(<BacktestExport {...defaultProps} result={null} />);
    expect(screen.getByText('CSV')).toBeDisabled();
  });

  it('disables JSON when no data at all', () => {
    render(<BacktestExport {...defaultProps} result={null} />);
    expect(screen.getByText('JSON')).toBeDisabled();
  });

  it('enables JSON when result exists', () => {
    render(<BacktestExport {...defaultProps} />);
    expect(screen.getByText('JSON')).not.toBeDisabled();
  });

  it('enables CSV when result exists', () => {
    render(<BacktestExport {...defaultProps} />);
    expect(screen.getByText('CSV')).not.toBeDisabled();
  });

  it('calls createObjectURL on CSV click', () => {
    render(<BacktestExport {...defaultProps} />);
    fireEvent.click(screen.getByText('CSV'));
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('calls createObjectURL on JSON click', () => {
    render(<BacktestExport {...defaultProps} />);
    fireEvent.click(screen.getByText('JSON'));
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('calls revokeObjectURL on CSV click', () => {
    render(<BacktestExport {...defaultProps} />);
    fireEvent.click(screen.getByText('CSV'));
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });
});
