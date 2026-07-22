import { Injectable } from '@nestjs/common';
import {
  PerformanceAnalyticsWidget,
  PerformanceMetric,
  StrategyPerformance,
  SectorPerformance,
  TimeframePerformance,
  TrendDirection,
} from './types';

@Injectable()
export class PerformanceAnalyticsService {
  getPerformanceWidget(data: {
    winRate: number;
    totalReturn: number;
    todayReturn: number;
    weekReturn: number;
    monthReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    strategyPerformance: { strategy: string; winRate: number; totalTrades: number; avgReturn: number; sharpeRatio: number; maxDrawdown: number }[];
    sectorPerformance: { sector: string; avgReturn: number; winRate: number; exposure: number; opportunityCount: number }[];
    timeframePerformance: { timeframe: string; avgReturn: number; winRate: number; signalCount: number; consensusAccuracy: number }[];
    historicalPerformance: { period: string; returnPercent: number }[];
    benchmarkReturn?: number;
  }): PerformanceAnalyticsWidget {
    const overallMetrics = this.buildOverallMetrics(data);
    const strategyPerf = data.strategyPerformance.map(s => s as StrategyPerformance);
    const sectorPerf = data.sectorPerformance.map(s => s as SectorPerformance);
    const timeframePerf = data.timeframePerformance.map(t => t as TimeframePerformance);

    const benchmarkComparison = {
      benchmark: 'XU100',
      portfolioReturn: data.totalReturn,
      benchmarkReturn: data.benchmarkReturn ?? 0,
      alpha: data.totalReturn - (data.benchmarkReturn ?? 0),
    };

    return {
      overallMetrics,
      recommendationSuccessRate: data.winRate,
      strategyPerformance: strategyPerf,
      sectorPerformance: sectorPerf,
      timeframePerformance: timeframePerf,
      historicalPerformance: data.historicalPerformance,
      benchmarkComparison,
      lastUpdated: new Date().toISOString(),
    };
  }

  calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.15): number {
    if (returns.length === 0) return 0;
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev < 1e-10) return 0;
    return (avgReturn - riskFreeRate) / stdDev;
  }

  calculateMaxDrawdown(equityCurve: number[]): number {
    if (equityCurve.length === 0) return 0;
    let peak = equityCurve[0];
    let maxDrawdown = 0;
    for (const value of equityCurve) {
      if (value > peak) peak = value;
      const drawdown = (peak - value) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    return maxDrawdown * 100;
  }

  calculateWinRate(outcomes: ('WIN' | 'LOSS' | 'BREAKEVEN')[]): number {
    if (outcomes.length === 0) return 0;
    const wins = outcomes.filter(o => o === 'WIN').length;
    return (wins / outcomes.length) * 100;
  }

  getTrendFromChange(change: number): TrendDirection {
    if (change > 0.5) return TrendDirection.UP;
    if (change < -0.5) return TrendDirection.DOWN;
    return TrendDirection.FLAT;
  }

  private buildOverallMetrics(data: {
    winRate: number;
    totalReturn: number;
    todayReturn: number;
    weekReturn: number;
    monthReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
  }): PerformanceMetric[] {
    return [
      { label: 'Kazanma Orani', value: data.winRate, unit: '%', trend: this.getTrendFromChange(data.winRate - 50), changePercent: 0 },
      { label: 'Toplam Getiri', value: data.totalReturn, unit: '%', trend: this.getTrendFromChange(data.totalReturn), changePercent: data.totalReturn },
      { label: 'Gunluk Getiri', value: data.todayReturn, unit: '%', trend: this.getTrendFromChange(data.todayReturn), changePercent: data.todayReturn },
      { label: 'Haftalik Getiri', value: data.weekReturn, unit: '%', trend: this.getTrendFromChange(data.weekReturn), changePercent: data.weekReturn },
      { label: 'Aylik Getiri', value: data.monthReturn, unit: '%', trend: this.getTrendFromChange(data.monthReturn), changePercent: data.monthReturn },
      { label: 'Sharpe Orani', value: data.sharpeRatio, unit: '', trend: this.getTrendFromChange(data.sharpeRatio), changePercent: 0 },
      { label: 'Maksimum Cekilme', value: data.maxDrawdown, unit: '%', trend: TrendDirection.DOWN, changePercent: -data.maxDrawdown },
    ];
  }
}
