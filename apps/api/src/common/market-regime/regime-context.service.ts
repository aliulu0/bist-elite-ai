import { Injectable } from '@nestjs/common';
import {
  MarketRegimeType,
  RegimeContext,
  RegimeAdjustment,
} from './types';

@Injectable()
export class RegimeContextService {
  getEliteScoreContext(
    regime: MarketRegimeType,
    confidence: number,
    duration: number = 0,
    transitionRisk: number = 0,
  ): RegimeContext {
    const adjustments = this.getAdjustmentsForRegime(regime);
    const riskFactors = this.getRiskFactors(regime, confidence, duration, transitionRisk);

    return {
      currentRegime: regime,
      confidence,
      duration,
      transitionRisk,
      recommendedAdjustments: adjustments,
      riskFactors,
    };
  }

  getExplainabilityContext(
    regime: MarketRegimeType,
    confidence: number,
    duration: number = 0,
    transitionRisk: number = 0,
  ): RegimeContext {
    const adjustments = this.getExplainabilityAdjustments(regime);
    const riskFactors = this.getRiskFactors(regime, confidence, duration, transitionRisk);

    return {
      currentRegime: regime,
      confidence,
      duration,
      transitionRisk,
      recommendedAdjustments: adjustments,
      riskFactors,
    };
  }

  getConsensusContext(
    regime: MarketRegimeType,
    confidence: number,
    duration: number = 0,
    transitionRisk: number = 0,
  ): RegimeContext {
    const adjustments = this.getConsensusAdjustments(regime);
    const riskFactors = this.getRiskFactors(regime, confidence, duration, transitionRisk);

    return {
      currentRegime: regime,
      confidence,
      duration,
      transitionRisk,
      recommendedAdjustments: adjustments,
      riskFactors,
    };
  }

  getTrackerContext(
    regime: MarketRegimeType,
    confidence: number,
    duration: number = 0,
    transitionRisk: number = 0,
  ): RegimeContext {
    const adjustments = this.getTrackerAdjustments(regime);
    const riskFactors = this.getRiskFactors(regime, confidence, duration, transitionRisk);

    return {
      currentRegime: regime,
      confidence,
      duration,
      transitionRisk,
      recommendedAdjustments: adjustments,
      riskFactors,
    };
  }

  getPortfolioContext(
    regime: MarketRegimeType,
    confidence: number,
    duration: number = 0,
    transitionRisk: number = 0,
  ): RegimeContext {
    const adjustments = this.getPortfolioAdjustments(regime);
    const riskFactors = this.getRiskFactors(regime, confidence, duration, transitionRisk);

    return {
      currentRegime: regime,
      confidence,
      duration,
      transitionRisk,
      recommendedAdjustments: adjustments,
      riskFactors,
    };
  }

  getNotificationContext(
    regime: MarketRegimeType,
    confidence: number,
    duration: number = 0,
    transitionRisk: number = 0,
  ): RegimeContext {
    const adjustments = this.getNotificationAdjustments(regime);
    const riskFactors = this.getRiskFactors(regime, confidence, duration, transitionRisk);

    return {
      currentRegime: regime,
      confidence,
      duration,
      transitionRisk,
      recommendedAdjustments: adjustments,
      riskFactors,
    };
  }

  private getAdjustmentsForRegime(regime: MarketRegimeType): RegimeAdjustment[] {
    const adjustmentMap: Record<MarketRegimeType, RegimeAdjustment[]> = {
      [MarketRegimeType.STRONG_BULL]: [
        { parameter: 'maxPositionSize', currentValue: 0.15, recommendedValue: 0.10, reason: 'Guclu yuksek trendde pozisyon boyutunu kisitla' },
        { parameter: 'stopLoss', currentValue: 0.05, recommendedValue: 0.07, reason: 'Yuksek trendde daha genis stop loss' },
      ],
      [MarketRegimeType.BULL]: [
        { parameter: 'maxPositionSize', currentValue: 0.15, recommendedValue: 0.12, reason: 'Yukselis piyasasinda normal pozisyon boyutu' },
      ],
      [MarketRegimeType.WEAK_BULL]: [
        { parameter: 'maxPositionSize', currentValue: 0.15, recommendedValue: 0.10, reason: 'Zayif yukseliste kucuk pozisyonlar tercih et' },
        { parameter: 'minEliteScore', currentValue: 0.7, recommendedValue: 0.75, reason: 'Daha yuksek kalite sinyaller tercih et' },
      ],
      [MarketRegimeType.SIDEWAYS]: [
        { parameter: 'maxPositionSize', currentValue: 0.15, recommendedValue: 0.08, reason: 'Yatay piyasada kucuk pozisyonlar' },
        { parameter: 'stopLoss', currentValue: 0.05, recommendedValue: 0.03, reason: 'Yatay piyasada dar stop loss' },
      ],
      [MarketRegimeType.WEAK_BEAR]: [
        { parameter: 'maxPositionSize', currentValue: 0.15, recommendedValue: 0.05, reason: 'Zayif dusus piyasasinda cok kucuk pozisyonlar' },
        { parameter: 'minEliteScore', currentValue: 0.7, recommendedValue: 0.8, reason: 'Cok yuksek kalite sinyaller gerekli' },
      ],
      [MarketRegimeType.BEAR]: [
        { parameter: 'maxPositionSize', currentValue: 0.15, recommendedValue: 0.03, reason: 'Dusus piyasasinda cok kucuk pozisyonlar' },
        { parameter: 'minEliteScore', currentValue: 0.7, recommendedValue: 0.85, reason: 'En yuksek kalite sinyaller tercih et' },
      ],
      [MarketRegimeType.STRONG_BEAR]: [
        { parameter: 'maxPositionSize', currentValue: 0.15, recommendedValue: 0.01, reason: 'Guclu dusus piyasasinda neredeyse hic pozisyon alma' },
        { parameter: 'minEliteScore', currentValue: 0.7, recommendedValue: 0.9, reason: 'Sadece en olaustan sinyaller' },
      ],
      [MarketRegimeType.HIGH_VOLATILITY]: [
        { parameter: 'maxPositionSize', currentValue: 0.15, recommendedValue: 0.05, reason: 'Yuksek volatilitede kucuk pozisyonlar' },
        { parameter: 'stopLoss', currentValue: 0.05, recommendedValue: 0.08, reason: 'Yuksek volatilitede daha genis stop loss' },
      ],
      [MarketRegimeType.LOW_VOLATILITY]: [
        { parameter: 'maxPositionSize', currentValue: 0.15, recommendedValue: 0.15, reason: 'Dusuk volatilitede normal pozisyon boyutu' },
      ],
      [MarketRegimeType.RECOVERY]: [
        { parameter: 'maxPositionSize', currentValue: 0.15, recommendedValue: 0.08, reason: 'Toparlanmada kademeli giris' },
        { parameter: 'minEliteScore', currentValue: 0.7, recommendedValue: 0.7, reason: 'Normal kalite esik degeri' },
      ],
      [MarketRegimeType.CORRECTION]: [
        { parameter: 'maxPositionSize', currentValue: 0.15, recommendedValue: 0.05, reason: 'Duzeltmede cok kucuk pozisyonlar' },
        { parameter: 'stopLoss', currentValue: 0.05, recommendedValue: 0.04, reason: 'Duzeltmede daha dar stop loss' },
      ],
      [MarketRegimeType.DISTRIBUTION]: [
        { parameter: 'maxPositionSize', currentValue: 0.15, recommendedValue: 0.03, reason: 'Dagitim asamasinda kucuk pozisyonlar' },
        { parameter: 'minEliteScore', currentValue: 0.7, recommendedValue: 0.85, reason: 'Cok yuksek kalite sinyaller tercih et' },
      ],
      [MarketRegimeType.ACCUMULATION]: [
        { parameter: 'maxPositionSize', currentValue: 0.15, recommendedValue: 0.10, reason: 'Birikim asamasinda kademeli pozisyon olusturma' },
        { parameter: 'minEliteScore', currentValue: 0.7, recommendedValue: 0.75, reason: 'Yuksek kalite sinyaller tercih et' },
      ],
    };
    return adjustmentMap[regime];
  }

  private getExplainabilityAdjustments(regime: MarketRegimeType): RegimeAdjustment[] {
    const base = this.getAdjustmentsForRegime(regime);
    const explainAdj: Record<MarketRegimeType, RegimeAdjustment> = {
      [MarketRegimeType.STRONG_BULL]: { parameter: 'includeVolatilityAnalysis', currentValue: 0, recommendedValue: 1, reason: 'Guclu trendde volatilite analizi gerekli' },
      [MarketRegimeType.BULL]: { parameter: 'includeVolatilityAnalysis', currentValue: 0, recommendedValue: 1, reason: 'Normal trendde volatilite analizi faydali' },
      [MarketRegimeType.WEAK_BULL]: { parameter: 'includeVolatilityAnalysis', currentValue: 0, recommendedValue: 1, reason: 'Zayif trendde volatilite analizi kritik' },
      [MarketRegimeType.SIDEWAYS]: { parameter: 'includeVolatilityAnalysis', currentValue: 0, recommendedValue: 0, reason: 'Yatay piyasada volatilite analizi daha az onemli' },
      [MarketRegimeType.WEAK_BEAR]: { parameter: 'includeVolatilityAnalysis', currentValue: 0, recommendedValue: 1, reason: 'Dusus trendinde volatilite analizi kritik' },
      [MarketRegimeType.BEAR]: { parameter: 'includeVolatilityAnalysis', currentValue: 0, recommendedValue: 1, reason: 'Dusus trendinde volatilite analizi zorunlu' },
      [MarketRegimeType.STRONG_BEAR]: { parameter: 'includeVolatilityAnalysis', currentValue: 0, recommendedValue: 1, reason: 'Guclu dusus analizinde volatilite on planda' },
      [MarketRegimeType.HIGH_VOLATILITY]: { parameter: 'includeVolatilityAnalysis', currentValue: 0, recommendedValue: 1, reason: 'Yuksek volatilitede detayli volatilite analizi gerekli' },
      [MarketRegimeType.LOW_VOLATILITY]: { parameter: 'includeVolatilityAnalysis', currentValue: 0, recommendedValue: 0, reason: 'Dusuk volatilitede ek volatilite analizi gereksiz' },
      [MarketRegimeType.RECOVERY]: { parameter: 'includeVolatilityAnalysis', currentValue: 0, recommendedValue: 1, reason: 'Toparlanmada volatilite analizi onemli' },
      [MarketRegimeType.CORRECTION]: { parameter: 'includeVolatilityAnalysis', currentValue: 0, recommendedValue: 1, reason: 'Duzeltmede volatilite analizi kritik' },
      [MarketRegimeType.DISTRIBUTION]: { parameter: 'includeVolatilityAnalysis', currentValue: 0, recommendedValue: 1, reason: 'Dagitim analizinde volatilite onemli' },
      [MarketRegimeType.ACCUMULATION]: { parameter: 'includeVolatilityAnalysis', currentValue: 0, recommendedValue: 1, reason: 'Birikim analizinde volatilite faydali' },
    };
    return [...base, explainAdj[regime]];
  }

  private getConsensusAdjustments(regime: MarketRegimeType): RegimeAdjustment[] {
    const base = this.getAdjustmentsForRegime(regime);
    const consensusAdj: Record<MarketRegimeType, RegimeAdjustment> = {
      [MarketRegimeType.STRONG_BULL]: { parameter: 'minTimeframeAgreement', currentValue: 0.6, recommendedValue: 0.7, reason: 'Guclu trendde daha yuksek zaman dilimi uyumu gerekli' },
      [MarketRegimeType.BULL]: { parameter: 'minTimeframeAgreement', currentValue: 0.6, recommendedValue: 0.65, reason: 'Normal trendde zaman dilimi uyumu onemli' },
      [MarketRegimeType.WEAK_BULL]: { parameter: 'minTimeframeAgreement', currentValue: 0.6, recommendedValue: 0.7, reason: 'Zayif trendde daha yuksek uyum gerekli' },
      [MarketRegimeType.SIDEWAYS]: { parameter: 'minTimeframeAgreement', currentValue: 0.6, recommendedValue: 0.6, reason: 'Yatay piyasada normal uyum esik degeri' },
      [MarketRegimeType.WEAK_BEAR]: { parameter: 'minTimeframeAgreement', currentValue: 0.6, recommendedValue: 0.75, reason: 'Zayif dususda cok yuksek uyum gerekli' },
      [MarketRegimeType.BEAR]: { parameter: 'minTimeframeAgreement', currentValue: 0.6, recommendedValue: 0.8, reason: 'Dusus trendinde cok yuksek uyum gerekli' },
      [MarketRegimeType.STRONG_BEAR]: { parameter: 'minTimeframeAgreement', currentValue: 0.6, recommendedValue: 0.85, reason: 'Guclu dususda en yuksek uyum gerekli' },
      [MarketRegimeType.HIGH_VOLATILITY]: { parameter: 'minTimeframeAgreement', currentValue: 0.6, recommendedValue: 0.75, reason: 'Yuksek volatilitede yuksek uyum gerekli' },
      [MarketRegimeType.LOW_VOLATILITY]: { parameter: 'minTimeframeAgreement', currentValue: 0.6, recommendedValue: 0.6, reason: 'Dusuk volatilitede normal uyum' },
      [MarketRegimeType.RECOVERY]: { parameter: 'minTimeframeAgreement', currentValue: 0.6, recommendedValue: 0.7, reason: 'Toparlanmada yuksek uyum gerekli' },
      [MarketRegimeType.CORRECTION]: { parameter: 'minTimeframeAgreement', currentValue: 0.6, recommendedValue: 0.75, reason: 'Duzeltmede yuksek uyum gerekli' },
      [MarketRegimeType.DISTRIBUTION]: { parameter: 'minTimeframeAgreement', currentValue: 0.6, recommendedValue: 0.8, reason: 'Dagitimde yuksek uyum gerekli' },
      [MarketRegimeType.ACCUMULATION]: { parameter: 'minTimeframeAgreement', currentValue: 0.6, recommendedValue: 0.7, reason: 'Birikimde yuksek uyum gerekli' },
    };
    return [...base, consensusAdj[regime]];
  }

  private getTrackerAdjustments(regime: MarketRegimeType): RegimeAdjustment[] {
    return this.getAdjustmentsForRegime(regime);
  }

  private getPortfolioAdjustments(regime: MarketRegimeType): RegimeAdjustment[] {
    const base = this.getAdjustmentsForRegime(regime);
    const portfolioAdj: Record<MarketRegimeType, RegimeAdjustment> = {
      [MarketRegimeType.STRONG_BULL]: { parameter: 'cashAllocation', currentValue: 0.2, recommendedValue: 0.1, reason: 'Guclu trendde daha az nakit tut' },
      [MarketRegimeType.BULL]: { parameter: 'cashAllocation', currentValue: 0.2, recommendedValue: 0.15, reason: 'Yukseliste normal nakit orani' },
      [MarketRegimeType.WEAK_BULL]: { parameter: 'cashAllocation', currentValue: 0.2, recommendedValue: 0.2, reason: 'Zayif yukseliste normal nakit orani' },
      [MarketRegimeType.SIDEWAYS]: { parameter: 'cashAllocation', currentValue: 0.2, recommendedValue: 0.3, reason: 'Yatay piyasada daha fazla nakit tut' },
      [MarketRegimeType.WEAK_BEAR]: { parameter: 'cashAllocation', currentValue: 0.2, recommendedValue: 0.4, reason: 'Zayif dususda yuksek nakit orani' },
      [MarketRegimeType.BEAR]: { parameter: 'cashAllocation', currentValue: 0.2, recommendedValue: 0.5, reason: 'Dusus piyasasinda yuksek nakit orani' },
      [MarketRegimeType.STRONG_BEAR]: { parameter: 'cashAllocation', currentValue: 0.2, recommendedValue: 0.7, reason: 'Guclu dususda cok yuksek nakit orani' },
      [MarketRegimeType.HIGH_VOLATILITY]: { parameter: 'cashAllocation', currentValue: 0.2, recommendedValue: 0.4, reason: 'Yuksek volatilitede yuksek nakit orani' },
      [MarketRegimeType.LOW_VOLATILITY]: { parameter: 'cashAllocation', currentValue: 0.2, recommendedValue: 0.15, reason: 'Dusuk volatilitede normal nakit orani' },
      [MarketRegimeType.RECOVERY]: { parameter: 'cashAllocation', currentValue: 0.2, recommendedValue: 0.2, reason: 'Toparlanmada normal nakit orani' },
      [MarketRegimeType.CORRECTION]: { parameter: 'cashAllocation', currentValue: 0.2, recommendedValue: 0.35, reason: 'Duzeltmede yuksek nakit orani' },
      [MarketRegimeType.DISTRIBUTION]: { parameter: 'cashAllocation', currentValue: 0.2, recommendedValue: 0.5, reason: 'Dagitimde yuksek nakit orani' },
      [MarketRegimeType.ACCUMULATION]: { parameter: 'cashAllocation', currentValue: 0.2, recommendedValue: 0.15, reason: 'Birikimde dusuk nakit orani' },
    };
    return [...base, portfolioAdj[regime]];
  }

  private getNotificationAdjustments(regime: MarketRegimeType): RegimeAdjustment[] {
    const base = this.getAdjustmentsForRegime(regime);
    const notifAdj: Record<MarketRegimeType, RegimeAdjustment> = {
      [MarketRegimeType.STRONG_BULL]: { parameter: 'notificationPriority', currentValue: 1, recommendedValue: 2, reason: 'Guclu trendde yuksek oncelikli bildirimler' },
      [MarketRegimeType.BULL]: { parameter: 'notificationPriority', currentValue: 1, recommendedValue: 1, reason: 'Normal trendde normal oncelik' },
      [MarketRegimeType.WEAK_BULL]: { parameter: 'notificationPriority', currentValue: 1, recommendedValue: 1, reason: 'Zayif trendde normal oncelik' },
      [MarketRegimeType.SIDEWAYS]: { parameter: 'notificationPriority', currentValue: 1, recommendedValue: 0, reason: 'Yatay piyasada dusuk oncelik' },
      [MarketRegimeType.WEAK_BEAR]: { parameter: 'notificationPriority', currentValue: 1, recommendedValue: 2, reason: 'Zayif dususda yuksek oncelik' },
      [MarketRegimeType.BEAR]: { parameter: 'notificationPriority', currentValue: 1, recommendedValue: 3, reason: 'Dusus piyasasinda en yuksek oncelik' },
      [MarketRegimeType.STRONG_BEAR]: { parameter: 'notificationPriority', currentValue: 1, recommendedValue: 3, reason: 'Guclu dususda acil durum bildirimi' },
      [MarketRegimeType.HIGH_VOLATILITY]: { parameter: 'notificationPriority', currentValue: 1, recommendedValue: 3, reason: 'Yuksek volatilitede acil durum bildirimi' },
      [MarketRegimeType.LOW_VOLATILITY]: { parameter: 'notificationPriority', currentValue: 1, recommendedValue: 0, reason: 'Dusuk volatilitede dusuk oncelik' },
      [MarketRegimeType.RECOVERY]: { parameter: 'notificationPriority', currentValue: 1, recommendedValue: 2, reason: 'Toparlanmada yuksek oncelik' },
      [MarketRegimeType.CORRECTION]: { parameter: 'notificationPriority', currentValue: 1, recommendedValue: 2, reason: 'Duzeltmede yuksek oncelik' },
      [MarketRegimeType.DISTRIBUTION]: { parameter: 'notificationPriority', currentValue: 1, recommendedValue: 2, reason: 'Dagitimde yuksek oncelik' },
      [MarketRegimeType.ACCUMULATION]: { parameter: 'notificationPriority', currentValue: 1, recommendedValue: 1, reason: 'Birikimde normal oncelik' },
    };
    return [...base, notifAdj[regime]];
  }

  private getRiskFactors(
    regime: MarketRegimeType,
    confidence: number,
    duration: number,
    transitionRisk: number,
  ): string[] {
    const factors: string[] = [];

    if (confidence < 0.5) {
      factors.push('Dusuk rejim guvenilirlik skoru');
    }
    if (duration > 30) {
      factors.push('Uzun sureli rejim - degisim riski yuksek');
    }
    if (transitionRisk > 0.7) {
      factors.push('Yuksek gecis riski algilandi');
    }

    const highRiskRegimes: MarketRegimeType[] = [
      MarketRegimeType.STRONG_BEAR,
      MarketRegimeType.HIGH_VOLATILITY,
      MarketRegimeType.DISTRIBUTION,
    ];
    if (highRiskRegimes.includes(regime)) {
      factors.push('Yuksek riskli rejim aktif');
    }

    return factors;
  }
}
