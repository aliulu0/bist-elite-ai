import { Injectable } from '@nestjs/common';
import {
  OpportunityRecord,
  ScoreEvolution,
  EvolutionTrend,
} from './types';

@Injectable()
export class EvolutionAnalyzerService {
  analyzeEvolution(record: OpportunityRecord): ScoreEvolution[] {
    return [
      this.analyzeMetric(record, 'eliteScore', 'Elite Skor'),
      this.analyzeMetric(record, 'confidence', 'Guvenilirlik'),
      this.analyzeMetric(record, 'consensusScore', 'Konsensus Skoru'),
      this.analyzeMetric(record, 'riskScore', 'Risk Skoru'),
      this.analyzeMetric(record, 'momentumScore', 'Momentum'),
      this.analyzeMetric(record, 'volumeScore', 'Hacim'),
      this.analyzeMetric(record, 'volatilityScore', 'Volatilite'),
    ];
  }

  analyzeMetric(
    record: OpportunityRecord,
    metricKey: string,
    metricName: string,
  ): ScoreEvolution {
    const snapshots = record.snapshots.map((s) => ({
      timestamp: s.timestamp,
      value: (s as any)[metricKey] as number,
    }));

    if (snapshots.length < 2) {
      return {
        metric: metricName,
        snapshots,
        trend: EvolutionTrend.INSUFFICIENT_DATA,
        currentValue: snapshots.length > 0 ? snapshots[0].value : 0,
        startValue: snapshots.length > 0 ? snapshots[0].value : 0,
        change: 0,
        changePercent: 0,
        volatility: 0,
      };
    }

    const values = snapshots.map((s) => s.value);
    const currentValue = values[values.length - 1];
    const startValue = values[0];
    const change = currentValue - startValue;
    const changePercent = startValue !== 0 ? (change / Math.abs(startValue)) * 100 : 0;
    const volatility = this.calculateVolatility(values);
    const trend = this.determineTrend(values);

    return {
      metric: metricName,
      snapshots,
      trend,
      currentValue,
      startValue,
      change,
      changePercent,
      volatility,
    };
  }

  calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    const returns: number[] = [];
    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] !== 0) {
        returns.push((values[i] - values[i - 1]) / Math.abs(values[i - 1]));
      }
    }
    if (returns.length === 0) return 0;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  determineTrend(values: number[]): EvolutionTrend {
    if (values.length < 3) return EvolutionTrend.INSUFFICIENT_DATA;

    const half = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, half);
    const secondHalf = values.slice(half);

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const changeThreshold = 0.05;
    const change = secondAvg - firstAvg;
    const relativeChange = firstAvg !== 0 ? change / Math.abs(firstAvg) : 0;

    if (relativeChange > changeThreshold) return EvolutionTrend.IMPROVING;
    if (relativeChange < -changeThreshold) return EvolutionTrend.DEGRADING;
    return EvolutionTrend.STABLE;
  }

  getOverallTrend(evolution: ScoreEvolution[]): EvolutionTrend {
    const trends = evolution.filter(
      (e) => e.trend !== EvolutionTrend.INSUFFICIENT_DATA,
    );
    if (trends.length === 0) return EvolutionTrend.INSUFFICIENT_DATA;

    const improving = trends.filter((e) => e.trend === EvolutionTrend.IMPROVING).length;
    const degrading = trends.filter((e) => e.trend === EvolutionTrend.DEGRADING).length;

    if (improving > degrading) return EvolutionTrend.IMPROVING;
    if (degrading > improving) return EvolutionTrend.DEGRADING;
    return EvolutionTrend.STABLE;
  }

  detectDivergence(evolution: ScoreEvolution[]): Array<{ metric1: string; metric2: string; type: string }> {
    const divergences: Array<{ metric1: string; metric2: string; type: string }> = [];

    for (let i = 0; i < evolution.length; i++) {
      for (let j = i + 1; j < evolution.length; j++) {
        const e1 = evolution[i];
        const e2 = evolution[j];
        if (
          e1.trend === EvolutionTrend.IMPROVING &&
          e2.trend === EvolutionTrend.DEGRADING
        ) {
          divergences.push({
            metric1: e1.metric,
            metric2: e2.metric,
            type: 'tepsel_cakismazlik',
          });
        }
      }
    }

    return divergences;
  }
}
