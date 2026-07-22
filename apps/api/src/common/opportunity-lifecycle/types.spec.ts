import {
  OpportunityStage,
  StageTransitionReason,
  HealthLevel,
  EvolutionTrend,
  FailureCategory,
  EarlyDetectionResult,
  SignalDirection,
  LIFECYCLE_CONFIG_DEFAULTS,
  LIFECYCLE_STAGES,
} from './types';

describe('OpportunityLifecycle Types', () => {
  describe('OpportunityStage enum', () => {
    it('should have 8 stages', () => {
      expect(Object.keys(OpportunityStage)).toHaveLength(8);
    });

    it('should include DETECTED and CANCELLED', () => {
      expect(OpportunityStage.DETECTED).toBe('DETECTED');
      expect(OpportunityStage.CANCELLED).toBe('CANCELLED');
    });
  });

  describe('StageTransitionReason enum', () => {
    it('should have 10 reasons', () => {
      expect(Object.keys(StageTransitionReason)).toHaveLength(10);
    });
  });

  describe('HealthLevel enum', () => {
    it('should have 5 levels', () => {
      expect(Object.keys(HealthLevel)).toHaveLength(5);
    });
  });

  describe('EvolutionTrend enum', () => {
    it('should have 4 trends', () => {
      expect(Object.keys(EvolutionTrend)).toHaveLength(4);
    });
  });

  describe('FailureCategory enum', () => {
    it('should have 5 categories', () => {
      expect(Object.keys(FailureCategory)).toHaveLength(5);
    });
  });

  describe('EarlyDetectionResult enum', () => {
    it('should have 4 results', () => {
      expect(Object.keys(EarlyDetectionResult)).toHaveLength(4);
    });
  });

  describe('SignalDirection enum', () => {
    it('should have 3 directions', () => {
      expect(Object.keys(SignalDirection)).toHaveLength(3);
    });
  });

  describe('LIFECYCLE_CONFIG_DEFAULTS', () => {
    it('should have valid health weights summing close to 1', () => {
      const w = LIFECYCLE_CONFIG_DEFAULTS.healthWeights;
      const sum = w.scoreWeight + w.confidenceWeight + w.momentumWeight + w.riskWeight + w.stabilityWeight;
      expect(sum).toBeCloseTo(1.0, 2);
    });

    it('should have valid stage transition thresholds', () => {
      const t = LIFECYCLE_CONFIG_DEFAULTS.stageTransitions;
      expect(t.detectedToEmerging.minConfidence).toBeGreaterThan(0);
      expect(t.emergingToConfirmed.minConfirmationLevel).toBeGreaterThan(0);
    });
  });

  describe('LIFECYCLE_STAGES', () => {
    it('should have 8 stages', () => {
      expect(LIFECYCLE_STAGES).toHaveLength(8);
    });

    it('should start with DETECTED', () => {
      expect(LIFECYCLE_STAGES[0]).toBe(OpportunityStage.DETECTED);
    });
  });
});
