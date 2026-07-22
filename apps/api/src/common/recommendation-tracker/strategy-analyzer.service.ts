import { Injectable } from '@nestjs/common';
import {
  RecommendationRecord,
  StrategyPerformanceAnalysis,
  IndicatorPerformanceAnalysis,
  SectorPerformanceAnalysis,
  TimeframePerformanceAnalysis,
  MarketConditionPerformanceAnalysis,
  MarketRegime,
} from './types';

@Injectable()
export class StrategyAnalyzerService {
  analyzeStrategyPerformance(recommendations: RecommendationRecord[]): StrategyPerformanceAnalysis[] {
    const strategyMap = new Map<string, RecommendationRecord[]>();
    for (const rec of recommendations) {
      const existing = strategyMap.get(rec.strategyUsed) || [];
      existing.push(rec);
      strategyMap.set(rec.strategyUsed, existing);
    }

    const results: StrategyPerformanceAnalysis[] = [];
    for (const [strategy, recs] of strategyMap) {
      results.push(this.buildStrategyAnalysis(strategy, recs));
    }
    return results;
  }

  analyzeIndicatorPerformance(recommendations: RecommendationRecord[]): IndicatorPerformanceAnalysis[] {
    const indicatorStats = new Map<string, { correct: number; total: number; truePositive: number; falsePositive: number; falseNegative: number }>();
    const indicators = ['eliteScore', 'consensusScore', 'confidenceScore', 'strategyUsed', 'marketRegime'];

    for (const rec of recommendations) {
      const actualReturn = rec.actualReturn || 0;
      const actualPositive = actualReturn > 0;

      for (const indicator of indicators) {
        if (!indicatorStats.has(indicator)) {
          indicatorStats.set(indicator, { correct: 0, total: 0, truePositive: 0, falsePositive: 0, falseNegative: 0 });
        }
        const stats = indicatorStats.get(indicator)!;
        stats.total++;

        let predictedPositive = false;
        switch (indicator) {
          case 'eliteScore': predictedPositive = rec.entryEliteScore >= 50; break;
          case 'consensusScore': predictedPositive = rec.entryConsensusScore >= 50; break;
          case 'confidenceScore': predictedPositive = rec.entryConfidence >= 0.5; break;
          case 'strategyUsed': predictedPositive = rec.strategyUsed !== ''; break;
          case 'marketRegime': predictedPositive = rec.marketRegime === MarketRegime.BULL; break;
        }

        if (predictedPositive === actualPositive) stats.correct++;
        if (predictedPositive && actualPositive) stats.truePositive++;
        if (predictedPositive && !actualPositive) stats.falsePositive++;
        if (!predictedPositive && actualPositive) stats.falseNegative++;
      }
    }

    const results: IndicatorPerformanceAnalysis[] = [];
    for (const [indicator, stats] of indicatorStats) {
      const accuracy = stats.total > 0 ? stats.correct / stats.total : 0;
      const precision = (stats.truePositive + stats.falsePositive) > 0
        ? stats.truePositive / (stats.truePositive + stats.falsePositive)
        : 0;
      const recall = (stats.truePositive + stats.falseNegative) > 0
        ? stats.truePositive / (stats.truePositive + stats.falseNegative)
        : 0;
      const f1Score = (precision + recall) > 0
        ? 2 * (precision * recall) / (precision + recall)
        : 0;
      const contribution = accuracy * 0.4 + precision * 0.3 + recall * 0.3;

      results.push({
        indicator,
        accuracy,
        precision,
        recall,
        f1Score,
        contribution,
        analyzedAt: new Date().toISOString(),
      });
    }

    return results;
  }

  analyzeSectorPerformance(recommendations: RecommendationRecord[]): SectorPerformanceAnalysis[] {
    const sectorMap = new Map<string, RecommendationRecord[]>();
    for (const rec of recommendations) {
      const sector = rec.sector || 'Diger';
      const existing = sectorMap.get(sector) || [];
      existing.push(rec);
      sectorMap.set(sector, existing);
    }

    const results: SectorPerformanceAnalysis[] = [];
    for (const [sector, recs] of sectorMap) {
      const completed = recs.filter(r => r.actualReturn !== undefined);
      const winners = completed.filter(r => (r.actualReturn || 0) > 0);
      const avgReturn = completed.length > 0
        ? completed.reduce((s, r) => s + (r.actualReturn || 0), 0) / completed.length
        : 0;
      const grossProfit = completed.filter(r => (r.actualReturn || 0) > 0).reduce((s, r) => s + (r.actualReturn || 0), 0);
      const grossLoss = Math.abs(completed.filter(r => (r.actualReturn || 0) < 0).reduce((s, r) => s + (r.actualReturn || 0), 0));
      const avgEliteScore = recs.length > 0
        ? recs.reduce((s, r) => s + r.entryEliteScore, 0) / recs.length
        : 0;

      results.push({
        sector,
        totalRecommendations: recs.length,
        winRate: completed.length > 0 ? (winners.length / completed.length) * 100 : 0,
        avgReturn,
        profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
        avgEliteScore,
        analyzedAt: new Date().toISOString(),
      });
    }

    return results;
  }

  analyzeTimeframePerformance(recommendations: RecommendationRecord[]): TimeframePerformanceAnalysis[] {
    const timeframeMap = new Map<string, RecommendationRecord[]>();
    for (const rec of recommendations) {
      const tf = rec.timeframeConsensus || 'unknown';
      const existing = timeframeMap.get(tf) || [];
      existing.push(rec);
      timeframeMap.set(tf, existing);
    }

    const results: TimeframePerformanceAnalysis[] = [];
    for (const [timeframe, recs] of timeframeMap) {
      const completed = recs.filter(r => r.actualReturn !== undefined);
      const winners = completed.filter(r => (r.actualReturn || 0) > 0);
      const avgReturn = completed.length > 0
        ? completed.reduce((s, r) => s + (r.actualReturn || 0), 0) / completed.length
        : 0;
      const grossProfit = completed.filter(r => (r.actualReturn || 0) > 0).reduce((s, r) => s + (r.actualReturn || 0), 0);
      const grossLoss = Math.abs(completed.filter(r => (r.actualReturn || 0) < 0).reduce((s, r) => s + (r.actualReturn || 0), 0));

      results.push({
        timeframe,
        totalRecommendations: recs.length,
        winRate: completed.length > 0 ? (winners.length / completed.length) * 100 : 0,
        avgReturn,
        profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
        analyzedAt: new Date().toISOString(),
      });
    }

    return results;
  }

  analyzeMarketConditionPerformance(
    recommendations: RecommendationRecord[],
  ): MarketConditionPerformanceAnalysis[] {
    const regimeMap = new Map<MarketRegime, RecommendationRecord[]>();
    for (const rec of recommendations) {
      const existing = regimeMap.get(rec.marketRegime) || [];
      existing.push(rec);
      regimeMap.set(rec.marketRegime, existing);
    }

    const results: MarketConditionPerformanceAnalysis[] = [];
    for (const [regime, recs] of regimeMap) {
      const completed = recs.filter(r => r.actualReturn !== undefined);
      const winners = completed.filter(r => (r.actualReturn || 0) > 0);
      const avgReturn = completed.length > 0
        ? completed.reduce((s, r) => s + (r.actualReturn || 0), 0) / completed.length
        : 0;
      const grossProfit = completed.filter(r => (r.actualReturn || 0) > 0).reduce((s, r) => s + (r.actualReturn || 0), 0);
      const grossLoss = Math.abs(completed.filter(r => (r.actualReturn || 0) < 0).reduce((s, r) => s + (r.actualReturn || 0), 0));

      results.push({
        regime,
        totalRecommendations: recs.length,
        winRate: completed.length > 0 ? (winners.length / completed.length) * 100 : 0,
        avgReturn,
        profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
        analyzedAt: new Date().toISOString(),
      });
    }

    return results;
  }

  private buildStrategyAnalysis(strategy: string, recs: RecommendationRecord[]): StrategyPerformanceAnalysis {
    const completed = recs.filter(r => r.actualReturn !== undefined);
    const winners = completed.filter(r => (r.actualReturn || 0) > 0);
    const avgReturn = completed.length > 0
      ? completed.reduce((s, r) => s + (r.actualReturn || 0), 0) / completed.length
      : 0;

    const returns = completed.map(r => r.actualReturn || 0);
    const grossProfit = winners.reduce((s, r) => s + (r.actualReturn || 0), 0);
    const grossLoss = Math.abs(completed.filter(r => (r.actualReturn || 0) < 0).reduce((s, r) => s + (r.actualReturn || 0), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    const mean = returns.length > 0 ? returns.reduce((s, v) => s + v, 0) / returns.length : 0;
    const variance = returns.length > 1
      ? returns.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (returns.length - 1)
      : 0;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? mean / stdDev : 0;

    let maxDrawdown = 0;
    let peak = 0;
    let cumulative = 0;
    for (const r of returns) {
      cumulative += r;
      if (cumulative > peak) peak = cumulative;
      const dd = peak > 0 ? ((peak - cumulative) / peak) * 100 : 0;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    let bestRec = completed[0];
    let worstRec = completed[0];
    for (const r of completed) {
      if ((r.actualReturn || 0) > (bestRec?.actualReturn || -Infinity)) bestRec = r;
      if ((r.actualReturn || 0) < (worstRec?.actualReturn || Infinity)) worstRec = r;
    }

    return {
      strategy,
      totalRecommendations: recs.length,
      winRate: completed.length > 0 ? (winners.length / completed.length) * 100 : 0,
      avgReturn,
      profitFactor,
      sharpeRatio,
      maxDrawdown,
      bestPerformance: {
        symbol: bestRec?.stockSymbol || 'N/A',
        return_: bestRec?.actualReturn || 0,
      },
      worstPerformance: {
        symbol: worstRec?.stockSymbol || 'N/A',
        return_: worstRec?.actualReturn || 0,
      },
      analyzedAt: new Date().toISOString(),
    };
  }
}
