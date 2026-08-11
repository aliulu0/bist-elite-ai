import {
  EarlyOpportunityLevel,
  EarlyOpportunitySymbolInput,
  EarlyOpportunityResult,
  EarlyScoreComponents,
  EARLY_OPPORTUNITY_LEVEL_META,
  EARLY_OPPORTUNITY_SCORE_MAX,
  EARLY_OPPORTUNITY_SCORE_MIN,
  EARLY_OPPORTUNITY_TIMEFRAME_WEIGHTS,
} from './early-opportunity.types';
import { PredictionResult } from '../prediction/prediction.types';
import { clamp01, clamp0100, weightedAverage } from './early-opportunity.utils';

export class EarlyOpportunityEngine {
  evaluate(input: EarlyOpportunitySymbolInput): EarlyOpportunityResult {
    const valid = input.predictions.filter((p) => p.isValid);

    if (valid.length === 0) {
      return this.emptyResult(input);
    }

    const primary = valid.find((p) => p.timeframe === '1d') ?? valid[0];
    const components = this.computeComponents(valid, input, primary);
    const score = this.computeScore(components);
    const level = this.resolveLevel(score);

    return {
      ticker: input.ticker,
      company: input.company,
      sector: input.sector,
      score,
      level,
      levelLabel: EARLY_OPPORTUNITY_LEVEL_META[level].label,
      levelEmoji: EARLY_OPPORTUNITY_LEVEL_META[level].emoji,
      confidence: components.confidence,
      components,
      timeframesEvaluated: valid.map((p) => p.timeframe),
      reasons: this.buildReasons(valid, input, primary, components),
      evaluatedAt: new Date().toISOString(),
    };
  }

  private computeComponents(
    predictions: PredictionResult[],
    input: EarlyOpportunitySymbolInput,
    primary: PredictionResult,
  ): EarlyScoreComponents {
    const { bullishProbability, confidence } = this.weightedTimeframeAverages(predictions);
    const expectedReturn = this.toReturnPoints(primary);
    const riskAdjustedReturn = this.riskAdjustedReturn(expectedReturn, confidence);

    const smartMoneyScore = clamp0100(
      weightedAverage(
        predictions.map((p) => p.smartMoneyScore),
        predictions.map((p) => this.tfWeight(p.timeframe)),
      ),
    );

    const catalystScore = clamp0100(
      this.bestOrElse(predictions.map((p) => p.catalystScore), 50),
    );

    const verification = primary.verification === 'TRUE';

    return {
      bullishProbability: clamp0100(bullishProbability),
      confidence: clamp0100(confidence),
      expectedReturn,
      riskAdjustedReturn,
      smartMoneyScore,
      catalystScore,
      verification,
      researchScore: this.researchScore(input.consensus),
      eliteScore: this.eliteScore(input.eliteScore, bullishProbability),
      backtestWinRate: this.backtestWinRate(predictions[0].backtestAccuracy),
      opportunityScore: input.opportunity
        ? clamp0100(input.opportunity.opportunityScore)
        : 0,
      decisionScore: input.decision
        ? clamp0100(input.decision.decisionScore)
        : 0,
      timeframeAgreement: this.timeframeAgreement(predictions),
    };
  }

  private weightedTimeframeAverages(predictions: PredictionResult[]): {
    bullishProbability: number;
    confidence: number;
  } {
    return {
      bullishProbability: weightedAverage(
        predictions.map((p) => p.bullishProbability),
        predictions.map((p) => this.tfWeight(p.timeframe)),
      ),
      confidence: weightedAverage(
        predictions.map((p) => p.confidence),
        predictions.map((p) => this.tfWeight(p.timeframe)),
      ),
    };
  }

  private tfWeight(timeframe: PredictionResult['timeframe']): number {
    return EARLY_OPPORTUNITY_TIMEFRAME_WEIGHTS[timeframe] ?? 1;
  }

  private toReturnPoints(pred: PredictionResult): number {
    return clamp0100(Math.max(0, pred.expectedReturn) * 5);
  }

  private riskAdjustedReturn(returnPoints: number, confidence: number): number {
    return clamp0100(returnPoints * clamp01(confidence / 100));
  }

  private bestOrElse(values: (number | null)[], fallback: number): number {
    const present = values.filter((v): v is number => v != null);
    if (present.length === 0) return fallback;
    return Math.max(...present);
  }

  private researchScore(consensus: EarlyOpportunitySymbolInput['consensus']): number {
    if (!consensus) return 50;
    const agreement = clamp0100((consensus.agreementLevel ?? 0) * 100);
    const confidence = clamp0100(consensus.confidence ?? 0);
    const consensusScore = clamp0100(consensus.consensusScore ?? 0);
    return (agreement + confidence + consensusScore) / 3;
  }

  private eliteScore(
    elite: EarlyOpportunitySymbolInput['eliteScore'],
    fallback: number,
  ): number {
    if (!elite || elite.horizons.length === 0) return fallback;
    return clamp0100(
      elite.horizons.reduce((sum, h) => sum + (h.skor ?? 0), 0) / elite.horizons.length,
    );
  }

  private backtestWinRate(backtest: PredictionResult['backtestAccuracy']): number {
    const winRate = backtest?.winRate ?? 0;
    return clamp0100(winRate > 1 ? winRate : winRate * 100);
  }

  private timeframeAgreement(predictions: PredictionResult[]): number {
    if (predictions.length <= 1) return predictions.length === 1 ? 100 : 0;
    const bullishTfs = predictions.filter(
      (p) => p.bullishProbability > p.bearishProbability && p.bullishProbability > 50,
    );
    return (bullishTfs.length / predictions.length) * 100;
  }

  private computeScore(c: EarlyScoreComponents): number {
    const confidence = clamp01(c.confidence);
    const weighted =
      c.bullishProbability * 0.3 +
      c.confidence * 0.15 +
      c.riskAdjustedReturn * 0.12 +
      c.smartMoneyScore * 0.1 +
      c.researchScore * 0.08 +
      c.eliteScore * 0.08 +
      c.backtestWinRate * 0.05 +
      c.catalystScore * 0.04 +
      c.decisionScore * 0.03 +
      c.opportunityScore * 0.02 +
      c.timeframeAgreement * 0.03;

    const verificationBoost = c.verification ? 1 : -1;
    return clamp0100(Math.round(weighted + confidence * 0.1 + verificationBoost));
  }

  private resolveLevel(score: number): EarlyOpportunityLevel {
    const entries = Object.entries(EARLY_OPPORTUNITY_LEVEL_META) as [
      EarlyOpportunityLevel,
      { label: string; emoji: string; minScore: number },
    ][];
    const matched = entries
      .filter(([, meta]) => score >= meta.minScore)
      .sort((a, b) => b[1].minScore - a[1].minScore)[0];
    return matched ? matched[0] : ('BEKLE' as EarlyOpportunityLevel);
  }

  private buildReasons(
    predictions: PredictionResult[],
    input: EarlyOpportunitySymbolInput,
    primary: PredictionResult,
    components: EarlyScoreComponents,
  ): string[] {
    void predictions;
    const reasons: string[] = [];

    if (components.bullishProbability >= 80) {
      reasons.push('Yüksek yaşıl olasılık (multi-timeframe)');
    } else if (components.bullishProbability >= 60) {
      reasons.push('Orta-yüksek yaşıl eğilim');
    }

    if (components.confidence >= 80) {
      reasons.push('Yüksek tahmin güveni');
    }
    if (components.timeframeAgreement >= 80) {
      reasons.push('Zaman dilimleri anlaştı');
    }
    if (components.smartMoneyScore >= 70) {
      reasons.push('Akıllı para birikimi tespit edildi');
    }
    if (components.catalystScore >= 60) {
      reasons.push('Pozitif katalizör mevcut');
    }
    if (components.verification) {
      reasons.push('Veriler doğrulandı');
    }
    if (components.researchScore >= 70) {
      reasons.push('Araştırma konsensüsü güçlü');
    }
    if (components.backtestWinRate >= 60) {
      reasons.push('Geçmiş strateji performansı iyi');
    }
    if (components.eliteScore >= 70) {
      reasons.push('Elite skor destekli');
    }
    if (components.riskAdjustedReturn >= 50) {
      reasons.push('Güven artırıcı beklenen getiri');
    }

    if (primary.riskScore >= 70) {
      reasons.push('Yüksek risk uyarısı');
    }
    if (input.opportunity && input.opportunity.opportunityScore > 0) {
      reasons.push(`Fırsat skoru: ${input.opportunity.opportunityScore}`);
    }

    if (reasons.length === 0) {
      reasons.push('Temel sinyallere sahip');
    }
    return reasons;
  }

  private emptyResult(input: EarlyOpportunitySymbolInput): EarlyOpportunityResult {
    return {
      ticker: input.ticker,
      company: input.company,
      sector: input.sector,
      score: EARLY_OPPORTUNITY_SCORE_MIN,
      level: 'BEKLE',
      levelLabel: EARLY_OPPORTUNITY_LEVEL_META.BEKLE.label,
      levelEmoji: EARLY_OPPORTUNITY_LEVEL_META.BEKLE.emoji,
      confidence: EARLY_OPPORTUNITY_SCORE_MIN,
      components: this.emptyComponents(),
      timeframesEvaluated: [],
      reasons: ['Yeterli tahmin verisi yok'],
      evaluatedAt: new Date().toISOString(),
    };
  }

  private emptyComponents(): EarlyScoreComponents {
    return {
      bullishProbability: 0,
      confidence: 0,
      expectedReturn: 0,
      riskAdjustedReturn: 0,
      smartMoneyScore: 0,
      catalystScore: 0,
      verification: false,
      researchScore: 50,
      eliteScore: 0,
      backtestWinRate: 0,
      opportunityScore: 0,
      decisionScore: 0,
      timeframeAgreement: 0,
    };
  }
}
