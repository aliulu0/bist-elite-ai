import {
  AlignmentScores,
  HoldingType,
  MultiTimeframeOpportunityInput,
  MultiTimeframeOpportunityResult,
  OpportunityStrength,
  RiskSummary,
  TrendStage,
  TimeframeSignal,
  MULTI_TIMEFRAME_LONG,
  MULTI_TIMEFRAME_SHORT,
  MULTI_TIMEFRAME_WEIGHTS,
  OPPORTUNITY_STRENGTH_META,
} from './multi-timeframe.types';
import { PredictionResult, PredictionTimeframe } from '../../prediction/prediction.types';
import { RiskLevel } from '../early-opportunity.types';
import { clamp0100, weightedAverage } from '../early-opportunity.utils';

const RISK_ORDER: RiskLevel[] = ['low', 'medium', 'high'];

export class MultiTimeframeOpportunityEngine {
  evaluate(input: MultiTimeframeOpportunityInput): MultiTimeframeOpportunityResult {
    const valid = input.predictions.filter((p) => p.isValid);
    if (valid.length === 0) {
      return this.emptyResult(input);
    }

    const signals = valid.map((p) => this.toSignal(p));
    const weights = valid.map((p) => this.tfWeight(p.timeframe));
    const alignments = this.computeAlignments(valid, signals, input.consensus);

    const score = this.computeScore(alignments, signals, weights);
    const strength = this.resolveStrength(score);
    const trendStage = this.resolveTrendStage(valid, signals, alignments, score);
    const holdingType = this.resolveHoldingType(signals);
    const { best, worst, mostBullish, highestConfidence } = this.timeframeRankings(valid);
    const riskSummary = this.riskSummary(valid);
    const primary = this.mostBullishPrediction(valid, mostBullish);

    const bullishPercent = clamp0100(
      weightedAverage(
        signals.map((s) => s.bullish),
        weights,
      ),
    );
    const confidence = clamp0100(
      weightedAverage(
        signals.map((s) => s.confidence),
        weights,
      ),
    );
    const expectedReturn = clamp0100(
      weightedAverage(
        valid.map((p) => p.expectedReturn),
        weights,
      ),
    );

    return {
      ticker: input.ticker,
      company: input.company,
      sector: input.sector,
      multiTimeframeScore: score,
      strength,
      strengthLabel: OPPORTUNITY_STRENGTH_META[strength].label,
      trendStage,
      holdingType,
      bestTimeframe: best,
      worstTimeframe: worst,
      mostBullishTimeframe: mostBullish,
      highestConfidenceTimeframe: highestConfidence,
      timeframesAnalyzed: valid.map((p) => p.timeframe),
      alignments,
      riskSummary,
      expectedReturn,
      bullishPercent,
      confidence,
      entryZone: primary.entryZone,
      stop: primary.stopZone,
      target1: primary.target1,
      target2: primary.target2,
      riskRewardRatio: primary.riskRewardRatio,
      reasons: this.buildReasons(signals, trendStage, strength, alignments),
      evaluatedAt: new Date().toISOString(),
    };
  }

  private toSignal(pred: PredictionResult): TimeframeSignal {
    return {
      timeframe: pred.timeframe,
      bullish: pred.bullishProbability,
      confidence: pred.confidence,
      momentum: pred.momentum,
      trend: pred.trendDirection,
      trendStrength: pred.trendStrength,
      riskScore: pred.riskScore,
      risk: pred.risk,
      holdingUnit: pred.expectedHoldingPeriod?.unit ?? 'days',
    };
  }

  private tfWeight(tf: PredictionTimeframe): number {
    return MULTI_TIMEFRAME_WEIGHTS[tf] ?? 1;
  }

  private computeAlignments(
    predictions: PredictionResult[],
    signals: TimeframeSignal[],
    consensus: MultiTimeframeOpportunityInput['consensus'],
  ): AlignmentScores {
    const weights = predictions.map((p) => this.tfWeight(p.timeframe));

    const timeframeAgreement = this.fraction(
      signals.filter((s) => s.bullish > 50 && s.bullish > (100 - s.bullish)),
      signals,
    );
    const trendAlignment = this.fraction(
      signals.filter((s) => s.trend === 'up' && ['moderate', 'strong'].includes(s.trendStrength)),
      signals,
    );
    const momentumAlignment = this.fraction(
      signals.filter((s) => ['strong_bullish', 'bullish'].includes(s.momentum)),
      signals,
    );
    const confidenceAlignment = clamp0100(
      weightedAverage(
        signals.map((s) => s.confidence),
        weights,
      ),
    );
    const smartMoneyAlignment = clamp0100(
      weightedAverage(
        predictions.map((p) => p.smartMoneyScore),
        weights,
      ),
    );
    const catalystAlignment = clamp0100(
      weightedAverage(
        predictions.map((p) => p.catalystScore ?? 50),
        weights,
      ),
    );
    const riskAlignment = clamp0100(
      100 - weightedAverage(
        signals.map((s) => s.riskScore),
        weights,
      ),
    );
    const marketStructureAlignment = clamp0100(
      weightedAverage(
        signals.map(this.trendSignalScore),
        weights,
      ),
    );
    const macroAlignment = this.macroAlignment(consensus);

    return {
      timeframeAgreement,
      trendAlignment,
      momentumAlignment,
      riskAlignment,
      confidenceAlignment,
      smartMoneyAlignment,
      catalystAlignment,
      macroAlignment,
      marketStructureAlignment,
    };
  }

  private trendSignalScore(s: TimeframeSignal): number {
    if (s.trend !== 'up') return 20;
    if (s.trendStrength === 'strong') return 100;
    if (s.trendStrength === 'moderate') return 70;
    return 40;
  }

  private macroAlignment(consensus: MultiTimeframeOpportunityInput['consensus']): number {
    if (!consensus) return 50;
    const agreement = clamp0100((consensus.agreementLevel ?? 0) * 100);
    const confidence = clamp0100(consensus.confidence ?? 0);
    const consensusScore = clamp0100(consensus.consensusScore ?? 0);
    return (agreement + confidence + consensusScore) / 3;
  }

  private fraction(subset: unknown[], total: unknown[]): number {
    if (total.length === 0) return 0;
    return (subset.length / total.length) * 100;
  }

  private computeScore(
    alignments: AlignmentScores,
    signals: TimeframeSignal[],
    weights: number[],
  ): number {
    const bullishConsensus = clamp0100(
      weightedAverage(
        signals.map((s) => s.bullish),
        weights,
      ),
    );

    const score =
      bullishConsensus * 0.25 +
      alignments.confidenceAlignment * 0.15 +
      alignments.trendAlignment * 0.12 +
      alignments.momentumAlignment * 0.12 +
      alignments.riskAlignment * 0.08 +
      alignments.smartMoneyAlignment * 0.08 +
      alignments.timeframeAgreement * 0.07 +
      alignments.macroAlignment * 0.06 +
      alignments.marketStructureAlignment * 0.07;

    return clamp0100(Math.round(score));
  }

  private resolveStrength(score: number): OpportunityStrength {
    const entries = Object.entries(OPPORTUNITY_STRENGTH_META) as [
      OpportunityStrength,
      { label: string; minScore: number },
    ][];
    const matched = entries
      .filter(([, meta]) => score >= meta.minScore)
      .sort((a, b) => b[1].minScore - a[1].minScore)[0];
    return matched ? matched[0] : ('Weak' as OpportunityStrength);
  }

  private resolveTrendStage(
    predictions: PredictionResult[],
    signals: TimeframeSignal[],
    alignments: AlignmentScores,
    score: number,
  ): TrendStage {
    const shortSignals = signals.filter((s) => MULTI_TIMEFRAME_SHORT.includes(s.timeframe));
    const longSignals = signals.filter((s) => MULTI_TIMEFRAME_LONG.includes(s.timeframe));

    const shortBull = shortSignals.length
      ? shortSignals.reduce((sum, s) => sum + s.bullish, 0) / shortSignals.length
      : 0;
    const longBull = longSignals.length
      ? longSignals.reduce((sum, s) => sum + s.bullish, 0) / longSignals.length
      : 0;
    const shortMomBull = this.fraction(
      shortSignals.filter((s) => ['strong_bullish', 'bullish'].includes(s.momentum)),
      shortSignals,
    );
    const longBear = this.fraction(
      longSignals.filter((s) => s.bullish < 50),
      longSignals,
    );

    const expectedReturn = predictions.length
      ? predictions.reduce((sum, p) => sum + p.expectedReturn, 0) / predictions.length
      : 0;
    const avgRisk = signals.length ? signals.reduce((sum, s) => sum + s.riskScore, 0) / signals.length : 0;

    if (shortBull > 70 && longBear > 50) {
      return 'Late';
    }
    if (shortBull > 70 && longBull > 70 && alignments.timeframeAgreement > 75) {
      return 'Growing';
    }
    if (shortBull > 70 && shortMomBull > 60 && alignments.timeframeAgreement > 60) {
      return 'Breakout';
    }
    if (score >= 75 && shortBull > 80 && expectedReturn > 8 && avgRisk > 60) {
      return 'Extended';
    }
    return 'Early';
  }

  private resolveHoldingType(signals: TimeframeSignal[]): HoldingType {
    const bullish = this.mostBullishSignal(signals);
    if (!bullish?.holdingUnit) return 'Swing';
    switch (bullish.holdingUnit) {
      case 'hours':
        return 'Intraday';
      case 'days':
        return 'Swing';
      case 'weeks':
        return 'Position';
      case 'months':
        return 'Investment';
      default:
        return 'Swing';
    }
  }

  private mostBullishSignal(signals: TimeframeSignal[]): TimeframeSignal | undefined {
    if (signals.length === 0) return undefined;
    return [...signals].sort((a, b) => b.bullish - a.bullish)[0];
  }

  private timeframeRankings(predictions: PredictionResult[]): {
    best: PredictionTimeframe;
    worst: PredictionTimeframe;
    mostBullish: PredictionTimeframe;
    highestConfidence: PredictionTimeframe;
  } {
    const signals = predictions.map((p) => this.toSignal(p));
    const best = this.pick(signals, (s) => s.bullish * s.confidence);
    const worst = this.pick(signals, (s) => -s.bullish, true);
    const mostBullish = this.pick(signals, (s) => s.bullish);
    const highestConfidence = this.pick(signals, (s) => s.confidence);
    return { best, worst, mostBullish, highestConfidence };
  }

  private pick(
    signals: TimeframeSignal[],
    score: (s: TimeframeSignal) => number,
    lowest = false,
  ): PredictionTimeframe {
    if (signals.length === 0) return '1d';
    const sorted = [...signals].sort((a, b) => score(b) - score(a));
    return (lowest ? sorted[sorted.length - 1] : sorted[0]).timeframe;
  }

  private mostBullishPrediction(
    valid: PredictionResult[],
    timeframe: PredictionTimeframe,
  ): PredictionResult {
    return (
      valid.find((p) => p.timeframe === timeframe) ??
      valid.reduce(
        (best, p) => (p.bullishProbability > best.bullishProbability ? p : best),
        valid[0],
      )
    );
  }

  private riskSummary(predictions: PredictionResult[]): RiskSummary {
    const distribution = { low: 0, medium: 0, high: 0 };
    for (const p of predictions) {
      const lvl = p.risk as RiskLevel;
      if (lvl in distribution) {
        distribution[lvl]++;
      }
    }
    const maxRisk = predictions.length
      ? (predictions.reduce((worst, p) =>
          RISK_ORDER.indexOf(p.risk as RiskLevel) > RISK_ORDER.indexOf(worst.risk as RiskLevel) ? p : worst,
        ).risk as RiskLevel)
      : 'low';

    return {
      avgRiskScore: Math.round(
        predictions.reduce((sum, p) => sum + p.riskScore, 0) / predictions.length,
      ),
      distribution,
      maxRisk,
      summary: `Ortalama risk skoru ${Math.round(
        predictions.reduce((sum, p) => sum + p.riskScore, 0) / predictions.length,
      )}, maksimum risk: ${maxRisk}.`,
    };
  }

  private buildReasons(
    signals: TimeframeSignal[],
    trendStage: TrendStage,
    strength: OpportunityStrength,
    alignments: AlignmentScores,
  ): string[] {
    const reasons: string[] = [];
    if (strength === 'Very Strong') {
      reasons.push('Tüm zaman dilimlerinde güçlü uyum');
    } else if (strength === 'Strong') {
      reasons.push('Çoğu zaman diliminde güçlü uyuma');
    } else if (strength === 'Medium') {
      reasons.push('Orta güçlü çok-zamanlı sinyal');
    } else {
      reasons.push('Zayıf çok-zamanlı sinyal');
    }

    if (trendStage === 'Early') {
      reasons.push('Erken evre: kısa vadeli momentum uzun vadelere giriyor');
    } else if (trendStage === 'Growing') {
      reasons.push('Büyüyen trend: kısa ve uzun vadeli uyumlu');
    } else if (trendStage === 'Breakout') {
      reasons.push('Kırmanın eşiğinde: güçlü momentum');
    } else if (trendStage === 'Extended') {
      reasons.push('Uzatlamış: fiyat hedeflerine yakın, risk artmış');
    } else {
      reasons.push('Gecikmiş: kısa vadeli yükseliş uzun vadeli düşüşle çelişiyor');
    }

    if (alignments.timeframeAgreement >= 75) {
      reasons.push('Zaman dilimleri arası anlaşma yüksek');
    }
    if (alignments.smartMoneyAlignment >= 70) {
      reasons.push('Akıllı para tüm zaman dilimlerinde tutarlı');
    }
    if (alignments.momentumAlignment >= 70) {
      reasons.push('Momentum tüm zaman dilimlerinde yükseliyor');
    }
    if (alignments.trendAlignment >= 70) {
      reasons.push('Trend yönü tüm zaman dilimlerinde tutarlı');
    }

    if (reasons.length === 0) {
      reasons.push('Çok zamanlı analiz uygun sinyal vermiyor');
    }
    return reasons;
  }

  private emptyResult(input: MultiTimeframeOpportunityInput): MultiTimeframeOpportunityResult {
    const tf = '1d' as PredictionTimeframe;
    return {
      ticker: input.ticker,
      company: input.company,
      sector: input.sector,
      multiTimeframeScore: 0,
      strength: 'Weak',
      strengthLabel: OPPORTUNITY_STRENGTH_META.Weak.label,
      trendStage: 'Early',
      holdingType: 'Swing',
      bestTimeframe: tf,
      worstTimeframe: tf,
      mostBullishTimeframe: tf,
      highestConfidenceTimeframe: tf,
      timeframesAnalyzed: [],
      alignments: this.emptyAlignments(),
      riskSummary: {
        avgRiskScore: 0,
        distribution: { low: 0, medium: 0, high: 0 },
        maxRisk: 'low',
        summary: 'Veri yok',
      },
      expectedReturn: 0,
      bullishPercent: 0,
      confidence: 0,
      entryZone: null,
      stop: null,
      target1: null,
      target2: null,
      riskRewardRatio: null,
      reasons: ['Yeterli çok-zamanlı veri yok'],
      evaluatedAt: new Date().toISOString(),
    };
  }

  private emptyAlignments(): AlignmentScores {
    return {
      timeframeAgreement: 0,
      trendAlignment: 0,
      momentumAlignment: 0,
      riskAlignment: 0,
      confidenceAlignment: 0,
      smartMoneyAlignment: 0,
      catalystAlignment: 0,
      macroAlignment: 0,
      marketStructureAlignment: 0,
    };
  }
}
