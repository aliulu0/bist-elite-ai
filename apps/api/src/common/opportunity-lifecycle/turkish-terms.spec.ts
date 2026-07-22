import {
  OpportunityStage,
  StageTransitionReason,
  HealthLevel,
  EvolutionTrend,
  FailureCategory,
  EarlyDetectionResult,
  SignalDirection,
} from './types';
import {
  OPPORTUNITY_STAGE_TURKISH,
  TRANSITION_REASON_TURKISH,
  HEALTH_LEVEL_TURKISH,
  EVOLUTION_TREND_TURKISH,
  FAILURE_CATEGORY_TURKISH,
  EARLY_DETECTION_RESULT_TURKISH,
  SIGNAL_DIRECTION_TURKISH,
  METRIC_NAMES_TURKISH,
  formatScoreTurkish,
  formatPercentageTurkish,
  formatDurationTurkish,
  getStageIconTurkish,
  REPORT_HEADER_TURKISH,
  REPORT_FOOTER_TURKISH,
} from './turkish-terms';

describe('OpportunityLifecycle Turkish Terms', () => {
  describe('OPPORTUNITY_STAGE_TURKISH', () => {
    it('should have translations for all 8 stages', () => {
      expect(Object.keys(OPPORTUNITY_STAGE_TURKISH)).toHaveLength(8);
    });

    it('should translate DETECTED', () => {
      expect(OPPORTUNITY_STAGE_TURKISH[OpportunityStage.DETECTED]).toBe('Tespit Edildi');
    });
  });

  describe('TRANSITION_REASON_TURKISH', () => {
    it('should have translations for all 10 reasons', () => {
      expect(Object.keys(TRANSITION_REASON_TURKISH)).toHaveLength(10);
    });
  });

  describe('HEALTH_LEVEL_TURKISH', () => {
    it('should have translations for all 5 levels', () => {
      expect(Object.keys(HEALTH_LEVEL_TURKISH)).toHaveLength(5);
    });
  });

  describe('EVOLUTION_TREND_TURKISH', () => {
    it('should have translations for all 4 trends', () => {
      expect(Object.keys(EVOLUTION_TREND_TURKISH)).toHaveLength(4);
    });
  });

  describe('FAILURE_CATEGORY_TURKISH', () => {
    it('should have translations for all 5 categories', () => {
      expect(Object.keys(FAILURE_CATEGORY_TURKISH)).toHaveLength(5);
    });
  });

  describe('EARLY_DETECTION_RESULT_TURKISH', () => {
    it('should have translations for all 4 results', () => {
      expect(Object.keys(EARLY_DETECTION_RESULT_TURKISH)).toHaveLength(4);
    });
  });

  describe('SIGNAL_DIRECTION_TURKISH', () => {
    it('should have translations for all 3 directions', () => {
      expect(Object.keys(SIGNAL_DIRECTION_TURKISH)).toHaveLength(3);
    });
  });

  describe('formatScoreTurkish', () => {
    it('should format to 2 decimal places', () => {
      expect(formatScoreTurkish(0.5)).toBe('0.50');
      expect(formatScoreTurkish(1.234)).toBe('1.23');
    });
  });

  describe('formatPercentageTurkish', () => {
    it('should format 0.5 as %50.0', () => {
      expect(formatPercentageTurkish(0.5)).toBe('%50.0');
    });
  });

  describe('formatDurationTurkish', () => {
    it('should format hours for < 1 day', () => {
      expect(formatDurationTurkish(0.5)).toContain('saat');
    });

    it('should format days for >= 1 day', () => {
      expect(formatDurationTurkish(3)).toBe('3 gun');
    });

    it('should handle exactly 1 day', () => {
      expect(formatDurationTurkish(1)).toBe('1 gun');
    });
  });

  describe('getStageIconTurkish', () => {
    it('should return icons for all stages', () => {
      expect(getStageIconTurkish(OpportunityStage.DETECTED)).toBe('[*]');
      expect(getStageIconTurkish(OpportunityStage.MATURE)).toBe('[M]');
      expect(getStageIconTurkish(OpportunityStage.CANCELLED)).toBe('[!]');
    });
  });

  describe('Report constants', () => {
    it('should have header and footer', () => {
      expect(REPORT_HEADER_TURKISH).toContain('Firsat');
      expect(REPORT_FOOTER_TURKISH).toContain('Rapor Sonu');
    });
  });
});
