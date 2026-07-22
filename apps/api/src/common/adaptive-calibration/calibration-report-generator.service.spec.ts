import { CalibrationReportGeneratorService } from './calibration-report-generator.service';
import {
  CalibrationSummary, CalibrationStatus, ComponentHealth, TrendDirection,
  DiagnosticIssueType, ComponentTrend, TrendAnalysisPoint
} from './types';

describe('CalibrationReportGeneratorService', () => {
  let service: CalibrationReportGeneratorService;

  beforeEach(() => {
    service = new CalibrationReportGeneratorService();
  });

  describe('generateTurkishSummary', () => {
    it('should generate summary for HEALTHY status', () => {
      const summary = getGoodSummary();
      const result = service.generateTurkishSummary(summary);

      expect(result).toContain('Kalibrasyon Özeti');
      expect(result).toContain('Genel Durum');
      expect(result).toContain('Genel Skor');
      expect(result).toContain('Bileşen Durumları');
    });

    it('should generate summary for NEEDS_REVIEW status', () => {
      const summary = getNeedReviewSummary();
      const result = service.generateTurkishSummary(summary);

      expect(result).toContain('Kalibrasyon Özeti');
      expect(result).toContain('Genel Durum');
    });

    it('should generate summary for CRITICAL status', () => {
      const summary = getCriticalSummary();
      const result = service.generateTurkishSummary(summary);

      expect(result).toContain('Kalibrasyon Özeti');
    });

    it('should include recommendations in summary', () => {
      const summary = getNeedReviewSummary();
      const result = service.generateTurkishSummary(summary);

      expect(result).toContain('Öneriler');
    });
  });

  describe('generateReport', () => {
    it('should generate report with component rankings', () => {
      const summary = getGoodSummary();
      const result = service.generateReport(summary);

      expect(result.summary).toBe(summary);
      expect(result.detailedAnalysis.componentRankings).toBeDefined();
      expect(Array.isArray(result.detailedAnalysis.componentRankings)).toBe(true);
      expect(result.detailedAnalysis.componentRankings.length).toBe(3);
      expect(result.detailedAnalysis.componentRankings[0].component).toBeDefined();
      expect(result.detailedAnalysis.componentRankings[0].weight).toBeDefined();
    });

    it('should generate report with improvement opportunities', () => {
      const summary = getNeedReviewSummary();
      const result = service.generateReport(summary);

      expect(result.detailedAnalysis.improvementOpportunities).toBeDefined();
      expect(Array.isArray(result.detailedAnalysis.improvementOpportunities)).toBe(true);
    });

    it('should generate report with risk assessment', () => {
      const summary = getCriticalSummary();
      const result = service.generateReport(summary);

      expect(result.detailedAnalysis.riskAssessment).toBeDefined();
      expect(result.detailedAnalysis.riskAssessment.overallRisk).toBeDefined();
      expect(typeof result.detailedAnalysis.riskAssessment.overallRisk).toBe('number');
      expect(result.detailedAnalysis.riskAssessment.riskFactors).toBeDefined();
      expect(Array.isArray(result.detailedAnalysis.riskAssessment.riskFactors)).toBe(true);
    });

    it('should generate report with disclaimer and timestamp', () => {
      const summary = getGoodSummary();
      const result = service.generateReport(summary);

      expect(result.generatedAt).toBeDefined();
      expect(result.disclaimer).toBeDefined();
    });
  });
});

function makeDataPoints(values: number[]): TrendAnalysisPoint[] {
  return values.map((v, i) => ({
    timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
    value: v,
    sampleSize: 1,
  }));
}

function getGoodSummary(): CalibrationSummary {
  return {
    overallStatus: CalibrationStatus.HEALTHY,
    overallScore: 75,
    confidence: 0.8,
    componentDiagnostics: [
      {
        component: 'technical',
        currentWeight: 0.10,
        health: ComponentHealth.GOOD,
        issues: [],
        effectiveness: 0.7,
        stability: 0.75,
        contribution: 0.72,
        trend: TrendDirection.STABLE,
        recommendedWeight: 0.10,
        confidence: 0.8,
        evidence: ['Test evidence'],
      },
      {
        component: 'momentum',
        currentWeight: 0.10,
        health: ComponentHealth.GOOD,
        issues: [],
        effectiveness: 0.68,
        stability: 0.72,
        contribution: 0.70,
        trend: TrendDirection.IMPROVING,
        recommendedWeight: 0.11,
        confidence: 0.75,
        evidence: ['Test evidence'],
      },
      {
        component: 'risk',
        currentWeight: 0.10,
        health: ComponentHealth.FAIR,
        issues: [],
        effectiveness: 0.55,
        stability: 0.60,
        contribution: 0.58,
        trend: TrendDirection.STABLE,
        recommendedWeight: 0.09,
        confidence: 0.65,
        evidence: ['Test evidence'],
      },
    ],
    recommendations: [],
    performanceEvaluation: {
      predictionAccuracy: 0.68,
      precision: 0.72,
      recall: 0.65,
      f1Score: 0.68,
      profitFactor: 1.8,
      sharpeRatio: 1.5,
      maxDrawdown: 15,
      historicalReliability: 0.70,
      scoreDistribution: { mean: 62, median: 60, stdDev: 12, min: 35, max: 85 },
      calibrationError: 0.15,
      brierScore: 0.20,
      overallHealth: CalibrationStatus.HEALTHY,
    },
    componentTrends: [
      {
        component: 'technical',
        direction: TrendDirection.STABLE,
        strength: 0.7,
        dataPoints: makeDataPoints([60, 61, 60, 62, 60, 61, 60, 62, 60, 61]),
        slope: 0.01,
        rSquared: 0.75,
        forecast: 61,
        confidence: 0.7,
      },
      {
        component: 'momentum',
        direction: TrendDirection.IMPROVING,
        strength: 0.8,
        dataPoints: makeDataPoints([55, 57, 58, 60, 62, 63, 65, 66, 68, 70]),
        slope: 0.05,
        rSquared: 0.80,
        forecast: 71,
        confidence: 0.75,
      },
      {
        component: 'risk',
        direction: TrendDirection.STABLE,
        strength: 0.5,
        dataPoints: makeDataPoints([58, 57, 56, 55, 54, 55, 56, 55, 54, 55]),
        slope: -0.02,
        rSquared: 0.60,
        forecast: 55,
        confidence: 0.6,
      },
    ],
    historicalComparison: {
      currentPeriod: { avgScore: 65, accuracy: 0.72, sampleSize: 50 },
      previousPeriod: { avgScore: 58, accuracy: 0.62, sampleSize: 50 },
      change: 0.10,
    },
    generatedAt: '2025-01-15T10:00:00Z',
    calibrationDuration: 150,
    disclaimer: 'Test disclaimer',
  };
}

function getNeedReviewSummary(): CalibrationSummary {
  return {
    ...getGoodSummary(),
    overallStatus: CalibrationStatus.NEEDS_REVIEW,
    overallScore: 55,
    confidence: 0.6,
    componentDiagnostics: [
      {
        component: 'technical',
        currentWeight: 0.20,
        health: ComponentHealth.FAIR,
        issues: [DiagnosticIssueType.OVERWEIGHTED],
        effectiveness: 0.40,
        stability: 0.50,
        contribution: 0.35,
        trend: TrendDirection.DEGRADING,
        recommendedWeight: 0.15,
        confidence: 0.55,
        evidence: ['Overweighted'],
      },
      {
        component: 'momentum',
        currentWeight: 0.05,
        health: ComponentHealth.GOOD,
        issues: [DiagnosticIssueType.UNDERWEIGHTED],
        effectiveness: 0.72,
        stability: 0.70,
        contribution: 0.68,
        trend: TrendDirection.IMPROVING,
        recommendedWeight: 0.08,
        confidence: 0.70,
        evidence: ['Underweighted'],
      },
      {
        component: 'risk',
        currentWeight: 0.10,
        health: ComponentHealth.FAIR,
        issues: [],
        effectiveness: 0.50,
        stability: 0.55,
        contribution: 0.52,
        trend: TrendDirection.STABLE,
        recommendedWeight: 0.09,
        confidence: 0.60,
        evidence: ['Fair performance'],
      },
    ],
  };
}

function getCriticalSummary(): CalibrationSummary {
  return {
    ...getGoodSummary(),
    overallStatus: CalibrationStatus.CRITICAL,
    overallScore: 30,
    confidence: 0.4,
    componentDiagnostics: [
      {
        component: 'technical',
        currentWeight: 0.25,
        health: ComponentHealth.CRITICAL,
        issues: [DiagnosticIssueType.LOW_VALUE, DiagnosticIssueType.OVERWEIGHTED],
        effectiveness: 0.20,
        stability: 0.30,
        contribution: 0.15,
        trend: TrendDirection.DEGRADING,
        recommendedWeight: 0.15,
        confidence: 0.40,
        evidence: ['Low value, overweighted'],
      },
      {
        component: 'momentum',
        currentWeight: 0.03,
        health: ComponentHealth.CRITICAL,
        issues: [DiagnosticIssueType.UNDERWEIGHTED, DiagnosticIssueType.UNSTABLE],
        effectiveness: 0.35,
        stability: 0.25,
        contribution: 0.30,
        trend: TrendDirection.DEGRADING,
        recommendedWeight: 0.08,
        confidence: 0.35,
        evidence: ['Underweighted and unstable'],
      },
      {
        component: 'risk',
        currentWeight: 0.10,
        health: ComponentHealth.POOR,
        issues: [DiagnosticIssueType.LOW_VALUE],
        effectiveness: 0.15,
        stability: 0.20,
        contribution: 0.12,
        trend: TrendDirection.DEGRADING,
        recommendedWeight: 0.08,
        confidence: 0.30,
        evidence: ['Low value'],
      },
    ],
  };
}
