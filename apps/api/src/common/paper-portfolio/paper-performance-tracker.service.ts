import { Injectable } from '@nestjs/common';
import {
  PortfolioState, PositionState, PositionStatus, PerformanceReport,
  DailyReturn, PaperPortfolioConfig,
} from './types';

@Injectable()
export class PaperPerformanceTrackerService {
  calculatePerformance(
    portfolio: PortfolioState,
    dailySnapshots?: Array<{ date: string; value: number }>,
    config?: PaperPortfolioConfig,
  ): PerformanceReport {
    const totalValue = this.getTotalValue(portfolio);
    const totalReturn = ((totalValue - portfolio.initialCapital) / portfolio.initialCapital) * 100;

    const realizedReturn = this.calculateRealizedReturn(portfolio);
    const unrealizedReturn = this.calculateUnrealizedReturn(portfolio);

    const dailyReturns = dailySnapshots
      ? this.calculateDailyReturns(dailySnapshots)
      : [];

    const annualizedReturn = this.calculateAnnualizedReturn(totalReturn, dailySnapshots?.length || 30);
    const maxDrawdown = this.calculateMaxDrawdown(dailySnapshots || []);
    const currentDrawdown = this.calculateCurrentDrawdown(portfolio, dailySnapshots || []);
    const portfolioVolatility = this.calculateVolatility(dailyReturns);
    const sharpeRatio = this.calculateSharpeRatio(dailyReturns);

    const closedPositions = this.getClosedPositions(portfolio);
    const winRate = this.calculateWinRate(closedPositions);
    const lossRate = 1 - winRate;
    const profitFactor = this.calculateProfitFactor(closedPositions);
    const avgWinningTrade = this.calculateAvgWinningTrade(closedPositions);
    const avgLosingTrade = this.calculateAvgLosingTrade(closedPositions);
    const avgHoldingPeriod = this.calculateAvgHoldingPeriod(closedPositions);

    const sectorExposure = this.calculateSectorExposure(portfolio, totalValue);
    const cashAllocation = portfolio.cashBalance / totalValue;
    const concentrationRisk = this.calculateConcentrationRisk(portfolio, totalValue);

    return {
      portfolioId: portfolio.id,
      portfolioName: portfolio.name,
      totalReturn,
      realizedReturn,
      unrealizedReturn,
      dailyReturns,
      monthlyReturn: totalReturn,
      annualizedReturn,
      maxDrawdown,
      currentDrawdown,
      portfolioVolatility,
      sharpeRatio,
      winRate,
      lossRate,
      profitFactor,
      avgWinningTrade,
      avgLosingTrade,
      avgHoldingPeriod,
      sectorExposure,
      cashAllocation,
      concentrationRisk,
      generatedAt: new Date().toISOString(),
      disclaimer: 'Bu rapor yalnızca bilgilendirme amaçlıdır ve yatırım tavsiyesi niteliğinde değildir.',
    };
  }

  calculateRealizedReturn(portfolio: PortfolioState): number {
    let totalRealized = 0;
    portfolio.positions.forEach(p => {
      totalRealized += p.realizedPnl;
    });
    return (totalRealized / portfolio.initialCapital) * 100;
  }

  calculateUnrealizedReturn(portfolio: PortfolioState): number {
    let totalUnrealized = 0;
    portfolio.positions.forEach(p => {
      if (p.status === PositionStatus.OPEN) {
        totalUnrealized += p.unrealizedPnl;
      }
    });
    return (totalUnrealized / portfolio.initialCapital) * 100;
  }

  calculateDailyReturns(snapshots: Array<{ date: string; value: number }>): DailyReturn[] {
    if (snapshots.length < 2) return [];

    const returns: DailyReturn[] = [];
    for (let i = 1; i < snapshots.length; i++) {
      const prevValue = snapshots[i - 1].value;
      const currValue = snapshots[i].value;
      const returnPercent = prevValue > 0 ? ((currValue - prevValue) / prevValue) * 100 : 0;
      returns.push({
        date: snapshots[i].date,
        returnPercent,
        portfolioValue: currValue,
      });
    }
    return returns;
  }

  calculateAnnualizedReturn(totalReturn: number, days: number): number {
    if (days <= 0) return 0;
    const annualizationFactor = 365 / days;
    return totalReturn * annualizationFactor;
  }

  calculateMaxDrawdown(snapshots: Array<{ date: string; value: number }>): number {
    if (snapshots.length === 0) return 0;

    let peak = snapshots[0].value;
    let maxDrawdown = 0;

    for (const snap of snapshots) {
      if (snap.value > peak) peak = snap.value;
      const drawdown = peak > 0 ? ((peak - snap.value) / peak) * 100 : 0;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    return maxDrawdown;
  }

  calculateCurrentDrawdown(portfolio: PortfolioState, snapshots: Array<{ date: string; value: number }>): number {
    const currentValue = this.getTotalValue(portfolio);
    const peakValue = portfolio.peakValue > 0 ? portfolio.peakValue : currentValue;
    return peakValue > 0 ? ((peakValue - currentValue) / peakValue) * 100 : 0;
  }

  calculateVolatility(dailyReturns: DailyReturn[]): number {
    if (dailyReturns.length < 2) return 0;

    const returns = dailyReturns.map(r => r.returnPercent);
    const mean = returns.reduce((s, v) => s + v, 0) / returns.length;
    const variance = returns.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (returns.length - 1);
    return Math.sqrt(variance);
  }

  calculateSharpeRatio(dailyReturns: DailyReturn[], riskFreeRate: number = 0): number {
    if (dailyReturns.length < 2) return 0;

    const returns = dailyReturns.map(r => r.returnPercent);
    const mean = returns.reduce((s, v) => s + v, 0) / returns.length;
    const variance = returns.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (returns.length - 1);
    const stdDev = Math.sqrt(variance);

    return stdDev > 0 ? (mean - riskFreeRate) / stdDev : 0;
  }

  calculateWinRate(positions: PositionState[]): number {
    if (positions.length === 0) return 0;
    const winners = positions.filter(p => p.realizedPnl > 0).length;
    return winners / positions.length;
  }

  calculateProfitFactor(positions: PositionState[]): number {
    const grossProfit = positions
      .filter(p => p.realizedPnl > 0)
      .reduce((s, p) => s + p.realizedPnl, 0);
    const grossLoss = Math.abs(
      positions
        .filter(p => p.realizedPnl < 0)
        .reduce((s, p) => s + p.realizedPnl, 0)
    );
    return grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  }

  calculateAvgWinningTrade(positions: PositionState[]): number {
    const winners = positions.filter(p => p.realizedPnl > 0);
    if (winners.length === 0) return 0;
    return winners.reduce((s, p) => s + p.realizedPnl, 0) / winners.length;
  }

  calculateAvgLosingTrade(positions: PositionState[]): number {
    const losers = positions.filter(p => p.realizedPnl < 0);
    if (losers.length === 0) return 0;
    return losers.reduce((s, p) => s + p.realizedPnl, 0) / losers.length;
  }

  calculateAvgHoldingPeriod(positions: PositionState[]): number {
    if (positions.length === 0) return 0;
    const totalDays = positions.reduce((s, p) => s + p.holdingPeriodDays, 0);
    return totalDays / positions.length;
  }

  calculateSectorExposure(portfolio: PortfolioState, totalValue: number): Record<string, number> {
    const exposure: Record<string, number> = {};
    portfolio.positions.forEach(p => {
      if (p.status === PositionStatus.OPEN && p.sector) {
        const value = p.quantity * p.currentPrice;
        exposure[p.sector] = (exposure[p.sector] || 0) + (value / totalValue);
      }
    });
    return exposure;
  }

  calculateConcentrationRisk(portfolio: PortfolioState, totalValue: number): number {
    let maxConc = 0;
    portfolio.positions.forEach(p => {
      if (p.status === PositionStatus.OPEN) {
        const conc = (p.quantity * p.currentPrice) / totalValue;
        if (conc > maxConc) maxConc = conc;
      }
    });
    return maxConc;
  }

  generateSnapshot(portfolio: PortfolioState): { date: string; value: number; cashBalance: number; investedValue: number } {
    const investedValue = this.getInvestedValue(portfolio);
    return {
      date: new Date().toISOString(),
      value: portfolio.cashBalance + investedValue,
      cashBalance: portfolio.cashBalance,
      investedValue,
    };
  }

  private getTotalValue(portfolio: PortfolioState): number {
    return portfolio.cashBalance + this.getInvestedValue(portfolio);
  }

  private getInvestedValue(portfolio: PortfolioState): number {
    let invested = 0;
    portfolio.positions.forEach(p => {
      if (p.status === PositionStatus.OPEN) {
        invested += p.quantity * p.currentPrice;
      }
    });
    return invested;
  }

  private getClosedPositions(portfolio: PortfolioState): PositionState[] {
    const result: PositionState[] = [];
    portfolio.positions.forEach(p => {
      if (p.status === PositionStatus.CLOSED) result.push(p);
    });
    return result;
  }
}
