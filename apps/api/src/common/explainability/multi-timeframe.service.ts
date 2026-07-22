import { Injectable } from '@nestjs/common';
import {
  ExplanationInput,
  MultiTimeframeSummary,
  TimeframeAgreement,
  Timeframe,
  TrendDirection,
  MomentumState,
  TIMEFRAME_ORDER,
  TIMEFRAME_LABELS,
} from './types';
import { getAgreementDescription, getConflictDescription, TREND_TRANSLATIONS, TIMEFRAME_VIEW_LABELS } from './turkish-terms';

@Injectable()
export class MultiTimeframeAnalyzer {
  analyze(input: ExplanationInput): MultiTimeframeSummary {
    const agreements = this.buildTimeframeAgreements(input);
    const overallAgreement = this.calculateOverallAgreement(agreements);
    const dominantTrend = this.determineDominantTrend(agreements);
    const hasConflict = this.detectConflict(agreements);
    const conflictDescription = hasConflict ? getConflictDescription(agreements) : undefined;

    const shortTermView = this.buildViewSummary(agreements, Timeframe.M4, Timeframe.D1);
    const mediumTermView = this.buildViewSummary(agreements, Timeframe.D1, Timeframe.W1);
    const longTermView = this.buildViewSummary(agreements, Timeframe.W1, Timeframe.M1);

    return {
      agreements,
      dominantTrend,
      overallAgreement,
      hasConflict,
      conflictDescription,
      shortTermView,
      mediumTermView,
      longTermView,
    };
  }

  private buildTimeframeAgreements(input: ExplanationInput): TimeframeAgreement[] {
    const timeframes: Timeframe[] = input.timeframeData
      ? (Object.keys(input.timeframeData) as Timeframe[])
      : TIMEFRAME_ORDER;

    return timeframes.map(timeframe => {
      const tfData = input.timeframeData?.[timeframe];
      const direction = tfData?.trend || this.inferTrendFromIndicators(tfData?.indicators || []);
      const momentum = tfData?.momentum || this.inferMomentumFromIndicators(tfData?.indicators || []);
      const agreementScore = this.calculateTimeframeAgreementScore(tfData?.indicators || [], direction);

      return {
        timeframe,
        direction,
        momentum,
        agreementScore,
        description: this.buildTimeframeDescription(timeframe, direction, agreementScore),
      };
    });
  }

  private inferTrendFromIndicators(indicators: Array<{ isPositive: boolean; value: number }>): TrendDirection {
    if (indicators.length === 0) return TrendDirection.SIDEWAYS;

    const positiveRatio = indicators.filter(i => i.isPositive).length / indicators.length;
    const avgValue = indicators.reduce((sum, i) => sum + i.value, 0) / indicators.length;

    if (positiveRatio >= 0.8 && avgValue >= 0.6) return TrendDirection.STRONG_UPTREND;
    if (positiveRatio >= 0.65) return TrendDirection.UPTREND;
    if (positiveRatio >= 0.55) return TrendDirection.WEAK_UPTREND;
    if (positiveRatio <= 0.2 && avgValue <= 0.4) return TrendDirection.STRONG_DOWNTREND;
    if (positiveRatio <= 0.35) return TrendDirection.DOWNTREND;
    if (positiveRatio <= 0.45) return TrendDirection.WEAK_DOWNTREND;
    return TrendDirection.SIDEWAYS;
  }

  private inferMomentumFromIndicators(indicators: Array<{ isPositive: boolean; value: number }>): MomentumState {
    if (indicators.length === 0) return MomentumState.NEUTRAL;

    const positiveRatio = indicators.filter(i => i.isPositive).length / indicators.length;
    const avgValue = indicators.reduce((sum, i) => sum + i.value, 0) / indicators.length;

    if (avgValue >= 0.8) return MomentumState.OVERBOUGHT;
    if (positiveRatio >= 0.65) return MomentumState.BULLISH_MOMENTUM;
    if (avgValue <= 0.2) return MomentumState.OVERSOLD;
    if (positiveRatio <= 0.35) return MomentumState.BEARISH_MOMENTUM;
    return MomentumState.NEUTRAL;
  }

  private calculateTimeframeAgreementScore(
    indicators: Array<{ isPositive: boolean; value: number }>,
    direction: TrendDirection,
  ): number {
    if (indicators.length === 0) return 0.5;

    const isUptrend = direction === TrendDirection.STRONG_UPTREND || direction === TrendDirection.UPTREND || direction === TrendDirection.WEAK_UPTREND;
    const isDowntrend = direction === TrendDirection.STRONG_DOWNTREND || direction === TrendDirection.DOWNTREND || direction === TrendDirection.WEAK_DOWNTREND;

    let agreementCount = 0;
    for (const indicator of indicators) {
      if (isUptrend && indicator.isPositive) agreementCount++;
      else if (isDowntrend && !indicator.isPositive) agreementCount++;
      else if (direction === TrendDirection.SIDEWAYS) {
        if (indicator.value >= 0.3 && indicator.value <= 0.7) agreementCount++;
      }
    }

    return agreementCount / indicators.length;
  }

  private buildTimeframeDescription(timeframe: Timeframe, direction: TrendDirection, agreement: number): string {
    const label = TIMEFRAME_LABELS[timeframe];
    const trend = TREND_TRANSLATIONS[direction];

    if (agreement >= 0.7) {
      return `${label} zaman diliminde ${trend} hakim ve göstergeler bu yönde güçlü uyum gösteriyor.`;
    }
    if (agreement >= 0.5) {
      return `${label} zaman diliminde ${trend} gözlemleniyor. Göstergeler genel uyum içinde ancak bazı sapmalar mevcut.`;
    }
    return `${label} zaman diliminde ${trend} olmasına rağmen göstergeler çelişkili sinyaller üretiyor.`;
  }

  private calculateOverallAgreement(agreements: TimeframeAgreement[]): number {
    if (agreements.length === 0) return 0;

    const scores = agreements.map(a => a.agreementScore);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    const directions = agreements.map(a => a.direction);
    const hasConflict = this.hasDirectionConflict(directions);

    if (hasConflict) {
      return avgScore * 0.6;
    }

    return avgScore;
  }

  private determineDominantTrend(agreements: TimeframeAgreement[]): TrendDirection {
    if (agreements.length === 0) return TrendDirection.SIDEWAYS;

    const timeframeWeights: Record<Timeframe, number> = {
      [Timeframe.M4]: 0.15,
      [Timeframe.D1]: 0.30,
      [Timeframe.W1]: 0.35,
      [Timeframe.M1]: 0.20,
    };

    const directionScores = new Map<TrendDirection, number>();

    for (const agreement of agreements) {
      const weight = timeframeWeights[agreement.timeframe] || 0.25;
      const score = agreement.agreementScore * weight;
      directionScores.set(
        agreement.direction,
        (directionScores.get(agreement.direction) || 0) + score,
      );
    }

    let dominant = TrendDirection.SIDEWAYS;
    let maxScore = 0;

    for (const [direction, score] of directionScores) {
      if (score > maxScore) {
        maxScore = score;
        dominant = direction;
      }
    }

    return dominant;
  }

  private detectConflict(agreements: TimeframeAgreement[]): boolean {
    const directions = agreements.map(a => a.direction);
    return this.hasDirectionConflict(directions);
  }

  private hasDirectionConflict(directions: TrendDirection[]): boolean {
    const uptrends = directions.filter(d =>
      d === TrendDirection.STRONG_UPTREND || d === TrendDirection.UPTREND || d === TrendDirection.WEAK_UPTREND,
    );
    const downtrends = directions.filter(d =>
      d === TrendDirection.STRONG_DOWNTREND || d === TrendDirection.DOWNTREND || d === TrendDirection.WEAK_DOWNTREND,
    );
    return uptrends.length > 0 && downtrends.length > 0;
  }

  private buildViewSummary(agreements: TimeframeAgreement[], primary: Timeframe, secondary: Timeframe): string {
    const primaryAgreement = agreements.find(a => a.timeframe === primary);
    const secondaryAgreement = agreements.find(a => a.timeframe === secondary);

    const parts: string[] = [];

    if (primaryAgreement) {
      const label = TIMEFRAME_VIEW_LABELS[primary].short;
      parts.push(`${label} ${TREND_TRANSLATIONS[primaryAgreement.direction]}`);
    }

    if (secondaryAgreement) {
      const label = TIMEFRAME_VIEW_LABELS[secondary].short;
      parts.push(`${label} ${TREND_TRANSLATIONS[secondaryAgreement.direction]}`);
    }

    if (parts.length === 0) return 'Veri bulunamadı.';

    if (primaryAgreement && secondaryAgreement && primaryAgreement.direction !== secondaryAgreement.direction) {
      return `${parts.join(' ve ')} arasında çelişki mevcut. Temkinli hareket edilmeli.`;
    }

    return `${parts.join(' ve ')} yönünde genel uyum mevcut.`;
  }
}
