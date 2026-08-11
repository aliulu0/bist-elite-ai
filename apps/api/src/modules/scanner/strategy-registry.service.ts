import { Injectable, Logger } from '@nestjs/common';
import {
  EliteScannerStrategy,
  EliteScannerContext,
  StrategyEvaluation,
  StrategyInfo,
} from './elite-scanner.types';
import {
  buildTechnicalContext,
  TechnicalContext,
  pegRatio,
  evEbitda,
  relativeStrength52,
  verificationConfidence,
  catalystSignal,
} from './strategy-utils';

export interface StrategyRuleResult {
  name: string;
  passed: boolean;
  reason: string;
  signal?: string;
}

export abstract class BaseStrategyEngine implements EliteScannerStrategy {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;
  readonly enabled = true;

  protected abstract evaluateRules(context: EliteScannerContext): StrategyRuleResult[];

  evaluate(context: EliteScannerContext): StrategyEvaluation {
    const rules = this.evaluateRules(context);
    const passed = rules.filter((r) => r.passed);
    const failed = rules.filter((r) => !r.passed);

    const score = rules.length > 0 ? Math.round((passed.length / rules.length) * 100) : 0;
    const confidence = Math.round(this.computeConfidence(context) * (0.4 + 0.6 * (rules.length > 0 ? 1 : 0)));

    const signals = passed
      .filter((r) => r.signal)
      .map((r) => r.signal as string);

    const reasons = [
      ...passed.map((r) => `${r.name}: geçti`),
      ...failed.map((r) => `${r.name}: ${r.reason}`),
    ];

    return {
      score,
      passed: passed.map((r) => r.name),
      failedReasons: failed.map((r) => `${r.name}: ${r.reason}`),
      signals,
      reasons,
      confidence,
    };
  }

  private computeConfidence(context: EliteScannerContext): number {
    let score = 0;
    let count = 0;
    if (context.historicalPrices && context.historicalPrices.length > 0) {
      score += 1;
      count++;
    }
    if (context.financials) {
      score += 1;
      count++;
    }
    if (context.indicators) {
      score += 1;
      count++;
    }
    if (context.verificationData) {
      score += 1;
      count++;
    }
    if (context.catalystData) {
      score += 1;
      count++;
    }
    if (count === 0) return 0;
    return Math.round((score / count) * 100);
  }
}

export class ValueHunterStrategy extends BaseStrategyEngine {
  readonly id = 'value-hunter';
  readonly name = 'Değer Avcısı';
  readonly description =
    'Düşük değerleme çarpanları, yüksek getiri ve düşük borçluluk arayan iskonto stratejisi.';

  protected evaluateRules(context: EliteScannerContext): StrategyRuleResult[] {
    const f = context.financials;
    const rules: StrategyRuleResult[] = [];
    const marketCap = context.marketData.marketCap;

    if (!f) {
      return [{ name: 'Temel veri', passed: false, reason: 'Finansal veri mevcut değil' }];
    }

    const pe = f.peRatio;
    const peOk = pe != null && pe > 0 && pe < 15;
    rules.push({
      name: 'P/E düşük',
      passed: peOk,
      reason: pe == null ? 'P/E mevcut değil' : `P/E ${pe.toFixed(1)} (eşik < 15)`,
      signal: peOk ? `Düşük P/E: ${pe!.toFixed(1)}` : undefined,
    });

    const pb = f.pbRatio;
    const pbOk = pb != null && pb > 0 && pb < 1.5;
    rules.push({
      name: 'P/B düşük',
      passed: pbOk,
      reason: pb == null ? 'P/B mevcut değil' : `P/B ${pb.toFixed(2)} (eşik < 1.5)`,
      signal: pbOk ? `Düşük P/B: ${pb!.toFixed(2)}` : undefined,
    });

    const roe = f.roe;
    const roeOk = roe != null && roe > 0.15;
    rules.push({
      name: 'ROE yüksek',
      passed: roeOk,
      reason: roe == null ? 'ROE mevcut değil' : `ROE ${(roe * 100).toFixed(1)}% (eşik > 15%)`,
      signal: roeOk ? `Yüksek ROE: ${(roe! * 100).toFixed(1)}%` : undefined,
    });

    const debt = f.debtToEquity;
    const debtOk = debt != null && debt < 1.0;
    rules.push({
      name: 'Borç/Özkaynak düşük',
      passed: debtOk,
      reason: debt == null ? 'Borç/Özkaynak mevcut değil' : `Borç/Özkaynak ${debt.toFixed(2)} (eşik < 1.0)`,
      signal: debtOk ? `Düşük borçluluk: ${debt!.toFixed(2)}` : undefined,
    });

    const peg = pegRatio(f);
    const pegOk = peg != null && peg < 1.5;
    rules.push({
      name: 'PEG düşük',
      passed: pegOk,
      reason: peg == null ? 'PEG hesaplanamadı' : `PEG ${peg.toFixed(2)} (eşik < 1.5)`,
      signal: pegOk ? `Düşük PEG: ${peg.toFixed(2)}` : undefined,
    });

    const evebitda = evEbitda(f, marketCap);
    const evOk = evebitda != null && evebitda < 10;
    rules.push({
      name: 'EV/EBITDA düşük',
      passed: evOk,
      reason: evebitda == null ? 'EV/EBITDA hesaplanamadı' : `EV/EBITDA ${evebitda.toFixed(1)} (eşik < 10)`,
      signal: evOk ? `Düşük EV/EBITDA: ${evebitda.toFixed(1)}` : undefined,
    });

    const margin = f.netMargin;
    const marginOk = margin != null && margin > 0.05;
    rules.push({
      name: 'Net marj pozitif',
      passed: marginOk,
      reason: margin == null ? 'Net marj mevcut değil' : `Net marj ${(margin * 100).toFixed(1)}% (eşik > 5%)`,
      signal: marginOk ? `Pozitif net marj: ${(margin! * 100).toFixed(1)}%` : undefined,
    });

    const growth = f.revenueGrowth;
    const growthOk = growth != null && growth > 0.05;
    rules.push({
      name: 'Gelir büyümesi',
      passed: growthOk,
      reason: growth == null ? 'Gelir büyümesi mevcut değil' : `Gelir büyümesi ${(growth * 100).toFixed(1)}% (eşik > 5%)`,
      signal: growthOk ? `Gelir büyümesi: ${(growth! * 100).toFixed(1)}%` : undefined,
    });

    return rules;
  }
}

export class SmartMoneyStrategy extends BaseStrategyEngine {
  readonly id = 'smart-money';
  readonly name = 'Akıllı Para';
  readonly description =
    'Kurumsal akışları OBV, para akışı, CMF ve hacim artışı üzerinden tespit eden strateji.';

  protected evaluateRules(context: EliteScannerContext): StrategyRuleResult[] {
    if (!context.historicalPrices || context.historicalPrices.length < 2) {
      return [{ name: 'Fiyat verisi', passed: false, reason: 'Tarihsel fiyat verisi mevcut değil' }];
    }
    const tc = buildTechnicalContext(context.historicalPrices, context.indicators);
    const rules: StrategyRuleResult[] = [];

    const obvOk = tc.obv != null && tc.obv > 0;
    rules.push({
      name: 'OBV pozitif',
      passed: obvOk,
      reason: tc.obv == null ? 'OBV hesaplanamadı' : `OBV ${Math.round(tc.obv)} (pozitif gerekli)`,
      signal: obvOk ? `Pozitif OBV: ${Math.round(tc.obv!)}` : undefined,
    });

    const mfiOk = tc.mfi != null && tc.mfi > 55;
    rules.push({
      name: 'Para akışı (MFI)',
      passed: mfiOk,
      reason: tc.mfi == null ? 'MFI hesaplanamadı' : `MFI ${tc.mfi.toFixed(1)} (eşik > 55)`,
      signal: mfiOk ? `Güçlü para akışı: MFI ${tc.mfi!.toFixed(1)}` : undefined,
    });

    const cmfOk = tc.cmf != null && tc.cmf > 0.05;
    rules.push({
      name: 'CMF pozitif',
      passed: cmfOk,
      reason: tc.cmf == null ? 'CMF hesaplanamadı' : `CMF ${tc.cmf.toFixed(3)} (eşik > 0.05)`,
      signal: cmfOk ? `Pozitif CMF: ${tc.cmf!.toFixed(3)}` : undefined,
    });

    const currentVol = tc.bars.volumes[tc.bars.volumes.length - 1];
    const volSpikeOk = tc.avgVolume != null && currentVol > tc.avgVolume * 1.5;
    rules.push({
      name: 'Hacim artışı',
      passed: volSpikeOk,
      reason:
        tc.avgVolume == null
          ? 'Ortalama hacim hesaplanamadı'
          : `Hacim ${Math.round(currentVol)} vs ort ${Math.round(tc.avgVolume)} (x1.5 eşiği)`,
      signal: volSpikeOk ? `Hacim artışı: ortalamanın ${(currentVol / tc.avgVolume!).toFixed(1)} katı` : undefined,
    });

    const accumulationOk = tc.obv != null && tc.roc != null && tc.obv > 0 && tc.roc > 0;
    rules.push({
      name: 'Birikim',
      passed: accumulationOk,
      reason:
        tc.obv == null || tc.roc == null
          ? 'Birikim verisi hesaplanamadı'
          : `OBV ${Math.round(tc.obv)} ve ROC ${tc.roc.toFixed(1)} pozitif olmalı`,
      signal: accumulationOk ? 'Birikim sinyali (OBV + ROC pozitif)' : undefined,
    });

    return rules;
  }
}

export class MomentumStrategy extends BaseStrategyEngine {
  readonly id = 'momentum';
  readonly name = 'Momentum';
  readonly description =
    'MACD, RSI, ROC, ADX ve EMA üzerinden güçlü fiyat hareketini yakalayan strateji.';

  protected evaluateRules(context: EliteScannerContext): StrategyRuleResult[] {
    if (!context.historicalPrices || context.historicalPrices.length < 2) {
      return [{ name: 'Fiyat verisi', passed: false, reason: 'Tarihsel fiyat verisi mevcut değil' }];
    }
    const tc = buildTechnicalContext(context.historicalPrices, context.indicators);
    const rules: StrategyRuleResult[] = [];

    const macdOk = tc.macd != null && tc.macdSignal != null && tc.macd > tc.macdSignal;
    rules.push({
      name: 'MACD pozitif',
      passed: macdOk,
      reason:
        tc.macd == null || tc.macdSignal == null
          ? 'MACD hesaplanamadı'
          : `MACD ${tc.macd.toFixed(2)} vs sinyal ${tc.macdSignal.toFixed(2)}`,
      signal: macdOk ? `MACD pozitif: ${(tc.macd! - tc.macdSignal!).toFixed(2)} histogram` : undefined,
    });

    const rsiOk = tc.rsi != null && tc.rsi > 50 && tc.rsi < 75;
    rules.push({
      name: 'RSI momentum bölgesi',
      passed: rsiOk,
      reason:
        tc.rsi == null
          ? 'RSI hesaplanamadı'
          : `RSI ${tc.rsi.toFixed(1)} (50-75 aralığı gerekli)`,
      signal: rsiOk ? `RSI ${tc.rsi!.toFixed(1)} momentum bölgesinde` : undefined,
    });

    const rocOk = tc.roc != null && tc.roc > 0;
    rules.push({
      name: 'ROC pozitif',
      passed: rocOk,
      reason: tc.roc == null ? 'ROC hesaplanamadı' : `ROC ${tc.roc.toFixed(1)}% (pozitif gerekli)`,
      signal: rocOk ? `Pozitif ROC: ${tc.roc!.toFixed(1)}%` : undefined,
    });

    const adxOk = tc.adx != null && tc.adx > 20;
    rules.push({
      name: 'ADX güçlü trend',
      passed: adxOk,
      reason: tc.adx == null ? 'ADX hesaplanamadı' : `ADX ${tc.adx.toFixed(1)} (eşik > 20)`,
      signal: adxOk ? `Güçlü trend: ADX ${tc.adx!.toFixed(1)}` : undefined,
    });

    const emaOk = tc.ema12 != null && tc.ema26 != null && tc.ema12 > tc.ema26;
    rules.push({
      name: 'EMA12 > EMA26',
      passed: emaOk,
      reason:
        tc.ema12 == null || tc.ema26 == null
          ? 'EMA hesaplanamadı'
          : `EMA12 ${tc.ema12.toFixed(2)} vs EMA26 ${tc.ema26.toFixed(2)}`,
      signal: emaOk ? 'Kısa EMA uzun EMA üzerinde' : undefined,
    });

    const priceAboveSma50 = tc.sma50 != null && tc.bars.closes[tc.bars.closes.length - 1] > tc.sma50;
    rules.push({
      name: 'Fiyat > SMA50',
      passed: priceAboveSma50,
      reason:
        tc.sma50 == null
          ? 'SMA50 hesaplanamadı'
          : `Fiyat ${tc.bars.closes[tc.bars.closes.length - 1].toFixed(2)} vs SMA50 ${tc.sma50.toFixed(2)}`,
      signal: priceAboveSma50 ? 'Fiyat 50 günlük ortalamanın üzerinde' : undefined,
    });

    return rules;
  }
}

export class SwingStrategy extends BaseStrategyEngine {
  readonly id = 'swing';
  readonly name = 'Swing';
  readonly description =
    'Kısa-orta vadeli fiyat salınımlarını EMA kesişimi, ATR ve trend yönüyle yakalar.';

  protected evaluateRules(context: EliteScannerContext): StrategyRuleResult[] {
    if (!context.historicalPrices || context.historicalPrices.length < 2) {
      return [{ name: 'Fiyat verisi', passed: false, reason: 'Tarihsel fiyat verisi mevcut değil' }];
    }
    const tc = buildTechnicalContext(context.historicalPrices, context.indicators);
    const rules: StrategyRuleResult[] = [];

    const emaCrossOk = tc.ema12 != null && tc.ema26 != null && tc.ema12 > tc.ema26;
    rules.push({
      name: 'EMA altın kesişim',
      passed: emaCrossOk,
      reason:
        tc.ema12 == null || tc.ema26 == null
          ? 'EMA hesaplanamadı'
          : `EMA12 ${tc.ema12.toFixed(2)} vs EMA26 ${tc.ema26.toFixed(2)}`,
      signal: emaCrossOk ? 'EMA12 EMA26 üzerinde (altın kesişim)' : undefined,
    });

    const price = tc.bars.closes[tc.bars.closes.length - 1];
    const atrRatio = tc.atr != null && price > 0 ? tc.atr / price : null;
    const atrOk = atrRatio != null && atrRatio >= 0.01 && atrRatio <= 0.06;
    rules.push({
      name: 'ATR uygun dalgalanma',
      passed: atrOk,
      reason:
        atrRatio == null
          ? 'ATR hesaplanamadı'
          : `ATR oranı ${(atrRatio * 100).toFixed(2)}% (1-6% aralığı)`,
      signal: atrOk ? `Uygun dalgalanma: ATR/fiyat ${(atrRatio! * 100).toFixed(2)}%` : undefined,
    });

    const rsiOk = tc.rsi != null && tc.rsi > 45 && tc.rsi < 65;
    rules.push({
      name: 'RSI nötr bölge',
      passed: rsiOk,
      reason: tc.rsi == null ? 'RSI hesaplanamadı' : `RSI ${tc.rsi.toFixed(1)} (45-65 aralığı)`,
      signal: rsiOk ? `RSI ${tc.rsi!.toFixed(1)} swing için uygun` : undefined,
    });

    const macdOk = tc.macdHistogram != null && tc.macdHistogram > 0;
    rules.push({
      name: 'MACD histogram pozitif',
      passed: macdOk,
      reason:
        tc.macdHistogram == null
          ? 'MACD histogram hesaplanamadı'
          : `Histogram ${tc.macdHistogram.toFixed(3)} (pozitif gerekli)`,
      signal: macdOk ? `Pozitif MACD histogram: ${tc.macdHistogram!.toFixed(3)}` : undefined,
    });

    const trendOk = tc.sma50 != null && price > tc.sma50 && tc.sma20 != null && price > tc.sma20;
    rules.push({
      name: 'Yukarı trend',
      passed: trendOk,
      reason:
        tc.sma20 == null || tc.sma50 == null
          ? 'SMA hesaplanamadı'
          : `Fiyat ${price.toFixed(2)} SMA20 ${tc.sma20?.toFixed(2)} ve SMA50 ${tc.sma50?.toFixed(2)} üzerinde`,
      signal: trendOk ? 'Fiyat SMA20 ve SMA50 üzerinde (yukarı trend)' : undefined,
    });

    return rules;
  }
}

export class DipCollectorStrategy extends BaseStrategyEngine {
  readonly id = 'dip-collector';
  readonly name = 'Dip Toplayıcı';
  readonly description =
    'Aşırı satım bölgelerini RSI, Williams %R, Bollinger alt bandı ve destek seviyesiyle bulur.';

  protected evaluateRules(context: EliteScannerContext): StrategyRuleResult[] {
    if (!context.historicalPrices || context.historicalPrices.length < 2) {
      return [{ name: 'Fiyat verisi', passed: false, reason: 'Tarihsel fiyat verisi mevcut değil' }];
    }
    const tc = buildTechnicalContext(context.historicalPrices, context.indicators);
    const rules: StrategyRuleResult[] = [];
    const price = tc.bars.closes[tc.bars.closes.length - 1];

    const rsiOversoldOk = tc.rsi != null && tc.rsi < 35;
    rules.push({
      name: 'RSI aşırı satım',
      passed: rsiOversoldOk,
      reason: tc.rsi == null ? 'RSI hesaplanamadı' : `RSI ${tc.rsi.toFixed(1)} (< 35 aşırı satım)`,
      signal: rsiOversoldOk ? `RSI ${tc.rsi!.toFixed(1)} aşırı satım bölgesinde` : undefined,
    });

    const wrOk = tc.williamsR != null && tc.williamsR < -70;
    rules.push({
      name: "Williams %R aşırı satım",
      passed: wrOk,
      reason: tc.williamsR == null ? "Williams %R hesaplanamadı" : `Williams %R ${tc.williamsR.toFixed(1)} (< -70)`,
      signal: wrOk ? `Williams %R ${tc.williamsR!.toFixed(1)} aşırı satım` : undefined,
    });

    const bbOk =
      tc.bollingerLower != null && tc.bollingerMiddle != null && price <= tc.bollingerLower * 1.03;
    rules.push({
      name: 'Bollinger alt banda yakın',
      passed: bbOk,
      reason:
        tc.bollingerLower == null
          ? 'Bollinger bant hesaplanamadı'
          : `Fiyat ${price.toFixed(2)} vs alt bant ${tc.bollingerLower.toFixed(2)}`,
      signal: bbOk ? 'Fiyat Bollinger alt bandına yakın (destek bölgesi)' : undefined,
    });

    const low20 = Math.min(...tc.bars.lows.slice(-20));
    const supportOk = low20 > 0 && price <= low20 * 1.05;
    rules.push({
      name: '20 günlük destek bölgesi',
      passed: supportOk,
      reason: `Fiyat ${price.toFixed(2)} vs 20g dip ${low20.toFixed(2)}`,
      signal: supportOk ? `Fiyat 20 günlük destek bölgesinde (${low20.toFixed(2)})` : undefined,
    });

    const notInFreeFallOk = tc.roc != null && tc.roc > -15;
    rules.push({
      name: 'Kontrollü düşüş',
      passed: notInFreeFallOk,
      reason: tc.roc == null ? 'ROC hesaplanamadı' : `ROC ${tc.roc.toFixed(1)}% (> -15 gerekli)`,
      signal: notInFreeFallOk ? `Kontrollü düşüş: ROC ${tc.roc!.toFixed(1)}%` : undefined,
    });

    return rules;
  }
}

export class MinerviniStrategy extends BaseStrategyEngine {
  readonly id = 'minervini';
  readonly name = 'Minervini';
  readonly description =
    'Aşama analizi: 150/200 SMA düzenlenmesi, 52 haftalık zirveye yakınlık ve göreli güç.';

  protected evaluateRules(context: EliteScannerContext): StrategyRuleResult[] {
    if (!context.historicalPrices || context.historicalPrices.length < 2) {
      return [{ name: 'Fiyat verisi', passed: false, reason: 'Tarihsel fiyat verisi mevcut değil' }];
    }
    const tc = buildTechnicalContext(context.historicalPrices, context.indicators);
    const rules: StrategyRuleResult[] = [];
    const price = tc.bars.closes[tc.bars.closes.length - 1];

    const above150Ok = tc.sma150 != null && price > tc.sma150;
    rules.push({
      name: 'Fiyat > 150 SMA',
      passed: above150Ok,
      reason:
        tc.sma150 == null
          ? '150 SMA hesaplanamadı'
          : `Fiyat ${price.toFixed(2)} vs 150 SMA ${tc.sma150.toFixed(2)}`,
      signal: above150Ok ? 'Fiyat 150 günlük ortalamanın üzerinde' : undefined,
    });

    const smaOrderOk = tc.sma150 != null && tc.sma200 != null && tc.sma150 > tc.sma200;
    rules.push({
      name: '150 SMA > 200 SMA',
      passed: smaOrderOk,
      reason:
        tc.sma150 == null || tc.sma200 == null
          ? 'SMA hesaplanamadı'
          : `150 SMA ${tc.sma150.toFixed(2)} vs 200 SMA ${tc.sma200.toFixed(2)}`,
      signal: smaOrderOk ? '150 SMA 200 SMA üzerinde (düzenli trend)' : undefined,
    });

    const above200Ok = tc.sma200 != null && price > tc.sma200;
    rules.push({
      name: 'Fiyat > 200 SMA',
      passed: above200Ok,
      reason:
        tc.sma200 == null
          ? '200 SMA hesaplanamadı'
          : `Fiyat ${price.toFixed(2)} vs 200 SMA ${tc.sma200.toFixed(2)}`,
      signal: above200Ok ? 'Fiyat 200 günlük ortalamanın üzerinde' : undefined,
    });

    const rs52 = relativeStrength52(tc);
    const proximityOk = rs52 != null && rs52 > 75;
    rules.push({
      name: '52 haftalık zirveye yakınlık',
      passed: proximityOk,
      reason:
        rs52 == null
          ? '52 haftalık zirve hesaplanamadı'
          : `Zirveye uzaklık %${(100 - rs52).toFixed(1)} (maks %25)`,
      signal: proximityOk ? `Zirveye uzaklık sadece %${(100 - rs52!).toFixed(1)}` : undefined,
    });

    const rs20 = tc.roc != null && tc.roc > 0;
    rules.push({
      name: 'Göreli güç (ROC)',
      passed: rs20,
      reason: tc.roc == null ? 'ROC hesaplanamadı' : `ROC ${tc.roc.toFixed(1)}% (pozitif gerekli)`,
      signal: rs20 ? `Pozitif göreli güç: ROC ${tc.roc!.toFixed(1)}%` : undefined,
    });

    const trendOk = tc.sma20 != null && price > tc.sma20;
    rules.push({
      name: 'Kısa vadeli trend',
      passed: trendOk,
      reason: tc.sma20 == null ? 'SMA20 hesaplanamadı' : `Fiyat ${price.toFixed(2)} vs SMA20 ${tc.sma20.toFixed(2)}`,
      signal: trendOk ? 'Fiyat SMA20 üzerinde (kısa vadeli trend)' : undefined,
    });

    return rules;
  }
}

export class CanslimStrategy extends BaseStrategyEngine {
  readonly id = 'canslim';
  readonly name = 'CANSLIM';
  readonly description =
    'CANSLIM kriterleri: kazanç büyümesi, göreli güç, arz-talep, liderlik ve kurumsal ilgi.';

  protected evaluateRules(context: EliteScannerContext): StrategyRuleResult[] {
    const f = context.financials;
    const tc =
      context.historicalPrices && context.historicalPrices.length >= 2
        ? buildTechnicalContext(context.historicalPrices, context.indicators)
        : null;
    const rules: StrategyRuleResult[] = [];

    const currentEarningsOk = f != null && f.netIncome != null && f.netIncome > 0;
    rules.push({
      name: 'Cari kazanç pozitif',
      passed: currentEarningsOk,
      reason: f == null || f.netIncome == null ? 'Cari kazanç verisi mevcut değil' : 'Net kazanç pozitif',
      signal: currentEarningsOk ? 'Cari kazanç pozitif' : undefined,
    });

    const annualEarningsOk = f != null && f.roe != null && f.roe > 0.1;
    rules.push({
      name: 'Yıllık kazanç büyümesi',
      passed: annualEarningsOk,
      reason:
        f == null || f.roe == null
          ? 'ROE mevcut değil'
          : `ROE ${(f.roe * 100).toFixed(1)}% (eşik > 10%)`,
      signal: annualEarningsOk ? `Güçlü ROE: ${(f.roe! * 100).toFixed(1)}%` : undefined,
    });

    const rs52 = tc ? relativeStrength52(tc) : null;
    const rsOk = rs52 != null && rs52 > 70;
    rules.push({
      name: 'Göreli güç',
      passed: rsOk,
      reason:
        rs52 == null
          ? 'Göreli güç hesaplanamadı'
          : `Zirveye uzaklık %${(100 - rs52).toFixed(1)} (maks %30)`,
      signal: rsOk ? `Güçlü göreli güç: zirve %${(100 - rs52!).toFixed(1)} uzakta` : undefined,
    });

    const supplyOk = f != null && f.totalDebt != null && f.totalDebt >= 0 && f.debtToEquity != null && f.debtToEquity < 1.5;
    rules.push({
      name: 'Kontrollü arz/borçluluk',
      passed: supplyOk,
      reason:
        f == null || f.debtToEquity == null
          ? 'Borçluluk verisi mevcut değil'
          : `Borç/Özkaynak ${f.debtToEquity.toFixed(2)} (eşik < 1.5)`,
      signal: supplyOk ? `Kontrollü borçluluk: ${f!.debtToEquity!.toFixed(2)}` : undefined,
    });

    const leaderOk = f != null && f.revenueGrowth != null && f.revenueGrowth > 0.1;
    rules.push({
      name: 'Liderlik (gelir büyümesi)',
      passed: leaderOk,
      reason:
        f == null || f.revenueGrowth == null
          ? 'Gelir büyümesi mevcut değil'
          : `Gelir büyümesi ${(f.revenueGrowth * 100).toFixed(1)}% (eşik > 10%)`,
      signal: leaderOk ? `Lider gelir büyümesi: ${(f.revenueGrowth! * 100).toFixed(1)}%` : undefined,
    });

    const instOk = tc != null && tc.obv != null && tc.obv > 0;
    rules.push({
      name: 'Kurumsal ilgi (OBV)',
      passed: instOk,
      reason: tc == null || tc.obv == null ? 'OBV hesaplanamadı' : `OBV ${Math.round(tc.obv)} (pozitif gerekli)`,
      signal: instOk ? `Kurumsal birikim: OBV ${Math.round(tc!.obv!)}` : undefined,
    });

    const price = tc ? tc.bars.closes[tc.bars.closes.length - 1] : null;
    const marketDirOk = tc != null && tc.sma50 != null && price != null && price > tc.sma50;
    rules.push({
      name: 'Piyasa yönü (SMA50)',
      passed: marketDirOk,
      reason:
        tc == null || tc.sma50 == null || price == null
          ? 'SMA50 hesaplanamadı'
          : `Fiyat ${price.toFixed(2)} vs SMA50 ${tc.sma50.toFixed(2)}`,
      signal: marketDirOk ? 'Fiyat SMA50 üzerinde (piyasa yönü yukarı)' : undefined,
    });

    return rules;
  }
}

export class WilliamOneilStrategy extends BaseStrategyEngine {
  readonly id = 'william-oneil';
  readonly name = "William O'Neil";
  readonly description =
    "EPS/satış büyümesi, göreli güç, breakout ve hacim doğrulaması ile CANSLIM kökenli lider seçimi.";

  protected evaluateRules(context: EliteScannerContext): StrategyRuleResult[] {
    const f = context.financials;
    const tc =
      context.historicalPrices && context.historicalPrices.length >= 2
        ? buildTechnicalContext(context.historicalPrices, context.indicators)
        : null;
    const rules: StrategyRuleResult[] = [];

    const epsOk = f != null && f.netMargin != null && f.netMargin > 0.1 && f.netIncome != null && f.netIncome > 0;
    rules.push({
      name: 'EPS güçlü',
      passed: epsOk,
      reason:
        f == null || f.netMargin == null
          ? 'EPS verisi mevcut değil'
          : `Net marj ${(f.netMargin * 100).toFixed(1)}% (eşik > 10%)`,
      signal: epsOk ? `Güçlü EPS: net marj ${(f!.netMargin! * 100).toFixed(1)}%` : undefined,
    });

    const salesOk = f != null && f.revenueGrowth != null && f.revenueGrowth > 0.1;
    rules.push({
      name: 'Satış büyümesi',
      passed: salesOk,
      reason:
        f == null || f.revenueGrowth == null
          ? 'Satış büyümesi mevcut değil'
          : `Gelir büyümesi ${(f.revenueGrowth * 100).toFixed(1)}% (eşik > 10%)`,
      signal: salesOk ? `Güçlü satış büyümesi: ${(f!.revenueGrowth! * 100).toFixed(1)}%` : undefined,
    });

    const rs52 = tc ? relativeStrength52(tc) : null;
    const rsOk = rs52 != null && rs52 > 80;
    rules.push({
      name: 'Göreli güç yüksek',
      passed: rsOk,
      reason:
        rs52 == null
          ? 'Göreli güç hesaplanamadı'
          : `Zirveye uzaklık %${(100 - rs52).toFixed(1)} (maks %20)`,
      signal: rsOk ? `Zirveye uzaklık sadece %${(100 - rs52!).toFixed(1)}` : undefined,
    });

    const price = tc ? tc.bars.closes[tc.bars.closes.length - 1] : null;
    const breakoutOk = tc != null && tc.sma50 != null && price != null && price > tc.sma50 * 1.05;
    rules.push({
      name: 'Breakout (SMA50 +%5)',
      passed: breakoutOk,
      reason:
        tc == null || tc.sma50 == null || price == null
          ? 'Breakout hesaplanamadı'
          : `Fiyat ${price.toFixed(2)} vs SMA50 x1.05 ${(tc.sma50 * 1.05).toFixed(2)}`,
      signal: breakoutOk ? 'Fiyat SMA50nin %5 uzerinde (breakout)' : undefined,
    });

    const currentVol = tc ? tc.bars.volumes[tc.bars.volumes.length - 1] : null;
    const volOk = tc != null && tc.avgVolume != null && currentVol != null && currentVol > tc.avgVolume * 1.4;
    rules.push({
      name: 'Hacim doğrulaması',
      passed: volOk,
      reason:
        tc == null || tc.avgVolume == null
          ? 'Hacim verisi hesaplanamadı'
          : `Hacim ortalamanın ${(currentVol! / tc.avgVolume).toFixed(1)} katı (x1.4 eşiği)`,
      signal: volOk ? `Hacim doğrulaması: ortalamanın ${(currentVol! / tc!.avgVolume!).toFixed(1)} katı` : undefined,
    });

    return rules;
  }
}

export class QullamaggieStrategy extends BaseStrategyEngine {
  readonly id = 'qullamaggie';
  readonly name = 'Qullamaggie';
  readonly description =
    'Volatilite daralması, sıkışık aralık, düşük hacim ve ardından gelen hacimli breakout.';

  protected evaluateRules(context: EliteScannerContext): StrategyRuleResult[] {
    if (!context.historicalPrices || context.historicalPrices.length < 2) {
      return [{ name: 'Fiyat verisi', passed: false, reason: 'Tarihsel fiyat verisi mevcut değil' }];
    }
    const tc = buildTechnicalContext(context.historicalPrices, context.indicators);
    const rules: StrategyRuleResult[] = [];
    const closes = tc.bars.closes;
    const price = closes[closes.length - 1];

    const bbWidth =
      tc.bollingerUpper != null && tc.bollingerLower != null && tc.bollingerMiddle != null && tc.bollingerMiddle > 0
        ? (tc.bollingerUpper - tc.bollingerLower) / tc.bollingerMiddle
        : null;
    const contractionOk = bbWidth != null && bbWidth < 0.08;
    rules.push({
      name: 'Volatilite daralması',
      passed: contractionOk,
      reason:
        bbWidth == null
          ? 'Bollinger genişliği hesaplanamadı'
          : `Bollinger genişliği ${(bbWidth * 100).toFixed(2)}% (eşik < 8%)`,
      signal: contractionOk ? `Volatilite daraldı: genişlik %${(bbWidth! * 100).toFixed(2)}` : undefined,
    });

    const last20 = closes.slice(-20);
    const range20 = last20.length > 0 ? (Math.max(...last20) - Math.min(...last20)) / price : null;
    const tightOk = range20 != null && range20 < 0.15;
    rules.push({
      name: 'Sıkışık aralık',
      passed: tightOk,
      reason:
        range20 == null
          ? 'Aralık hesaplanamadı'
          : `20g aralık %${(range20 * 100).toFixed(1)} (eşik < 15%)`,
      signal: tightOk ? `Sıkışık aralık: %${(range20! * 100).toFixed(1)}` : undefined,
    });

    const dryOk = tc.avgVolume != null && tc.bars.volumes[tc.bars.volumes.length - 1] < tc.avgVolume;
    rules.push({
      name: 'Düşük hacim (kuru dönem)',
      passed: dryOk,
      reason:
        tc.avgVolume == null
          ? 'Ortalama hacim hesaplanamadı'
          : `Hacim ${Math.round(tc.bars.volumes[tc.bars.volumes.length - 1])} vs ort ${Math.round(tc.avgVolume)}`,
      signal: dryOk ? 'Kuru dönem: hacim ortalamanın altında' : undefined,
    });

    const high20 = Math.max(...closes.slice(-20));
    const breakoutOk = price > high20 * 1.0;
    rules.push({
      name: 'Breakout (20g zirve)',
      passed: breakoutOk,
      reason: `Fiyat ${price.toFixed(2)} vs 20g zirve ${high20.toFixed(2)}`,
      signal: breakoutOk ? 'Fiyat 20 günlük zirvenin üzerinde (breakout)' : undefined,
    });

    const currentVol = tc.bars.volumes[tc.bars.volumes.length - 1];
    const expansionOk = tc.avgVolume != null && currentVol > tc.avgVolume * 1.3;
    rules.push({
      name: 'Hacim genişlemesi',
      passed: expansionOk,
      reason:
        tc.avgVolume == null
          ? 'Ortalama hacim hesaplanamadı'
          : `Hacim ortalamanın ${(currentVol / tc.avgVolume).toFixed(1)} katı (x1.3 eşiği)`,
      signal: expansionOk ? `Hacim genişlemesi: ortalamanın ${(currentVol / tc.avgVolume!).toFixed(1)} katı` : undefined,
    });

    return rules;
  }
}

@Injectable()
export class StrategyRegistry {
  private readonly logger = new Logger(StrategyRegistry.name);
  private readonly strategies = new Map<string, EliteScannerStrategy>();

  constructor() {
    this.register(new ValueHunterStrategy());
    this.register(new SmartMoneyStrategy());
    this.register(new MomentumStrategy());
    this.register(new SwingStrategy());
    this.register(new DipCollectorStrategy());
    this.register(new MinerviniStrategy());
    this.register(new CanslimStrategy());
    this.register(new WilliamOneilStrategy());
    this.register(new QullamaggieStrategy());
  }

  register(strategy: EliteScannerStrategy): void {
    this.strategies.set(strategy.id, strategy);
    this.logger.log(`Strateji kaydedildi: "${strategy.name}" (${strategy.id})`);
  }

  unregister(id: string): boolean {
    return this.strategies.delete(id);
  }

  get(id: string): EliteScannerStrategy | undefined {
    return this.strategies.get(id);
  }

  list(): EliteScannerStrategy[] {
    return [...this.strategies.values()];
  }

  listInfo(): StrategyInfo[] {
    return this.list().map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      enabled: s.enabled,
    }));
  }

  has(id: string): boolean {
    return this.strategies.has(id);
  }
}
