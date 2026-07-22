import {
  RECOMMENDATION_STATUS_TURKISH,
  RECOMMENDATION_OUTCOME_TURKISH,
  EVALUATION_WINDOW_TURKISH,
  FAILURE_TYPE_TURKISH,
  CONFIDENCE_LEVEL_TURKISH,
  formatCurrency,
  formatPercentage,
  formatNumber,
  getConfidenceLevel,
  generateReportHeader,
  generateReportFooter,
  generatePerformanceCommentary,
  generateFailureCommentary,
  generateMonthlySummary,
} from './turkish-terms';
import { RecommendationStatus, RecommendationOutcome, EvaluationWindow, FailureType, FailureSeverity } from './types';

describe('Turkish Terms', () => {
  describe('RECOMMENDATION_STATUS_TURKISH', () => {
    it('should map all statuses to Turkish', () => {
      expect(RECOMMENDATION_STATUS_TURKISH[RecommendationStatus.CREATED]).toBe('Olusturuldu');
      expect(RECOMMENDATION_STATUS_TURKISH[RecommendationStatus.FINAL_OUTCOME]).toBe('Nihai Sonuc');
    });
  });

  describe('RECOMMENDATION_OUTCOME_TURKISH', () => {
    it('should map all outcomes to Turkish', () => {
      expect(RECOMMENDATION_OUTCOME_TURKISH[RecommendationOutcome.WINNER]).toBe('Kazanan');
      expect(RECOMMENDATION_OUTCOME_TURKISH[RecommendationOutcome.LOSER]).toBe('Kaybeden');
      expect(RECOMMENDATION_OUTCOME_TURKISH[RecommendationOutcome.BREAKEVEN]).toBe('Basabas');
    });
  });

  describe('EVALUATION_WINDOW_TURKISH', () => {
    it('should map all windows to Turkish', () => {
      expect(EVALUATION_WINDOW_TURKISH[EvaluationWindow.ONE_DAY]).toBe('1 Gunluk');
      expect(EVALUATION_WINDOW_TURKISH[EvaluationWindow.ONE_MONTH]).toBe('1 Aylik');
      expect(EVALUATION_WINDOW_TURKISH[EvaluationWindow.SIX_MONTHS]).toBe('6 Aylik');
    });
  });

  describe('FAILURE_TYPE_TURKISH', () => {
    it('should map all failure types to Turkish', () => {
      expect(FAILURE_TYPE_TURKISH[FailureType.LATE_SIGNAL]).toBe('Gecikmis Sinyal');
      expect(FAILURE_TYPE_TURKISH[FailureType.FALSE_POSITIVE]).toBe('Yanlis Pozitif');
      expect(FAILURE_TYPE_TURKISH[FailureType.POOR_TIMING]).toBe('Zamanlama Hatasi');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency with TRY', () => {
      expect(formatCurrency(1234.56)).toBe('1234.56 TL');
      expect(formatCurrency(0)).toBe('0.00 TL');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage', () => {
      expect(formatPercentage(55.5)).toBe('%55.50');
      expect(formatPercentage(0)).toBe('%0.00');
    });
  });

  describe('formatNumber', () => {
    it('should format number with decimals', () => {
      expect(formatNumber(1.23456)).toBe('1.23');
      expect(formatNumber(1.23456, 3)).toBe('1.235');
    });
  });

  describe('getConfidenceLevel', () => {
    it('should return correct levels', () => {
      expect(getConfidenceLevel(0.95)).toBe('VERY_HIGH');
      expect(getConfidenceLevel(0.75)).toBe('HIGH');
      expect(getConfidenceLevel(0.55)).toBe('MEDIUM');
      expect(getConfidenceLevel(0.35)).toBe('LOW');
      expect(getConfidenceLevel(0.1)).toBe('VERY_LOW');
    });
  });

  describe('generateReportHeader', () => {
    it('should generate report header', () => {
      const header = generateReportHeader('TEST REPORT');
      expect(header).toContain('TEST REPORT');
      expect(header).toContain('=');
    });
  });

  describe('generateReportFooter', () => {
    it('should generate report footer with disclaimer', () => {
      const footer = generateReportFooter();
      expect(footer).toContain('bilgilendirme');
      expect(footer).toContain('-');
    });
  });

  describe('generatePerformanceCommentary', () => {
    it('should generate positive commentary for good metric', () => {
      const commentary = generatePerformanceCommentary('winRate', 65, 55);
      expect(commentary).toContain('Kazanma Orani');
      expect(commentary).toContain('Olumlu');
    });

    it('should generate negative commentary for bad metric', () => {
      const commentary = generatePerformanceCommentary('winRate', 35, 55);
      expect(commentary).toContain('Kazanma Orani');
      expect(commentary).toContain('Dikkatli');
    });
  });

  describe('generateFailureCommentary', () => {
    it('should generate commentary for each failure type', () => {
      const late = generateFailureCommentary(FailureType.LATE_SIGNAL, 'THYAO');
      expect(late).toContain('THYAO');
      expect(late).toContain('Gecikmis Sinyal');

      const fp = generateFailureCommentary(FailureType.FALSE_POSITIVE, 'GARAN');
      expect(fp).toContain('GARAN');
      expect(fp).toContain('Yanlis Pozitif');
    });
  });

  describe('generateMonthlySummary', () => {
    it('should generate monthly summary', () => {
      const summary = generateMonthlySummary(2026, 7, 10, 60, 5.5);
      expect(summary).toContain('2026');
      expect(summary).toContain('10');
      expect(summary).toContain('%60.00');
    });
  });
});
