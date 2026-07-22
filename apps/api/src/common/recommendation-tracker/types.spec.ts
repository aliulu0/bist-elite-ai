import {
  RecommendationStatus,
  RecommendationOutcome,
  EvaluationWindow,
  FailureType,
  FailureSeverity,
  ConfidenceLevel,
  MarketRegime,
  RECOMMENDATION_TRACKER_DEFAULTS,
  getRecommendationTrackerConfig,
} from './types';

describe('Recommendation Tracker Types', () => {
  describe('RecommendationStatus', () => {
    it('should have all status values', () => {
      expect(RecommendationStatus.CREATED).toBe('CREATED');
      expect(RecommendationStatus.NOTIFICATION_SENT).toBe('NOTIFICATION_SENT');
      expect(RecommendationStatus.VIRTUAL_ENTRY).toBe('VIRTUAL_ENTRY');
      expect(RecommendationStatus.HOLDING).toBe('HOLDING');
      expect(RecommendationStatus.TARGET_REACHED).toBe('TARGET_REACHED');
      expect(RecommendationStatus.STOP_CONDITION).toBe('STOP_CONDITION');
      expect(RecommendationStatus.VIRTUAL_EXIT).toBe('VIRTUAL_EXIT');
      expect(RecommendationStatus.FINAL_OUTCOME).toBe('FINAL_OUTCOME');
      expect(RecommendationStatus.CANCELLED).toBe('CANCELLED');
    });
  });

  describe('RecommendationOutcome', () => {
    it('should have all outcome values', () => {
      expect(RecommendationOutcome.WINNER).toBe('WINNER');
      expect(RecommendationOutcome.LOSER).toBe('LOSER');
      expect(RecommendationOutcome.BREAKEVEN).toBe('BREAKEVEN');
      expect(RecommendationOutcome.PENDING).toBe('PENDING');
      expect(RecommendationOutcome.CANCELLED).toBe('CANCELLED');
    });
  });

  describe('EvaluationWindow', () => {
    it('should have all window values', () => {
      expect(EvaluationWindow.ONE_DAY).toBe('1D');
      expect(EvaluationWindow.THREE_DAYS).toBe('3D');
      expect(EvaluationWindow.ONE_WEEK).toBe('1W');
      expect(EvaluationWindow.TWO_WEEKS).toBe('2W');
      expect(EvaluationWindow.ONE_MONTH).toBe('1M');
      expect(EvaluationWindow.THREE_MONTHS).toBe('3M');
      expect(EvaluationWindow.SIX_MONTHS).toBe('6M');
    });
  });

  describe('FailureType', () => {
    it('should have all failure types', () => {
      expect(FailureType.LATE_SIGNAL).toBe('LATE_SIGNAL');
      expect(FailureType.FALSE_POSITIVE).toBe('FALSE_POSITIVE');
      expect(FailureType.FALSE_NEGATIVE).toBe('FALSE_NEGATIVE');
      expect(FailureType.WEAK_CONFIRMATION).toBe('WEAK_CONFIRMATION');
      expect(FailureType.HIGH_RISK_SIGNAL).toBe('HIGH_RISK_SIGNAL');
      expect(FailureType.POOR_TIMING).toBe('POOR_TIMING');
    });
  });

  describe('FailureSeverity', () => {
    it('should have all severity levels', () => {
      expect(FailureSeverity.LOW).toBe('LOW');
      expect(FailureSeverity.MEDIUM).toBe('MEDIUM');
      expect(FailureSeverity.HIGH).toBe('HIGH');
      expect(FailureSeverity.CRITICAL).toBe('CRITICAL');
    });
  });

  describe('ConfidenceLevel', () => {
    it('should have all confidence levels', () => {
      expect(ConfidenceLevel.VERY_HIGH).toBe('VERY_HIGH');
      expect(ConfidenceLevel.HIGH).toBe('HIGH');
      expect(ConfidenceLevel.MEDIUM).toBe('MEDIUM');
      expect(ConfidenceLevel.LOW).toBe('LOW');
      expect(ConfidenceLevel.VERY_LOW).toBe('VERY_LOW');
    });
  });

  describe('MarketRegime', () => {
    it('should have all market regimes', () => {
      expect(MarketRegime.BULL).toBe('BULL');
      expect(MarketRegime.BEAR).toBe('BEAR');
      expect(MarketRegime.SIDEWAYS).toBe('SIDEWAYS');
      expect(MarketRegime.HIGH_VOLATILITY).toBe('HIGH_VOLATILITY');
      expect(MarketRegime.LOW_VOLATILITY).toBe('LOW_VOLATILITY');
    });
  });

  describe('RECOMMENDATION_TRACKER_DEFAULTS', () => {
    it('should have valid defaults', () => {
      expect(RECOMMENDATION_TRACKER_DEFAULTS.enabled).toBe(true);
      expect(RECOMMENDATION_TRACKER_DEFAULTS.evaluationWindows).toHaveLength(7);
      expect(RECOMMENDATION_TRACKER_DEFAULTS.successThresholds.minWinRate).toBe(55);
      expect(RECOMMENDATION_TRACKER_DEFAULTS.alertThresholds.lowWinRate).toBe(40);
      expect(RECOMMENDATION_TRACKER_DEFAULTS.metricWeights.returnWeight).toBe(0.35);
      expect(RECOMMENDATION_TRACKER_DEFAULTS.tracking.maxHistorySize).toBe(10000);
    });
  });

  describe('getRecommendationTrackerConfig', () => {
    it('should return defaults when no overrides', () => {
      const config = getRecommendationTrackerConfig();
      expect(config).toEqual(RECOMMENDATION_TRACKER_DEFAULTS);
    });

    it('should merge overrides with defaults', () => {
      const config = getRecommendationTrackerConfig({
        enabled: false,
        successThresholds: { minWinRate: 60, minProfitFactor: 1.5, minSharpeRatio: 1.2, maxDrawdown: 15 },
      });
      expect(config.enabled).toBe(false);
      expect(config.successThresholds.minWinRate).toBe(60);
      expect(config.successThresholds.minProfitFactor).toBe(1.5);
      expect(config.alertThresholds.lowWinRate).toBe(40);
    });
  });
});
