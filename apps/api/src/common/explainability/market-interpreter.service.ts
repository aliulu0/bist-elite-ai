import { Injectable } from '@nestjs/common';
import {
  ExplanationInput,
  TrendAnalysis,
  MomentumAnalysis,
  VolumeAnalysis,
  SupportResistance,
  IndicatorEvidence,
  TrendDirection,
  MomentumState,
  VolumeState,
  EliteScoreExplanation,
  PositiveNegativeFactors,
  TIMEFRAME_LABELS,
} from './types';
import {
  getTrendDescription,
  getMomentumDescription,
  getVolumeDescription,
  getRiskRewardDescription,
  INDICATOR_NAMES,
  TREND_TRANSLATIONS,
} from './turkish-terms';

@Injectable()
export class MarketInterpreter {
  interpretTrend(input: ExplanationInput): TrendAnalysis {
    const indicators = input.indicators || [];
    const trendIndicators = indicators.filter(i =>
      ['EMA', 'SMA', 'ADX', 'Ichimoku'].includes(i.indicator),
    );

    const direction = this.determineTrendDirection(trendIndicators, input);
    const strength = this.calculateTrendStrength(trendIndicators);
    const description = getTrendDescription(direction, strength);

    return {
      direction,
      strength,
      description,
      supportingIndicators: trendIndicators,
    };
  }

  interpretMomentum(input: ExplanationInput): MomentumAnalysis {
    const indicators = input.indicators || [];
    const momentumIndicators = indicators.filter(i =>
      ['RSI', 'MACD', 'Stochastic'].includes(i.indicator),
    );

    const rsiIndicator = momentumIndicators.find(i => i.indicator === 'RSI');
    const macdIndicator = momentumIndicators.find(i => i.indicator === 'MACD');

    const state = this.determineMomentumState(momentumIndicators, rsiIndicator);
    const description = getMomentumDescription(
      state,
      rsiIndicator?.value,
      macdIndicator?.value,
    );

    return {
      state,
      rsiValue: rsiIndicator?.value,
      macdValue: macdIndicator?.value,
      description,
      supportingIndicators: momentumIndicators,
    };
  }

  interpretVolume(input: ExplanationInput): VolumeAnalysis {
    const indicators = input.indicators || [];
    const volumeIndicators = indicators.filter(i =>
      ['Volume', 'OBV', 'VWAP'].includes(i.indicator),
    );

    const state = this.determineVolumeState(volumeIndicators, input);
    const description = getVolumeDescription(state);

    return {
      state,
      description,
      supportingIndicators: volumeIndicators,
    };
  }

  interpretSupportResistance(input: ExplanationInput): SupportResistance {
    const supportLevels: number[] = [];
    const resistanceLevels: number[] = [];
    const currentPrice = input.currentPrice;

    if (input.indicators) {
      const bbIndicator = input.indicators.find(i => i.indicator === 'BollingerBands');
      if (bbIndicator) {
        const spread = currentPrice * 0.05;
        supportLevels.push(currentPrice - spread);
        resistanceLevels.push(currentPrice + spread);
      }

      const pivotIndicator = input.indicators.find(i => i.indicator === 'Pivot');
      if (pivotIndicator) {
        supportLevels.push(pivotIndicator.value);
        resistanceLevels.push(currentPrice + (currentPrice - pivotIndicator.value));
      }
    }

    if (supportLevels.length === 0) {
      supportLevels.push(currentPrice * 0.95);
      supportLevels.push(currentPrice * 0.90);
    }
    if (resistanceLevels.length === 0) {
      resistanceLevels.push(currentPrice * 1.05);
      resistanceLevels.push(currentPrice * 1.10);
    }

    supportLevels.sort((a, b) => b - a);
    resistanceLevels.sort((a, b) => a - b);

    const nearestSupport = supportLevels.find(s => s < currentPrice) || supportLevels[0];
    const nearestResistance = resistanceLevels.find(r => r > currentPrice) || resistanceLevels[0];

    const distanceToSupport = ((currentPrice - nearestSupport) / currentPrice) * 100;
    const distanceToResistance = ((nearestResistance - currentPrice) / currentPrice) * 100;

    const description = this.buildSupportResistanceDescription(
      distanceToSupport,
      distanceToResistance,
      currentPrice,
      nearestSupport,
      nearestResistance,
    );

    return {
      supportLevels,
      resistanceLevels,
      currentPrice,
      distanceToSupport,
      distanceToResistance,
      description,
    };
  }

  explainEliteScore(input: ExplanationInput): EliteScoreExplanation {
    if (!input.eliteScore) {
      return {
        technicalScore: 0,
        financialScore: 0,
        confidenceScore: 0,
        compositeScore: 0,
        description: 'Elite Skor verisi bulunamadı.',
        positiveFactors: { positive: [], negative: [] },
        negativeFactors: { positive: [], negative: [] },
      };
    }

    const { technical, financial, confidence, composite, rank } = input.eliteScore;
    const positiveFactors = this.extractPositiveFactors(input);
    const negativeFactors = this.extractNegativeFactors(input);

    const description = this.buildEliteScoreDescription(technical, financial, confidence, composite, rank);

    return {
      technicalScore: technical,
      financialScore: financial,
      confidenceScore: confidence,
      compositeScore: composite,
      rank,
      description,
      positiveFactors,
      negativeFactors,
    };
  }

  buildGeneralSummary(input: ExplanationInput): string {
    const parts: string[] = [];

    parts.push(`${input.stockName} (${input.stockSymbol}) hissesinin mevcut durumu`);

    if (input.eliteScore) {
      parts.push(`Elite Skor: ${input.eliteScore.composite.toFixed(1)}`);
      if (input.eliteScore.rank) {
        parts.push(`Sıralama: ${input.eliteScore.rank}. sıra`);
      }
    }

    if (input.decisionSignal) {
      const signalText = input.decisionSignal.action === 'BUY' ? 'Alım' :
        input.decisionSignal.action === 'SELL' ? 'Satım' :
          input.decisionSignal.action === 'HOLD' ? 'Bekleme' : 'İzleme';
      parts.push(`${signalText} sinyali aktif`);
    }

    return parts.join('. ') + '.';
  }

  buildTechnicalAnalysis(input: ExplanationInput): string {
    const parts: string[] = [];
    const indicators = input.indicators || [];

    if (indicators.length > 0) {
      const positive = indicators.filter(i => i.isPositive);
      const negative = indicators.filter(i => !i.isPositive);

      if (positive.length > negative.length) {
        parts.push(`Teknik göstergeler genel olarak yükseliş yönünde sinyal üretiyor (${positive.length}/${indicators.length} pozitif).`);
      } else if (negative.length > positive.length) {
        parts.push(`Teknik göstergeler genel olarak düşüş yönünde sinyal üretiyor (${negative.length}/${indicators.length} negatif).`);
      } else {
        parts.push('Teknik göstergeler karışık sinyaller üretiyor. Net bir yön belirlenmemiş.');
      }
    }

    if (input.technicalScore) {
      const { momentum, trend, volatility, volume } = input.technicalScore;
      const components: string[] = [];
      if (momentum !== undefined) components.push(`momentum: ${momentum.toFixed(1)}`);
      if (trend !== undefined) components.push(`trend: ${trend.toFixed(1)}`);
      if (volatility !== undefined) components.push(`volatilite: ${volatility.toFixed(1)}`);
      if (volume !== undefined) components.push(`hacim: ${volume.toFixed(1)}`);

      if (components.length > 0) {
        parts.push(`Teknik bileşenler: ${components.join(', ')}.`);
      }
    }

    return parts.join(' ') || 'Teknik analiz verisi bulunamadı.';
  }

  buildSuggestedObservation(input: ExplanationInput): string {
    const parts: string[] = [];

    if (input.decisionSignal) {
      if (input.decisionSignal.action === 'BUY') {
        parts.push('Alım sinyali mevcut. Giriş fiyatı ve hedef seviye belirlenmeli.');
        if (input.decisionSignal.stopLossPrice) {
          parts.push(`Stop-loss seviyesi: ${input.decisionSignal.stopLossPrice.toFixed(2)}`);
        }
        if (input.decisionSignal.targetPrice) {
          parts.push(`Hedef fiyat: ${input.decisionSignal.targetPrice.toFixed(2)}`);
        }
      } else if (input.decisionSignal.action === 'SELL') {
        parts.push('Satım sinyali mevcut. Mevcut pozisyonlar değerlendirilmeli.');
      } else if (input.decisionSignal.action === 'WATCH') {
        parts.push('Hisse izleme listesine alınmalı. Belirli seviyelerin kırılması durumunda harekete geçilmeli.');
      } else {
        parts.push('Mevcut pozisyon korunmalı. Belirgin bir yön değişikliği henüz doğrulanmamış.');
      }
    }

    if (input.decisionSignal?.riskRewardRatio) {
      parts.push(getRiskRewardDescription(input.decisionSignal.riskRewardRatio));
    }

    return parts.join(' ') || 'Gözlem önerisi için yeterli veri bulunmuyor.';
  }

  buildFinalEvaluation(input: ExplanationInput): string {
    const parts: string[] = [];

    if (input.eliteScore && input.confidenceScore) {
      const eliteScore = input.eliteScore.composite;
      const confidence = input.confidenceScore.composite;

      if (eliteScore >= 70 && confidence >= 0.7) {
        parts.push(`${input.stockSymbol} hissesi güçlü bir fırsat sunuyor.`);
        parts.push('Teknik ve finansal göstergeler uyumlu.');
        parts.push('Yüksek güven seviyesi mevcut.');
      } else if (eliteScore >= 50 && confidence >= 0.5) {
        parts.push(`${input.stockSymbol} hissesinde orta düzeyde bir fırsat bulunuyor.`);
        parts.push('Ek onay ve izleme öneriliyor.');
      } else if (eliteScore < 30) {
        parts.push(`${input.stockSymbol} hissesi zayıf bir yapı sergiliyor.`);
        parts.push('Risk seviyesi yüksek, temkinli hareket edilmeli.');
      } else {
        parts.push(`${input.stockSymbol} hissesi belirsiz bir yapıda.`);
        parts.push('Net bir karar için daha fazla veriye ihtiyaç var.');
      }
    }

    return parts.join(' ') || 'Değerlendirme için yeterli veri bulunmuyor.';
  }

  private determineTrendDirection(indicators: IndicatorEvidence[], input: ExplanationInput): TrendDirection {
    if (indicators.length === 0) {
      if (input.technicalScore?.trend !== undefined) {
        return this.trendFromScore(input.technicalScore.trend);
      }
      return TrendDirection.SIDEWAYS;
    }

    const positiveRatio = indicators.filter(i => i.isPositive).length / indicators.length;
    const avgValue = indicators.reduce((sum, i) => sum + i.value, 0) / indicators.length;

    if (positiveRatio >= 0.8 && avgValue >= 0.7) return TrendDirection.STRONG_UPTREND;
    if (positiveRatio >= 0.65) return TrendDirection.UPTREND;
    if (positiveRatio >= 0.55) return TrendDirection.WEAK_UPTREND;
    if (positiveRatio <= 0.2 && avgValue <= 0.3) return TrendDirection.STRONG_DOWNTREND;
    if (positiveRatio <= 0.35) return TrendDirection.DOWNTREND;
    if (positiveRatio <= 0.45) return TrendDirection.WEAK_DOWNTREND;
    return TrendDirection.SIDEWAYS;
  }

  private trendFromScore(score: number): TrendDirection {
    if (score >= 75) return TrendDirection.STRONG_UPTREND;
    if (score >= 60) return TrendDirection.UPTREND;
    if (score >= 50) return TrendDirection.WEAK_UPTREND;
    if (score >= 40) return TrendDirection.SIDEWAYS;
    if (score >= 30) return TrendDirection.WEAK_DOWNTREND;
    if (score >= 20) return TrendDirection.DOWNTREND;
    return TrendDirection.STRONG_DOWNTREND;
  }

  private calculateTrendStrength(indicators: IndicatorEvidence[]): number {
    if (indicators.length === 0) return 50;

    const positiveCount = indicators.filter(i => i.isPositive).length;
    const agreement = positiveCount / indicators.length;
    const weightedSum = indicators.reduce((sum, i) => {
      const weight = i.isPositive ? i.weight : -i.weight;
      return sum + weight * i.value;
    }, 0);

    const normalizedStrength = Math.abs(weightedSum) * 100;
    return Math.min(100, Math.max(0, normalizedStrength));
  }

  private determineMomentumState(indicators: IndicatorEvidence[], rsiIndicator?: IndicatorEvidence): MomentumState {
    if (rsiIndicator) {
      if (rsiIndicator.value >= 70) return MomentumState.OVERBOUGHT;
      if (rsiIndicator.value <= 30) return MomentumState.OVERSOLD;
      if (rsiIndicator.value >= 55) return MomentumState.BULLISH_MOMENTUM;
      if (rsiIndicator.value <= 45) return MomentumState.BEARISH_MOMENTUM;
    }

    if (indicators.length === 0) return MomentumState.NEUTRAL;

    const positiveRatio = indicators.filter(i => i.isPositive).length / indicators.length;
    if (positiveRatio >= 0.7) return MomentumState.BULLISH_MOMENTUM;
    if (positiveRatio <= 0.3) return MomentumState.BEARISH_MOMENTUM;
    return MomentumState.NEUTRAL;
  }

  private determineVolumeState(indicators: IndicatorEvidence[], input: ExplanationInput): VolumeState {
    if (input.technicalScore?.volume !== undefined) {
      const volume = input.technicalScore.volume;
      if (volume >= 70) return VolumeState.HIGH_VOLUME;
      if (volume <= 30) return VolumeState.LOW_VOLUME;
    }

    if (indicators.length === 0) return VolumeState.NORMAL_VOLUME;

    const positiveCount = indicators.filter(i => i.isPositive).length;
    if (positiveCount > indicators.length * 0.6) return VolumeState.INCREASING;
    if (positiveCount < indicators.length * 0.4) return VolumeState.DECLINING;
    return VolumeState.NORMAL_VOLUME;
  }

  private buildSupportResistanceDescription(
    distanceToSupport: number,
    distanceToResistance: number,
    currentPrice: number,
    support: number,
    resistance: number,
  ): string {
    const parts: string[] = [];

    parts.push(`Mevcut fiyat: ${currentPrice.toFixed(2)}`);

    if (distanceToSupport <= 3) {
      parts.push(`En yakın destek ${support.toFixed(2)} seviyesinde (mesafe: %${distanceToSupport.toFixed(1)}). Fiyat destek seviyesine yakın.`);
    } else {
      parts.push(`En yakın destek: ${support.toFixed(2)} (%${distanceToSupport.toFixed(1)} mesafede).`);
    }

    if (distanceToResistance <= 3) {
      parts.push(`En yakın direnç ${resistance.toFixed(2)} seviyesinde (mesafe: %${distanceToResistance.toFixed(1)}). Fiyat direnç seviyesine yakın.`);
    } else {
      parts.push(`En yakın direnç: ${resistance.toFixed(2)} (%${distanceToResistance.toFixed(1)} mesafede).`);
    }

    return parts.join(' ');
  }

  private buildEliteScoreDescription(
    technical: number,
    financial: number,
    confidence: number,
    composite: number,
    rank?: number,
  ): string {
    const parts: string[] = [];

    parts.push(`Elite Skor: ${composite.toFixed(1)}`);

    if (composite >= 70) {
      parts.push('Güçlü bir fırsat yapısı.');
    } else if (composite >= 50) {
      parts.push('Orta düzeyde fırsat potansiyeli.');
    } else if (composite >= 30) {
      parts.push('Düşük fırsat potansiyeli.');
    } else {
      parts.push('Zayıf yapı, yüksek risk.');
    }

    parts.push(`Teknik: ${technical.toFixed(1)}, Finansal: ${financial.toFixed(1)}, Güven: ${(confidence * 100).toFixed(1)}%`);

    if (rank) {
      parts.push(`Sıralama: ${rank}.`);
    }

    return parts.join(' ');
  }

  private extractPositiveFactors(input: ExplanationInput): PositiveNegativeFactors {
    const positive: PositiveNegativeFactors['positive'] = [];
    const negative: PositiveNegativeFactors['negative'] = [];

    if (input.indicators) {
      for (const indicator of input.indicators) {
        const entry = {
          factor: INDICATOR_NAMES[indicator.indicator] || indicator.indicator,
          weight: indicator.weight,
          evidence: indicator.interpretation,
        };
        if (indicator.isPositive) {
          positive.push(entry);
        } else {
          negative.push(entry);
        }
      }
    }

    if (input.technicalScore) {
      if (input.technicalScore.momentum !== undefined && input.technicalScore.momentum >= 60) {
        positive.push({ factor: 'Momentum', weight: 0.15, evidence: `Momentum skoru ${input.technicalScore.momentum.toFixed(1)} seviyesinde` });
      }
      if (input.technicalScore.trend !== undefined && input.technicalScore.trend >= 60) {
        positive.push({ factor: 'Trend Yapısı', weight: 0.15, evidence: `Trend skoru ${input.technicalScore.trend.toFixed(1)} seviyesinde` });
      }
    }

    if (input.financialScore) {
      if (input.financialScore.growth !== undefined && input.financialScore.growth >= 60) {
        positive.push({ factor: 'Büyüme', weight: 0.12, evidence: `Büyüme skoru ${input.financialScore.growth.toFixed(1)} seviyesinde` });
      }
      if (input.financialScore.profitability !== undefined && input.financialScore.profitability >= 60) {
        positive.push({ factor: 'Karlılık', weight: 0.12, evidence: `Karlılık skoru ${input.financialScore.profitability.toFixed(1)} seviyesinde` });
      }
    }

    return { positive, negative };
  }

  private extractNegativeFactors(input: ExplanationInput): PositiveNegativeFactors {
    const positive: PositiveNegativeFactors['positive'] = [];
    const negative: PositiveNegativeFactors['negative'] = [];

    if (input.technicalScore) {
      if (input.technicalScore.volatility !== undefined && input.technicalScore.volatility >= 70) {
        negative.push({ factor: 'Yüksek Volatilite', weight: 0.12, evidence: `Volatilite skoru ${input.technicalScore.volatility.toFixed(1)} seviyesinde` });
      }
      if (input.technicalScore.momentum !== undefined && input.technicalScore.momentum <= 35) {
        negative.push({ factor: 'Zayıf Momentum', weight: 0.12, evidence: `Momentum skoru ${input.technicalScore.momentum.toFixed(1)} seviyesinde` });
      }
    }

    if (input.riskFactors) {
      for (const risk of input.riskFactors) {
        if (risk.severity === 'high' || risk.severity === 'critical') {
          negative.push({ factor: risk.type, weight: 0.10, evidence: risk.description });
        }
      }
    }

    return { positive, negative };
  }
}
