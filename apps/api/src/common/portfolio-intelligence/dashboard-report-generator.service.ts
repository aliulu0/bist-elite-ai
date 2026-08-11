import { Injectable } from '@nestjs/common';
import {
  PortfolioSummaryWidget,
  IntelligencePanelWidget,
  PerformanceAnalyticsWidget,
  RiskCenterWidget,
  ExplanationWidget,
  NotificationCenterWidget,
  DashboardTimelineWidget,
} from './types';
import { OVERVIEW_LABELS_TURKISH, PERFORMANCE_LABELS_TURKISH, RISK_LABELS_TURKISH, formatTurkishPercent, formatTurkishCurrency } from './turkish-terms';

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

@Injectable()
export class DashboardReportGeneratorService {
  generateSummaryReport(
    portfolio: PortfolioSummaryWidget,
    intelligence: IntelligencePanelWidget,
    performance: PerformanceAnalyticsWidget,
    risk: RiskCenterWidget,
  ): string {
    const lines: string[] = [];
    lines.push('=== PORTFOY INTELIGENCE DASHBOARD ===');
    lines.push('');
    lines.push('--- Portfolio Ozeti ---');
    lines.push(`Toplam Deger: ${formatTurkishCurrency(portfolio.totalValue)}`);
    lines.push(`Nakit Bakiye: ${formatTurkishCurrency(portfolio.cashBalance)}`);
    lines.push(`Toplam Getiri: ${formatTurkishPercent(portfolio.totalReturnPercent)}`);
    lines.push(`Acik Pozisyon: ${portfolio.openPositionsCount}`);
    lines.push(`Risk Skoru: ${num(portfolio.portfolioRiskScore).toFixed(1)}`);
    lines.push('');
    lines.push('--- Zeka Paneli ---');
    lines.push(`Aktif Firsatlar: ${intelligence.totalActiveOpportunities}`);
    lines.push(`Mevcut Rejim: ${intelligence.currentMarketRegime}`);
    lines.push(`En Yuksek Elite Skor: ${intelligence.topOpportunities.length > 0 ? num(intelligence.topOpportunities[0].eliteScore).toFixed(1) : 'N/A'}`);
    lines.push(`Cikan Firsatlar: ${intelligence.emergingOpportunities.length}`);
    lines.push(`Zayiflayan Firsatlar: ${intelligence.weakeningOpportunities.length}`);
    lines.push('');
    lines.push('--- Performans ---');
    lines.push(`Kazanma Orani: %${num(performance.recommendationSuccessRate).toFixed(1)}`);
    lines.push(`Benchmark Farki: ${formatTurkishPercent(performance.benchmarkComparison.alpha)}`);
    lines.push('');
    lines.push('--- Risk ---');
    lines.push(`Genel Risk: ${risk.overallRiskLevel} (${num(risk.overallRiskScore).toFixed(1)})`);
    lines.push(`Cekilme: %${num(risk.currentDrawdown).toFixed(1)}`);
    lines.push(`Volatilite: %${num(risk.volatility).toFixed(1)}`);
    lines.push(`Cerceve Cakismasi: ${risk.timeframeConflicts}`);

    return lines.join('\n');
  }

  generatePortfolioReport(portfolio: PortfolioSummaryWidget): string {
    const lines: string[] = [];
    lines.push('=== PORTFOZ OZETI ===');
    lines.push(`Toplam Deger: ${formatTurkishCurrency(portfolio.totalValue)}`);
    lines.push(`Nakit: ${formatTurkishCurrency(portfolio.cashBalance)} (${num(portfolio.cashAllocation).toFixed(1)}%)`);
    lines.push(`Yatirim: ${formatTurkishCurrency(portfolio.investedValue)} (${num(portfolio.investedAllocation).toFixed(1)}%)`);
    lines.push(`Toplam Getiri: ${formatTurkishPercent(portfolio.totalReturnPercent)}`);
    lines.push(`Gunluk: ${formatTurkishPercent(portfolio.todayReturnPercent)}`);
    lines.push(`Haftalik: ${formatTurkishPercent(portfolio.weekReturnPercent)}`);
    lines.push(`Aylik: ${formatTurkishPercent(portfolio.monthReturnPercent)}`);
    lines.push(`Acik: ${portfolio.openPositionsCount} | Kapali: ${portfolio.closedPositionsCount}`);
    lines.push(`Kazanma: %${num(portfolio.winRate).toFixed(1)}`);
    return lines.join('\n');
  }

  generateRiskReport(risk: RiskCenterWidget): string {
    const lines: string[] = [];
    lines.push('=== RISK MERKEZI ===');
    lines.push(`Genel Risk: ${risk.overallRiskLevel} (${num(risk.overallRiskScore).toFixed(1)})`);
    lines.push('');
    for (const metric of risk.riskMetrics) {
      lines.push(`${metric.label}: ${metric.level} - ${metric.description}`);
    }
    lines.push('');
    lines.push('Sektor Konsantrasyonu:');
    for (const sc of risk.sectorConcentration) {
      lines.push(`  ${sc.sector}: %${num(sc.weight).toFixed(1)} (${sc.riskLevel})`);
    }
    if (risk.riskAlerts.length > 0) {
      lines.push('');
      lines.push('Risk Uyarilari:');
      for (const alert of risk.riskAlerts) {
        lines.push(`  - ${alert}`);
      }
    }
    return lines.join('\n');
  }

  generateIntelligenceReport(intelligence: IntelligencePanelWidget): string {
    const lines: string[] = [];
    lines.push('=== ZEKA PANELI ===');
    lines.push(`Rejim: ${intelligence.currentMarketRegime} (${num(intelligence.marketRegimeConfidence).toFixed(1)}%)`);
    lines.push(`Aktif Firsat: ${intelligence.totalActiveOpportunities}`);
    lines.push('');
    lines.push('En Iyi Firsatlar:');
    for (const opp of intelligence.topOpportunities.slice(0, 5)) {
      lines.push(`  ${opp.symbol}: Elite=${num(opp.eliteScore).toFixed(1)} Guven=${num(opp.confidence * 100).toFixed(0)}% Asama=${opp.stage}`);
    }
    lines.push('');
    lines.push(`Cikan Firsat: ${intelligence.emergingOpportunities.length}`);
    lines.push(`Zayiflayan Firsat: ${intelligence.weakeningOpportunities.length}`);
    return lines.join('\n');
  }

  generatePerformanceReport(performance: PerformanceAnalyticsWidget): string {
    const lines: string[] = [];
    lines.push('=== PERFORMANS ANALITIGI ===');
    lines.push(`Basari Orani: %${num(performance.recommendationSuccessRate).toFixed(1)}`);
    lines.push(`Benchmark: ${performance.benchmarkComparison.benchmark}`);
    lines.push(`Portfoy: ${formatTurkishPercent(performance.benchmarkComparison.portfolioReturn)}`);
    lines.push(`Benchmark: ${formatTurkishPercent(performance.benchmarkComparison.benchmarkReturn)}`);
    lines.push(`Alpha: ${formatTurkishPercent(performance.benchmarkComparison.alpha)}`);
    lines.push('');
    lines.push('Strateji Performansi:');
    for (const s of performance.strategyPerformance.slice(0, 5)) {
      lines.push(`  ${s.strategy}: Kazanma=%${num(s.winRate).toFixed(1)} Islem=${s.totalTrades} Sharpe=${num(s.sharpeRatio).toFixed(2)}`);
    }
    return lines.join('\n');
  }
}
