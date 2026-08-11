import { render, screen } from '@testing-library/react';
import { BacktestWeightOptimizer } from './backtest-weight-optimizer';
import type { WeightOptimizationResult } from './backtest-types';

const mockOptimization: WeightOptimizationResult = {
  recommendedWeights: {
    RSI_OVERSOLD: 0.35,
    VOLUME_SPIKE: 0.25,
    MACD_CROSSOVER: 0.20,
    CLOSE_ABOVE_EMA: 0.12,
    PRICE_ABOVE_SMA: 0.08,
  },
  expectedImprovement: 12.5,
  confidence: 0.85,
  simulation: {
    currentScore: 65.3,
    optimizedScore: 73.5,
    improvementPercent: 12.5,
    tradesAnalyzed: 42,
  },
  metadata: {},
};

describe('BacktestWeightOptimizer', () => {
  it('renders title', () => {
    render(<BacktestWeightOptimizer optimization={mockOptimization} />);
    expect(screen.getByText('Ağırlık Optimizasyonu')).toBeInTheDocument();
  });

  it('displays expected improvement', () => {
    render(<BacktestWeightOptimizer optimization={mockOptimization} />);
    expect(screen.getByText('+12.50%')).toBeInTheDocument();
  });

  it('displays confidence', () => {
    render(<BacktestWeightOptimizer optimization={mockOptimization} />);
    expect(screen.getByText('85.0%')).toBeInTheDocument();
  });

  it('displays current score', () => {
    render(<BacktestWeightOptimizer optimization={mockOptimization} />);
    expect(screen.getByText('65.30')).toBeInTheDocument();
  });

  it('displays optimized score', () => {
    render(<BacktestWeightOptimizer optimization={mockOptimization} />);
    expect(screen.getByText('73.50')).toBeInTheDocument();
  });

  it('renders recommended weights section', () => {
    render(<BacktestWeightOptimizer optimization={mockOptimization} />);
    expect(screen.getByText('Önerilen Ağırlıklar')).toBeInTheDocument();
  });

  it('displays all rules with weights', () => {
    render(<BacktestWeightOptimizer optimization={mockOptimization} />);
    expect(screen.getByText('RSI_OVERSOLD')).toBeInTheDocument();
    expect(screen.getByText('VOLUME_SPIKE')).toBeInTheDocument();
    expect(screen.getByText('MACD_CROSSOVER')).toBeInTheDocument();
    expect(screen.getByText('CLOSE_ABOVE_EMA')).toBeInTheDocument();
    expect(screen.getByText('PRICE_ABOVE_SMA')).toBeInTheDocument();
  });

  it('displays weight percentages', () => {
    render(<BacktestWeightOptimizer optimization={mockOptimization} />);
    expect(screen.getByText('35%')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText('12%')).toBeInTheDocument();
    expect(screen.getByText('8%')).toBeInTheDocument();
  });

  it('renders progress bars', () => {
    const { container } = render(<BacktestWeightOptimizer optimization={mockOptimization} />);
    const bars = container.querySelectorAll('.bg-primary');
    expect(bars.length).toBeGreaterThanOrEqual(5);
  });

  it('shows empty state when no weights', () => {
    const empty: WeightOptimizationResult = {
      recommendedWeights: {},
      expectedImprovement: 0,
      confidence: 0,
      simulation: { currentScore: 0, optimizedScore: 0, improvementPercent: 0, tradesAnalyzed: 0 },
      metadata: {},
    };
    render(<BacktestWeightOptimizer optimization={empty} />);
    expect(screen.getByText('Ağırlık verisi yok')).toBeInTheDocument();
  });

  it('sorts rules by weight descending', () => {
    render(<BacktestWeightOptimizer optimization={mockOptimization} />);
    const ruleNames = screen.getAllByText(/OVERSOLD|SPIKE|CROSSOVER|EMA|SMA/);
    expect(ruleNames[0]).toHaveTextContent('RSI_OVERSOLD');
    expect(ruleNames[1]).toHaveTextContent('VOLUME_SPIKE');
  });
});
