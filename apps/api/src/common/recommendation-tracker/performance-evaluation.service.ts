import { Injectable } from '@nestjs/common';
import {
  PriceData,
  WindowPerformance,
  RecommendationPerformance,
  EvaluationWindow,
  RecommendationRecord,
} from './types';

@Injectable()
export class PerformanceEvaluationService {
  evaluatePerformance(
    recommendation: RecommendationRecord,
    priceHistory: PriceData[],
  ): RecommendationPerformance {
    const windows = this.calculateAllWindows(recommendation, priceHistory);

    return {
      recommendationId: recommendation.id,
      stockSymbol: recommendation.stockSymbol,
      windows,
      overallReturn: this.calculateOverallReturn(recommendation, priceHistory),
      overallMaxGain: this.calculateOverallMaxGain(recommendation, priceHistory),
      overallMaxDrawdown: this.calculateOverallMaxDrawdown(recommendation, priceHistory),
      overallVolatility: this.calculateOverallVolatility(priceHistory),
      overallRiskAdjustedReturn: this.calculateOverallRiskAdjustedReturn(priceHistory),
      evaluatedAt: new Date().toISOString(),
    };
  }

  calculateReturnMetrics(
    entryPrice: number,
    exitPrice: number,
  ): { return_: number; maxGain: number; maxDrawdown: number } {
    const return_ = entryPrice > 0 ? ((exitPrice - entryPrice) / entryPrice) * 100 : 0;
    const maxGain = return_ > 0 ? return_ : 0;
    const maxDrawdown = return_ < 0 ? Math.abs(return_) : 0;
    return { return_, maxGain, maxDrawdown };
  }

  calculateRiskAdjustedReturn(returns: number[], riskFreeRate: number = 0): number {
    if (returns.length < 2) return 0;
    const mean = returns.reduce((s, v) => s + v, 0) / returns.length;
    const variance = returns.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (returns.length - 1);
    const stdDev = Math.sqrt(variance);
    return stdDev > 0 ? (mean - riskFreeRate) / stdDev : 0;
  }

  getWindowPerformance(
    recommendation: RecommendationRecord,
    priceHistory: PriceData[],
    window: EvaluationWindow,
  ): WindowPerformance {
    const windowDays = this.windowToDays(window);
    const entryDate = new Date(recommendation.entryDate);
    const windowEndDate = new Date(entryDate);
    windowEndDate.setDate(windowEndDate.getDate() + windowDays);

    const windowPrices = priceHistory.filter(p => {
      const d = new Date(p.date);
      return d >= entryDate && d <= windowEndDate;
    });

    if (windowPrices.length === 0) {
      return {
        window,
        returnPercent: 0,
        maxGainPercent: 0,
        maxDrawdownPercent: 0,
        volatility: 0,
        riskAdjustedReturn: 0,
        holdingPeriodDays: 0,
        evaluatedAt: new Date().toISOString(),
      };
    }

    const entryPrice = recommendation.entryPrice;
    const lastPrice = windowPrices[windowPrices.length - 1].close;
    const returnPercent = entryPrice > 0 ? ((lastPrice - entryPrice) / entryPrice) * 100 : 0;

    let maxGainPercent = 0;
    let peakPrice = entryPrice;
    let maxDrawdownPercent = 0;

    for (const p of windowPrices) {
      if (p.high > peakPrice) peakPrice = p.high;
      const gain = entryPrice > 0 ? ((p.high - entryPrice) / entryPrice) * 100 : 0;
      if (gain > maxGainPercent) maxGainPercent = gain;

      const drawdown = peakPrice > 0 ? ((peakPrice - p.low) / peakPrice) * 100 : 0;
      if (drawdown > maxDrawdownPercent) maxDrawdownPercent = drawdown;
    }

    const returns = this.extractReturns(windowPrices);
    const volatility = this.calculateVolatility(returns);
    const riskAdjustedReturn = this.calculateRiskAdjustedReturn(returns);

    return {
      window,
      returnPercent,
      maxGainPercent,
      maxDrawdownPercent,
      volatility,
      riskAdjustedReturn,
      holdingPeriodDays: Math.min(windowDays, windowPrices.length),
      evaluatedAt: new Date().toISOString(),
    };
  }

  getAggregatePerformance(
    recommendations: RecommendationRecord[],
  ): Record<string, WindowPerformance> {
    const result: Record<string, WindowPerformance> = {};
    const windows = Object.values(EvaluationWindow);

    for (const window of windows) {
      const allReturns: number[] = [];
      let totalVolatility = 0;
      let count = 0;

      for (const rec of recommendations) {
        if (rec.actualReturn !== undefined) {
          allReturns.push(rec.actualReturn);
          if (rec.maxDrawdown !== undefined) {
            totalVolatility += rec.maxDrawdown;
            count++;
          }
        }
      }

      const avgReturn = allReturns.length > 0
        ? allReturns.reduce((s, v) => s + v, 0) / allReturns.length
        : 0;
      const avgVolatility = count > 0 ? totalVolatility / count : 0;

      result[window] = {
        window,
        returnPercent: avgReturn,
        maxGainPercent: allReturns.length > 0 ? Math.max(...allReturns) : 0,
        maxDrawdownPercent: allReturns.length > 0 ? Math.max(...allReturns.map(r => Math.abs(r < 0 ? r : 0))) : 0,
        volatility: avgVolatility,
        riskAdjustedReturn: this.calculateRiskAdjustedReturn(allReturns),
        holdingPeriodDays: this.windowToDays(window),
        evaluatedAt: new Date().toISOString(),
      };
    }

    return result;
  }

  calculateVolatility(returns: number[]): number {
    if (returns.length < 2) return 0;
    const mean = returns.reduce((s, v) => s + v, 0) / returns.length;
    const variance = returns.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (returns.length - 1);
    return Math.sqrt(variance);
  }

  calculateSharpeRatio(returns: number[], riskFreeRate: number = 0): number {
    return this.calculateRiskAdjustedReturn(returns, riskFreeRate);
  }

  calculateSortinoRatio(returns: number[], riskFreeRate: number = 0): number {
    if (returns.length < 2) return 0;
    const mean = returns.reduce((s, v) => s + v, 0) / returns.length;
    const downsideReturns = returns.filter(r => r < riskFreeRate);
    if (downsideReturns.length === 0) return mean > riskFreeRate ? Infinity : 0;
    const downsideVariance = downsideReturns.reduce((s, v) => s + Math.pow(v - riskFreeRate, 2), 0) / downsideReturns.length;
    const downsideStdDev = Math.sqrt(downsideVariance);
    return downsideStdDev > 0 ? (mean - riskFreeRate) / downsideStdDev : 0;
  }

  private calculateAllWindows(
    recommendation: RecommendationRecord,
    priceHistory: PriceData[],
  ): WindowPerformance[] {
    const windows = Object.values(EvaluationWindow);
    return windows.map(window => this.getWindowPerformance(recommendation, priceHistory, window));
  }

  private calculateOverallReturn(
    recommendation: RecommendationRecord,
    priceHistory: PriceData[],
  ): number {
    if (priceHistory.length === 0) return 0;
    const lastPrice = priceHistory[priceHistory.length - 1].close;
    return recommendation.entryPrice > 0
      ? ((lastPrice - recommendation.entryPrice) / recommendation.entryPrice) * 100
      : 0;
  }

  private calculateOverallMaxGain(
    recommendation: RecommendationRecord,
    priceHistory: PriceData[],
  ): number {
    if (priceHistory.length === 0) return 0;
    let maxGain = 0;
    for (const p of priceHistory) {
      const gain = recommendation.entryPrice > 0
        ? ((p.high - recommendation.entryPrice) / recommendation.entryPrice) * 100
        : 0;
      if (gain > maxGain) maxGain = gain;
    }
    return maxGain;
  }

  private calculateOverallMaxDrawdown(
    recommendation: RecommendationRecord,
    priceHistory: PriceData[],
  ): number {
    if (priceHistory.length === 0) return 0;
    let peak = recommendation.entryPrice;
    let maxDrawdown = 0;
    for (const p of priceHistory) {
      if (p.high > peak) peak = p.high;
      const drawdown = peak > 0 ? ((peak - p.low) / peak) * 100 : 0;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    return maxDrawdown;
  }

  private calculateOverallVolatility(priceHistory: PriceData[]): number {
    const returns = this.extractReturns(priceHistory);
    return this.calculateVolatility(returns);
  }

  private calculateOverallRiskAdjustedReturn(priceHistory: PriceData[]): number {
    const returns = this.extractReturns(priceHistory);
    return this.calculateRiskAdjustedReturn(returns);
  }

  private extractReturns(prices: PriceData[]): number[] {
    if (prices.length < 2) return [];
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      const prev = prices[i - 1].close;
      const curr = prices[i].close;
      if (prev > 0) {
        returns.push(((curr - prev) / prev) * 100);
      }
    }
    return returns;
  }

  private windowToDays(window: EvaluationWindow): number {
    switch (window) {
      case EvaluationWindow.ONE_DAY: return 1;
      case EvaluationWindow.THREE_DAYS: return 3;
      case EvaluationWindow.ONE_WEEK: return 7;
      case EvaluationWindow.TWO_WEEKS: return 14;
      case EvaluationWindow.ONE_MONTH: return 30;
      case EvaluationWindow.THREE_MONTHS: return 90;
      case EvaluationWindow.SIX_MONTHS: return 180;
      default: return 30;
    }
  }
}
