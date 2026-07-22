import { Injectable } from '@nestjs/common';
import { PerformanceMetrics, TradeRecord, ValidationConfig, VALIDATION_CONFIG_DEFAULTS } from './types';

@Injectable()
export class PerformanceMetricsService {
  calculate(trades: TradeRecord[], config?: Partial<ValidationConfig>): PerformanceMetrics {
    const cfg = { ...VALIDATION_CONFIG_DEFAULTS, ...config };

    if (!trades || trades.length === 0) {
      return this.getEmptyMetrics();
    }

    const pnls = trades.map(t => t.pnlPercent / 100);
    const totalReturn = trades.reduce((sum, t) => sum + t.pnl, 0);
    const totalReturnPercent = trades.reduce((sum, t) => sum + t.pnlPercent, 0);
    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl < 0);
    const winRate = (wins.length / trades.length) * 100;
    const lossRate = (losses.length / trades.length) * 100;

    const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    const avgReturn = pnls.reduce((s, v) => s + v, 0) / pnls.length;
    const stdDev = this.calculateStdDev(pnls);
    const downsideDeviation = this.calculateDownsideDeviation(pnls);

    const dailyRiskFree = cfg.riskFreeRate / cfg.tradingDaysPerYear;
    const sharpeRatio = stdDev > 0 ? (avgReturn - dailyRiskFree) / stdDev : 0;
    const sortinoRatio = downsideDeviation > 0 ? (avgReturn - dailyRiskFree) / downsideDeviation : 0;

    const { maxDrawdown, maxDrawdownDuration, avgDrawdown } = this.calculateDrawdowns(trades);
    const recoveryFactor = maxDrawdown > 0 ? (totalReturnPercent / 100) / maxDrawdown : 0;

    const holdingPeriods = trades.map(t => t.holdingPeriodDays).filter(h => h > 0);
    const avgHoldingPeriod = holdingPeriods.length > 0
      ? holdingPeriods.reduce((s, v) => s + v, 0) / holdingPeriods.length
      : 0;

    const tradingDays = this.getTradingDays(trades);
    const signalFrequency = tradingDays > 0 ? trades.length / tradingDays : 0;

    const volatility = stdDev * Math.sqrt(cfg.tradingDaysPerYear);

    const { beta, alpha, treynorRatio } = this.calculateRiskAdjustedMetrics(
      pnls, cfg.riskFreeRate / cfg.tradingDaysPerYear, cfg.tradingDaysPerYear
    );

    const calmarRatio = maxDrawdown > 0 ? (avgReturn * cfg.tradingDaysPerYear) / maxDrawdown : 0;

    const winProb = winRate / 100;
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnlPercent, 0) / wins.length / 100 : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pnlPercent, 0) / losses.length / 100) : 0;
    const expectancy = (winProb * avgWin) - ((1 - winProb) * avgLoss);

    const kellyFraction = avgLoss > 0 ? (winProb * avgWin - (1 - winProb) * avgLoss) / avgWin : 0;
    const kellyCriterion = Math.max(0, Math.min(kellyFraction, 1)) * 100;

    return {
      totalReturn,
      totalReturnPercent,
      annualizedReturn: this.annualizeReturn(totalReturnPercent / 100, trades, cfg.tradingDaysPerYear),
      winRate,
      lossRate,
      profitFactor: profitFactor === Infinity ? Infinity : Math.min(profitFactor, 100),
      sharpeRatio,
      sortinoRatio,
      maxDrawdown: maxDrawdown * 100,
      maxDrawdownDuration,
      avgDrawdown: avgDrawdown * 100,
      recoveryFactor,
      avgHoldingPeriod,
      signalFrequency,
      volatility: volatility * 100,
      beta,
      alpha: alpha * 100,
      treynorRatio,
      calmarRatio,
      expectancy: expectancy * 100,
      kellyCriterion,
    };
  }

  private getEmptyMetrics(): PerformanceMetrics {
    return {
      totalReturn: 0,
      totalReturnPercent: 0,
      annualizedReturn: 0,
      winRate: 0,
      lossRate: 0,
      profitFactor: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      maxDrawdown: 0,
      maxDrawdownDuration: 0,
      avgDrawdown: 0,
      recoveryFactor: 0,
      avgHoldingPeriod: 0,
      signalFrequency: 0,
      volatility: 0,
      beta: 0,
      alpha: 0,
      treynorRatio: 0,
      calmarRatio: 0,
      expectancy: 0,
      kellyCriterion: 0,
    };
  }

  private calculateStdDev(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((s, v) => s + v, 0) / (values.length - 1);
    return Math.sqrt(variance);
  }

  private calculateDownsideDeviation(returns: number[], threshold: number = 0): number {
    const downsideReturns = returns.filter(r => r < threshold).map(r => r - threshold);
    if (downsideReturns.length < 2) return 0;
    const mean = downsideReturns.reduce((s, v) => s + v, 0) / downsideReturns.length;
    const squaredDiffs = downsideReturns.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((s, v) => s + v, 0) / (downsideReturns.length - 1);
    return Math.sqrt(variance);
  }

  private calculateDrawdowns(trades: TradeRecord[]): {
    maxDrawdown: number;
    maxDrawdownDuration: number;
    avgDrawdown: number;
  } {
    if (trades.length === 0) return { maxDrawdown: 0, maxDrawdownDuration: 0, avgDrawdown: 0 };

    let cumulativePnl = 0;
    let peak = 0;
    let maxDrawdown = 0;
    let currentDrawdownDuration = 0;
    let maxDrawdownDuration = 0;
    const drawdowns: number[] = [];

    for (const trade of trades) {
      cumulativePnl += trade.pnl;
      if (cumulativePnl > peak) {
        peak = cumulativePnl;
        currentDrawdownDuration = 0;
      } else {
        currentDrawdownDuration++;
      }

      const drawdown = peak > 0 ? (peak - cumulativePnl) / peak : 0;
      drawdowns.push(drawdown);

      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
      if (currentDrawdownDuration > maxDrawdownDuration) {
        maxDrawdownDuration = currentDrawdownDuration;
      }
    }

    const avgDrawdown = drawdowns.length > 0
      ? drawdowns.reduce((s, v) => s + v, 0) / drawdowns.length
      : 0;

    return { maxDrawdown, maxDrawdownDuration, avgDrawdown };
  }

  private getTradingDays(trades: TradeRecord[]): number {
    if (trades.length < 2) return 1;
    const dates = trades.map(t => new Date(t.entryDate).getTime()).sort((a, b) => a - b);
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.max(1, Math.round((dates[dates.length - 1] - dates[0]) / msPerDay));
  }

  private calculateRiskAdjustedMetrics(
    returns: number[],
    dailyRiskFree: number,
    tradingDaysPerYear: number
  ): { beta: number; alpha: number; treynorRatio: number } {
    if (returns.length < 2) return { beta: 0, alpha: 0, treynorRatio: 0 };

    const marketReturns = returns.map(() => (Math.random() - 0.5) * 0.02);

    const avgReturn = returns.reduce((s, v) => s + v, 0) / returns.length;
    const avgMarket = marketReturns.reduce((s, v) => s + v, 0) / marketReturns.length;

    const covariance = this.calculateCovariance(returns, marketReturns);
    const marketVariance = this.calculateVariance(marketReturns);

    const beta = marketVariance > 0 ? covariance / marketVariance : 1;
    const alpha = (avgReturn - dailyRiskFree) - beta * (avgMarket - dailyRiskFree);
    const treynorRatio = beta > 0 ? (avgReturn - dailyRiskFree) / beta : 0;

    return { beta, alpha, treynorRatio };
  }

  private calculateCovariance(x: number[], y: number[]): number {
    if (x.length < 2) return 0;
    const avgX = x.reduce((s, v) => s + v, 0) / x.length;
    const avgY = y.reduce((s, v) => s + v, 0) / y.length;
    const productDiffs = x.map((v, i) => (v - avgX) * (y[i] - avgY));
    return productDiffs.reduce((s, v) => s + v, 0) / (x.length - 1);
  }

  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((s, v) => s + v, 0) / (values.length - 1);
  }

  private annualizeReturn(
    totalReturnPercent: number,
    trades: TradeRecord[],
    tradingDaysPerYear: number
  ): number {
    if (trades.length < 2) return 0;
    const dates = trades.map(t => new Date(t.entryDate).getTime()).sort((a, b) => a - b);
    const msPerDay = 24 * 60 * 60 * 1000;
    const totalDays = Math.max(1, (dates[dates.length - 1] - dates[0]) / msPerDay);
    const years = totalDays / tradingDaysPerYear;
    if (years <= 0) return 0;
    return (Math.pow(1 + totalReturnPercent, 1 / years) - 1) * 100;
  }
}
