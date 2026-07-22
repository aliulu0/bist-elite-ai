import { Injectable } from '@nestjs/common';
import {
  SuccessAnalytics,
  PerformanceDashboard,
  EliteScoreAnalysis,
  SectorPerformanceAnalysis,
  StrategyPerformanceAnalysis,
  FailureAnalysis,
  RecommendationRecord,
  EvaluationWindow,
} from './types';
import {
  RECOMMENDATION_STATUS_TURKISH,
  RECOMMENDATION_OUTCOME_TURKISH,
  EVALUATION_WINDOW_TURKISH,
  METRIC_NAMES_TURKISH,
  TRACKER_TERMS_TURKISH,
  formatPercentage,
  formatNumber,
  generateReportHeader,
  generateReportFooter,
  generateMonthlySummary,
  generatePerformanceCommentary,
} from './turkish-terms';

@Injectable()
export class RecommendationReportGeneratorService {
  generateSummaryReport(
    analytics: SuccessAnalytics,
    dashboard: PerformanceDashboard,
  ): string {
    let report = generateReportHeader('ONERI PERFORMANS OZET RAPORU');

    report += '\n--- GENEL PERFORMANS ---\n';
    report += `Toplam Oneri: ${analytics.totalRecommendations}\n`;
    report += `Kazanma Orani: ${formatPercentage(analytics.winRate)}\n`;
    report += `Kayip Orani: ${formatPercentage(analytics.lossRate)}\n`;
    report += `Ortalama Kazanc: ${formatPercentage(analytics.avgGain)}\n`;
    report += `Ortalama Kayip: ${formatPercentage(analytics.avgLoss)}\n`;
    report += `Kar Faktoru: ${formatNumber(analytics.profitFactor)}\n`;
    report += `Sharpe Orani: ${formatNumber(analytics.sharpeRatio)}\n`;
    report += `Sortino Orani: ${formatNumber(analytics.sortinoRatio)}\n`;
    report += `Hassasiyet: ${formatPercentage(analytics.precision)}\n`;
    report += `Duyarlilik: ${formatPercentage(analytics.recall)}\n`;
    report += `F1 Skoru: ${formatNumber(analytics.f1Score)}\n`;

    if (dashboard.topPerformers.length > 0) {
      report += '\n--- EN IYI PERFORMANSLAR ---\n';
      for (const p of dashboard.topPerformers.slice(0, 5)) {
        report += `  ${p.symbol}: ${formatPercentage(p.return_)} (Skor: ${formatNumber(p.eliteScore)})\n`;
      }
    }

    if (dashboard.worstPerformers.length > 0) {
      report += '\n--- EN KOTU PERFORMANSLAR ---\n';
      for (const p of dashboard.worstPerformers.slice(0, 5)) {
        report += `  ${p.symbol}: ${formatPercentage(p.return_)} (Skor: ${formatNumber(p.eliteScore)})\n`;
      }
    }

    report += '\n--- PENCERE PERFORMANSLARI ---\n';
    for (const [window, perf] of Object.entries(dashboard.windowPerformance)) {
      const windowLabel = EVALUATION_WINDOW_TURKISH[window as EvaluationWindow] || window;
      report += `  ${windowLabel}: Getiri ${formatPercentage(perf.returnPercent)}, Maks Kazanc ${formatPercentage(perf.maxGainPercent)}, Maks Drawdown ${formatPercentage(perf.maxDrawdownPercent)}\n`;
    }

    report += generateReportFooter();
    return report;
  }

  generatePerformanceDashboard(dashboard: PerformanceDashboard): string {
    let report = generateReportHeader('PERFORMANS PANELI');

    report += '\n--- STRATEJI ANALIZI ---\n';
    for (const s of dashboard.strategyBreakdown) {
      report += `  ${s.strategy}: ${s.totalRecommendations} oneri, Kazanma %${formatNumber(s.winRate)}, Ort. Getiri ${formatPercentage(s.avgReturn)}\n`;
    }

    report += '\n--- SEKTOR ANALIZI ---\n';
    for (const s of dashboard.sectorBreakdown) {
      report += `  ${s.sector}: ${s.totalRecommendations} oneri, Kazanma %${formatNumber(s.winRate)}, Ort. Getiri ${formatPercentage(s.avgReturn)}\n`;
    }

    report += '\n--- SON ONERILER ---\n';
    for (const rec of dashboard.recentRecommendations.slice(0, 10)) {
      const statusTr = RECOMMENDATION_STATUS_TURKISH[rec.status] || rec.status;
      const outcomeTr = RECOMMENDATION_OUTCOME_TURKISH[rec.outcome] || rec.outcome;
      report += `  ${rec.stockSymbol}: ${statusTr} / ${outcomeTr}`;
      if (rec.actualReturn !== undefined) {
        report += ` (Getiri: ${formatPercentage(rec.actualReturn)})`;
      }
      report += '\n';
    }

    report += generateReportFooter();
    return report;
  }

  generateAccuracyReport(analyses: EliteScoreAnalysis[]): string {
    let report = generateReportHeader('SKOR DOGRULUK RAPORU');

    if (analyses.length === 0) {
      report += 'Henuz analiz edilmis oneri bulunmamaktadir.\n';
      report += generateReportFooter();
      return report;
    }

    const avgScoreAccuracy = analyses.reduce((s, a) => s + a.scoreAccuracy, 0) / analyses.length;
    const avgConfidenceAccuracy = analyses.reduce((s, a) => s + a.confidenceAccuracy, 0) / analyses.length;
    const avgBrierScore = analyses.reduce((s, a) => s + a.brierScore, 0) / analyses.length;
    const avgCalibrationError = analyses.reduce((s, a) => s + a.calibrationError, 0) / analyses.length;

    report += `\nToplam Analiz: ${analyses.length}\n`;
    report += `Ortalama Skor Dogrulugu: ${formatPercentage(avgScoreAccuracy * 100)}\n`;
    report += `Ortalama Guven Dogrulugu: ${formatPercentage(avgConfidenceAccuracy * 100)}\n`;
    report += `Ortalama Brier Skoru: ${formatNumber(avgBrierScore)}\n`;
    report += `Ortalama Kalibrasyon Hatasi: ${formatNumber(avgCalibrationError)}\n`;

    report += '\n--- BIREYSEL ANALIZLER ---\n';
    for (const a of analyses.slice(0, 20)) {
      report += `  ${a.stockSymbol}: Skor Dogruluğu ${formatPercentage(a.scoreAccuracy * 100)}, Guven ${formatPercentage(a.confidenceAccuracy * 100)}\n`;
    }

    report += generateReportFooter();
    return report;
  }

  generateSectorReport(sectors: SectorPerformanceAnalysis[]): string {
    let report = generateReportHeader('SEKTOR PERFORMANS RAPORU');

    if (sectors.length === 0) {
      report += 'Henuz sektor analizi bulunmamaktadir.\n';
      report += generateReportFooter();
      return report;
    }

    const sorted = [...sectors].sort((a, b) => b.avgReturn - a.avgReturn);

    for (const s of sorted) {
      report += `\n--- ${s.sector} ---\n`;
      report += `  Toplam Oneri: ${s.totalRecommendations}\n`;
      report += `  Kazanma Orani: ${formatPercentage(s.winRate)}\n`;
      report += `  Ortalama Getiri: ${formatPercentage(s.avgReturn)}\n`;
      report += `  Kar Faktoru: ${formatNumber(s.profitFactor)}\n`;
      report += `  Ortalama Elite Skor: ${formatNumber(s.avgEliteScore)}\n`;
    }

    report += generateReportFooter();
    return report;
  }

  generateStrategyReport(strategies: StrategyPerformanceAnalysis[]): string {
    let report = generateReportHeader('STRATEJI PERFORMANS RAPORU');

    if (strategies.length === 0) {
      report += 'Henuz strateji analizi bulunmamaktadir.\n';
      report += generateReportFooter();
      return report;
    }

    const sorted = [...strategies].sort((a, b) => b.avgReturn - a.avgReturn);

    for (const s of sorted) {
      report += `\n--- ${s.strategy} ---\n`;
      report += `  Toplam Oneri: ${s.totalRecommendations}\n`;
      report += `  Kazanma Orani: ${formatPercentage(s.winRate)}\n`;
      report += `  Ortalama Getiri: ${formatPercentage(s.avgReturn)}\n`;
      report += `  Kar Faktoru: ${formatNumber(s.profitFactor)}\n`;
      report += `  Sharpe Orani: ${formatNumber(s.sharpeRatio)}\n`;
      report += `  Maks Drawdown: ${formatPercentage(s.maxDrawdown)}\n`;
      report += `  En Iyi: ${s.bestPerformance.symbol} (${formatPercentage(s.bestPerformance.return_)})\n`;
      report += `  En Kotu: ${s.worstPerformance.symbol} (${formatPercentage(s.worstPerformance.return_)})\n`;
    }

    report += generateReportFooter();
    return report;
  }

  generateMonthlyReport(
    recommendations: RecommendationRecord[],
    year: number,
    month: number,
  ): string {
    const monthlyRecs = recommendations.filter(r => {
      const d = new Date(r.entryDate);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });

    const completed = monthlyRecs.filter(r => r.actualReturn !== undefined);
    const winners = completed.filter(r => (r.actualReturn || 0) > 0);
    const avgReturn = completed.length > 0
      ? completed.reduce((s, r) => s + (r.actualReturn || 0), 0) / completed.length
      : 0;

    let report = generateReportHeader('AYLIK ONERI RAPORU');
    report += generateMonthlySummary(year, month, monthlyRecs.length, completed.length > 0 ? (winners.length / completed.length) * 100 : 0, avgReturn);

    report += '\n--- AYLIK DETAY ---\n';
    for (const rec of monthlyRecs) {
      const statusTr = RECOMMENDATION_STATUS_TURKISH[rec.status] || rec.status;
      report += `  ${rec.stockSymbol}: ${statusTr}`;
      if (rec.actualReturn !== undefined) {
        report += ` (Getiri: ${formatPercentage(rec.actualReturn)})`;
      }
      report += ` [Skor: ${formatNumber(rec.entryEliteScore)}]\n`;
    }

    report += generateReportFooter();
    return report;
  }

  generateFailureReport(failures: FailureAnalysis[]): string {
    let report = generateReportHeader('HATA ANALIZI RAPORU');

    if (failures.length === 0) {
      report += 'Henuz hata analizi bulunmamaktadir.\n';
      report += generateReportFooter();
      return report;
    }

    const totalFailures = failures.reduce((s, f) => s + f.failures.length, 0);
    const avgRiskScore = failures.reduce((s, f) => s + f.overallRiskScore, 0) / failures.length;

    report += `\nToplam Analiz: ${failures.length}\n`;
    report += `Toplam Hata: ${totalFailures}\n`;
    report += `Ortalama Risk Skoru: ${formatNumber(avgRiskScore)}\n`;

    report += '\n--- HATA TURLERI ---\n';
    const failureTypeCounts = new Map<string, number>();
    for (const f of failures) {
      for (const fail of f.failures) {
        const count = failureTypeCounts.get(fail.type) || 0;
        failureTypeCounts.set(fail.type, count + 1);
      }
    }
    for (const [type, count] of failureTypeCounts) {
      report += `  ${type}: ${count}\n`;
    }

    report += '\n--- KRITIK HATALAR ---\n';
    const criticalFailures = failures.filter(f => f.failures.some(fail => fail.severity === 'CRITICAL'));
    for (const f of criticalFailures.slice(0, 10)) {
      report += `  ${f.stockSymbol}: Risk Skoru ${formatNumber(f.overallRiskScore)}\n`;
    }

    report += generateReportFooter();
    return report;
  }
}
