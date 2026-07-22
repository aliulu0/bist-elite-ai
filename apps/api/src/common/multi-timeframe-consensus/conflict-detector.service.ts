import { Injectable } from '@nestjs/common';
import {
  TimeframeData,
  Timeframe,
  ConflictDetail,
  ConflictType,
  ConflictSeverity,
  TrendDirection,
  MomentumState,
  VolumeState,
  ConsensusConfig,
  getConsensusConfig,
} from './types';
import {
  CONFLICT_TYPE_TR,
  CONFLICT_SEVERITY_TR,
  getTimeframeLabel,
} from './turkish-terms';

@Injectable()
export class ConflictDetector {
  private readonly config: ConsensusConfig;

  constructor(configOverrides?: Partial<ConsensusConfig>) {
    this.config = getConsensusConfig(configOverrides);
  }

  detect(timeframes: TimeframeData[]): ConflictDetail[] {
    const conflicts: ConflictDetail[] = [];

    conflicts.push(...this.detectShortLongConflicts(timeframes));
    conflicts.push(...this.detectTrendReversals(timeframes));
    conflicts.push(...this.detectWeakConfirmations(timeframes));
    conflicts.push(...this.detectMixedIndicators(timeframes));
    conflicts.push(...this.detectVolumeInconsistencies(timeframes));
    conflicts.push(...this.detectRiskInconsistencies(timeframes));
    conflicts.push(...this.detectMomentumDivergence(timeframes));

    return this.deduplicateConflicts(conflicts);
  }

  getConflictLevel(conflicts: ConflictDetail[]): number {
    if (conflicts.length === 0) return 0;

    const severityWeights: Record<ConflictSeverity, number> = {
      [ConflictSeverity.LOW]: 0.1,
      [ConflictSeverity.MEDIUM]: 0.25,
      [ConflictSeverity.HIGH]: 0.5,
      [ConflictSeverity.CRITICAL]: 1.0,
    };

    let totalImpact = 0;
    for (const conflict of conflicts) {
      totalImpact += severityWeights[conflict.severity] * Math.abs(conflict.impact);
    }

    return Math.min(1, totalImpact / Math.max(1, conflicts.length));
  }

  private detectShortLongConflicts(timeframes: TimeframeData[]): ConflictDetail[] {
    const conflicts: ConflictDetail[] = [];
    const shortTerm = timeframes.filter(tf =>
      [Timeframe.M4, Timeframe.D1].includes(tf.timeframe) && tf.trend,
    );
    const longTerm = timeframes.filter(tf =>
      [Timeframe.W1, Timeframe.M1].includes(tf.trend as any) ||
      (tf.trend && this.getTimeframeOrder(tf.timeframe) >= 2),
    );

    for (const short of shortTerm) {
      for (const long of longTerm) {
        if (!short.trend || !long.trend) continue;
        if (this.areTrendsOpposed(short.trend, long.trend)) {
          const severity = this.calculateConflictSeverity(short.trend, long.trend);
          const impact = this.calculateConflictImpact(short, long);
          conflicts.push({
            type: ConflictType.SHORT_LONG_CONFLICT,
            severity,
            timeframe1: short.timeframe,
            timeframe2: long.timeframe,
            description: `Short-term (${getTimeframeLabel(short.timeframe)}) and long-term (${getTimeframeLabel(long.timeframe)}) trends conflict`,
            descriptionTr: `${getTimeframeLabel(short.timeframe)} kisa vade ile ${getTimeframeLabel(long.timeframe)} uzun vade trendi celigisiyor`,
            impact,
            indicators: this.getConflictingIndicators(short, long),
          });
        }
      }
    }

    return conflicts;
  }

  private detectTrendReversals(timeframes: TimeframeData[]): ConflictDetail[] {
    const conflicts: ConflictDetail[] = [];
    const sorted = [...timeframes].sort((a, b) => this.getTimeframeOrder(a.timeframe) - this.getTimeframeOrder(b.timeframe));

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      if (!current.trend || !next.trend) continue;

      if (this.isTrendReversal(current.trend, next.trend)) {
        conflicts.push({
          type: ConflictType.TREND_REVERSAL,
          severity: ConflictSeverity.HIGH,
          timeframe1: current.timeframe,
          timeframe2: next.timeframe,
          description: `Potential trend reversal detected between ${getTimeframeLabel(current.timeframe)} and ${getTimeframeLabel(next.timeframe)}`,
          descriptionTr: `${getTimeframeLabel(current.timeframe)} ve ${getTimeframeLabel(next.timeframe)} arasinda potansiyel trend donusumu`,
          impact: 0.7,
          indicators: ['Trend'],
        });
      }
    }

    return conflicts;
  }

  private detectWeakConfirmations(timeframes: TimeframeData[]): ConflictDetail[] {
    const conflicts: ConflictDetail[] = [];

    for (const tf of timeframes) {
      if (!tf.trend) continue;

      const trendScore = tf.trendScore;
      if (trendScore !== undefined && trendScore < 35 && trendScore > 25) {
        conflicts.push({
          type: ConflictType.WEAK_CONFIRMATION,
          severity: ConflictSeverity.LOW,
          timeframe1: tf.timeframe,
          timeframe2: tf.timeframe,
          description: `Weak trend confirmation in ${getTimeframeLabel(tf.timeframe)}`,
          descriptionTr: `${getTimeframeLabel(tf.timeframe)} zaman diliminde zayif trend onayi`,
          impact: 0.2,
          indicators: ['Trend Score'],
        });
      }
    }

    return conflicts;
  }

  private detectMixedIndicators(timeframes: TimeframeData[]): ConflictDetail[] {
    const conflicts: ConflictDetail[] = [];

    for (const tf of timeframes) {
      if (!tf.indicators || tf.indicators.length < 3) continue;

      const positive = tf.indicators.filter(i => i.isPositive).length;
      const negative = tf.indicators.length - positive;
      const ratio = Math.min(positive, negative) / Math.max(positive, negative || 1);

      if (ratio > 0.6 && positive >= 2 && negative >= 2) {
        conflicts.push({
          type: ConflictType.MIXED_INDICATORS,
          severity: ratio > 0.8 ? ConflictSeverity.HIGH : ConflictSeverity.MEDIUM,
          timeframe1: tf.timeframe,
          timeframe2: tf.timeframe,
          description: `Mixed indicator signals in ${getTimeframeLabel(tf.timeframe)}: ${positive} positive, ${negative} negative`,
          descriptionTr: `${getTimeframeLabel(tf.timeframe)} zaman diliminde karistirici gosterge sinyalleri: ${positive} olumlu, ${negative} olumsuz`,
          impact: ratio * 0.6,
          indicators: tf.indicators.map(i => i.name),
        });
      }
    }

    return conflicts;
  }

  private detectVolumeInconsistencies(timeframes: TimeframeData[]): ConflictDetail[] {
    const conflicts: ConflictDetail[] = [];
    const withVolume = timeframes.filter(tf => tf.volume);

    if (withVolume.length < 2) return conflicts;

    const volumeSignals = withVolume.map(tf => ({
      timeframe: tf.timeframe,
      positive: tf.volume === VolumeState.HIGH_VOLUME || tf.volume === VolumeState.INCREASING,
    }));

    const positiveCount = volumeSignals.filter(v => v.positive).length;
    const negativeCount = volumeSignals.length - positiveCount;

    if (positiveCount > 0 && negativeCount > 0) {
      const conflictPairs = this.getConflictingPairs(volumeSignals);
      for (const pair of conflictPairs) {
        conflicts.push({
          type: ConflictType.VOLUME_INCONSISTENCY,
          severity: ConflictSeverity.MEDIUM,
          timeframe1: pair[0],
          timeframe2: pair[1],
          description: `Volume inconsistency between ${getTimeframeLabel(pair[0])} and ${getTimeframeLabel(pair[1])}`,
          descriptionTr: `${getTimeframeLabel(pair[0])} ve ${getTimeframeLabel(pair[1])} arasinda hacim tutarsizligi`,
          impact: 0.3,
          indicators: ['Volume'],
        });
      }
    }

    return conflicts;
  }

  private detectRiskInconsistencies(timeframes: TimeframeData[]): ConflictDetail[] {
    const conflicts: ConflictDetail[] = [];
    const withRisk = timeframes.filter(tf => tf.riskScore !== undefined);

    if (withRisk.length < 2) return conflicts;

    for (let i = 0; i < withRisk.length; i++) {
      for (let j = i + 1; j < withRisk.length; j++) {
        const a = withRisk[i];
        const b = withRisk[j];
        if (a.riskScore === undefined || b.riskScore === undefined) continue;

        const diff = Math.abs(a.riskScore - b.riskScore);
        if (diff > 40) {
          conflicts.push({
            type: ConflictType.RISK_INCONSISTENCY,
            severity: diff > 60 ? ConflictSeverity.HIGH : ConflictSeverity.MEDIUM,
            timeframe1: a.timeframe,
            timeframe2: b.timeframe,
            description: `Risk inconsistency between ${getTimeframeLabel(a.timeframe)} (${a.riskScore.toFixed(0)}) and ${getTimeframeLabel(b.timeframe)} (${b.riskScore.toFixed(0)})`,
            descriptionTr: `${getTimeframeLabel(a.timeframe)} (${a.riskScore.toFixed(0)}) ve ${getTimeframeLabel(b.timeframe)} (${b.riskScore.toFixed(0)}) arasinda risk tutarsizligi`,
            impact: diff / 100,
            indicators: ['Risk Score'],
          });
        }
      }
    }

    return conflicts;
  }

  private detectMomentumDivergence(timeframes: TimeframeData[]): ConflictDetail[] {
    const conflicts: ConflictDetail[] = [];
    const withMomentum = timeframes.filter(tf => tf.momentum !== undefined && tf.trend !== undefined);

    for (const tf of withMomentum) {
      if (!tf.momentum || !tf.trend) continue;

      const trendBullish = [TrendDirection.STRONG_UPTREND, TrendDirection.UPTREND, TrendDirection.WEAK_UPTREND].includes(tf.trend);
      const momentumBullish = tf.momentum === MomentumState.BULLISH_MOMENTUM;

      if (trendBullish && !momentumBullish && tf.momentum !== MomentumState.NEUTRAL) {
        conflicts.push({
          type: ConflictType.MOMENTUM_DIVERGENCE,
          severity: ConflictSeverity.MEDIUM,
          timeframe1: tf.timeframe,
          timeframe2: tf.timeframe,
          description: `Momentum divergence in ${getTimeframeLabel(tf.timeframe)}: trend is bullish but momentum is ${tf.momentum}`,
          descriptionTr: `${getTimeframeLabel(tf.timeframe)} zaman diliminde momentum farkliligi: trend yukari yönlü ama momentum ${tf.momentum}`,
          impact: 0.4,
          indicators: ['Momentum', 'Trend'],
        });
      }
    }

    return conflicts;
  }

  private deduplicateConflicts(conflicts: ConflictDetail[]): ConflictDetail[] {
    const seen = new Set<string>();
    return conflicts.filter(c => {
      const key = `${c.type}:${c.timeframe1}:${c.timeframe2}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private calculateConflictSeverity(trend1: TrendDirection, trend2: TrendDirection): ConflictSeverity {
    const dir1 = this.getTrendDirectionValue(trend1);
    const dir2 = this.getTrendDirectionValue(trend2);
    const diff = Math.abs(dir1 - dir2);

    if (diff >= 2) return ConflictSeverity.CRITICAL;
    if (diff >= 1.5) return ConflictSeverity.HIGH;
    if (diff >= 1) return ConflictSeverity.MEDIUM;
    return ConflictSeverity.LOW;
  }

  private calculateConflictImpact(short: TimeframeData, long: TimeframeData): number {
    let impact = 0.5;

    if (short.trendScore !== undefined && long.trendScore !== undefined) {
      const scoreDiff = Math.abs(short.trendScore - long.trendScore);
      impact = Math.min(1, scoreDiff / 100);
    }

    return impact;
  }

  private areTrendsOpposed(a: TrendDirection, b: TrendDirection): boolean {
    const aVal = this.getTrendDirectionValue(a);
    const bVal = this.getTrendDirectionValue(b);
    return (aVal > 0 && bVal < 0) || (aVal < 0 && bVal > 0);
  }

  private isTrendReversal(shorter: TrendDirection, longer: TrendDirection): boolean {
    const sVal = this.getTrendDirectionValue(shorter);
    const lVal = this.getTrendDirectionValue(longer);
    return (sVal > 0.5 && lVal < -0.5) || (sVal < -0.5 && lVal > 0.5);
  }

  private getTrendDirectionValue(trend: TrendDirection): number {
    const map: Record<TrendDirection, number> = {
      [TrendDirection.STRONG_UPTREND]: 1,
      [TrendDirection.UPTREND]: 0.75,
      [TrendDirection.WEAK_UPTREND]: 0.5,
      [TrendDirection.SIDEWAYS]: 0,
      [TrendDirection.WEAK_DOWNTREND]: -0.5,
      [TrendDirection.DOWNTREND]: -0.75,
      [TrendDirection.STRONG_DOWNTREND]: -1,
    };
    return map[trend] ?? 0;
  }

  private getConflictingIndicators(short: TimeframeData, long: TimeframeData): string[] {
    const indicators: string[] = [];
    if (short.trend && long.trend) indicators.push('Trend');
    if (short.momentum && long.momentum) indicators.push('Momentum');
    if (short.volume && long.volume) indicators.push('Volume');
    return indicators;
  }

  private getConflictingPairs(
    signals: Array<{ timeframe: Timeframe; positive: boolean }>,
  ): Array<[Timeframe, Timeframe]> {
    const pairs: Array<[Timeframe, Timeframe]> = [];
    for (let i = 0; i < signals.length; i++) {
      for (let j = i + 1; j < signals.length; j++) {
        if (signals[i].positive !== signals[j].positive) {
          pairs.push([signals[i].timeframe, signals[j].timeframe]);
        }
      }
    }
    return pairs;
  }

  private getTimeframeOrder(timeframe: Timeframe): number {
    const order: Record<Timeframe, number> = {
      [Timeframe.M4]: 0,
      [Timeframe.D1]: 1,
      [Timeframe.W1]: 2,
      [Timeframe.M1]: 3,
    };
    return order[timeframe] ?? 0;
  }
}
