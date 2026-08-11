import { LeadTimeService } from '../lead-time.service';
import { FutureOutcome, BacktestHorizon } from '../early-opportunity-backtest.types';

describe('LeadTimeService', () => {
  let service: LeadTimeService;

  beforeEach(() => {
    service = new LeadTimeService();
  });

  const makeOutcome = (returnPct: number): FutureOutcome => ({
    ticker: 'THYAO.IS',
    decisionDate: '2024-01-15T23:59:59.000Z',
    outcomes: [{
      horizon: '3M' as BacktestHorizon,
      horizonDays: 90,
      entryPrice: 100,
      exitPrice: 100 * (1 + returnPct / 100),
      absoluteReturn: 100 * (returnPct / 100),
      percentageReturn: returnPct,
      maxFavorableExcursion: 0,
      maxAdverseExcursion: 0,
      maxDrawdownAfterSignal: 0,
      timeToPositiveReturn: null,
      timeToTarget: null,
      timeToStop: null,
      targetReached: false,
      stopReached: false,
      dataAvailable: true,
    }],
    overallMaxDrawdown: 0,
    overallMaxFavorableExcursion: 0,
    overallMaxAdverseExcursion: 0,
    dataAvailable: true,
  });

  it('should calculate lead time summary', () => {
    const outcomes = [makeOutcome(15), makeOutcome(20), makeOutcome(12)];
    const scoreBuckets = [
      { ticker: 'THYAO.IS', decisionDate: '2024-01-15T23:59:59.000Z', score: 80, signalStrength: 75 },
      { ticker: 'THYAO.IS', decisionDate: '2024-01-15T23:59:59.000Z', score: 70, signalStrength: 65 },
      { ticker: 'THYAO.IS', decisionDate: '2024-01-15T23:59:59.000Z', score: 60, signalStrength: 55 },
    ];
    const result = service.calculate(outcomes, scoreBuckets);
    expect(result.sampleCount).toBeGreaterThan(0);
    expect(result.interpretation).toBeDefined();
  });

  it('should handle no data', () => {
    const result = service.calculate([], []);
    expect(result.sampleCount).toBe(0);
    expect(result.interpretation).toContain('yeterli veri');
  });
});