import { PortfolioIntegration } from './portfolio-integration';
import { stubResult } from '../backtest-test-helpers';
import { BacktestResult, PerformanceMetrics, RiskMetrics } from '../backtest.types';

describe('PortfolioIntegration', () => {
  let integration: PortfolioIntegration;

  beforeEach(() => {
    integration = new PortfolioIntegration();
  });

  function baseMetrics(overrides: Partial<PerformanceMetrics> = {}): PerformanceMetrics {
    return {
      totalTrades: 1,
      winningTrades: 1,
      losingTrades: 0,
      winRate: 100,
      lossRate: 0,
      averageReturn: 5,
      medianReturn: 5,
      averageWin: 5,
      averageLoss: 0,
      bestTrade: 5,
      worstTrade: 5,
      cagr: 5,
      annualReturn: 5,
      profitFactor: 2,
      totalReturn: 5,
      expectancy: 5,
      exposure: 10,
      recoveryFactor: 5,
      riskReward: 2,
      ...overrides,
    };
  }

  function baseRisk(overrides: Partial<RiskMetrics> = {}): RiskMetrics {
    return {
      sharpeRatio: 1.5,
      sortinoRatio: 2.0,
      maxDrawdown: 3,
      maxDrawdownDuration: 0,
      volatility: 10,
      downsideDeviation: 5,
      calmarRatio: 0.5,
      ...overrides,
    };
  }

  it('recommends BUY for a winning, low-drawdown strategy', () => {
    const result = stubResult({
      performance: baseMetrics(),
      risk: baseRisk(),
    }) as BacktestResult;
    const signals = integration.buildSignals({ symbol: 'THYAO.IS', timeframe: '1d', result, positionSizePercent: 100 });
    expect(signals.length).toBe(1);
    expect(signals[0].action).toBe('BUY');
    expect(signals[0].confidence).toBeGreaterThan(0.5);
    expect(signals[0].sizePercent).toBeGreaterThan(0);
    expect(signals[0].basedOn.winRate).toBe(100);
  });

  it('recommends WAIT when win rate is low and drawdown is high', () => {
    const result = stubResult({
      performance: baseMetrics({ winRate: 30, totalReturn: -5 }),
      risk: baseRisk({ maxDrawdown: 40, sharpeRatio: -1 }),
    }) as BacktestResult;
    const signals = integration.buildSignals({ symbol: 'THYAO.IS', timeframe: '1d', result, positionSizePercent: 100 });
    expect(signals[0].action).toBe('WAIT');
  });

  it('recommends SELL for a negative-return, low-win strategy', () => {
    const result = stubResult({
      performance: baseMetrics({ winRate: 35, totalReturn: -8 }),
      risk: baseRisk({ maxDrawdown: 12, sharpeRatio: -0.4 }),
    }) as BacktestResult;
    const signals = integration.buildSignals({ symbol: 'THYAO.IS', timeframe: '1d', result, positionSizePercent: 100 });
    expect(signals[0].action).toBe('SELL');
  });
});
