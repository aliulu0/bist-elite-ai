import { Injectable } from '@nestjs/common';
import {
  PortfolioSnapshot,
  PerformanceReport,
  PerformancePeriod,
  Position,
  Portfolio,
} from '../types/portfolio.types';

@Injectable()
export class PerformanceCalculator {
  calculate(
    portfolio: Portfolio,
    snapshots: PortfolioSnapshot[],
    positions: Position[],
    period: PerformancePeriod,
    benchmarkReturns?: number[],
  ): PerformanceReport {
    const now = new Date();
    const startDate = this.getPeriodStart(now, period, portfolio.metadata.inceptionDate);
    const filtered = snapshots.filter((s) => s.timestamp >= startDate && s.timestamp <= now.toISOString());

    const startValue = filtered.length > 0 ? filtered[0].totalValue : portfolio.cash + positions.reduce((s, p) => s + p.currentValue, 0);
    const endValue = portfolio.cash + positions.reduce((s, p) => s + p.currentValue, 0);
    const absoluteReturn = endValue - startValue;
    const percentReturn = startValue > 0 ? (absoluteReturn / startValue) * 100 : 0;

    const returns = this.calculateReturns(filtered);
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const variance = returns.length > 0 ? returns.reduce((sum, r) => sum + (r - avgReturn) ** 2, 0) / returns.length : 0;
    const volatility = Math.sqrt(variance) * 100;

    const winningDays = returns.filter((r) => r > 0).length;
    const losingDays = returns.filter((r) => r < 0).length;

    const bestDay = returns.length > 0 ? Math.max(...returns) * 100 : null;
    const worstDay = returns.length > 0 ? Math.min(...returns) * 100 : null;

    const rf = 0.15 / 365;
    const excessReturns = returns.map((r) => r - rf);
    const avgExcess = excessReturns.length > 0 ? excessReturns.reduce((a, b) => a + b, 0) / excessReturns.length : 0;
    const sharpeRatio = volatility > 0 ? (avgExcess / (volatility / 100)) * Math.sqrt(365) : null;

    const maxDrawdown = this.calculateMaxDrawdown(filtered, endValue);

    const benchReturn = benchmarkReturns && benchmarkReturns.length > 0
      ? benchmarkReturns[benchmarkReturns.length - 1] : null;
    const alpha = benchReturn !== null ? percentReturn - benchReturn : null;

    return {
      portfolioId: portfolio.id,
      period,
      startDate,
      endDate: now.toISOString(),
      startValue: this.round(startValue),
      endValue: this.round(endValue),
      absoluteReturn: this.round(absoluteReturn),
      percentReturn: this.round(percentReturn),
      benchmarkReturn: benchReturn !== null ? this.round(benchReturn) : null,
      alpha: alpha !== null ? this.round(alpha) : null,
      beta: null,
      volatility: this.round(volatility),
      sharpeRatio: sharpeRatio !== null ? this.round(sharpeRatio) : null,
      maxDrawdown: this.round(maxDrawdown),
      bestDay: bestDay !== null ? this.round(bestDay) : null,
      worstDay: worstDay !== null ? this.round(worstDay) : null,
      winningDays,
      losingDays,
      timestamp: now.toISOString(),
    };
  }

  private getPeriodStart(now: Date, period: PerformancePeriod, inceptionDate: string): string {
    const d = new Date(now);
    switch (period) {
      case 'DAILY':
        d.setDate(d.getDate() - 1);
        break;
      case 'WEEKLY':
        d.setDate(d.getDate() - 7);
        break;
      case 'MONTHLY':
        d.setMonth(d.getMonth() - 1);
        break;
      case 'QUARTERLY':
        d.setMonth(d.getMonth() - 3);
        break;
      case 'YEARLY':
        d.setFullYear(d.getFullYear() - 1);
        break;
      case 'SINCE_INCEPTION':
        return inceptionDate;
    }
    return d.toISOString();
  }

  private calculateReturns(snapshots: PortfolioSnapshot[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < snapshots.length; i++) {
      if (snapshots[i - 1].totalValue > 0) {
        returns.push((snapshots[i].totalValue - snapshots[i - 1].totalValue) / snapshots[i - 1].totalValue);
      }
    }
    return returns;
  }

  private calculateMaxDrawdown(snapshots: PortfolioSnapshot[], currentValue: number): number {
    const allValues = [...snapshots.map((s) => s.totalValue), currentValue];
    if (allValues.length === 0) return 0;
    let peak = allValues[0];
    let maxDd = 0;
    for (const v of allValues) {
      if (v > peak) peak = v;
      const dd = peak > 0 ? ((peak - v) / peak) * 100 : 0;
      if (dd > maxDd) maxDd = dd;
    }
    return maxDd;
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
