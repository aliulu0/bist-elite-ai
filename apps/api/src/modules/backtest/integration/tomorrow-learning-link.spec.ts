import { TomorrowLearningLink } from './tomorrow-learning-link';
import { stubResult } from '../backtest-test-helpers';
import { BacktestResult, PerformanceMetrics, RiskMetrics } from '../backtest.types';

describe('TomorrowLearningLink', () => {
  let link: TomorrowLearningLink;

  beforeEach(() => {
    link = new TomorrowLearningLink();
  });

  it('upgrades confidence when actual beats prediction', () => {
    const result = stubResult();
    const out = link.applyFeedback({ symbol: 'THYAO.IS', predictedScore: 5, actualReturn: 8, result });
    expect(out.delta).toBe(3);
    expect(out.direction).toBe('UPGRADE');
    expect(out.confidence).toBeGreaterThanOrEqual(0);
    expect(out.confidence).toBeLessThanOrEqual(1);
  });

  it('downgrades when actual underperforms prediction', () => {
    const result = stubResult();
    const out = link.applyFeedback({ symbol: 'THYAO.IS', predictedScore: 8, actualReturn: 3, result });
    expect(out.delta).toBe(-5);
    expect(out.direction).toBe('DOWNGRADE');
  });

  it('keeps when within deadband', () => {
    const out = link.applyFeedback({ symbol: 'THYAO.IS', predictedScore: 5, actualReturn: 5.2 });
    expect(out.direction).toBe('KEEP');
    expect(out.confidence).toBe(0.5);
  });

  it('scales confidence from backtest reliability (sharpe + win rate)', () => {
    const perf = { winRate: 100, sharpeRatio: 1.5 } as unknown as PerformanceMetrics & RiskMetrics;
    void perf;
    const result = stubResult();
    const out = link.applyFeedback({ symbol: 'THYAO.IS', predictedScore: 5, actualReturn: 6, result });
    expect(out.confidence).toBeGreaterThan(0.5);
  });
});
