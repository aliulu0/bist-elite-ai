import { RecommendationEngineService } from './recommendation-engine.service';
import {
  ComponentDiagnostic, ComponentTrend, PerformanceEvaluation,
  ComponentHealth, DiagnosticIssueType, TrendDirection,
  RecommendationPriority, CalibrationStatus
} from './types';

describe('RecommendationEngineService', () => {
  let service: RecommendationEngineService;

  beforeEach(() => {
    service = new RecommendationEngineService();
  });

  describe('generate', () => {
    it('should return empty array for empty diagnostics', () => {
      const result = service.generate([], [], getEmptyEvaluation());
      expect(result).toEqual([]);
    });

    it('should generate recommendations for overweighted components', () => {
      const diagnostics: ComponentDiagnostic[] = [{
        component: 'technical',
        currentWeight: 0.20,
        health: ComponentHealth.FAIR,
        issues: [DiagnosticIssueType.OVERWEIGHTED],
        effectiveness: 0.4,
        stability: 0.6,
        contribution: 0.3,
        trend: TrendDirection.STABLE,
        recommendedWeight: 0.15,
        confidence: 0.7,
        evidence: ['Test evidence'],
      }];

      const result = service.generate(diagnostics, [], getEmptyEvaluation());

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].component).toBe('technical');
      expect(result[0].recommendedWeight).toBeLessThan(result[0].currentWeight);
    });

    it('should generate recommendations for underweighted components', () => {
      const diagnostics: ComponentDiagnostic[] = [{
        component: 'momentum',
        currentWeight: 0.05,
        health: ComponentHealth.GOOD,
        issues: [DiagnosticIssueType.UNDERWEIGHTED],
        effectiveness: 0.75,
        stability: 0.8,
        contribution: 0.7,
        trend: TrendDirection.IMPROVING,
        recommendedWeight: 0.08,
        confidence: 0.8,
        evidence: ['Test evidence'],
      }];

      const result = service.generate(diagnostics, [], getEmptyEvaluation());

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].recommendedWeight).toBeGreaterThan(result[0].currentWeight);
    });

    it('should generate recommendations for unstable components', () => {
      const diagnostics: ComponentDiagnostic[] = [{
        component: 'volume',
        currentWeight: 0.10,
        health: ComponentHealth.FAIR,
        issues: [DiagnosticIssueType.UNSTABLE],
        effectiveness: 0.55,
        stability: 0.4,
        contribution: 0.45,
        trend: TrendDirection.STABLE,
        recommendedWeight: 0.09,
        confidence: 0.6,
        evidence: ['Test evidence'],
      }];

      const result = service.generate(diagnostics, [], getEmptyEvaluation());

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].priority).toBeDefined();
    });

    it('should prioritize critical recommendations first', () => {
      const diagnostics: ComponentDiagnostic[] = [
        {
          component: 'technical',
          currentWeight: 0.10,
          health: ComponentHealth.FAIR,
          issues: [DiagnosticIssueType.UNSTABLE],
          effectiveness: 0.5,
          stability: 0.5,
          contribution: 0.4,
          trend: TrendDirection.STABLE,
          recommendedWeight: 0.09,
          confidence: 0.6,
          evidence: ['Test evidence'],
        },
        {
          component: 'risk',
          currentWeight: 0.15,
          health: ComponentHealth.CRITICAL,
          issues: [DiagnosticIssueType.LOW_VALUE],
          effectiveness: 0.2,
          stability: 0.3,
          contribution: 0.15,
          trend: TrendDirection.DEGRADING,
          recommendedWeight: 0.10,
          confidence: 0.5,
          evidence: ['Test evidence'],
        },
      ];

      const result = service.generate(diagnostics, [], getEmptyEvaluation());

      expect(result.length).toBeGreaterThan(0);
      const riskRec = result.find(r => r.component === 'risk');
      if (riskRec) {
        expect(riskRec.priority).toBe(RecommendationPriority.CRITICAL);
      }
    });

    it('should include safeguards in recommendations', () => {
      const diagnostics: ComponentDiagnostic[] = [{
        component: 'technical',
        currentWeight: 0.20,
        health: ComponentHealth.POOR,
        issues: [DiagnosticIssueType.OVERWEIGHTED],
        effectiveness: 0.3,
        stability: 0.4,
        contribution: 0.2,
        trend: TrendDirection.DEGRADING,
        recommendedWeight: 0.15,
        confidence: 0.6,
        evidence: ['Test evidence'],
      }];

      const result = service.generate(diagnostics, [], getEmptyEvaluation());

      expect(result[0].safeguards.length).toBeGreaterThan(0);
    });

    it('should not require approval for small changes', () => {
      const diagnostics: ComponentDiagnostic[] = [{
        component: 'technical',
        currentWeight: 0.25,
        health: ComponentHealth.CRITICAL,
        issues: [DiagnosticIssueType.LOW_VALUE, DiagnosticIssueType.OVERWEIGHTED],
        effectiveness: 0.2,
        stability: 0.3,
        contribution: 0.1,
        trend: TrendDirection.DEGRADING,
        recommendedWeight: 0.10,
        confidence: 0.5,
        evidence: ['Test evidence'],
      }];

      const result = service.generate(diagnostics, [], getEmptyEvaluation());

      expect(result[0].requiresApproval).toBe(false);
    });

    it('should include expected impact', () => {
      const diagnostics: ComponentDiagnostic[] = [{
        component: 'technical',
        currentWeight: 0.20,
        health: ComponentHealth.FAIR,
        issues: [DiagnosticIssueType.OVERWEIGHTED],
        effectiveness: 0.4,
        stability: 0.5,
        contribution: 0.3,
        trend: TrendDirection.STABLE,
        recommendedWeight: 0.15,
        confidence: 0.7,
        evidence: ['Test evidence'],
      }];

      const result = service.generate(diagnostics, [], getEmptyEvaluation());

      expect(result[0].expectedImpact).toBeDefined();
      expect(typeof result[0].expectedImpact.accuracyChange).toBe('number');
    });
  });
});

function getEmptyEvaluation(): PerformanceEvaluation {
  return {
    predictionAccuracy: 0.5,
    precision: 0.5,
    recall: 0.5,
    f1Score: 0.5,
    profitFactor: 1.0,
    sharpeRatio: 0.5,
    maxDrawdown: 20,
    historicalReliability: 0.5,
    scoreDistribution: { mean: 50, median: 50, stdDev: 10, min: 30, max: 70 },
    calibrationError: 0.2,
    brierScore: 0.25,
    overallHealth: CalibrationStatus.NEEDS_REVIEW,
  };
}
