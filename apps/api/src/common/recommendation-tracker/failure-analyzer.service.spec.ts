import { FailureAnalyzerService } from './failure-analyzer.service';
import {
  RecommendationRecord,
  RecommendationStatus,
  RecommendationOutcome,
  MarketRegime,
  FailureType,
  FailureSeverity,
} from './types';

describe('FailureAnalyzerService', () => {
  let service: FailureAnalyzerService;

  beforeEach(() => {
    service = new FailureAnalyzerService();
  });

  function createRecommendation(overrides: Partial<RecommendationRecord> = {}): RecommendationRecord {
    return {
      id: 'rec-1',
      stockSymbol: 'THYAO',
      stockName: 'Turk Hava Yollari',
      status: RecommendationStatus.FINAL_OUTCOME,
      outcome: RecommendationOutcome.WINNER,
      entryPrice: 100,
      entryDate: '2026-01-01T00:00:00.000Z',
      entryEliteScore: 75,
      entryConfidence: 0.8,
      entryConsensusScore: 70,
      strategyUsed: 'elite-score',
      marketRegime: MarketRegime.BULL,
      timeframeConsensus: 'balanced',
      actualReturn: 15,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-15T00:00:00.000Z',
      ...overrides,
    };
  }

  describe('analyzeFailures', () => {
    it('should analyze all failures for each recommendation', () => {
      const recs = [
        createRecommendation({ holdingPeriodDays: 60, actualReturn: -10, entryEliteScore: 70 }),
      ];
      const results = service.analyzeFailures(recs);
      expect(results).toHaveLength(1);
      expect(results[0].failures).toBeDefined();
      expect(results[0].overallRiskScore).toBeDefined();
    });

    it('should return empty for empty input', () => {
      expect(service.analyzeFailures([])).toEqual([]);
    });
  });

  describe('detectLateSignals', () => {
    it('should detect late signals', () => {
      const recs = [
        createRecommendation({ holdingPeriodDays: 45 }),
        createRecommendation({ id: 'rec-2', holdingPeriodDays: 10 }),
      ];
      const failures = service.detectLateSignals(recs);
      expect(failures).toHaveLength(1);
      expect(failures[0].type).toBe(FailureType.LATE_SIGNAL);
    });

    it('should detect high severity for very late signals', () => {
      const recs = [createRecommendation({ holdingPeriodDays: 70 })];
      const failures = service.detectLateSignals(recs);
      expect(failures[0].severity).toBe(FailureSeverity.HIGH);
    });
  });

  describe('detectFalsePositives', () => {
    it('should detect false positives', () => {
      const recs = [
        createRecommendation({ entryEliteScore: 70, actualReturn: -10 }),
        createRecommendation({ id: 'rec-2', entryEliteScore: 30, actualReturn: -5 }),
      ];
      const failures = service.detectFalsePositives(recs);
      expect(failures).toHaveLength(1);
      expect(failures[0].type).toBe(FailureType.FALSE_POSITIVE);
    });

    it('should detect critical severity for severe losses', () => {
      const recs = [createRecommendation({ entryEliteScore: 70, actualReturn: -20 })];
      const failures = service.detectFalsePositives(recs);
      expect(failures[0].severity).toBe(FailureSeverity.CRITICAL);
    });
  });

  describe('detectFalseNegatives', () => {
    it('should detect false negatives', () => {
      const recs = [
        createRecommendation({ entryEliteScore: 30, actualReturn: 15 }),
        createRecommendation({ id: 'rec-2', entryEliteScore: 70, actualReturn: 5 }),
      ];
      const failures = service.detectFalseNegatives(recs);
      expect(failures).toHaveLength(1);
      expect(failures[0].type).toBe(FailureType.FALSE_NEGATIVE);
    });
  });

  describe('detectWeakConfirmations', () => {
    it('should detect weak confirmations', () => {
      const recs = [
        createRecommendation({ entryConsensusScore: 20, entryConfidence: 0.3 }),
        createRecommendation({ id: 'rec-2', entryConsensusScore: 70, entryConfidence: 0.8 }),
      ];
      const failures = service.detectWeakConfirmations(recs);
      expect(failures).toHaveLength(1);
      expect(failures[0].type).toBe(FailureType.WEAK_CONFIRMATION);
    });
  });

  describe('detectHighRiskSignals', () => {
    it('should detect high risk signals', () => {
      const recs = [
        createRecommendation({ marketRegime: MarketRegime.HIGH_VOLATILITY }),
        createRecommendation({ id: 'rec-2', marketRegime: MarketRegime.BULL }),
      ];
      const failures = service.detectHighRiskSignals(recs);
      expect(failures).toHaveLength(1);
      expect(failures[0].type).toBe(FailureType.HIGH_RISK_SIGNAL);
    });

    it('should detect bear market as high risk', () => {
      const recs = [createRecommendation({ marketRegime: MarketRegime.BEAR })];
      const failures = service.detectHighRiskSignals(recs);
      expect(failures).toHaveLength(1);
    });
  });

  describe('detectPoorTiming', () => {
    it('should detect poor timing', () => {
      const recs = [
        createRecommendation({ actualReturn: -10, maxDrawdown: 30 }),
      ];
      const failures = service.detectPoorTiming(recs);
      expect(failures).toHaveLength(1);
      expect(failures[0].type).toBe(FailureType.POOR_TIMING);
    });

    it('should not detect poor timing for good return/drawdown ratio', () => {
      const recs = [
        createRecommendation({ actualReturn: 10, maxDrawdown: 5 }),
      ];
      const failures = service.detectPoorTiming(recs);
      expect(failures).toHaveLength(0);
    });
  });

  describe('calculateFailureSeverity', () => {
    it('should calculate severity based on impact', () => {
      expect(service.calculateFailureSeverity({ type: FailureType.LATE_SIGNAL, severity: FailureSeverity.LOW, description: '', descriptionTr: '', impact: 0.9, indicators: [] })).toBe(FailureSeverity.CRITICAL);
      expect(service.calculateFailureSeverity({ type: FailureType.LATE_SIGNAL, severity: FailureSeverity.LOW, description: '', descriptionTr: '', impact: 0.6, indicators: [] })).toBe(FailureSeverity.HIGH);
      expect(service.calculateFailureSeverity({ type: FailureType.LATE_SIGNAL, severity: FailureSeverity.LOW, description: '', descriptionTr: '', impact: 0.3, indicators: [] })).toBe(FailureSeverity.MEDIUM);
      expect(service.calculateFailureSeverity({ type: FailureType.LATE_SIGNAL, severity: FailureSeverity.LOW, description: '', descriptionTr: '', impact: 0.1, indicators: [] })).toBe(FailureSeverity.LOW);
    });
  });
});
