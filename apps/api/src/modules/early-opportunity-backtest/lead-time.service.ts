import { Injectable } from '@nestjs/common';
import { FutureOutcome, LeadTimeResult, LeadTimeSummary } from './early-opportunity-backtest.types';

@Injectable()
export class LeadTimeService {
  calculate(
    outcomes: FutureOutcome[],
    scoreBuckets: { ticker: string; decisionDate: string; score: number; signalStrength: number }[],
  ): LeadTimeSummary {
    const leadTimes: number[] = [];
    const results: LeadTimeResult[] = [];

    for (const outcome of outcomes) {
      const result = this.calculateForOutcome(outcome);
      results.push(result);
      if (result.leadTimeDays != null) {
        leadTimes.push(result.leadTimeDays);
      }
    }

    const sorted = [...leadTimes].sort((a, b) => a - b);
    const avg = leadTimes.length > 0 ? leadTimes.reduce((s, v) => s + v, 0) / leadTimes.length : null;
    const median = leadTimes.length > 0
      ? (sorted.length % 2 === 0 ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 : sorted[Math.floor(sorted.length / 2)])
      : null;
    const best = leadTimes.length > 0 ? Math.min(...leadTimes) : null;
    const worst = leadTimes.length > 0 ? Math.max(...leadTimes) : null;

    const byScoreBucket: Record<string, number> = {};
    const bySignalStrength: Record<string, number> = {};

    for (const sb of scoreBuckets) {
      const result = results.find((r) => r.ticker === sb.ticker && r.decisionDate === sb.decisionDate);
      if (result?.leadTimeDays != null) {
        const bucket = sb.score >= 75 ? 'HIGH' : sb.score >= 60 ? 'MEDIUM' : 'LOW';
        byScoreBucket[bucket] = (byScoreBucket[bucket] || 0) + result.leadTimeDays;
        const sigBucket = sb.signalStrength >= 70 ? 'STRONG' : sb.signalStrength >= 40 ? 'MODERATE' : 'WEAK';
        bySignalStrength[sigBucket] = (bySignalStrength[sigBucket] || 0) + result.leadTimeDays;
      }
    }

    for (const key of Object.keys(byScoreBucket)) {
      const count = scoreBuckets.filter((sb) => {
        const bucket = sb.score >= 75 ? 'HIGH' : sb.score >= 60 ? 'MEDIUM' : 'LOW';
        return bucket === key;
      }).length;
      if (count > 0) byScoreBucket[key] = Math.round(byScoreBucket[key] / count);
    }
    for (const key of Object.keys(bySignalStrength)) {
      const count = scoreBuckets.filter((sb) => {
        const bucket = sb.signalStrength >= 70 ? 'STRONG' : sb.signalStrength >= 40 ? 'MODERATE' : 'WEAK';
        return bucket === key;
      }).length;
      if (count > 0) bySignalStrength[key] = Math.round(bySignalStrength[key] / count);
    }

    const interpretation = leadTimes.length === 0
      ? 'Lider zaman hesaplaması için yeterli veri yok.'
      : leadTimes.length < 10
        ? `Örneklem sayısı (${leadTimes.length}) güvenilir yorum için yetersiz.`
        : `Ortalama ${Math.round(avg ?? 0)} gün erken tespit süresi.`;

    return {
      averageLeadTime: avg != null ? Math.round(avg * 10) / 10 : null,
      medianLeadTime: median != null ? Math.round(median * 10) / 10 : null,
      bestLeadTime: best,
      worstLeadTime: worst,
      sampleCount: leadTimes.length,
      leadTimeByScoreBucket: byScoreBucket,
      leadTimeBySignalStrength: bySignalStrength,
      interpretation,
    };
  }

  private calculateForOutcome(outcome: FutureOutcome): LeadTimeResult {
    const primary = outcome.outcomes.find((o) => o.horizon === '3M') || outcome.outcomes.find((o) => o.dataAvailable);
    if (!primary || !primary.dataAvailable || primary.percentageReturn == null) {
      return {
        decisionDate: outcome.decisionDate,
        ticker: outcome.ticker,
        leadTimeDays: null,
        majorMoveDate: null,
        majorMoveReturn: null,
        dataAvailable: false,
      };
    }

    const significantReturn = primary.percentageReturn > 10;
    if (!significantReturn) {
      return {
        decisionDate: outcome.decisionDate,
        ticker: outcome.ticker,
        leadTimeDays: null,
        majorMoveDate: null,
        majorMoveReturn: primary.percentageReturn,
        dataAvailable: false,
      };
    }

    return {
      decisionDate: outcome.decisionDate,
      ticker: outcome.ticker,
      leadTimeDays: 0,
      majorMoveDate: null,
      majorMoveReturn: primary.percentageReturn,
      dataAvailable: true,
    };
  }
}