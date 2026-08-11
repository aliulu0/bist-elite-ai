import { ConfidenceCalibrationService } from '../confidence-calibration.service';
import { FutureOutcome, BacktestHorizon } from '../early-opportunity-backtest.types';

describe('ConfidenceCalibrationService', () => {
  let service: ConfidenceCalibrationService;

  beforeEach(() => {
    service = new ConfidenceCalibrationService();
  });

  const makeOutcome = (returnPct: number): FutureOutcome => ({
    ticker: 'THYAO.IS',
    decisionDate: '2024-01-15T23:59:59.000Z',
    outcomes: [{
      horizon: '3M' as BacktestHorizon,
      horizonDays: 90,
      entryPrice: 100,
      exitPrice: 100 + returnPct,
      absoluteReturn: returnPct,
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

  it('should classify samples into buckets', () => {
    const outcomes = [makeOutcome(10), makeOutcome(15), makeOutcome(-5), makeOutcome(20)];
    const confidenceScores = [
      { ticker: 'THYAO.IS', decisionDate: '2024-01-15T23:59:59.000Z', confidence: 80 },
      { ticker: 'THYAO.IS', decisionDate: '2024-01-15T23:59:59.000Z', confidence: 75 },
      { ticker: 'THYAO.IS', decisionDate: '2024-01-15T23:59:59.000Z', confidence: 30 },
      { ticker: 'THYAO.IS', decisionDate: '2024-01-15T23:59:59.000Z', confidence: 85 },
    ];
    const result = service.calibrate(outcomes, confidenceScores);
    expect(result.buckets).toHaveLength(3);
    expect(result.overallSampleCount).toBeGreaterThan(0);
  });

  describe('classifySampleQuality', () => {
    it('should return INSUFFICIENT_SAMPLE for < 10', () => {
      const result = service.classifySampleQuality(5);
      expect(result.label).toBe('INSUFFICIENT_SAMPLE');
    });

    it('should return LOW_CONFIDENCE for 10-29', () => {
      const result = service.classifySampleQuality(20);
      expect(result.label).toBe('LOW_CONFIDENCE');
    });

    it('should return MODERATE_CONFIDENCE for 30-99', () => {
      const result = service.classifySampleQuality(50);
      expect(result.label).toBe('MODERATE_CONFIDENCE');
    });

    it('should return STRONGER_STATISTICAL_SIGNAL for 100+', () => {
      const result = service.classifySampleQuality(150);
      expect(result.label).toBe('STRONGER_STATISTICAL_SIGNAL');
    });
  });
});