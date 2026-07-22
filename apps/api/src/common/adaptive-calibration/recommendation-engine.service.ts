import { Injectable } from '@nestjs/common';
import {
  CalibrationRecommendation, ComponentDiagnostic, ComponentTrend,
  PerformanceEvaluation, RecommendationPriority, DiagnosticIssueType,
  TrendDirection, CalibrationConfig, CALIBRATION_CONFIG_DEFAULTS
} from './types';

@Injectable()
export class RecommendationEngineService {
  generate(
    diagnostics: ComponentDiagnostic[],
    trends: ComponentTrend[],
    evaluation: PerformanceEvaluation,
    config?: Partial<CalibrationConfig>
  ): CalibrationRecommendation[] {
    const cfg = { ...CALIBRATION_CONFIG_DEFAULTS, ...config };

    if (!diagnostics || diagnostics.length === 0) {
      return [];
    }

    const recommendations: CalibrationRecommendation[] = [];

    for (const diagnostic of diagnostics) {
      const trend = trends.find(t => t.component === diagnostic.component);
      const componentRecs = this.generateForComponent(diagnostic, trend, evaluation, cfg);
      recommendations.push(...componentRecs);
    }

    return this.prioritize(recommendations, cfg);
  }

  private generateForComponent(
    diagnostic: ComponentDiagnostic,
    trend: ComponentTrend | undefined,
    evaluation: PerformanceEvaluation,
    config: CalibrationConfig
  ): CalibrationRecommendation[] {
    const recommendations: CalibrationRecommendation[] = [];

    for (const issue of diagnostic.issues) {
      const rec = this.generateForIssue(diagnostic, trend, evaluation, issue, config);
      if (rec) {
        recommendations.push(rec);
      }
    }

    if (diagnostic.issues.length === 0 && diagnostic.health === 'FAIR') {
      const rec = this.generateMonitoringRecommendation(diagnostic, trend, config);
      if (rec) {
        recommendations.push(rec);
      }
    }

    return recommendations;
  }

  private generateForIssue(
    diagnostic: ComponentDiagnostic,
    trend: ComponentTrend | undefined,
    evaluation: PerformanceEvaluation,
    issue: DiagnosticIssueType,
    config: CalibrationConfig
  ): CalibrationRecommendation | null {
    const weightChange = this.calculateWeightChange(diagnostic, issue, config);

    if (Math.abs(weightChange) < config.recommendationSettings.minWeightChange) {
      return null;
    }

    const priority = this.determinePriority(diagnostic, issue, evaluation);
    const reason = this.generateReason(diagnostic, issue, trend);
    const evidence = this.generateEvidence(diagnostic, issue, trend);
    const expectedImpact = this.estimateImpact(diagnostic, issue, weightChange);
    const safeguards = this.generateSafeguards(diagnostic, issue);
    const requiresApproval = Math.abs(weightChange) > config.recommendationSettings.requireApprovalAbove;
    const autoApplicable = Math.abs(weightChange) <= config.recommendationSettings.autoApplyBelow;

    return {
      id: `rec-${diagnostic.component}-${issue}-${Date.now()}`,
      component: diagnostic.component,
      priority,
      currentWeight: diagnostic.currentWeight,
      recommendedWeight: Math.max(0.01, Math.min(0.25, diagnostic.currentWeight + weightChange)),
      changePercent: (weightChange / diagnostic.currentWeight) * 100,
      reason,
      evidence,
      expectedImpact,
      safeguards,
      requiresApproval,
      autoApplicable,
    };
  }

  private calculateWeightChange(
    diagnostic: ComponentDiagnostic,
    issue: DiagnosticIssueType,
    config: CalibrationConfig
  ): number {
    const maxChange = config.recommendationSettings.maxWeightChange;

    switch (issue) {
      case DiagnosticIssueType.OVERWEIGHTED:
        return -Math.min(maxChange, 0.02);

      case DiagnosticIssueType.UNDERWEIGHTED:
        return Math.min(maxChange, 0.02);

      case DiagnosticIssueType.UNSTABLE:
        return -Math.min(maxChange, 0.01);

      case DiagnosticIssueType.CONFLICTING:
        return -Math.min(maxChange, 0.015);

      case DiagnosticIssueType.LOW_VALUE:
        return -Math.min(maxChange, 0.025);

      case DiagnosticIssueType.HIGHLY_PREDICTIVE:
        return Math.min(maxChange, 0.015);

      default:
        return 0;
    }
  }

  private determinePriority(
    diagnostic: ComponentDiagnostic,
    issue: DiagnosticIssueType,
    evaluation: PerformanceEvaluation
  ): RecommendationPriority {
    let score = 0;

    if (issue === DiagnosticIssueType.LOW_VALUE) score += 3;
    else if (issue === DiagnosticIssueType.CONFLICTING) score += 2;
    else if (issue === DiagnosticIssueType.OVERWEIGHTED || issue === DiagnosticIssueType.UNDERWEIGHTED) score += 1;

    if (diagnostic.effectiveness < 0.3) score += 2;
    else if (diagnostic.effectiveness < 0.5) score += 1;

    if (evaluation.overallHealth === 'CRITICAL') score += 2;
    else if (evaluation.overallHealth === 'DEGRADING') score += 1;

    if (diagnostic.contribution > 0.7 && issue === DiagnosticIssueType.HIGHLY_PREDICTIVE) score += 2;

    if (score >= 5) return RecommendationPriority.CRITICAL;
    if (score >= 3) return RecommendationPriority.HIGH;
    if (score >= 2) return RecommendationPriority.MEDIUM;
    return RecommendationPriority.LOW;
  }

  private generateReason(
    diagnostic: ComponentDiagnostic,
    issue: DiagnosticIssueType,
    trend: ComponentTrend | undefined
  ): string {
    const reasons: string[] = [];

    switch (issue) {
      case DiagnosticIssueType.OVERWEIGHTED:
        reasons.push(`Etkinlik düşük (%${(diagnostic.effectiveness * 100).toFixed(1)}) ancak ağırlık yüksek`);
        break;
      case DiagnosticIssueType.UNDERWEIGHTED:
        reasons.push(`Yüksek katkı (%${(diagnostic.contribution * 100).toFixed(1)}) ancak ağırlık düşük`);
        break;
      case DiagnosticIssueType.UNSTABLE:
        reasons.push(`Düşük kararlılık (%${(diagnostic.stability * 100).toFixed(1)})`);
        break;
      case DiagnosticIssueType.CONFLICTING:
        reasons.push(`Çelişkili sinyaller tespit edildi`);
        break;
      case DiagnosticIssueType.LOW_VALUE:
        reasons.push(`Düşük değer ve katkı`);
        break;
      case DiagnosticIssueType.HIGHLY_PREDICTIVE:
        reasons.push(`Yüksek tahmin gücü ve katkı`);
        break;
    }

    if (trend && trend.direction === TrendDirection.DEGRADING) {
      reasons.push(`Kötüleşen trend`);
    }

    return reasons.join('. ');
  }

  private generateEvidence(
    diagnostic: ComponentDiagnostic,
    issue: DiagnosticIssueType,
    trend: ComponentTrend | undefined
  ): string[] {
    const evidence: string[] = [];

    evidence.push(`Etkinlik: %${(diagnostic.effectiveness * 100).toFixed(1)}`);
    evidence.push(`Kararlılık: %${(diagnostic.stability * 100).toFixed(1)}`);
    evidence.push(`Katkı: %${(diagnostic.contribution * 100).toFixed(1)}`);
    evidence.push(`Mevcut Ağırlık: %${(diagnostic.currentWeight * 100).toFixed(1)}`);

    if (trend) {
      evidence.push(`Trend: ${trend.direction} (Güç: %${(trend.strength * 100).toFixed(1)})`);
    }

    return evidence;
  }

  private estimateImpact(
    diagnostic: ComponentDiagnostic,
    issue: DiagnosticIssueType,
    weightChange: number
  ): CalibrationRecommendation['expectedImpact'] {
    const impactFactor = Math.abs(weightChange) / 0.05;

    let accuracyChange = 0;
    let confidenceChange = 0;
    let riskChange = 0;

    if (issue === DiagnosticIssueType.OVERWEIGHTED) {
      accuracyChange = impactFactor * 2;
      confidenceChange = impactFactor * 1;
      riskChange = -impactFactor * 1;
    } else if (issue === DiagnosticIssueType.UNDERWEIGHTED) {
      accuracyChange = impactFactor * 3;
      confidenceChange = impactFactor * 2;
      riskChange = impactFactor * 0.5;
    } else if (issue === DiagnosticIssueType.LOW_VALUE) {
      accuracyChange = impactFactor * 4;
      confidenceChange = impactFactor * 2;
      riskChange = -impactFactor * 2;
    } else if (issue === DiagnosticIssueType.HIGHLY_PREDICTIVE) {
      accuracyChange = impactFactor * 3;
      confidenceChange = impactFactor * 2;
      riskChange = impactFactor * 1;
    }

    return {
      accuracyChange: Math.round(accuracyChange * 100) / 100,
      confidenceChange: Math.round(confidenceChange * 100) / 100,
      riskChange: Math.round(riskChange * 100) / 100,
    };
  }

  private generateSafeguards(
    diagnostic: ComponentDiagnostic,
    issue: DiagnosticIssueType
  ): string[] {
    const safeguards: string[] = [];

    safeguards.push('Değişiklik üretim ortamına uygulanmadan önce test edilmelidir');
    safeguards.push('Kullanıcı onayı gereklidir');

    if (issue === DiagnosticIssueType.OVERWEIGHTED) {
      safeguards.push('Ağırlık azaltması kademeli olarak yapılmalıdır');
      safeguards.push('Etkinlik izlemesi devam etmelidir');
    } else if (issue === DiagnosticIssueType.UNDERWEIGHTED) {
      safeguards.push('Ağırlık artırması kademeli olarak yapılmalıdır');
      safeguards.push('Risk etkisi izlenmelidir');
    } else if (issue === DiagnosticIssueType.CONFLICTING) {
      safeguards.push('Çelişkili göstergeler yeniden değerlendirilmelidir');
    }

    return safeguards;
  }

  private generateMonitoringRecommendation(
    diagnostic: ComponentDiagnostic,
    trend: ComponentTrend | undefined,
    config: CalibrationConfig
  ): CalibrationRecommendation | null {
    if (diagnostic.confidence < config.thresholds.recommendationConfidence) {
      return null;
    }

    return {
      id: `mon-${diagnostic.component}-${Date.now()}`,
      component: diagnostic.component,
      priority: RecommendationPriority.LOW,
      currentWeight: diagnostic.currentWeight,
      recommendedWeight: diagnostic.currentWeight,
      changePercent: 0,
      reason: 'Bileşen orta düzeydeperformans gösteriyor, izleme öneriliyor',
      evidence: [
        `Etkinlik: %${(diagnostic.effectiveness * 100).toFixed(1)}`,
        `Kararlılık: %${(diagnostic.stability * 100).toFixed(1)}`,
        `Katkı: %${(diagnostic.contribution * 100).toFixed(1)}`,
      ],
      expectedImpact: { accuracyChange: 0, confidenceChange: 0, riskChange: 0 },
      safeguards: ['Düzenli izleme öneriliyor'],
      requiresApproval: false,
      autoApplicable: true,
    };
  }

  private prioritize(
    recommendations: CalibrationRecommendation[],
    config: CalibrationConfig
  ): CalibrationRecommendation[] {
    const priorityOrder: Record<RecommendationPriority, number> = {
      [RecommendationPriority.CRITICAL]: 0,
      [RecommendationPriority.HIGH]: 1,
      [RecommendationPriority.MEDIUM]: 2,
      [RecommendationPriority.LOW]: 3,
    };

    return [...recommendations].sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return Math.abs(b.changePercent) - Math.abs(a.changePercent);
    });
  }
}
