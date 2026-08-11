import { Injectable } from '@nestjs/common';
import {
  AnalystInput,
  AnalystResult,
} from './analyst.types';
import { ANALYST_QUALITY_THRESHOLDS } from './analyst.config';
import { IndicatorResult } from '../indicators/indicator.types';
import { MarketStructureResult } from '../market-structure/market-structure.types';
import { OpportunityResult } from '../ai-opportunity/opportunity.types';
import { EliteScoreResult } from '../ai-elite-score/elite-score.types';
import { TomorrowCandidateResult } from '../tomorrow/tomorrow.types';
import { DecisionResult } from '../decision/decision.types';
import { VerificationResult, CatalystResultDto } from '../research/interfaces/verification.types';
import { EntryZoneResult } from '../entry/entry-zone.types';

@Injectable()
export class AnalystExplanationEngine {
  generate(input: AnalystInput): AnalystResult {
    const {
      ticker,
      company,
      price,
      atr,
      relativeVolume,
      indicators,
      structure,
      opportunity,
      eliteScore,
      tomorrow,
      decision,
      entryZone,
      verification,
      catalysts,
    } = input;

    const trendDirection = structure?.trend ?? 'sideways';
    const trendLabel = this.trendLabel(trendDirection);
    const macd = this.getIndicator(indicators, 'MACD');
    const rsi = this.getIndicator(indicators, 'RSI');
    const ema20 = this.getIndicator(indicators, 'EMA_20');
    const sma50 = this.getIndicator(indicators, 'SMA_50');
    const sma200 = this.getIndicator(indicators, 'SMA_200');
    const bb = this.getIndicator(indicators, 'BollingerBands');
    const bbValue = (bb?.value as Record<string, number> | null) ?? null;
    const momentum = this.getIndicator(indicators, 'MomentumOscillator');
    const roc = this.getIndicator(indicators, 'ROC');

    const genel = this.buildGenelAnaliz(trendDirection, opportunity, eliteScore);
    const teknik = this.buildTeknikAnaliz(macd, rsi, ema20, sma50, sma200, bbValue, price);
    const temel = this.buildTemelAnaliz(opportunity);
    const risk = this.buildRiskAnalizi(opportunity, atr);
    const momentumAnaliz = this.buildMomentumAnalizi(opportunity, momentum, roc);
    const trend = this.buildTrendAnalizi(trendDirection, structure);
    const likidite = this.buildLikiditeAnalizi(opportunity, relativeVolume);
    const verificationAnaliz = this.buildVerificationAnalizi(verification);
    const catalystAnaliz = this.buildCatalystAnalizi(catalysts);
    const entryYorum = this.buildEntryYorumu(entryZone, price);
    const stopYorum = this.buildStopYorumu(entryZone);
    const targetYorum = this.buildTargetYorumu(entryZone);

    const strengths = this.buildStrengths(decision, opportunity);
    const weaknesses = this.buildWeaknesses(decision, opportunity);
    const warnings = this.buildWarnings(entryZone, opportunity);
    const positiveSignals = this.buildPositiveSignals(decision, verification, catalysts);
    const negativeSignals = this.buildNegativeSignals(decision, verification, catalysts);

    return {
      ticker,
      company,
      genelAnaliz: genel,
      teknikAnaliz: teknik,
      temelAnaliz: temel,
      riskAnalizi: risk,
      momentumAnalizi: momentumAnaliz,
      trendAnalizi: trend,
      likiditeAnalizi: likidite,
      verificationAnalizi: verificationAnaliz,
      catalystAnalizi: catalystAnaliz,
      entryYorumu: entryYorum,
      stopYorumu: stopYorum,
      targetYorumu: targetYorum,
      strengths,
      weaknesses,
      warnings,
      positiveSignals,
      negativeSignals,
      evaluatedAt: new Date().toISOString(),
    };
  }

  private getIndicator(
    indicators: IndicatorResult[],
    name: string,
  ): IndicatorResult | undefined {
    return indicators.find((i) => i.indicator === name);
  }

  private trendDirectionLabel(trend: string): string {
    if (trend === 'uptrend') return 'yükseliş';
    if (trend === 'downtrend') return 'düşüş';
    return 'yan';
  }

  private trendLabel(trend: string): string {
    if (trend === 'uptrend') return 'Yükseliş';
    if (trend === 'downtrend') return 'Düşüş';
    return 'Yan';
  }

  private buildGenelAnaliz(
    trendDirection: string,
    opportunity: OpportunityResult | null,
    eliteScore: EliteScoreResult | null,
  ): string {
    const trend = this.trendDirectionLabel(trendDirection);
    const parts: string[] = [];

    if (opportunity) {
      const level = opportunity.level;
      if (level === 'ÇOK_GÜÇLÜ_FIRSAT' || level === 'GÜÇLÜ_FIRSAT') {
        parts.push(`Fırsat seviyesi ${level.toLowerCase().replace('_', ' ')}.`);
      } else if (level === 'İZLEME_LISTESI') {
        parts.push('İzleme listesinde.');
      } else {
        parts.push('Fırsat seviyesi zayıf.');
      }
    }

    if (eliteScore) {
      const daily = eliteScore.horizons.find((h) => h.horizon === 'GUNLUK');
      if (daily && daily.skor >= 70) {
        parts.push('Günlük elite skoru yüksek.');
      } else if (daily && daily.skor >= 40) {
        parts.push('Günlük elite skoru orta.');
      } else if (daily) {
        parts.push('Günlük elite skoru düşük.');
      }
    }

    if (parts.length === 0) {
      return `Hisse ${trend} trendinde.`;
    }

    return `Hisse güçlü ${trend} trendini koruyor. ${parts.join(' ')}`;
  }

  private buildTeknikAnaliz(
    macd: IndicatorResult | undefined,
    rsi: IndicatorResult | undefined,
    ema20: IndicatorResult | undefined,
    sma50: IndicatorResult | undefined,
    sma200: IndicatorResult | undefined,
    bbValue: Record<string, number> | null,
    price: number | null,
  ): string {
    const parts: string[] = [];

    if (macd?.value && typeof macd.value === 'object') {
      const hist = (macd.value as Record<string, number>).histogram;
      if (typeof hist === 'number') {
        parts.push(hist >= 0 ? 'MACD pozitif.' : 'MACD negatif.');
      }
    }

    if (rsi != null && typeof rsi.value === 'number') {
      const rsiVal = rsi.value as number;
      if (rsiVal > 75) {
        parts.push('RSI aşırı alım bölgesinde.');
      } else if (rsiVal < 30) {
        parts.push('RSI aşırı satım bölgesinde.');
      } else {
        parts.push('RSI aşırı alımda değil.');
      }
    }

    if (price != null && ema20?.value != null && typeof ema20.value === 'number') {
      const ema20Val = ema20.value as number;
      if (price > ema20Val) {
        parts.push('EMA20 üzerinde işlem görüyor.');
      } else {
        parts.push('EMA20 altında işlem görüyor.');
      }
    }

    if (price != null && sma50?.value != null && typeof sma50.value === 'number') {
      const sma50Val = sma50.value as number;
      if (price > sma50Val) {
        parts.push('SMA50 üzerinde işlem görüyor.');
      } else {
        parts.push('SMA50 altında işlem görüyor.');
      }
    }

    if (bbValue && price != null) {
      if (price > (bbValue.upper ?? Infinity)) {
        parts.push('Fiyat üst bant üzerinde.');
      } else if (price < (bbValue.lower ?? -Infinity)) {
        parts.push('Fiyat alt bant altında.');
      } else {
        parts.push('Fiyat Bollinger bant içinde.');
      }
    }

    if (parts.length === 0) {
      return 'Teknik veri yetersiz.';
    }

    return parts.join(' ');
  }

  private buildTemelAnaliz(opportunity: OpportunityResult | null): string {
    if (!opportunity) return 'Temel veri mevcut değil.';

    const parts: string[] = [];

    if (opportunity.fundamental != null && opportunity.fundamental >= 60) {
      parts.push('Temel güçlü.');
    } else if (opportunity.fundamental != null && opportunity.fundamental >= 40) {
      parts.push('Temel orta seviye.');
    } else if (opportunity.fundamental != null) {
      parts.push('Temel zayıf.');
    }

    if (opportunity.technical != null && opportunity.technical >= 60) {
      parts.push('Teknik skoru yüksek.');
    }

    if (opportunity.quality != null && opportunity.quality >= 60) {
      parts.push('Kalite skoru yüksek.');
    }

    if (parts.length === 0) {
      return 'Temel veriler değerlendiriliyor.';
    }

    return parts.join(' ');
  }

  private buildRiskAnalizi(opportunity: OpportunityResult | null, atr: number | null): string {
    if (!opportunity && !atr) return 'Risk verisi mevcut değil.';

    const parts: string[] = [];

    if (opportunity?.risk != null) {
      if (opportunity.risk >= 70) {
        parts.push('Risk seviyesi düşük.');
      } else if (opportunity.risk >= 40) {
        parts.push('Risk seviyesi orta.');
      } else {
        parts.push('Risk seviyesi yüksek.');
      }
    }

    if (atr != null && atr > 0) {
      if (atr > 10) {
        parts.push('Volatilite yüksek.');
      } else if (atr < 3) {
        parts.push('Volatilite düşük.');
      }
    }

    if (parts.length === 0) {
      return 'Risk verisi yetersiz.';
    }

    return parts.join(' ');
  }

  private buildMomentumAnalizi(
    opportunity: OpportunityResult | null,
    momentum: IndicatorResult | undefined,
    roc: IndicatorResult | undefined,
  ): string {
    const parts: string[] = [];

    if (opportunity?.momentum != null) {
      if (opportunity.momentum >= 70) {
        parts.push('Momentum kuvvetli.');
      } else if (opportunity.momentum >= 40) {
        parts.push('Momentum orta.');
      } else {
        parts.push('Momentum zayıf.');
      }
    }

    if (momentum?.value != null && typeof momentum.value === 'number') {
      const mVal = momentum.value as number;
      if (mVal > 0) {
        parts.push('Momentum göstergesi pozitif.');
      } else {
        parts.push('Momentum göstergesi negatif.');
      }
    }

    if (roc?.value != null && typeof roc.value === 'number') {
      const rocVal = roc.value as number;
      if (rocVal > 0) {
        parts.push('ROC pozitif.');
      } else {
        parts.push('ROC negatif.');
      }
    }

    if (parts.length === 0) {
      return 'Momentum verisi mevcut değil.';
    }

    return parts.join(' ');
  }

  private buildTrendAnalizi(
    trendDirection: string,
    structure: MarketStructureResult | null,
  ): string {
    if (trendDirection === 'uptrend') {
      return 'Yükseliş trendi.';
    }
    if (trendDirection === 'downtrend') {
      return 'Düşüş trendi.';
    }
    return 'Yan trend.';
  }

  private buildLikiditeAnalizi(
    opportunity: OpportunityResult | null,
    relativeVolume: number | null,
  ): string {
    const parts: string[] = [];

    if (opportunity?.liquidity != null) {
      if (opportunity.liquidity >= 70) {
        parts.push('Likidite yüksek.');
      } else if (opportunity.liquidity >= 40) {
        parts.push('Likidite orta.');
      } else {
        parts.push('Likidite düşük.');
      }
    }

    if (relativeVolume != null) {
      if (relativeVolume >= 1.5) {
        parts.push('Hacim yıllık ortalamanın üzerinde.');
      } else if (relativeVolume >= 1.0) {
        parts.push('Hacim normal seviyede.');
      } else {
        parts.push('Hacim yıllık ortalamasının altında.');
      }
    }

    if (parts.length === 0) {
      return 'Likidite verisi mevcut değil.';
    }

    return parts.join(' ');
  }

  private buildVerificationAnalizi(verification: VerificationResult | null): string {
    if (!verification) return 'Doğrulama verisi mevcut değil.';

    const parts: string[] = [];

    if (verification.totalEvidence > 0) {
      const ratio = verification.verifiedCount / verification.totalEvidence;
      if (ratio >= 0.5) {
        parts.push('Haberler doğrulanmış.');
      } else if (ratio > 0) {
        parts.push('Kısmi doğrulama mevcut.');
      } else {
        parts.push('Doğrulanmış haber yok.');
      }
    }

    if (verification.conflicts.length > 0) {
      parts.push('Haberlerde çelişki tespit edildi.');
    }

    if (verification.averageConfidence > 70) {
      parts.push('Güven oranı yüksek.');
    }

    if (parts.length === 0) {
      return 'Doğrulama verisi yok.';
    }

    return parts.join(' ');
  }

  private buildCatalystAnalizi(catalysts: CatalystResultDto[]): string {
    if (!catalysts || catalysts.length === 0) {
      return 'Katalizör mevcut değil.';
    }

    const parts: string[] = [];
    const bullish = catalysts.filter((c) => c.direction === 'Bullish');
    const bearish = catalysts.filter((c) => c.direction === 'Bearish');

    if (bullish.length > 0) {
      const types = bullish.map((c) => c.title).join(', ');
      parts.push(`Pozitif katalizör: ${types}.`);
    }

    if (bearish.length > 0) {
      const types = bearish.map((c) => c.title).join(', ');
      parts.push(`Negatif katalizör: ${types}.`);
    }

    if (parts.length === 0) {
      return 'Katalizör yok.';
    }

    return parts.join(' ');
  }

  private buildEntryYorumu(entryZone: EntryZoneResult | null, price: number | null): string {
    if (!entryZone?.idealEntryZone) {
      return 'Giriş bölgesi hesaplanamadı.';
    }

    const zone = entryZone.idealEntryZone;
    if (price != null && price >= zone.min && price <= zone.max) {
      return `${zone.min}-${zone.max} bölgesinde mevcut fiyat. Uygun giriş alanı.`;
    }
    return `${zone.min}-${zone.max} bölgesi uygun giriş alanı.`;
  }

  private buildStopYorumu(entryZone: EntryZoneResult | null): string {
    if (!entryZone?.stopLoss) return 'Stop loss verisi mevcut değil.';
    return `${entryZone.stopLoss} altında pozisyon gözden geçirilmeli.`;
  }

  private buildTargetYorumu(entryZone: EntryZoneResult | null): string {
    if (!entryZone) return 'Hedef verisi mevcut değil.';

    const parts: string[] = [];
    if (entryZone.target1 != null) {
      parts.push(`${entryZone.target1} ilk hedef.`);
    }
    if (entryZone.target2 != null) {
      parts.push(`${entryZone.target2} ikinci hedef.`);
    }
    if (entryZone.target3 != null) {
      parts.push(`${entryZone.target3} üçüncü hedef.`);
    }

    if (parts.length === 0) return 'Hedef verisi mevcut değil.';
    return parts.join(' ');
  }

  private buildStrengths(
    decision: DecisionResult | null,
    opportunity: OpportunityResult | null,
  ): string[] {
    const strengths: string[] = [];

    if (decision?.positiveSignals) {
      strengths.push(...decision.positiveSignals);
    }

    if (opportunity?.positiveSignals) {
      strengths.push(...opportunity.positiveSignals);
    }

    if (opportunity?.tags) {
      strengths.push(...opportunity.tags.map((t) => String(t)));
    }

    return [...new Set(strengths)];
  }

  private buildWeaknesses(
    decision: DecisionResult | null,
    opportunity: OpportunityResult | null,
  ): string[] {
    const weaknesses: string[] = [];

    if (decision?.negativeSignals) {
      weaknesses.push(...decision.negativeSignals);
    }

    if (opportunity?.negativeSignals) {
      weaknesses.push(...opportunity.negativeSignals);
    }

    return [...new Set(weaknesses)];
  }

  private buildWarnings(
    entryZone: EntryZoneResult | null,
    opportunity: OpportunityResult | null,
  ): string[] {
    const warnings: string[] = [];

    if (entryZone?.warnings) {
      warnings.push(...entryZone.warnings);
    }

    if (opportunity?.warnings) {
      warnings.push(...opportunity.warnings);
    }

    return [...new Set(warnings)];
  }

  private buildPositiveSignals(
    decision: DecisionResult | null,
    verification: VerificationResult | null,
    catalysts: CatalystResultDto[],
  ): string[] {
    const signals: string[] = [];

    if (decision?.positiveSignals) {
      signals.push(...decision.positiveSignals);
    }

    if (verification && verification.verifiedCount > 0) {
      signals.push('Doğrulanmış veri mevcut');
    }

    const bullishCatalysts = catalysts.filter((c) => c.direction === 'Bullish');
    if (bullishCatalysts.length > 0) {
      signals.push('Pozitif katalizör mevcut');
    }

    return [...new Set(signals)];
  }

  private buildNegativeSignals(
    decision: DecisionResult | null,
    verification: VerificationResult | null,
    catalysts: CatalystResultDto[],
  ): string[] {
    const signals: string[] = [];

    if (decision?.negativeSignals) {
      signals.push(...decision.negativeSignals);
    }

    if (verification && verification.conflicts.length > 0) {
      signals.push('Çelişkili veri tespit edildi');
    }

    const bearishCatalysts = catalysts.filter((c) => c.direction === 'Bearish');
    if (bearishCatalysts.length > 0) {
      signals.push('Negatif katalizör mevcut');
    }

    return [...new Set(signals)];
  }
}