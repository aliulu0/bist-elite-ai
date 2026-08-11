import { render, screen } from '@testing-library/react';
import { BacktestRuleAnalytics } from './backtest-rule-analytics';
import type { RuleAnalyticsResult } from './backtest-types';

const mockAnalytics: RuleAnalyticsResult = {
  ruleStatistics: [
    { rule: 'RSI_OVERSOLD', totalTrades: 15, winningTrades: 10, losingTrades: 5, winRate: 0.667, avgReturn: 0.035, medianReturn: 0.028, totalReturn: 0.525, bestTrade: 0.12, worstTrade: -0.05, sharpe: 1.5 },
    { rule: 'VOLUME_SPIKE', totalTrades: 12, winningTrades: 7, losingTrades: 5, winRate: 0.583, avgReturn: 0.02, medianReturn: 0.015, totalReturn: 0.24, bestTrade: 0.08, worstTrade: -0.04, sharpe: 0.8 },
    { rule: 'MACD_CROSSOVER', totalTrades: 10, winningTrades: 5, losingTrades: 5, winRate: 0.5, avgReturn: 0.01, medianReturn: 0.008, totalReturn: 0.1, bestTrade: 0.06, worstTrade: -0.03, sharpe: 0.4 },
  ],
  pairStatistics: [
    { ruleA: 'RSI_OVERSOLD', ruleB: 'VOLUME_SPIKE', totalTrades: 8, winRate: 0.75, avgReturn: 0.04, totalReturn: 0.32 },
    { ruleA: 'MACD_CROSSOVER', ruleB: 'RSI_OVERSOLD', totalTrades: 5, winRate: 0.6, avgReturn: 0.025, totalReturn: 0.125 },
  ],
  tripleStatistics: [],
  timeframeStatistics: [],
  sectorStatistics: [],
  eliteStatistics: [],
  opportunityStatistics: [],
  metadata: {},
};

describe('BacktestRuleAnalytics', () => {
  it('renders rule statistics title', () => {
    render(<BacktestRuleAnalytics analytics={mockAnalytics} />);
    expect(screen.getByText('Kural İstatistikleri')).toBeInTheDocument();
  });

  it('renders all rules', () => {
    render(<BacktestRuleAnalytics analytics={mockAnalytics} />);
    expect(screen.getAllByText('RSI_OVERSOLD').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('VOLUME_SPIKE').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('MACD_CROSSOVER').length).toBeGreaterThanOrEqual(1);
  });

  it('displays rule trade counts', () => {
    render(<BacktestRuleAnalytics analytics={mockAnalytics} />);
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('displays win rates', () => {
    render(<BacktestRuleAnalytics analytics={mockAnalytics} />);
    expect(screen.getByText('66.7%')).toBeInTheDocument();
    expect(screen.getByText('58.3%')).toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument();
  });

  it('renders pair statistics section', () => {
    render(<BacktestRuleAnalytics analytics={mockAnalytics} />);
    expect(screen.getByText('En İyi Kural Çiftleri')).toBeInTheDocument();
  });

  it('renders pair rule names', () => {
    render(<BacktestRuleAnalytics analytics={mockAnalytics} />);
    expect(screen.getAllByText('RSI_OVERSOLD').length).toBeGreaterThanOrEqual(2);
  });

  it('shows empty state when no rules', () => {
    const empty: RuleAnalyticsResult = {
      ruleStatistics: [], pairStatistics: [], tripleStatistics: [],
      timeframeStatistics: [], sectorStatistics: [], eliteStatistics: [],
      opportunityStatistics: [], metadata: {},
    };
    render(<BacktestRuleAnalytics analytics={empty} />);
    expect(screen.getByText('Veri yok')).toBeInTheDocument();
  });

  it('sorts rules by avgReturn descending', () => {
    render(<BacktestRuleAnalytics analytics={mockAnalytics} />);
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('RSI_OVERSOLD');
  });

  it('formats returns as percentages', () => {
    render(<BacktestRuleAnalytics analytics={mockAnalytics} />);
    expect(screen.getAllByText(/\+3\.50%/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders sharpe values', () => {
    render(<BacktestRuleAnalytics analytics={mockAnalytics} />);
    expect(screen.getByText('1.50')).toBeInTheDocument();
    expect(screen.getByText('0.80')).toBeInTheDocument();
    expect(screen.getByText('0.40')).toBeInTheDocument();
  });
});
