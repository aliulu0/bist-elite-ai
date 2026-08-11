import { Injectable } from '@nestjs/common';
import {
  ENTRY_AGGRESSIVE_ATR_FACTOR,
  ENTRY_ATR_FALLBACK_RATIO,
  ENTRY_CONSERVATIVE_ATR_FACTOR,
  ENTRY_QUALITY_LEVELS,
  ENTRY_STOP_ATR_FACTOR,
  ENTRY_TARGET_EXTENSION,
} from './entry-zone.config';
import {
  EntryTrendDirection,
  EntryZoneInput,
  EntryZoneResult,
} from './entry-zone.types';
import { Zone } from '../market-structure/market-structure.types';

@Injectable()
export class EntryZoneEngine {
  evaluate(input: EntryZoneInput): EntryZoneResult {
    const { ticker, company, price, atr, trend, context } = input;
    const warnings: string[] = [];

    const hasPrice = typeof price === 'number' && Number.isFinite(price) && price > 0;
    const effectiveAtr =
      hasPrice && typeof atr === 'number' && Number.isFinite(atr) && atr > 0
        ? atr
        : hasPrice
          ? price! * ENTRY_ATR_FALLBACK_RATIO
          : null;

    if (!hasPrice) {
      warnings.push('Fiyat verisi yok — seviyeler hesaplanamadı');
    }
    if (hasPrice && effectiveAtr !== atr) {
      warnings.push('ATR verisi yok — varsayılan volatilite kullanıldı');
    }
    if (input.supportZones.length === 0 && input.resistanceZones.length === 0) {
      warnings.push('Destek/direnç bölgesi bulunamadı — SMA tabanlı seviyeler');
    }

    const { support1, support2 } = this.pickSupports(input.supportZones, price, effectiveAtr);
    const { resistance1, resistance2 } = this.pickResistances(input.resistanceZones, price, effectiveAtr);

    const conservativeEntry =
      hasPrice && effectiveAtr
        ? this.round2(Math.max(support1 ?? price! - effectiveAtr, price! - ENTRY_CONSERVATIVE_ATR_FACTOR * effectiveAtr))
        : null;
    const aggressiveEntry =
      hasPrice && effectiveAtr
        ? this.round2(price! + ENTRY_AGGRESSIVE_ATR_FACTOR * effectiveAtr)
        : null;
    const idealEntryZone =
      conservativeEntry != null && aggressiveEntry != null
        ? {
            min: Math.min(conservativeEntry, aggressiveEntry),
            max: Math.max(conservativeEntry, aggressiveEntry),
          }
        : null;

    const stopLoss =
      hasPrice && effectiveAtr
        ? this.round2((support1 ?? conservativeEntry ?? price!) - ENTRY_STOP_ATR_FACTOR * effectiveAtr)
        : null;

    const target1 =
      hasPrice && effectiveAtr
        ? this.round2(resistance1 ?? price! + 2 * effectiveAtr)
        : null;
    const target2 =
      target1 != null && effectiveAtr
        ? this.round2(target1 + ENTRY_TARGET_EXTENSION * effectiveAtr)
        : null;
    const target3 =
      target2 != null && effectiveAtr
        ? this.round2(target2 + ENTRY_TARGET_EXTENSION * effectiveAtr)
        : null;

    const referenceEntry =
      conservativeEntry != null && aggressiveEntry != null
        ? (conservativeEntry + aggressiveEntry) / 2
        : null;
    const risk = referenceEntry != null && stopLoss != null ? referenceEntry - stopLoss : null;
    const reward = referenceEntry != null && target1 != null ? target1 - referenceEntry : null;
    const riskRewardRatio =
      risk != null && reward != null && risk > 0 ? Math.round((reward / risk) * 10) / 10 : null;
    const riskRewardLabel = riskRewardRatio != null ? `1 : ${riskRewardRatio}` : null;

    if (riskRewardRatio != null && riskRewardRatio < 1.5) {
      warnings.push('Risk/ödül zayıf (1 : 1.5 altı)');
    }

    if (input.rsi != null && input.rsi > 75) {
      warnings.push('RSI aşırı alım bölgesinde');
    }

    const trendDirection = this.determineTrendDirection(trend, input);
    const entryConfidence = this.computeConfidence(input, effectiveAtr, support1, riskRewardRatio);
    const entryQuality = this.determineQuality(entryConfidence);

    const reasons = this.buildReasons(
      price,
      idealEntryZone,
      aggressiveEntry,
      conservativeEntry,
      support1,
      support2,
      resistance1,
      resistance2,
      stopLoss,
      target1,
      target2,
      target3,
      riskRewardLabel,
      entryConfidence,
      trendDirection,
      context,
    );

    return {
      ticker,
      company,
      price,
      idealEntryZone,
      aggressiveEntry,
      conservativeEntry,
      support1,
      support2,
      resistance1,
      resistance2,
      stopLoss,
      target1,
      target2,
      target3,
      riskRewardRatio,
      riskRewardLabel,
      entryConfidence,
      trendDirection,
      entryQuality,
      reasons,
      warnings,
      evaluatedAt: new Date().toISOString(),
    };
  }

  private pickSupports(
    zones: Zone[],
    price: number | null,
    atr: number | null,
  ): { support1: number | null; support2: number | null } {
    if (price == null || atr == null) {
      return { support1: null, support2: null };
    }
    const below = zones
      .filter((z) => z.upper < price)
      .sort((a, b) => b.upper - a.upper);
    const support1 = below[0]?.upper ?? this.round2(price - 2 * atr);
    const support2 = below[1]?.upper ?? below[0]?.lower ?? this.round2(price - 4 * atr);
    return { support1: this.round2(support1), support2: this.round2(support2) };
  }

  private pickResistances(
    zones: Zone[],
    price: number | null,
    atr: number | null,
  ): { resistance1: number | null; resistance2: number | null } {
    if (price == null || atr == null) {
      return { resistance1: null, resistance2: null };
    }
    const above = zones
      .filter((z) => z.lower > price)
      .sort((a, b) => a.lower - b.lower);
    const resistance1 = above[0]?.lower ?? this.round2(price + 2 * atr);
    const resistance2 = above[1]?.lower ?? above[0]?.upper ?? this.round2(price + 4 * atr);
    return { resistance1: this.round2(resistance1), resistance2: this.round2(resistance2) };
  }

  private determineTrendDirection(
    trend: EntryZoneInput['trend'],
    input: EntryZoneInput,
  ): EntryTrendDirection {
    if (trend === 'uptrend') return 'UPTREND';
    if (trend === 'downtrend') return 'DOWNTREND';
    const { sma20, sma50 } = input.sma;
    if (sma20 != null && sma50 != null) {
      if (sma20 > sma50) return 'UPTREND';
      if (sma20 < sma50) return 'DOWNTREND';
    }
    return 'SIDEWAYS';
  }

  private computeConfidence(
    input: EntryZoneInput,
    atr: number | null,
    support1: number | null,
    riskRewardRatio: number | null,
  ): number {
    const { price, trend, sma, ema, rsi, relativeVolume, context } = input;
    let score = 40;

    if (typeof price === 'number' && price > 0) {
      if (trend === 'uptrend') score += 20;
      else if (trend === 'sideways') score += 5;
      else score -= 15;

      if (sma.sma20 != null && price > sma.sma20) score += 6;
      if (sma.sma50 != null && price > sma.sma50) score += 6;
      if (sma.sma200 != null && price > sma.sma200) score += 8;

      if (ema.ema20 != null && ema.ema50 != null && ema.ema20 > ema.ema50) score += 5;

      if (rsi != null) {
        if (rsi >= 40 && rsi <= 65) score += 6;
        else if (rsi > 75) score -= 8;
        else if (rsi < 30) score -= 3;
      }

      if (relativeVolume != null) {
        if (relativeVolume >= 1.5) score += 5;
        else if (relativeVolume >= 1.0) score += 3;
      }

      if (support1 != null && atr != null) {
        const distanceToSupport = price - support1;
        if (distanceToSupport >= 0 && distanceToSupport <= 1.5 * atr) score += 8;
        else if (distanceToSupport > 3 * atr) score -= 5;
      }
    }

    const ctxValues = [context?.aiScore, context?.decisionScore, context?.opportunityScore, context?.eliteDaily, context?.tomorrowScore]
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    if (ctxValues.length > 0) {
      const avg = ctxValues.reduce((a, b) => a + b, 0) / ctxValues.length;
      score += Math.min(10, avg * 0.08);
    }
    if (typeof context?.risk === 'number' && Number.isFinite(context.risk)) {
      score += Math.min(4, context.risk * 0.04);
    }

    if (riskRewardRatio != null && riskRewardRatio < 1.5) {
      score -= 5;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private determineQuality(confidence: number) {
    for (const meta of ENTRY_QUALITY_LEVELS) {
      if (confidence >= meta.minConfidence) {
        return { level: meta.level, label: meta.label, stars: meta.stars };
      }
    }
    return ENTRY_QUALITY_LEVELS[ENTRY_QUALITY_LEVELS.length - 1];
  }

  private buildReasons(
    price: number | null,
    zone: { min: number; max: number } | null,
    aggressiveEntry: number | null,
    conservativeEntry: number | null,
    support1: number | null,
    support2: number | null,
    resistance1: number | null,
    resistance2: number | null,
    stopLoss: number | null,
    target1: number | null,
    target2: number | null,
    target3: number | null,
    riskRewardLabel: string | null,
    confidence: number,
    trendDirection: EntryTrendDirection,
    context: EntryZoneInput['context'],
  ): string[] {
    const reasons: string[] = [];
    reasons.push(`Trend: ${trendDirection}`);
    if (zone) reasons.push(`İdeal Giriş Bölgesi: ${zone.min} - ${zone.max}`);
    if (aggressiveEntry != null) reasons.push(`Agresif Giriş: ${aggressiveEntry}`);
    if (conservativeEntry != null) reasons.push(`Konservatif Giriş: ${conservativeEntry}`);
    if (support1 != null) reasons.push(`Destek 1: ${support1}`);
    if (support2 != null) reasons.push(`Destek 2: ${support2}`);
    if (resistance1 != null) reasons.push(`Direnç 1: ${resistance1}`);
    if (resistance2 != null) reasons.push(`Direnç 2: ${resistance2}`);
    if (stopLoss != null) reasons.push(`Stop Loss: ${stopLoss}`);
    if (target1 != null) reasons.push(`Hedef 1: ${target1}`);
    if (target2 != null) reasons.push(`Hedef 2: ${target2}`);
    if (target3 != null) reasons.push(`Hedef 3: ${target3}`);
    if (riskRewardLabel != null) reasons.push(`Risk/Ödül: ${riskRewardLabel}`);
    reasons.push(`Giriş Güveni: ${confidence}/100`);
    if (context?.aiScore != null) reasons.push(`AI Skoru: ${context.aiScore}`);
    if (context?.decisionScore != null) reasons.push(`Karar Skoru: ${context.decisionScore}`);
    if (context?.opportunityScore != null) reasons.push(`Fırsat Skoru: ${context.opportunityScore}`);
    if (context?.eliteDaily != null) reasons.push(`Günlük Elite Skor: ${context.eliteDaily}`);
    if (context?.tomorrowScore != null) reasons.push(`Yarın Skoru: ${context.tomorrowScore}`);
    if (price != null) reasons.push(`Son Kapanış: ${price}`);
    return reasons;
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
