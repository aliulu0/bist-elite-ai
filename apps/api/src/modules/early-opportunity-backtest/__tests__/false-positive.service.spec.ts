import { FalsePositiveService } from '../false-positive.service';
import { FutureOutcome, BacktestHorizon } from '../early-opportunity-backtest.types';
import { EarlyOpportunityDecisionSnapshot } from '../../ai-early-opportunity/decision/early-opportunity-decision.types';

describe('FalsePositiveService', () => {
  let service: FalsePositiveService;

  beforeEach(() => {
    service = new FalsePositiveService();
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
      maxAdverseExcursion: -10,
      maxDrawdownAfterSignal: 10,
      timeToPositiveReturn: null,
      timeToTarget: null,
      timeToStop: null,
      targetReached: false,
      stopReached: false,
      dataAvailable: true,
    }],
    overallMaxDrawdown: 10,
    overallMaxFavorableExcursion: 0,
    overallMaxAdverseExcursion: -10,
    dataAvailable: true,
  });

  const makeSnapshot = (overrides: Partial<EarlyOpportunityDecisionSnapshot> = {}): EarlyOpportunityDecisionSnapshot => ({
    decisionTimestamp: '2024-01-15T23:59:59.000Z',
    symbol: 'THYAO.IS',
    timeframeContext: ['1d'],
    decisionScore: 70,
    decisionStatus: 'EARLY_OPPORTUNITY',
    earlyOpportunity: true,
    entry: { min: 95, max: 105 },
    stop: 90,
    target1: 120,
    target2: 140,
    expectedReturn: 15,
    confidence: 75,
    evidence: {
      earlyStage: 80, multiTimeframe: 70, prediction: 65, smartMoney: 60,
      catalyst: 55, fundamentals: 50, signals: 65, verification: 60,
      dataQuality: 70, risk: 60,
    },
    inputDigest: 'abc123',
    ...overrides,
  });

  it('should detect false positives with negative return', () => {
    const outcome = makeOutcome(-10);
    const result = service.analyze([outcome], [{ ticker: 'THYAO.IS', decisionDate: '2024-01-15T23:59:59.000Z', snapshot: makeSnapshot() }]);
    expect(result.totalFalsePositives).toBeGreaterThan(0);
    expect(result.falsePositives[0].realizedReturn).toBeLessThan(0);
  });

  it('should not flag false positives with positive return', () => {
    const outcome = makeOutcome(10);
    const result = service.analyze([outcome], [{ ticker: 'THYAO.IS', decisionDate: '2024-01-15T23:59:59.000Z', snapshot: makeSnapshot() }]);
    expect(result.totalFalsePositives).toBe(0);
  });

  it('should classify failure reasons', () => {
    const outcome = makeOutcome(-10);
    const snapshot = makeSnapshot({ evidence: { ...makeSnapshot().evidence, fundamentals: 30 } });
    const result = service.analyze([outcome], [{ ticker: 'THYAO.IS', decisionDate: '2024-01-15T23:59:59.000Z', snapshot }]);
    expect(result.falsePositives[0].likelyReason).toBe('weak_fundamentals');
  });

  it('should return yetersiz_kanit when no deterministic reason found', () => {
    const outcome = makeOutcome(-10);
    const snapshot = makeSnapshot({ evidence: { earlyStage: 80, multiTimeframe: 80, prediction: 80, smartMoney: 80, catalyst: 80, fundamentals: 80, signals: 80, verification: 80, dataQuality: 80, risk: 80 } });
    const result = service.analyze([outcome], [{ ticker: 'THYAO.IS', decisionDate: '2024-01-15T23:59:59.000Z', snapshot }]);
    expect(result.falsePositives[0].likelyReason).toBe('yetersiz_kanit');
  });
});