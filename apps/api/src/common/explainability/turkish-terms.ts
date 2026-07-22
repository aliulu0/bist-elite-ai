import {
  TrendDirection,
  MomentumState,
  VolumeState,
  RiskType,
  RiskSeverity,
  SignalAction,
  SignalStrength,
  Timeframe,
} from './types';

export const TREND_TRANSLATIONS: Record<TrendDirection, string> = {
  [TrendDirection.STRONG_UPTREND]: 'Güçlü yükseliş trendi',
  [TrendDirection.UPTREND]: 'Yükseliş trendi',
  [TrendDirection.WEAK_UPTREND]: 'Zayıf yükseliş eğilimi',
  [TrendDirection.SIDEWAYS]: 'Yatay hareket',
  [TrendDirection.WEAK_DOWNTREND]: 'Zayıf düşüş eğilimi',
  [TrendDirection.DOWNTREND]: 'Düşüş trendi',
  [TrendDirection.STRONG_DOWNTREND]: 'Güçlü düşüş trendi',
};

export const MOMENTUM_TRANSLATIONS: Record<MomentumState, string> = {
  [MomentumState.OVERBOUGHT]: 'Aşırı alım bölgesi',
  [MomentumState.BULLISH_MOMENTUM]: 'Yükseliş momentumu',
  [MomentumState.NEUTRAL]: 'Nötr bölge',
  [MomentumState.BEARISH_MOMENTUM]: 'Düşüş momentumu',
  [MomentumState.OVERSOLD]: 'Aşırı satım bölgesi',
};

export const VOLUME_TRANSLATIONS: Record<VolumeState, string> = {
  [VolumeState.HIGH_VOLUME]: 'Yüksek işlem hacmi',
  [VolumeState.NORMAL_VOLUME]: 'Normal işlem hacmi',
  [VolumeState.LOW_VOLUME]: 'Düşük işlem hacmi',
  [VolumeState.DECLINING]: 'Azalan işlem hacmi',
  [VolumeState.INCREASING]: 'Artan işlem hacmi',
};

export const RISK_TRANSLATIONS: Record<RiskType, string> = {
  [RiskType.TREND_RISK]: 'Trend Riski',
  [RiskType.VOLATILITY_RISK]: 'Volatilite Riski',
  [RiskType.LIQUIDITY_RISK]: 'Likidite Riski',
  [RiskType.FALSE_BREAKOUT_RISK]: 'Yanlış Kırılma Riski',
  [RiskType.FALSE_SIGNAL_RISK]: 'Yanlış Sinyal Riski',
  [RiskType.TIMEFRAME_CONFLICT]: 'Zaman Uyumsuzluğu',
  [RiskType.MARKET_UNCERTAINTY]: 'Piyasa Belirsizliği',
};

export const RISK_SEVERITY_TRANSLATIONS: Record<RiskSeverity, string> = {
  [RiskSeverity.LOW]: 'Düşük',
  [RiskSeverity.MEDIUM]: 'Orta',
  [RiskSeverity.HIGH]: 'Yüksek',
  [RiskSeverity.CRITICAL]: 'Kritik',
};

export const SIGNAL_TRANSLATIONS: Record<SignalAction, string> = {
  [SignalAction.BUY]: 'Alım',
  [SignalAction.SELL]: 'Satım',
  [SignalAction.HOLD]: 'Bekleme',
  [SignalAction.WATCH]: 'İzleme',
};

export const STRENGTH_TRANSLATIONS: Record<SignalStrength, string> = {
  [SignalStrength.WEAK]: 'Zayıf',
  [SignalStrength.MODERATE]: 'Orta',
  [SignalStrength.STRONG]: 'Güçlü',
  [SignalStrength.VERY_STRONG]: 'Çok Güçlü',
};

export const TIMEFRAME_VIEW_LABELS: Record<Timeframe, { short: string; medium: string; long: string }> = {
  [Timeframe.M4]: { short: 'Kısa vadeli', medium: 'Kısa-orta vade', long: 'Kısa vadeli görünüm' },
  [Timeframe.D1]: { short: 'Günlük', medium: 'Orta vade', long: 'Günlük görünüm' },
  [Timeframe.W1]: { short: 'Haftalık', medium: 'Orta-uzun vade', long: 'Haftalık görünüm' },
  [Timeframe.M1]: { short: 'Aylık', medium: 'Uzun vade', long: 'Uzun vadeli görünüm' },
};

export const INDICATOR_NAMES: Record<string, string> = {
  RSI: 'RSI (Göreceli Güç Endeksi)',
  MACD: 'MACD (Hareketli Ortalama Yakınsaklık Farkı)',
  EMA: 'EMA (Üstel Hareketli Ortalama)',
  SMA: 'SMA (Basit Hareketli Ortalama)',
  BollingerBands: 'Bollinger Bantları',
  ATR: 'ATR (Ortalama Gerçek Aralık)',
  ADX: 'ADX (Ortalama Yönsel Endeks)',
  VWAP: 'VWAP (Ağırlıklı Ortalama Fiyat)',
  Stochastic: 'Stochastic Osilatör',
  Ichimoku: 'Ichimoku Bulutu',
};

export function getTrendDescription(direction: TrendDirection, strength: number): string {
  const trend = TREND_TRANSLATIONS[direction];
  const strengthText = formatStrength(strength);

  switch (direction) {
    case TrendDirection.STRONG_UPTREND:
      return `${trend} devam ediyor. Güç endeksi ${strengthText} seviyesinde. Teknik göstergelerin çoğunluğu yükseliş yönünde sinyal üretiyor.`;
    case TrendDirection.UPTREND:
      return `${trend} gözlemleniyor. Göstergeler genel olarak pozitif bir yapı sergiliyor ancak momentumun güçlendiği doğrulanmalı.`;
    case TrendDirection.WEAK_UPTREND:
      return `${trend} mevcut ancak momentum henüz güçlü değil. Göstergeler karışık sinyaller verebilir, dikkatli hareket edilmeli.`;
    case TrendDirection.SIDEWAYS:
      return `${trend} hakim. Belirgin bir yön yok, fiyat dar bir aralıkta hareket ediyor. Kırılma sinyalleri takip edilmeli.`;
    case TrendDirection.WEAK_DOWNTREND:
      return `${trend} gözlemleniyor. Düşüş baskısı var ancak henüz güçlü bir satış baskısı oluşmamış.`;
    case TrendDirection.DOWNTREND:
      return `${trend} devam ediyor. Teknik göstergelerin çoğunluğu düşüş yönünde sinyal üretiyor.`;
    case TrendDirection.STRONG_DOWNTREND:
      return `${trend} hakim. Güçlü satış baskısı altında. Dikkatli hareket edilmeli, dip arayışı erken olabilir.`;
  }
}

export function getMomentumDescription(state: MomentumState, rsiValue?: number, macdValue?: number): string {
  const momentum = MOMENTUM_TRANSLATIONS[state];
  const rsiText = rsiValue !== undefined ? `RSI ${formatNumber(rsiValue)} seviyesinde` : '';
  const macdText = macdValue !== undefined ? `MACD ${formatNumber(macdValue)} değerinde` : '';

  const details = [rsiText, macdText].filter(Boolean).join(', ');

  switch (state) {
    case MomentumState.OVERBOUGHT:
      return `${momentum} (${details || 'RSI 70 üzeri'}). Kar satışları gelebilir, kâr realizasyonu için fırsat bulunabilir ancak yukarı yönlü devam riski de mevcut.`;
    case MomentumState.BULLISH_MOMENTUM:
      return `${momentum} (${details || 'RSI 50-70 arası'}). Alıcılar piyasada baskın konumda. Yükseliş hareketi güçleniyor.`;
    case MomentumState.NEUTRAL:
      return `${momentum} bölgesinde (${details || 'RSI 40-60 arası'}). Net bir yön belirlenmemiş, kırılma bekleniyor.`;
    case MomentumState.BEARISH_MOMENTUM:
      return `${momentum} (${details || 'RSI 30-50 arası'}). Satıcılar piyasada baskın konumda. Düşüş hareketi devam ediyor.`;
    case MomentumState.OVERSOLD:
      return `${momentum} (${details || 'RSI 30 altı'}). Satış baskısı aşırı seviyede. Ters yönlü hareket potansiyeli artıyor.`;
  }
}

export function getVolumeDescription(state: VolumeState): string {
  return VOLUME_TRANSLATIONS[state];
}

export function getRiskDescription(type: RiskType, severity: RiskSeverity): string {
  const risk = RISK_TRANSLATIONS[type];
  const level = RISK_SEVERITY_TRANSLATIONS[severity];

  switch (type) {
    case RiskType.TREND_RISK:
      return `${risk} (${level}): Fiyatın trend yönünde ters hareket yapma riski. Trend çizgileri ve destek/direnç seviyeleri yakından takip edilmeli.`;
    case RiskType.VOLATILITY_RISK:
      return `${risk} (${level}): Fiyat dalgalanması yüksek seviyede. Ani fiyat hareketleri beklenebilir, pozisyon boyutu buna göre ayarlanmalı.`;
    case RiskType.LIQUIDITY_RISK:
      return `${risk} (${level}): İşlem hacmi düşük, büyük siparişlerde fiyat kayması yaşanabilir. Piyasa derinliği yeterli olmayabilir.`;
    case RiskType.FALSE_BREAKOUT_RISK:
      return `${risk} (${level}): Fiyatın önemli seviyeleri kırmış gibi görünüp sonra geri dönme riski. Onay beklendiğinde güvenilirlik artar.`;
    case RiskType.FALSE_SIGNAL_RISK:
      return `${risk} (${level}): Göstergelerin yanıltıcı sinyal üretme riski. Tek bir göstergenin sinyali yeterli değildir, çoklu onay aranmalı.`;
    case RiskType.TIMEFRAME_CONFLICT:
      return `${risk} (${level}): Farklı zaman dilimleri çelişkili sinyaller üretiyor. Hangi zaman diliminin baskın olduğu belirlenmeli.`;
    case RiskType.MARKET_UNCERTAINTY:
      return `${risk} (${level}): Piyasa koşulları belirsiz. Dış etkenler (global piyasalar, jeopolitik gelişmeler) fiyat hareketlerini etkiliyor.`;
  }
}

export function getSignalDescription(action: SignalAction, strength: SignalStrength): string {
  const signal = SIGNAL_TRANSLATIONS[action];
  const level = STRENGTH_TRANSLATIONS[strength];

  switch (action) {
    case SignalAction.BUY:
      return `${level} güçte ${signal} sinyali. Teknik göstergeler alım yönünde birleşiyor. Giriş fiyatı ve hedef seviye belirlenmeli.`;
    case SignalAction.SELL:
      return `${level} güçte ${signal} sinyali. Mevcut pozisyonlar için çıkış değerlendirilebilir. Düşüş devam edebilir.`;
    case SignalAction.HOLD:
      return `${signal} sinyali. Mevcut pozisyon korunmalı. Belirgin bir yön değişikliği henüz doğrulanmamış.`;
    case SignalAction.WATCH:
      return `${signal} sinyali. Hisse izleme listesine alınmalı. Belirli seviyelerin kırılması durumunda harekete geçilmeli.`;
  }
}

export function getAgreementDescription(agreement: number): string {
  if (agreement >= 0.85) {
    return 'Zaman dilimleri arasında güçlü uyum mevcut. Farklı vade analizleri aynı yönü gösteriyor.';
  }
  if (agreement >= 0.65) {
    return 'Zaman dilimleri arasında genel uyum var ancak bazı çelişkiler mevcut. Ana trend baskın.';
  }
  if (agreement >= 0.45) {
    return 'Zaman dilimleri arasında önemli çelişkiler bulunuyor. Belirsizlik yüksek, temkinli hareket edilmeli.';
  }
  return 'Zaman dilimleri arasında güçlü çelişkiler mevcut. Piyasa yönü belirsiz, kesin kararlar için erken.';
}

export function getConflictDescription(agreements: Array<{ timeframe: Timeframe; direction: TrendDirection }>): string {
  const shortTerm = agreements.find(a => a.timeframe === Timeframe.M4 || a.timeframe === Timeframe.D1);
  const longTerm = agreements.find(a => a.timeframe === Timeframe.W1 || a.timeframe === Timeframe.M1);

  if (!shortTerm || !longTerm) return '';

  const shortLabel = TIMEFRAME_VIEW_LABELS[shortTerm.timeframe].short;
  const longLabel = TIMEFRAME_VIEW_LABELS[longTerm.timeframe].long;

  return `${shortLabel} görünüm ${TREND_TRANSLATIONS[shortTerm.direction]} yönünde, ancak ${longLabel} ${TREND_TRANSLATIONS[longTerm.direction]} yönünde. Bu çelişki belirsizlik yaratıyor.`;
}

export function getConfidenceDescription(score: number): string {
  if (score >= 0.75) {
    return 'Yüksek güven seviyesi. Göstergeler güçlü uyum içinde ve sinyal kalitesi yüksek. Tarihsel benzerlik güçlü.';
  }
  if (score >= 0.50) {
    return 'Orta güven seviyesi. Göstergeler genel uyum içinde ancak bazı belirsizlikler mevcut. Ek onay öneriliyor.';
  }
  if (score >= 0.25) {
    return 'Düşük güven seviyesi. Göstergeler çelişkili sinyaller üretiyor. Kesin kararlar için yeterli kanıt bulunmuyor.';
  }
  return 'Çok düşük güven seviyesi. Sinyaller tutarsız ve yetersiz. Bu aşamada yatırım kararı almak riskli.';
}

export function getRiskRewardDescription(riskRewardRatio?: number): string {
  if (riskRewardRatio === undefined) return '';
  if (riskRewardRatio >= 3) {
    return `Risk/ödül oranı ${formatNumber(riskRewardRatio)} ile çok cazip. Potansiyel kazanç riskin 3 katından fazla.`;
  }
  if (riskRewardRatio >= 2) {
    return `Risk/ödül oranı ${formatNumber(riskRewardRatio)} ile kabul edilebilir seviyede.`;
  }
  if (riskRewardRatio >= 1) {
    return `Risk/ödül oranı ${formatNumber(riskRewardRatio)} ile dengeli. Potansiyel kazanç ve risk birbirine yakın.`;
  }
  return `Risk/ödül oranı ${formatNumber(riskRewardRatio)} ile düşük. Potansiyel risk, kazancın önünde.`;
}

export function getDisclaimer(): string {
  return 'Bu analiz yalnızca bilgilendirme amaçlıdır ve yatırım tavsiyesi niteliğinde değildir. Yatırım kararları kişisel risk toleransınıza ve finansal durumunuza göre verilmelidir. Geçmiş performans gelecek sonuçların garantisi değildir.';
}

function formatStrength(value: number): string {
  if (value >= 80) return 'çok güçlü';
  if (value >= 60) return 'güçlü';
  if (value >= 40) return 'orta';
  if (value >= 20) return 'zayıf';
  return 'çok zayıf';
}

function formatNumber(value: number): string {
  return value.toFixed(2).replace('.', ',');
}
