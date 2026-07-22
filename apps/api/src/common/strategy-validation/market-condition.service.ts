import { Injectable } from '@nestjs/common';
import { MarketCondition, TradeRecord, MarketConditionPerformance, PerformanceMetrics } from './types';

@Injectable()
export class MarketConditionAnalyzer {
  analyze(trades: TradeRecord[]): MarketConditionPerformance[] {
    if (!trades || trades.length === 0) {
      return [];
    }

    const conditionMap = new Map<MarketCondition, TradeRecord[]>();

    for (const trade of trades) {
      const condition = trade.marketCondition;
      if (!conditionMap.has(condition)) {
        conditionMap.set(condition, []);
      }
      conditionMap.get(condition)!.push(trade);
    }

    const results: MarketConditionPerformance[] = [];

    for (const [condition, conditionTrades] of conditionMap) {
      const wins = conditionTrades.filter(t => t.pnl > 0);
      const losses = conditionTrades.filter(t => t.pnl < 0);

      const winRate = (wins.length / conditionTrades.length) * 100;
      const avgReturn = conditionTrades.reduce((s, t) => s + t.pnlPercent, 0) / conditionTrades.length;

      const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
      const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
      const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

      const returns = conditionTrades.map(t => t.pnlPercent / 100);
      const avgReturnDaily = returns.reduce((s, v) => s + v, 0) / returns.length;
      const stdDev = this.calculateStdDev(returns);
      const sharpeRatio = stdDev > 0 ? avgReturnDaily / stdDev : 0;

      const { maxDrawdown } = this.calculateDrawdowns(conditionTrades);
      const volatility = stdDev * Math.sqrt(252);

      const confidence = this.calculateConditionConfidence(conditionTrades.length, winRate);

      results.push({
        condition,
        totalTrades: conditionTrades.length,
        winRate,
        avgReturn,
        profitFactor: Math.min(profitFactor, 100),
        sharpeRatio,
        maxDrawdown: maxDrawdown * 100,
        volatility: volatility * 100,
        confidence,
      });
    }

    return results.sort((a, b) => b.totalTrades - a.totalTrades);
  }

  classifyMarketCondition(
    priceData: Array<{ date: string; close: number; volume: number; high: number; low: number }>,
    lookbackPeriod: number = 20
  ): MarketCondition[] {
    if (!priceData || priceData.length < lookbackPeriod) {
      return [MarketCondition.SIDEWAYS_MARKET];
    }

    const recentData = priceData.slice(-lookbackPeriod);
    const conditions: MarketCondition[] = [];

    const returns = [];
    for (let i = 1; i < recentData.length; i++) {
      returns.push((recentData[i].close - recentData[i - 1].close) / recentData[i - 1].close);
    }

    const avgReturn = returns.reduce((s, v) => s + v, 0) / returns.length;
    const volatility = this.calculateStdDev(returns);

    if (avgReturn > 0.001) {
      conditions.push(MarketCondition.BULL_MARKET);
    } else if (avgReturn < -0.001) {
      conditions.push(MarketCondition.BEAR_MARKET);
    } else {
      conditions.push(MarketCondition.SIDEWAYS_MARKET);
    }

    if (volatility > 0.02) {
      conditions.push(MarketCondition.HIGH_VOLATILITY);
    } else if (volatility < 0.005) {
      conditions.push(MarketCondition.LOW_VOLATILITY);
    }

    const avgVolume = recentData.reduce((s, d) => s + d.volume, 0) / recentData.length;
    const recentVolume = recentData.slice(-5).reduce((s, d) => s + d.volume, 0) / 5;

    if (recentVolume > avgVolume * 1.5) {
      conditions.push(MarketCondition.HIGH_VOLUME);
    } else if (recentVolume < avgVolume * 0.5) {
      conditions.push(MarketCondition.LOW_VOLUME);
    }

    return conditions;
  }

  getMarketConditionPerformanceSummary(
    performances: MarketConditionPerformance[]
  ): {
    bestCondition: MarketCondition | null;
    worstCondition: MarketCondition | null;
    avgWinRate: number;
    avgProfitFactor: number;
    overallConfidence: number;
  } {
    if (performances.length === 0) {
      return {
        bestCondition: null,
        worstCondition: null,
        avgWinRate: 0,
        avgProfitFactor: 0,
        overallConfidence: 0,
      };
    }

    const sorted = [...performances].sort((a, b) => b.winRate - a.winRate);
    const bestCondition = sorted[0].condition;
    const worstCondition = sorted[sorted.length - 1].condition;

    const avgWinRate = performances.reduce((s, p) => s + p.winRate, 0) / performances.length;
    const avgProfitFactor = performances.reduce((s, p) => s + Math.min(p.profitFactor, 10), 0) / performances.length;
    const overallConfidence = performances.reduce((s, p) => s + p.confidence, 0) / performances.length;

    return {
      bestCondition,
      worstCondition,
      avgWinRate,
      avgProfitFactor,
      overallConfidence,
    };
  }

  private calculateStdDev(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((s, v) => s + v, 0) / (values.length - 1);
    return Math.sqrt(variance);
  }

  private calculateDrawdowns(trades: TradeRecord[]): { maxDrawdown: number } {
    if (trades.length === 0) return { maxDrawdown: 0 };

    let cumulativePnl = 0;
    let peak = 0;
    let maxDrawdown = 0;

    for (const trade of trades) {
      cumulativePnl += trade.pnl;
      if (cumulativePnl > peak) {
        peak = cumulativePnl;
      }
      const drawdown = peak > 0 ? (peak - cumulativePnl) / peak : 0;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return { maxDrawdown };
  }

  private calculateConditionConfidence(tradeCount: number, winRate: number): number {
    const sampleSizeConfidence = Math.min(1, tradeCount / 30);
    const winRateConfidence = winRate > 50 ? (winRate - 50) / 50 : 0;
    return sampleSizeConfidence * 0.6 + winRateConfidence * 0.4;
  }
}
