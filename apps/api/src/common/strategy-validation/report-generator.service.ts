import { Injectable } from '@nestjs/common';
import {
  ValidationSummary, ValidationReport, ComparisonResult, TradeRecord,
  SignalAction, MarketCondition, ValidationType, ValidationStatus
} from './types';
import { VALIDATION_STATUS_TURKISH, METRIC_NAMES_TURKISH, VALIDATION_TERMS_TURKISH } from './turkish-terms';

@Injectable()
export class ReportGenerator {
  generateReport(
    summary: ValidationSummary,
    trades: TradeRecord[],
    comparison?: ComparisonResult
  ): ValidationReport {
    const tradeAnalysis = this.analyzeTrades(trades);
    const monthlyReturns = this.calculateMonthlyReturns(trades);
    const drawdownAnalysis = this.analyzeDrawdowns(trades);
    const indicatorPerformance = this.analyzeIndicatorPerformance(trades);

    return {
      summary,
      comparison,
      detailedAnalysis: {
        tradeAnalysis,
        monthlyReturns,
        drawdownAnalysis,
        indicatorPerformance,
      },
      generatedAt: new Date().toISOString(),
      disclaimer: this.generateDisclaimer(),
    };
  }

  generateComparisonSummary(
    strategies: Array<{
      strategyId: string;
      strategyName: string;
      overallScore: number;
      performanceMetrics: any;
      signalQuality: any;
    }>
  ): ComparisonResult {
    const sorted = [...strategies].sort((a, b) => b.overallScore - a.overallScore);

    return {
      strategies: sorted.map((s, i) => ({
        strategyId: s.strategyId,
        strategyName: s.strategyName,
        overallScore: s.overallScore,
        performanceMetrics: s.performanceMetrics,
        signalQuality: s.signalQuality,
        rank: i + 1,
      })),
      winner: {
        strategyId: sorted[0].strategyId,
        strategyName: sorted[0].strategyName,
        overallScore: sorted[0].overallScore,
      },
      comparisonMetrics: [
        'overallScore',
        'winRate',
        'profitFactor',
        'sharpeRatio',
        'maxDrawdown',
        'f1Score',
      ],
      generatedAt: new Date().toISOString(),
    };
  }

  generateTurkishSummary(summary: ValidationSummary): string {
    const statusTurkish = VALIDATION_STATUS_TURKISH[summary.status] || 'Bilinmeyen';
    let report = `## Doğrulama Özeti - ${summary.strategyName}\n\n`;
    report += `**Genel Skor:** ${summary.overallScore.toFixed(1)}/100\n`;
    report += `**Durum:** ${statusTurkish}\n`;
    report += `**Güven:** ${(summary.confidence * 100).toFixed(1)}%\n\n`;

    report += `### Performans Metrikleri\n`;
    report += `| Metrik | Değer |\n|--------|-------|\n`;
    report += `| Toplam Getiri | ${summary.performanceMetrics.totalReturnPercent.toFixed(2)}% |\n`;
    report += `| Yıllık Getiri | ${summary.performanceMetrics.annualizedReturn.toFixed(2)}% |\n`;
    report += `| Kazanma Oranı | ${summary.performanceMetrics.winRate.toFixed(1)}% |\n`;
    report += `| Kâr Faktörü | ${summary.performanceMetrics.profitFactor.toFixed(2)} |\n`;
    report += `| Sharpe Oranı | ${summary.performanceMetrics.sharpeRatio.toFixed(2)} |\n`;
    report += `| Maks. Drawdown | ${summary.performanceMetrics.maxDrawdown.toFixed(2)}% |\n\n`;

    report += `### Sinyal Kalitesi\n`;
    report += `| Metrik | Değer |\n|--------|-------|\n`;
    report += `| Hassasiyet | ${(summary.signalQuality.precision * 100).toFixed(1)}% |\n`;
    report += `| Duyarlılık | ${(summary.signalQuality.recall * 100).toFixed(1)}% |\n`;
    report += `| F1 Skoru | ${(summary.signalQuality.f1Score * 100).toFixed(1)}% |\n\n`;

    if (summary.strengths.length > 0) {
      report += `### Güçlü Yönler\n`;
      summary.strengths.forEach(s => { report += `- ${s}\n`; });
      report += `\n`;
    }

    if (summary.weaknesses.length > 0) {
      report += `### Zayıf Yönler\n`;
      summary.weaknesses.forEach(w => { report += `- ${w}\n`; });
      report += `\n`;
    }

    if (summary.improvementSuggestions.length > 0) {
      report += `### İyileştirme Önerileri\n`;
      summary.improvementSuggestions.forEach(s => { report += `- ${s}\n`; });
      report += `\n`;
    }

    report += `*${summary.disclaimer || this.generateDisclaimer()}*\n`;

    return report;
  }

  private analyzeTrades(trades: TradeRecord[]): ValidationReport['detailedAnalysis']['tradeAnalysis'] {
    return trades.map((trade, i) => ({
      tradeId: i + 1,
      entryDate: trade.entryDate,
      exitDate: trade.exitDate,
      action: trade.action,
      return: trade.pnlPercent,
      holdingPeriod: trade.holdingPeriodDays,
      indicators: trade.indicators,
      marketCondition: trade.marketCondition,
    }));
  }

  private calculateMonthlyReturns(trades: TradeRecord[]): ValidationReport['detailedAnalysis']['monthlyReturns'] {
    const monthlyMap = new Map<string, { return_: number; trades: number; wins: number }>();

    for (const trade of trades) {
      const date = new Date(trade.entryDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, { return_: 0, trades: 0, wins: 0 });
      }

      const month = monthlyMap.get(key)!;
      month.return_ += trade.pnlPercent;
      month.trades++;
      if (trade.pnl > 0) month.wins++;
    }

    const monthlyReturns: ValidationReport['detailedAnalysis']['monthlyReturns'] = [];

    for (const [key, data] of monthlyMap) {
      const [year, month] = key.split('-').map(Number);
      monthlyReturns.push({
        year,
        month,
        return_: data.return_,
        trades: data.trades,
        winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
      });
    }

    return monthlyReturns.sort((a, b) => a.year - b.year || a.month - b.month);
  }

  private analyzeDrawdowns(trades: TradeRecord[]): ValidationReport['detailedAnalysis']['drawdownAnalysis'] {
    if (trades.length === 0) return [];

    let cumulativePnl = 0;
    let peak = 0;
    let currentDrawdownStart = -1;
    const drawdowns: ValidationReport['detailedAnalysis']['drawdownAnalysis'] = [];

    for (let i = 0; i < trades.length; i++) {
      cumulativePnl += trades[i].pnl;

      if (cumulativePnl > peak) {
        if (currentDrawdownStart >= 0) {
          const drawdown = peak > 0 ? (peak - cumulativePnl) / peak * 100 : 0;
          drawdowns.push({
            date: trades[currentDrawdownStart].entryDate,
            drawdown,
            duration: i - currentDrawdownStart,
            recoveryTime: 1,
          });
        }
        peak = cumulativePnl;
        currentDrawdownStart = -1;
      } else if (currentDrawdownStart === -1) {
        currentDrawdownStart = i;
      }
    }

    if (currentDrawdownStart >= 0) {
      const drawdown = peak > 0 ? (peak - cumulativePnl) / peak * 100 : 0;
      drawdowns.push({
        date: trades[currentDrawdownStart].entryDate,
        drawdown,
        duration: trades.length - currentDrawdownStart,
        recoveryTime: 0,
      });
    }

    return drawdowns;
  }

  private analyzeIndicatorPerformance(
    trades: TradeRecord[]
  ): ValidationReport['detailedAnalysis']['indicatorPerformance'] {
    const indicatorStats: Record<string, { correct: number; total: number; sumContribution: number }> = {};

    for (const trade of trades) {
      for (const [indicator, value] of Object.entries(trade.indicators)) {
        if (!indicatorStats[indicator]) {
          indicatorStats[indicator] = { correct: 0, total: 0, sumContribution: 0 };
        }

        const stats = indicatorStats[indicator];
        stats.total++;

        const isPositiveSignal = value > 50;
        const isWinningTrade = trade.pnl > 0;

        if (isPositiveSignal && isWinningTrade) {
          stats.correct++;
        } else if (!isPositiveSignal && !isWinningTrade) {
          stats.correct++;
        }

        stats.sumContribution += value * (isWinningTrade ? 1 : -1);
      }
    }

    const result: ValidationReport['detailedAnalysis']['indicatorPerformance'] = {};

    for (const [indicator, stats] of Object.entries(indicatorStats)) {
      result[indicator] = {
        accuracy: stats.total > 0 ? stats.correct / stats.total : 0,
        precision: stats.total > 0 ? stats.correct / stats.total : 0,
        recall: stats.total > 0 ? stats.correct / stats.total : 0,
        contribution: stats.total > 0 ? stats.sumContribution / stats.total : 0,
      };
    }

    return result;
  }

  private generateDisclaimer(): string {
    return 'Bu rapor yalnızca bilgilendirme amaçlıdır ve yatırım tavsiyesi niteliği taşımamaktadır. ' +
      'Geçmiş performans gelecek sonuçların garantisi değildir. Yatırım kararlarınızı vermeden önce ' +
      'profesyonel yatırım danışmanınıza başvurunuz.';
  }
}
