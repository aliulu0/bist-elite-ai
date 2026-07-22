import { Injectable } from '@nestjs/common';
import {
  CalibrationSummary, CalibrationReport, ComponentDiagnostic,
  ComponentTrend, CalibrationRecommendation, CalibrationStatus,
  ComponentHealth, PerformanceEvaluation
} from './types';
import {
  CALIBRATION_STATUS_TURKISH, COMPONENT_NAMES_TURKISH, COMPONENT_HEALTH_TURKISH,
  TREND_DIRECTION_TURKISH, RECOMMENDATION_PRIORITY_TURKISH,
  generateCalibrationSummaryTurkish, generateComponentCommentaryTurkish,
  generateRecommendationCommentaryTurkish, generateTrendCommentaryTurkish
} from './turkish-terms';

@Injectable()
export class CalibrationReportGeneratorService {
  generateReport(summary: CalibrationSummary): CalibrationReport {
    const componentRankings = this.rankComponents(summary.componentDiagnostics);
    const improvementOpportunities = this.identifyImprovementOpportunities(summary.componentDiagnostics);
    const riskAssessment = this.assessRisk(summary);

    return {
      summary,
      detailedAnalysis: {
        componentRankings,
        improvementOpportunities,
        historicalTrend: summary.componentTrends,
        riskAssessment,
      },
      generatedAt: new Date().toISOString(),
      disclaimer: this.generateDisclaimer(),
    };
  }

  generateTurkishSummary(summary: CalibrationSummary): string {
    const statusTurkish = CALIBRATION_STATUS_TURKISH[summary.overallStatus] || 'Bilinmeyen';
    let report = `## Kalibrasyon Özeti\n\n`;
    report += `**Genel Durum:** ${statusTurkish}\n`;
    report += `**Genel Skor:** ${summary.overallScore.toFixed(1)}/100\n`;
    report += `**Güven:** ${(summary.confidence * 100).toFixed(1)}%\n\n`;

    report += `### Bileşen Durumları\n`;
    report += `| Bileşen | Durum | Etkinlik | Kararlılık | Katkı | Trend |\n`;
    report += `|---------|-------|----------|------------|-------|-------|\n`;

    for (const diag of summary.componentDiagnostics) {
      const name = COMPONENT_NAMES_TURKISH[diag.component] || diag.component;
      const health = COMPONENT_HEALTH_TURKISH[diag.health];
      const trend = TREND_DIRECTION_TURKISH[diag.trend];
      report += `| ${name} | ${health} | %${(diag.effectiveness * 100).toFixed(1)} | %${(diag.stability * 100).toFixed(1)} | %${(diag.contribution * 100).toFixed(1)} | ${trend} |\n`;
    }

    report += `\n### Performans Değerlendirmesi\n`;
    report += `| Metrik | Değer |\n|--------|-------|\n`;
    report += `| Tahmin Doğruluğu | %${(summary.performanceEvaluation.predictionAccuracy * 100).toFixed(1)} |\n`;
    report += `| Hassasiyet | %${(summary.performanceEvaluation.precision * 100).toFixed(1)} |\n`;
    report += `| Duyarlılık | %${(summary.performanceEvaluation.recall * 100).toFixed(1)} |\n`;
    report += `| F1 Skoru | %${(summary.performanceEvaluation.f1Score * 100).toFixed(1)} |\n`;
    report += `| Kalibrasyon Hatası | %${(summary.performanceEvaluation.calibrationError * 100).toFixed(1)} |\n`;
    report += `| Brier Skoru | ${summary.performanceEvaluation.brierScore.toFixed(3)} |\n\n`;

    if (summary.recommendations.length > 0) {
      report += `### Öneriler\n`;
      for (const rec of summary.recommendations.slice(0, 5)) {
        const name = COMPONENT_NAMES_TURKISH[rec.component] || rec.component;
        const priority = RECOMMENDATION_PRIORITY_TURKISH[rec.priority];
        report += `#### ${name} (${priority})\n`;
        report += `- **Mevcut:** %${(rec.currentWeight * 100).toFixed(1)} → **Önerilen:** %${(rec.recommendedWeight * 100).toFixed(1)}\n`;
        report += `- **Neden:** ${rec.reason}\n`;
        if (rec.requiresApproval) {
          report += `- **Onay Gerektiriyor:** Evet\n`;
        }
        report += `\n`;
      }
    } else {
      report += `### Öneriler\n`;
      report += `Mevcut durum için öneri bulunmamaktadır.\n\n`;
    }

    report += `*${summary.disclaimer || this.generateDisclaimer()}*\n`;

    return report;
  }

  private rankComponents(diagnostics: ComponentDiagnostic[]): CalibrationReport['detailedAnalysis']['componentRankings'] {
    const sorted = [...diagnostics].sort((a, b) => {
      const scoreA = a.effectiveness * 0.4 + a.stability * 0.3 + a.contribution * 0.3;
      const scoreB = b.effectiveness * 0.4 + b.stability * 0.3 + b.contribution * 0.3;
      return scoreB - scoreA;
    });

    return sorted.map((d, i) => ({
      component: d.component,
      rank: i + 1,
      effectiveness: d.effectiveness,
      weight: d.health,
    }));
  }

  private identifyImprovementOpportunities(
    diagnostics: ComponentDiagnostic[]
  ): CalibrationReport['detailedAnalysis']['improvementOpportunities'] {
    return diagnostics
      .filter(d => d.health !== ComponentHealth.EXCELLENT && d.health !== ComponentHealth.GOOD)
      .map(d => ({
        component: d.component,
        currentScore: d.effectiveness,
        potentialImprovement: Math.max(0, 0.8 - d.effectiveness),
        difficulty: d.health === ComponentHealth.CRITICAL ? 'Yüksek' :
          d.health === ComponentHealth.POOR ? 'Orta' : 'Düşük',
        timeline: d.health === ComponentHealth.CRITICAL ? 'Uzun Vadeli' :
          d.health === ComponentHealth.POOR ? 'Orta Vadeli' : 'Kısa Vadeli',
      }));
  }

  private assessRisk(summary: CalibrationSummary): CalibrationReport['detailedAnalysis']['riskAssessment'] {
    const riskFactors: CalibrationReport['detailedAnalysis']['riskAssessment']['riskFactors'] = [];
    let overallRisk = 0;

    if (summary.performanceEvaluation.calibrationError > 0.2) {
      riskFactors.push({
        type: 'CALIBRATION_RISK',
        severity: 'Yüksek',
        description: `Kalibrasyon hatası yüksek: %${(summary.performanceEvaluation.calibrationError * 100).toFixed(1)}`,
      });
      overallRisk += 30;
    }

    if (summary.performanceEvaluation.brierScore > 0.25) {
      riskFactors.push({
        type: 'PREDICTION_RISK',
        severity: 'Yüksek',
        description: `Tahmin kalitesi düşük: Brier Skoru ${summary.performanceEvaluation.brierScore.toFixed(3)}`,
      });
      overallRisk += 25;
    }

    const criticalComponents = summary.componentDiagnostics.filter(
      d => d.health === ComponentHealth.CRITICAL
    );
    if (criticalComponents.length > 0) {
      riskFactors.push({
        type: 'COMPONENT_RISK',
        severity: 'Kritik',
        description: `${criticalComponents.length} kritik bileşen mevcut`,
      });
      overallRisk += 35;
    }

    const degradingTrends = summary.componentTrends.filter(
      t => t.direction === 'DEGRADING'
    );
    if (degradingTrends.length > 2) {
      riskFactors.push({
        type: 'TREND_RISK',
        severity: 'Orta',
        description: `${degradingTrends.length} bileşende kötüleşen trend`,
      });
      overallRisk += 20;
    }

    if (summary.performanceEvaluation.predictionAccuracy < 0.5) {
      riskFactors.push({
        type: 'ACCURACY_RISK',
        severity: 'Yüksek',
        description: `Tahmin doğruluğu düşük: %${(summary.performanceEvaluation.predictionAccuracy * 100).toFixed(1)}`,
      });
      overallRisk += 25;
    }

    return {
      overallRisk: Math.min(100, overallRisk),
      riskFactors,
    };
  }

  private generateDisclaimer(): string {
    return 'Bu rapor yalnızca bilgilendirme amaçlıdır ve otomatik kalibrasyon uygulamaz. ' +
      'Tüm değişiklikler kullanıcı onayı gerektirir. ' +
      'Geçmiş performans gelecek sonuçların garantisi değildir.';
  }
}
