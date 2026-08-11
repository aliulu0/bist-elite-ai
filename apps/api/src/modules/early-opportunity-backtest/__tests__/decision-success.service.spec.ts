import { DecisionSuccessService } from '../decision-success.service';
import { FutureOutcome, BacktestHorizon } from '../early-opportunity-backtest.types';

describe('DecisionSuccessService', () => {
  let service: DecisionSuccessService;

  beforeEach(() => {
    service = new DecisionSuccessService();
  });

  const makeOutcome = (overrides: Partial<FutureOutcome> = {}): FutureOutcome => ({
    ticker: 'THYAO.IS',
    decisionDate: '2024-01-15T23:59:59.000Z',
    outcomes: [
      {
        horizon: '3M' as BacktestHorizon,
        horizonDays: 90,
        entryPrice: 100,
        exitPrice: 115,
        absoluteReturn: 15,
        percentageReturn: 15,
        maxFavorableExcursion: 20,
        maxAdverseExcursion: -5,
        maxDrawdownAfterSignal: 8,
        timeToPositiveReturn: 10,
        timeToTarget: 45,
        timeToStop: null,
        targetReached: true,
        stopReached: false,
        dataAvailable: true,
      },
    ],
    overallMaxDrawdown: 8,
    overallMaxFavorableExcursion: 20,
    overallMaxAdverseExcursion: -5,
    dataAvailable: true,
    ...overrides,
  });

  it('should return RETURN success for positive return', () => {
    const result = service.evaluate(makeOutcome(), 30, null, null, null);
    const returnEval = result.evaluations.find((e) => e.dimension === 'RETURN');
    expect(returnEval!.satisfied).toBe(true);
  });

  it('should return RETURN failure for negative return', () => {
    const outcome = makeOutcome({
      outcomes: [{
        horizon: '3M' as BacktestHorizon,
        horizonDays: 90,
        entryPrice: 100,
        exitPrice: 85,
        absoluteReturn: -15,
        percentageReturn: -15,
        maxFavorableExcursion: 5,
        maxAdverseExcursion: -20,
        maxDrawdownAfterSignal: 20,
        timeToPositiveReturn: null,
        timeToTarget: null,
        timeToStop: 30,
        targetReached: false,
        stopReached: true,
        dataAvailable: true,
      }],
      overallMaxDrawdown: 20,
      dataAvailable: true,
    });
    const result = service.evaluate(outcome, 30, null, null, null);
    const returnEval = result.evaluations.find((e) => e.dimension === 'RETURN');
    expect(returnEval!.satisfied).toBe(false);
  });

  it('should detect stop hit first', () => {
    const outcome = makeOutcome({
      outcomes: [{
        horizon: '3M' as BacktestHorizon,
        horizonDays: 90,
        entryPrice: 100,
        exitPrice: 85,
        absoluteReturn: -15,
        percentageReturn: -15,
        maxFavorableExcursion: 5,
        maxAdverseExcursion: -20,
        maxDrawdownAfterSignal: 20,
        timeToPositiveReturn: null,
        timeToTarget: 60,
        timeToStop: 30,
        targetReached: true,
        stopReached: true,
        dataAvailable: true,
      }],
      dataAvailable: true,
    });
    const result = service.evaluate(outcome, 30, { min: 95, max: 105 }, 90, 120);
    expect(result.stopHitFirst).toBe(true);
  });

  it('should handle no data available', () => {
    const outcome = makeOutcome({ dataAvailable: false, outcomes: [] });
    const result = service.evaluate(outcome, 30, null, null, null);
    expect(result.overallSuccess).toBe(false);
  });

  it('should evaluate early opportunity success', () => {
    const result = service.evaluate(makeOutcome(), 30, null, null, null);
    const earlyEval = result.evaluations.find((e) => e.dimension === 'EARLY_OPPORTUNITY');
    expect(earlyEval).toBeDefined();
  });
});