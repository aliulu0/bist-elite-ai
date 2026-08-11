import { Injectable } from '@nestjs/common';
import {
  EarlySignal,
  EarlySignalScannerInput,
  EarlySignalScannerResult,
  SignalCategory,
  SignalConvergenceSummary,
  SignalPhase,
  SignalPriority,
  SignalStrengthLabel,
  SIGNAL_CATEGORIES,
  SIGNAL_STRENGTH_META,
} from './early-signal.types';
import { clamp0100 } from '../early-opportunity.utils';
import { CatalystCategory } from '../../catalyst/catalyst.types';

const VOLUME_SPIKE_THRESHOLD = 2.0;
const RELATIVE_VOLUME_THRESHOLD = 1.5;
const ACCUMULATION_STRONG = 55;
const DISTRIBUTION_STRONG = 55;
const SMART_MONEY_HIGH = 60;
const CATALYST_HIGH = 60;
const MTF_ALIGNMENT_MIN = 60;
const EARLY_STAGE_MIN = 55;

const CONTRACT_CATEGORIES: CatalystCategory[] = [
  'tender_win',
  'defense_contract',
  'large_customer_contract',
  'export_agreement',
];
const INVESTMENT_CATEGORIES: CatalystCategory[] = [
  'new_investment',
  'factory_opening',
  'capacity_expansion',
  'rnd',
  'foreign_investment',
  'patent',
];
const PARTNERSHIP_CATEGORIES: CatalystCategory[] = ['strategic_partnership'];
const CAPITAL_ACTION_CATEGORIES: CatalystCategory[] = [
  'capital_increase',
  'share_buyback',
  'dividend',
  'bonus_issue',
];
const REGULATORY_CATEGORIES: CatalystCategory[] = [
  'government_incentive',
  'credit_rating',
  'index_inclusion',
  'sector_rotation',
];
const CORPORATE_EVENT_CATEGORIES: CatalystCategory[] = ['ceo_change', 'board_change'];

interface SignalBuilder {
  input: EarlySignalScannerInput;
  signals: EarlySignal[];
}

@Injectable()
export class EarlySignalScannerEngine {
  scan(input: EarlySignalScannerInput): EarlySignalScannerResult {
    const builder: SignalBuilder = { input, signals: [] };

    this.detectPriceVolume(builder);
    this.detectSmartMoney(builder);
    this.detectFundamental(builder);
    this.detectCatalyst(builder);
    this.detectMultiTimeframe(builder);
    this.detectMarketStructure(builder);

    const factor = this.dataQualityFactor(input.financialDataQuality?.status ?? null);
    const cap = this.capForStatus(input.financialDataQuality?.status ?? null);

    const adjusted = builder.signals.map((s) => {
      const strength = clamp0100(s.strength * factor);
      const capped = Math.min(strength, cap);
      return {
        ...s,
        strength: capped,
        strengthLabel: this.strengthLabel(capped),
      };
    });

    const convergence = this.buildConvergence(adjusted, input.financialDataQuality?.status ?? null);

    return {
      ticker: input.ticker,
      company: input.company,
      sector: input.sector,
      signals: adjusted,
      convergence,
      dataQualityStatus: input.financialDataQuality?.status ?? null,
      scannedAt: new Date().toISOString(),
    };
  }

  // ---------- PRICE_VOLUME ----------

  private detectPriceVolume(b: SignalBuilder): void {
    const sm = b.input.smartMoney;
    if (!sm || !sm.isValid) return;

    if (typeof sm.volumeSpike === 'number' && sm.volumeSpike >= VOLUME_SPIKE_THRESHOLD) {
      this.push(b, 'PRICE_VOLUME', 'volume_spike', sm.breakoutVolume ? 'CONFIRMED' : 'EARLY',
        clamp0100(sm.volumeSpike * 40),
        `Hacim artışı ${sm.volumeSpike.toFixed(2)}x — kurumsal işlem hacmi ortalamanın üzerinde.`,
        ['smartMoney.volumeSpike']);
    }

    if (typeof sm.relativeVolume === 'number' && sm.relativeVolume >= RELATIVE_VOLUME_THRESHOLD) {
      this.push(b, 'PRICE_VOLUME', 'relative_volume', sm.breakoutVolume ? 'CONFIRMED' : 'EARLY',
        clamp0100(sm.relativeVolume * 40),
        `Göreli hacim ${sm.relativeVolume.toFixed(2)}x — piyasa ortalamasının üzerinde işlem.`,
        ['smartMoney.relativeVolume']);
    }

    if (sm.breakoutVolume === true) {
      this.push(b, 'PRICE_VOLUME', 'breakout', 'CONFIRMED', 75,
        'Hacim destekli fiyat kırılımı — güçlü alım baskısı.',
        ['smartMoney.breakoutVolume']);
    }

    if (this.hasSignal(sm, 'volume_confirmation')) {
      this.push(b, 'PRICE_VOLUME', 'breakout_confirmation', 'CONFIRMED', 70,
        'Hacim kurumsal akışı doğruluyor — kırılım teyitli.',
        ['smartMoney.signals']);
    }

    if (this.hasSignal(sm, 'compression_breakout')) {
      this.push(b, 'PRICE_VOLUME', 'price_compression', 'EARLY', 65,
        'Sıkışma (compression) — fiyat yatay bantta, kırılım yakın.',
        ['smartMoney.signals']);
    }

    if (sm.accumulationDays > 0) {
      this.push(b, 'PRICE_VOLUME', 'accumulation_day', 'EARLY',
        clamp0100(40 + sm.accumulationDays * 15),
        `${sm.accumulationDays} gün birikim — kurumsal alım dağılımı.`,
        ['smartMoney.accumulationDays']);
    }

    if (sm.distributionDays > 0) {
      this.push(b, 'PRICE_VOLUME', 'distribution_day', 'EARLY',
        clamp0100(40 + sm.distributionDays * 15),
        `${sm.distributionDays} gün dağıtım — kurumsal satış baskısı.`,
        ['smartMoney.distributionDays']);
    }

    const p = b.input.prediction;
    if (p && p.isValid) {
      if (typeof p.expectedVolatility === 'number' && p.expectedVolatility <= 2.5 && p.trendStrength === 'weak') {
        this.push(b, 'PRICE_VOLUME', 'volatility_compression', 'EARLY', 60,
          'Düşük oynaklık — volatilite sıkışması, patlama hazırlığı.',
          ['prediction.expectedVolatility', 'prediction.trendStrength']);
      }

      if (
        (p.trendDirection === 'up' && (sm.moneyFlow === 'negative' || sm.moneyFlow === 'strong_negative')) ||
        (p.trendDirection === 'down' && (sm.moneyFlow === 'positive' || sm.moneyFlow === 'strong_positive'))
      ) {
        this.push(b, 'PRICE_VOLUME', 'price_volume_divergence', 'EARLY', 55,
          'Fiyat ile para akışı ayrışıyor — fiyat/hacim sapması.',
          ['prediction.trendDirection', 'smartMoney.moneyFlow']);
      }

      if (this.hasSignal(sm, 'trend_confirmation')) {
        this.push(b, 'PRICE_VOLUME', 'trend_transition', 'EARLY', 65,
          'Trend yapısı yeni yöne dönüyor — erken eğilim değişimi.',
          ['smartMoney.signals']);
      }

      if (p.momentum === 'strong_bullish') {
        this.push(b, 'PRICE_VOLUME', 'momentum_acceleration',
          p.confidence >= 70 ? 'CONFIRMED' : 'EARLY', 75,
          'Momentum güçlü yükseliş — hızlanan alım ivmesi.',
          ['prediction.momentum']);
      }
    }
  }

  // ---------- SMART_MONEY ----------

  private detectSmartMoney(b: SignalBuilder): void {
    const sm = b.input.smartMoney;
    if (!sm || !sm.isValid) return;

    if (sm.accumulationScore >= ACCUMULATION_STRONG) {
      this.push(b, 'SMART_MONEY', 'accumulation', 'EARLY', sm.accumulationScore,
        `Kurumsal birikim ${sm.accumulationScore}/100 — akıllı para topluyor.`,
        ['smartMoney.accumulationScore']);

      if (sm.breakoutVolume) {
        this.push(b, 'SMART_MONEY', 'accumulation_breakout', 'CONFIRMED',
          Math.max(sm.accumulationScore, 70),
          'Birikim sonrası hacimle kırılım — kurumsal dağılım tamamlandı.',
          ['smartMoney.breakoutVolume']);
      }

      if (this.hasSignal(sm, 'compression_breakout')) {
        this.push(b, 'SMART_MONEY', 'accumulation_compression', 'EARLY',
          Math.max(sm.accumulationScore, 65),
          'Birikim bölgesinde sıkışma — kırılıma hazır kurumsal pozisyon.',
          ['smartMoney.signals']);
      }
    }

    if (sm.distributionScore >= DISTRIBUTION_STRONG) {
      this.push(b, 'SMART_MONEY', 'distribution', 'EARLY', sm.distributionScore,
        `Kurumsal dağıtım ${sm.distributionScore}/100 — satış baskısı altında.`,
        ['smartMoney.distributionScore']);
    }

    if (sm.smartMoneyScore >= SMART_MONEY_HIGH && b.input.catalyst && b.input.catalyst.catalystScore >= CATALYST_HIGH) {
      const verified = b.input.catalyst.verifiedCount > 0;
      this.push(b, 'SMART_MONEY', 'smart_money_catalyst', verified ? 'CONFIRMED' : 'EARLY',
        clamp0100((sm.smartMoneyScore + b.input.catalyst.catalystScore) / 2),
        'Akıllı para ve katalizör aynı yönde — iki doğrulama üst üste.',
        ['smartMoney.smartMoneyScore', 'catalyst.catalystScore']);
    }

    if (sm.smartMoneyScore >= SMART_MONEY_HIGH && b.input.fundamentals?.overallStatus === 'PASS') {
      this.push(b, 'SMART_MONEY', 'smart_money_fundamental', 'CONFIRMED',
        clamp0100((sm.smartMoneyScore + (b.input.fundamentals.score ?? 0)) / 2),
        'Akıllı para ve temel analiz uyumlu — kurumsal güven yüksek.',
        ['smartMoney.smartMoneyScore', 'fundamentals.overallStatus']);
    }
  }

  // ---------- FUNDAMENTAL ----------

  private detectFundamental(b: SignalBuilder): void {
    const f = b.input.fundamentals;
    if (!f) return;

    const npg = f.netProfitGrowth;
    if (npg?.availability === 'AVAILABLE' && npg.status === 'PASS' && (npg.value ?? 0) > 0) {
      this.push(b, 'FUNDAMENTAL', 'earnings_improvement', 'EARLY', clamp0100((npg.value ?? 0) * 4),
        `Net kar büyümesi %${(npg.value ?? 0).toFixed(1)} — kazanç güçleniyor.`,
        ['fundamentals.netProfitGrowth']);
    }

    if (npg?.availability === 'AVAILABLE' && (npg.value ?? 0) > 0) {
      this.push(b, 'FUNDAMENTAL', 'net_profit_growth', 'EARLY', clamp0100((npg.value ?? 0) * 4),
        `Net kar büyüme oranı %${(npg.value ?? 0).toFixed(1)}.`,
        ['fundamentals.netProfitGrowth']);
    }

    const undervalued =
      f.pdDd?.availability === 'AVAILABLE' && f.pdDd.status === 'PASS' ||
      f.fdFavok?.availability === 'AVAILABLE' && f.fdFavok.status === 'PASS';
    if (undervalued) {
      this.push(b, 'FUNDAMENTAL', 'valuation_improvement', 'EARLY', 65,
        'Değerleme göstergeleri uygun (PD/DD veya FD/FAVÖK) — iskonto.',
        ['fundamentals.pdDd', 'fundamentals.fdFavok']);
    }

    if (f.score >= 60 && b.input.prediction && b.input.prediction.trendDirection !== 'up') {
      this.push(b, 'FUNDAMENTAL', 'fundamental_price_divergence', 'EARLY', f.score,
        'Temel analiz güçlü ancak fiyat henüz yansımamış — değer fırsatı.',
        ['fundamentals.score', 'prediction.trendDirection']);
    }

    if (f.overallStatus === 'PASS' && b.input.smartMoney?.institutionalActivity === 'accumulating') {
      this.push(b, 'FUNDAMENTAL', 'fundamental_smart_money_convergence', 'CONFIRMED',
        clamp0100((f.score + (b.input.smartMoney.accumulationScore ?? 0)) / 2),
        'Güçlü temeller ve kurumsal birikim birleşiyor.',
        ['fundamentals.overallStatus', 'smartMoney.institutionalActivity']);
    }
  }

  // ---------- CATALYST ----------

  private detectCatalyst(b: SignalBuilder): void {
    const c = b.input.catalyst;
    if (!c || c.events.length === 0) return;

    const highImportance = c.events.some(
      (e) => e.importance === 'high' || e.importance === 'critical',
    );
    if (c.catalystScore >= CATALYST_HIGH || highImportance) {
      this.push(b, 'CATALYST', 'material_disclosure', c.verifiedCount > 0 ? 'CONFIRMED' : 'EARLY',
        clamp0100(c.catalystScore),
        `Önemli kurumsal bildirim — katalizör skoru ${c.catalystScore}/100.`,
        ['catalyst.catalystScore', 'catalyst.events']);
    }

    this.detectCatalystGroup(b, 'contract_catalyst', CONTRACT_CATEGORIES, c.verifiedCount);
    this.detectCatalystGroup(b, 'investment_catalyst', INVESTMENT_CATEGORIES, c.verifiedCount);
    this.detectCatalystGroup(b, 'partnership_catalyst', PARTNERSHIP_CATEGORIES, c.verifiedCount);
    this.detectCatalystGroup(b, 'capital_action_catalyst', CAPITAL_ACTION_CATEGORIES, c.verifiedCount);
    this.detectCatalystGroup(b, 'regulatory_catalyst', REGULATORY_CATEGORIES, c.verifiedCount);
    this.detectCatalystGroup(b, 'corporate_event_catalyst', CORPORATE_EVENT_CATEGORIES, c.verifiedCount);
  }

  private detectCatalystGroup(
    b: SignalBuilder,
    type: string,
    categories: CatalystCategory[],
    verifiedCount: number,
  ): void {
    const matching = b.input.catalyst?.events.filter((e) => categories.includes(e.category)) ?? [];
    if (matching.length === 0) return;
    const groupVerified = matching.some((e) => e.verified);
    const maxScore = Math.max(...matching.map((e) => e.catalystScore ?? 50));
    this.push(b, 'CATALYST', type, groupVerified ? 'CONFIRMED' : 'EARLY', clamp0100(maxScore),
      `${matching.length} katalizör olayı (${type}) — ${verifiedCount > 0 ? 'kısmen doğrulandı' : 'doğrulanmadı'}.`,
      ['catalyst.events']);
  }

  // ---------- MULTI_TIMEFRAME ----------

  private detectMultiTimeframe(b: SignalBuilder): void {
    const m = b.input.multiTimeframe;
    if (!m) return;

    if (m.multiTimeframeScore >= MTF_ALIGNMENT_MIN) {
      const strong = m.strength === 'Strong' || m.strength === 'Very Strong';
      this.push(b, 'MULTI_TIMEFRAME', 'mtf_alignment', strong ? 'CONFIRMED' : 'EARLY',
        m.multiTimeframeScore,
        `Çok zaman dilimi uyumu ${m.multiTimeframeScore}/100 — zaman dilimleri hizalı.`,
        ['multiTimeframe.multiTimeframeScore']);
    }

    const a = m.alignments;
    if (a.timeframeAgreement >= MTF_ALIGNMENT_MIN && a.trendAlignment >= MTF_ALIGNMENT_MIN) {
      this.push(b, 'MULTI_TIMEFRAME', 'timeframe_convergence', 'CONFIRMED',
        clamp0100((a.timeframeAgreement + a.trendAlignment) / 2),
        'Zaman dilimleri trend ve momentumda birleşiyor.',
        ['multiTimeframe.alignments']);
    }

    if (m.trendStage === 'Early' && m.multiTimeframeScore >= EARLY_STAGE_MIN) {
      this.push(b, 'MULTI_TIMEFRAME', 'early_trend_transition', 'EARLY', m.multiTimeframeScore,
        'Trend erken aşamada — yeni trendin başlangıcı.',
        ['multiTimeframe.trendStage']);
    }

    const shortBullish = ['1h', '2h', '4h', '1d'].includes(m.bestTimeframe);
    const longBullish = ['1w', '1m', '3m', '6m'].includes(m.mostBullishTimeframe);
    if (shortBullish && longBullish && a.trendAlignment >= MTF_ALIGNMENT_MIN) {
      this.push(b, 'MULTI_TIMEFRAME', 'short_long_alignment', 'CONFIRMED', a.trendAlignment,
        'Kısa ve uzun vade trendleri aynı yönde — güçlü uyum.',
        ['multiTimeframe.bestTimeframe', 'multiTimeframe.mostBullishTimeframe']);
    }
  }

  // ---------- MARKET_STRUCTURE ----------

  private detectMarketStructure(b: SignalBuilder): void {
    const sm = b.input.smartMoney;
    const p = b.input.prediction;
    const m = b.input.multiTimeframe;

    const trendUp = p?.trendDirection === 'up' && (p?.trendStrength === 'strong' || p?.trendStrength === 'moderate');
    const stageBreakout = m?.trendStage === 'Breakout' || m?.trendStage === 'Growing';
    if (trendUp || stageBreakout) {
      const strength = trendUp && p ? p.confidence : m?.multiTimeframeScore ?? 65;
      this.push(b, 'MARKET_STRUCTURE', 'trend_change',
        p?.trendStrength === 'strong' ? 'CONFIRMED' : 'EARLY',
        clamp0100(strength),
        'Piyasa yapısı yukarı yönlü değişti — yükselen trend.',
        ['prediction.trendDirection', 'multiTimeframe.trendStage']);
    }

    if (sm && this.hasSignal(sm, 'compression_breakout') && p?.trendDirection === 'up') {
      this.push(b, 'MARKET_STRUCTURE', 'consolidation_breakout', 'CONFIRMED', 75,
        'Konsolidasyon bölgesinden yukarı kırılım — yapısal bozulma yukarı.',
        ['smartMoney.signals', 'prediction.trendDirection']);
    }

    if (sm && this.hasSignal(sm, 'distribution') && p?.trendDirection === 'down') {
      this.push(b, 'MARKET_STRUCTURE', 'breakdown', 'CONFIRMED', sm.distributionScore,
        'Dağıtım + düşüş trendi — yapısal bozulma, destek kırılabilir.',
        ['smartMoney.signals', 'prediction.trendDirection']);
    }
  }

  // ---------- helpers ----------

  private hasSignal(sm: { signals: Array<{ type: string }> }, type: string): boolean {
    return sm.signals?.some((s) => s.type === type) ?? false;
  }

  private push(
    b: SignalBuilder,
    category: SignalCategory,
    type: string,
    phase: SignalPhase,
    strength: number,
    description: string,
    sourceFields: string[],
  ): void {
    b.signals.push({
      id: `${b.input.ticker}:${category}:${type}`,
      ticker: b.input.ticker,
      category,
      type,
      phase,
      strength: clamp0100(strength),
      strengthLabel: this.strengthLabel(clamp0100(strength)),
      priority: this.priorityFor(phase, clamp0100(strength)),
      description,
      sourceFields,
      detectedAt: new Date().toISOString(),
    });
  }

  private priorityFor(phase: SignalPhase, strength: number): SignalPriority {
    if (phase === 'CONFIRMED' && strength >= 75) return 'HIGH';
    if (phase === 'CONFIRMED' || strength >= 75) return 'MEDIUM';
    return 'LOW';
  }

  private strengthLabel(strength: number): SignalStrengthLabel {
    const labels: SignalStrengthLabel[] = ['Very Strong', 'Strong', 'Medium', 'Weak'];
    for (const label of labels) {
      if (strength >= SIGNAL_STRENGTH_META[label].min) return label;
    }
    return 'Weak';
  }

  private dataQualityFactor(status: string | null): number {
    switch (status) {
      case 'DATA_VERIFIED':
        return 1;
      case 'DATA_ACCEPTABLE':
        return 0.9;
      case 'DATA_WARNING':
        return 0.75;
      case 'DATA_INSUFFICIENT':
        return 0.5;
      default:
        return 1;
    }
  }

  private capForStatus(status: string | null): number {
    switch (status) {
      case 'DATA_VERIFIED':
        return 100;
      case 'DATA_ACCEPTABLE':
        return 90;
      case 'DATA_WARNING':
        return 75;
      case 'DATA_INSUFFICIENT':
        return 50;
      default:
        return 100;
    }
  }

  private buildConvergence(signals: EarlySignal[], status: string | null): SignalConvergenceSummary {
    const total = signals.length;
    if (total === 0) {
      return {
        convergenceScore: 0,
        totalSignals: 0,
        strongSignalCount: 0,
        earlyCount: 0,
        confirmedCount: 0,
        categoryCoverage: 0,
        avgStrength: 0,
        confirmedShare: 0,
        strongestSignals: [],
      };
    }

    const categories = new Set(signals.map((s) => s.category));
    const earlyCount = signals.filter((s) => s.phase === 'EARLY').length;
    const confirmedCount = signals.filter((s) => s.phase === 'CONFIRMED').length;
    const strongSignalCount = signals.filter((s) => s.strength >= SIGNAL_STRENGTH_META.Strong.min).length;
    const avgStrength = signals.reduce((sum, s) => sum + s.strength, 0) / total;
    const categoryCoverage = (categories.size / SIGNAL_CATEGORIES.length) * 100;
    const confirmedShare = (confirmedCount / total) * 100;

    const raw =
      categoryCoverage * 0.35 +
      avgStrength * 0.4 +
      confirmedShare * 0.25;

    let score = clamp0100(raw);
    if (status === 'DATA_INSUFFICIENT') score = Math.min(score, 40);
    else if (status === 'DATA_WARNING') score = Math.min(score, 60);
    else if (status === 'DATA_ACCEPTABLE') score = Math.min(score, 80);

    const strongest = [...signals]
      .sort((a, b) => b.strength - a.strength || a.type.localeCompare(b.type))
      .slice(0, 5);

    return {
      convergenceScore: Math.round(score),
      totalSignals: total,
      strongSignalCount,
      earlyCount,
      confirmedCount,
      categoryCoverage: categories.size,
      avgStrength: Math.round(avgStrength * 10) / 10,
      confirmedShare: Math.round(confirmedShare),
      strongestSignals: strongest,
    };
  }
}
