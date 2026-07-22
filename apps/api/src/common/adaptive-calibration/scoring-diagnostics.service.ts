import { Injectable } from '@nestjs/common';
import {
  ComponentDiagnostic, ComponentHealth, DiagnosticIssueType,
  TrendDirection, ScoringSnapshot, CalibrationConfig, CALIBRATION_CONFIG_DEFAULTS
} from './types';

@Injectable()
export class ScoringDiagnosticsService {
  analyze(
    snapshots: ScoringSnapshot[],
    config?: Partial<CalibrationConfig>
  ): ComponentDiagnostic[] {
    const cfg = { ...CALIBRATION_CONFIG_DEFAULTS, ...config };

    if (!snapshots || snapshots.length === 0) {
      return [];
    }

    const components = this.extractComponents(snapshots);
    return components.map(component =>
      this.analyzeComponent(component, snapshots, cfg)
    );
  }

  private extractComponents(snapshots: ScoringSnapshot[]): string[] {
    const componentSet = new Set<string>();
    for (const snapshot of snapshots) {
      for (const key of Object.keys(snapshot.componentScores)) {
        componentSet.add(key);
      }
    }
    return Array.from(componentSet);
  }

  private analyzeComponent(
    component: string,
    snapshots: ScoringSnapshot[],
    config: CalibrationConfig
  ): ComponentDiagnostic {
    const componentScores = snapshots
      .map(s => s.componentScores[component])
      .filter((v): v is number => v !== undefined);

    const componentWeights = snapshots
      .map(s => s.componentWeights[component])
      .filter((v): v is number => v !== undefined);

    const overallScores = snapshots.map(s => s.overallScore);
    const outcomes = snapshots.map(s => s.actualOutcome);

    const currentWeight = componentWeights.length > 0
      ? componentWeights[componentWeights.length - 1]
      : 0;

    const effectiveness = this.calculateEffectiveness(
      componentScores, outcomes, overallScores
    );

    const stability = this.calculateStability(componentScores);

    const contribution = this.calculateContribution(
      componentScores, outcomes
    );

    const issues = this.detectIssues(
      componentScores, componentWeights, effectiveness, stability, contribution, config
    );

    const health = this.determineHealth(effectiveness, stability, contribution, issues);

    const trend = this.determineTrend(componentScores, config.thresholds.trendSensitivity);

    const recommendedWeight = this.calculateRecommendedWeight(
      currentWeight, effectiveness, stability, contribution, trend, issues
    );

    const confidence = this.calculateConfidence(
      componentScores.length, effectiveness, stability
    );

    const evidence = this.generateEvidence(
      component, effectiveness, stability, contribution, issues, trend, config
    );

    return {
      component,
      currentWeight,
      health,
      issues,
      effectiveness,
      stability,
      contribution,
      trend,
      recommendedWeight,
      confidence,
      evidence,
    };
  }

  private calculateEffectiveness(
    scores: number[],
    outcomes: number[],
    overallScores: number[]
  ): number {
    if (scores.length < 2 || outcomes.length < 2) return 0.5;

    const correctPredictions = scores.filter((score, i) => {
      const predictedDirection = score >= 50 ? 1 : -1;
      const actualDirection = outcomes[i] >= 0 ? 1 : -1;
      return predictedDirection === actualDirection;
    }).length;

    const accuracy = correctPredictions / scores.length;

    const scoreOutcomeCorrelation = this.calculateCorrelation(scores, outcomes);

    return (accuracy * 0.6 + (scoreOutcomeCorrelation * 0.5 + 0.5) * 0.4);
  }

  private calculateStability(scores: number[]): number {
    if (scores.length < 2) return 0.5;

    const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
    const variance = scores.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / scores.length;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;

    return Math.max(0, 1 - cv);
  }

  private calculateContribution(
    scores: number[],
    outcomes: number[]
  ): number {
    if (scores.length < 2 || outcomes.length < 2) return 0;

    const correlation = this.calculateCorrelation(scores, outcomes);
    return Math.abs(correlation);
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length < 2 || y.length < 2) return 0;

    const n = Math.min(x.length, y.length);
    const xSlice = x.slice(0, n);
    const ySlice = y.slice(0, n);

    const meanX = xSlice.reduce((s, v) => s + v, 0) / n;
    const meanY = ySlice.reduce((s, v) => s + v, 0) / n;

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
      const dx = xSlice[i] - meanX;
      const dy = ySlice[i] - meanY;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }

    const denominator = Math.sqrt(denomX * denomY);
    return denominator > 0 ? numerator / denominator : 0;
  }

  private detectIssues(
    scores: number[],
    weights: number[],
    effectiveness: number,
    stability: number,
    contribution: number,
    config: CalibrationConfig
  ): DiagnosticIssueType[] {
    const issues: DiagnosticIssueType[] = [];

    if (weights.length > 0) {
      const avgWeight = weights.reduce((s, v) => s + v, 0) / weights.length;
      const weightScoreRatio = avgWeight / (scores.reduce((s, v) => s + v, 0) / scores.length / 100);

      if (weightScoreRatio > 1.3 && effectiveness < config.thresholds.effectivenessThreshold) {
        issues.push(DiagnosticIssueType.OVERWEIGHTED);
      }

      if (weightScoreRatio < 0.7 && contribution > 0.6) {
        issues.push(DiagnosticIssueType.UNDERWEIGHTED);
      }
    }

    if (stability < config.thresholds.stabilityThreshold) {
      issues.push(DiagnosticIssueType.UNSTABLE);
    }

    if (scores.length > 10) {
      const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
      const secondHalf = scores.slice(Math.floor(scores.length / 2));
      const firstMean = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
      const secondMean = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;

      if (Math.abs(firstMean - secondMean) > 20) {
        issues.push(DiagnosticIssueType.CONFLICTING);
      }
    }

    if (effectiveness < 0.4 && contribution < 0.3) {
      issues.push(DiagnosticIssueType.LOW_VALUE);
    }

    if (effectiveness > 0.8 && contribution > 0.7) {
      issues.push(DiagnosticIssueType.HIGHLY_PREDICTIVE);
    }

    return issues;
  }

  private determineHealth(
    effectiveness: number,
    stability: number,
    contribution: number,
    issues: DiagnosticIssueType[]
  ): ComponentHealth {
    if (issues.includes(DiagnosticIssueType.LOW_VALUE)) return ComponentHealth.CRITICAL;
    if (issues.includes(DiagnosticIssueType.CONFLICTING)) return ComponentHealth.POOR;

    const score = effectiveness * 0.4 + stability * 0.3 + contribution * 0.3;

    if (score >= 0.8) return ComponentHealth.EXCELLENT;
    if (score >= 0.65) return ComponentHealth.GOOD;
    if (score >= 0.5) return ComponentHealth.FAIR;
    if (score >= 0.35) return ComponentHealth.POOR;
    return ComponentHealth.CRITICAL;
  }

  private determineTrend(
    scores: number[],
    sensitivity: number
  ): TrendDirection {
    if (scores.length < 5) return TrendDirection.INSUFFICIENT_DATA;

    const n = scores.length;
    const firstQuarter = scores.slice(0, Math.floor(n / 4));
    const lastQuarter = scores.slice(Math.floor(n * 3 / 4));

    const firstMean = firstQuarter.reduce((s, v) => s + v, 0) / firstQuarter.length;
    const lastMean = lastQuarter.reduce((s, v) => s + v, 0) / lastQuarter.length;

    const change = (lastMean - firstMean) / firstMean;

    if (change > sensitivity) return TrendDirection.IMPROVING;
    if (change < -sensitivity) return TrendDirection.DEGRADING;
    return TrendDirection.STABLE;
  }

  private calculateRecommendedWeight(
    currentWeight: number,
    effectiveness: number,
    stability: number,
    contribution: number,
    trend: TrendDirection,
    issues: DiagnosticIssueType[]
  ): number {
    let adjustment = 0;

    if (issues.includes(DiagnosticIssueType.OVERWEIGHTED)) {
      adjustment -= 0.02;
    }

    if (issues.includes(DiagnosticIssueType.UNDERWEIGHTED)) {
      adjustment += 0.02;
    }

    if (effectiveness > 0.7) {
      adjustment += 0.01;
    } else if (effectiveness < 0.4) {
      adjustment -= 0.01;
    }

    if (trend === TrendDirection.IMPROVING) {
      adjustment += 0.005;
    } else if (trend === TrendDirection.DEGRADING) {
      adjustment -= 0.005;
    }

    if (stability < 0.5) {
      adjustment -= 0.005;
    }

    const recommended = Math.max(0.01, Math.min(0.25, currentWeight + adjustment));
    return Math.round(recommended * 1000) / 1000;
  }

  private calculateConfidence(
    sampleSize: number,
    effectiveness: number,
    stability: number
  ): number {
    const sampleConfidence = Math.min(1, sampleSize / 100);
    const metricConfidence = (effectiveness + stability) / 2;
    return sampleConfidence * 0.4 + metricConfidence * 0.6;
  }

  private generateEvidence(
    component: string,
    effectiveness: number,
    stability: number,
    contribution: number,
    issues: DiagnosticIssueType[],
    trend: TrendDirection,
    config: CalibrationConfig
  ): string[] {
    const evidence: string[] = [];

    evidence.push(`Etkinlik: %${(effectiveness * 100).toFixed(1)} (eşik: %${(config.thresholds.effectivenessThreshold * 100).toFixed(0)})`);
    evidence.push(`Kararlılık: %${(stability * 100).toFixed(1)} (eşik: %${(config.thresholds.stabilityThreshold * 100).toFixed(0)})`);
    evidence.push(`Katkı: %${(contribution * 100).toFixed(1)}`);

    if (issues.length > 0) {
      evidence.push(`Sorunlar: ${issues.join(', ')}`);
    }

    if (trend !== TrendDirection.INSUFFICIENT_DATA) {
      evidence.push(`Trend: ${trend}`);
    }

    return evidence;
  }
}
