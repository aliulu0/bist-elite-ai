import { Injectable } from '@nestjs/common';
import {
  CalibrationInput, CalibrationSummary, CalibrationReport,
  CalibrationConfig, CALIBRATION_CONFIG_DEFAULTS, CalibrationStatus
} from './types';
import { ScoringDiagnosticsService } from './scoring-diagnostics.service';
import { PerformanceEvaluatorService } from './performance-evaluator.service';
import { TrendAnalyzerService } from './trend-analyzer.service';
import { RecommendationEngineService } from './recommendation-engine.service';
import { CalibrationReportGeneratorService } from './calibration-report-generator.service';
import { CALIBRATION_STATUS_TURKISH } from './turkish-terms';

@Injectable()
export class CalibrationOrchestrator {
  constructor(
    private readonly diagnosticsService: ScoringDiagnosticsService,
    private readonly performanceEvaluator: PerformanceEvaluatorService,
    private readonly trendAnalyzer: TrendAnalyzerService,
    private readonly recommendationEngine: RecommendationEngineService,
    private readonly reportGenerator: CalibrationReportGeneratorService
  ) {}

  async calibrate(input: CalibrationInput): Promise<CalibrationSummary> {
    const startTime = Date.now();
    const config = { ...CALIBRATION_CONFIG_DEFAULTS, ...input.config };

    const diagnostics = this.diagnosticsService.analyze(input.snapshots, config);

    const performanceEvaluation = this.performanceEvaluator.evaluate(
      input.snapshots,
      input.validationResults,
      config
    );

    const componentTrends = this.trendAnalyzer.analyze(input.snapshots, config);

    const recommendations = this.recommendationEngine.generate(
      diagnostics,
      componentTrends,
      performanceEvaluation,
      config
    );

    const overallScore = this.calculateOverallScore(
      diagnostics,
      performanceEvaluation,
      componentTrends
    );

    const overallStatus = this.determineOverallStatus(
      overallScore,
      performanceEvaluation.overallHealth,
      diagnostics
    );

    const confidence = this.calculateConfidence(
      input.snapshots.length,
      diagnostics,
      performanceEvaluation
    );

    const historicalComparison = this.compareWithPreviousPeriod(
      input.snapshots,
      config
    );

    const calibrationDuration = Date.now() - startTime;

    return {
      overallStatus,
      overallScore,
      confidence,
      componentDiagnostics: diagnostics,
      performanceEvaluation,
      componentTrends,
      recommendations,
      historicalComparison,
      generatedAt: new Date().toISOString(),
      calibrationDuration,
      disclaimer: 'Bu rapor yalnızca bilgilendirme amaçlıdır ve otomatik kalibrasyon uygulamaz.',
    };
  }

  async generateReport(summary: CalibrationSummary): Promise<CalibrationReport> {
    return this.reportGenerator.generateReport(summary);
  }

  async generateTurkishSummary(summary: CalibrationSummary): Promise<string> {
    return this.reportGenerator.generateTurkishSummary(summary);
  }

  private calculateOverallScore(
    diagnostics: any[],
    performance: any,
    trends: any[]
  ): number {
    const diagnosticScore = diagnostics.length > 0
      ? diagnostics.reduce((s, d) => {
          const componentScore = d.effectiveness * 0.4 + d.stability * 0.3 + d.contribution * 0.3;
          return s + componentScore;
        }, 0) / diagnostics.length
      : 0.5;

    const performanceScore = (
      performance.predictionAccuracy * 0.3 +
      (1 - performance.calibrationError) * 0.25 +
      (1 - performance.brierScore) * 0.15 +
      performance.historicalReliability * 0.15 +
      Math.min(1, performance.profitFactor / 3) * 0.15
    );

    const trendScore = trends.length > 0
      ? trends.reduce((s, t) => {
          if (t.direction === 'IMPROVING') return s + 0.8;
          if (t.direction === 'STABLE') return s + 0.6;
          if (t.direction === 'DEGRADING') return s + 0.3;
          return s + 0.5;
        }, 0) / trends.length
      : 0.5;

    return (diagnosticScore * 0.35 + performanceScore * 0.45 + trendScore * 0.2) * 100;
  }

  private determineOverallStatus(
    score: number,
    performanceHealth: CalibrationStatus,
    diagnostics: any[]
  ): CalibrationStatus {
    const criticalCount = diagnostics.filter(d => d.health === 'CRITICAL').length;
    if (criticalCount >= 3) return CalibrationStatus.CRITICAL;

    if (score >= 75 && performanceHealth === CalibrationStatus.HEALTHY) {
      return CalibrationStatus.HEALTHY;
    }
    if (score >= 60) return CalibrationStatus.NEEDS_REVIEW;
    if (score >= 40) return CalibrationStatus.DEGRADING;
    return CalibrationStatus.CRITICAL;
  }

  private calculateConfidence(
    sampleSize: number,
    diagnostics: any[],
    performance: any
  ): number {
    const sampleConfidence = Math.min(1, sampleSize / 200);

    const diagnosticConfidence = diagnostics.length > 0
      ? diagnostics.reduce((s, d) => s + d.confidence, 0) / diagnostics.length
      : 0;

    const performanceConfidence = (
      performance.predictionAccuracy * 0.3 +
      (1 - performance.calibrationError) * 0.3 +
      performance.historicalReliability * 0.2 +
      (1 - performance.brierScore) * 0.2
    );

    return sampleConfidence * 0.3 + diagnosticConfidence * 0.3 + performanceConfidence * 0.4;
  }

  private compareWithPreviousPeriod(
    snapshots: any[],
    config: CalibrationConfig
  ): CalibrationSummary['historicalComparison'] {
    if (snapshots.length < config.evaluationWindow.shortTerm * 2) {
      return {
        currentPeriod: { avgScore: 0, accuracy: 0, sampleSize: 0 },
        previousPeriod: { avgScore: 0, accuracy: 0, sampleSize: 0 },
        change: 0,
      };
    }

    const sorted = [...snapshots].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const midpoint = Math.floor(sorted.length / 2);
    const previousPeriod = sorted.slice(0, midpoint);
    const currentPeriod = sorted.slice(midpoint);

    const prevAvgScore = previousPeriod.reduce((s, p) => s + p.overallScore, 0) / previousPeriod.length;
    const currAvgScore = currentPeriod.reduce((s, p) => s + p.overallScore, 0) / currentPeriod.length;

    const prevAccuracy = previousPeriod.filter(p => {
      const predicted = p.overallScore >= 50 ? 1 : -1;
      const actual = p.actualOutcome >= 0 ? 1 : -1;
      return predicted === actual;
    }).length / previousPeriod.length;

    const currAccuracy = currentPeriod.filter(p => {
      const predicted = p.overallScore >= 50 ? 1 : -1;
      const actual = p.actualOutcome >= 0 ? 1 : -1;
      return predicted === actual;
    }).length / currentPeriod.length;

    return {
      currentPeriod: {
        avgScore: currAvgScore,
        accuracy: currAccuracy,
        sampleSize: currentPeriod.length,
      },
      previousPeriod: {
        avgScore: prevAvgScore,
        accuracy: prevAccuracy,
        sampleSize: previousPeriod.length,
      },
      change: currAccuracy - prevAccuracy,
    };
  }
}
