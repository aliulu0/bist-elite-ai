export interface TerminologyEntry {
  key: string;
  tr: string;
  en: string;
  category: 'indicator' | 'market' | 'analysis' | 'risk' | 'common';
  description: string;
  preserveOriginal: boolean;
}

export const FINANCIAL_TERMINOLOGY: readonly TerminologyEntry[] = [
  {
    key: 'rsi',
    tr: 'RSI',
    en: 'RSI',
    category: 'indicator',
    description: 'Göreceli Güç Endeksi / Relative Strength Index',
    preserveOriginal: true,
  },
  {
    key: 'macd',
    tr: 'MACD',
    en: 'MACD',
    category: 'indicator',
    description: 'Hareketli Ortalama Yakınsama/Uzaklaşma / Moving Average Convergence Divergence',
    preserveOriginal: true,
  },
  {
    key: 'ema',
    tr: 'EMA',
    en: 'EMA',
    category: 'indicator',
    description: 'Üstel Hareketli Ortalama / Exponential Moving Average',
    preserveOriginal: true,
  },
  {
    key: 'sma',
    tr: 'SMA',
    en: 'SMA',
    category: 'indicator',
    description: 'Basit Hareketli Ortalama / Simple Moving Average',
    preserveOriginal: true,
  },
  {
    key: 'wma',
    tr: 'WMA',
    en: 'WMA',
    category: 'indicator',
    description: 'Ağırlıklı Hareketli Ortalama / Weighted Moving Average',
    preserveOriginal: true,
  },
  {
    key: 'vwma',
    tr: 'VWMA',
    en: 'VWMA',
    category: 'indicator',
    description: 'Hacim Ağırlıklı Hareketli Ortalama / Volume Weighted Moving Average',
    preserveOriginal: true,
  },
  {
    key: 'vwap',
    tr: 'VWAP',
    en: 'VWAP',
    category: 'indicator',
    description: 'Hacim Ağırlıklı Ortalama Fiyat / Volume Weighted Average Price',
    preserveOriginal: true,
  },
  {
    key: 'atr',
    tr: 'ATR',
    en: 'ATR',
    category: 'indicator',
    description: 'Ortalama Gerçek Aralık / Average True Range',
    preserveOriginal: true,
  },
  {
    key: 'adx',
    tr: 'ADX',
    en: 'ADX',
    category: 'indicator',
    description: 'Ortalama Yön Endeksi / Average Directional Index',
    preserveOriginal: true,
  },
  {
    key: 'cci',
    tr: 'CCI',
    en: 'CCI',
    category: 'indicator',
    description: 'Emtia Kanal Endeksi / Commodity Channel Index',
    preserveOriginal: true,
  },
  {
    key: 'obv',
    tr: 'OBV',
    en: 'OBV',
    category: 'indicator',
    description: 'Denge Hacmi / On Balance Volume',
    preserveOriginal: true,
  },
  {
    key: 'mfi',
    tr: 'MFI',
    en: 'MFI',
    category: 'indicator',
    description: 'Para Akışı Endeksi / Money Flow Index',
    preserveOriginal: true,
  },
  {
    key: 'roc',
    tr: 'ROC',
    en: 'ROC',
    category: 'indicator',
    description: 'Değişim Oranı / Rate of Change',
    preserveOriginal: true,
  },
  {
    key: 'ichimoku',
    tr: 'Ichimoku',
    en: 'Ichimoku',
    category: 'indicator',
    description: 'Ichimoku Bulutu / Ichimoku Cloud',
    preserveOriginal: true,
  },
  {
    key: 'fibonacci',
    tr: 'Fibonacci',
    en: 'Fibonacci',
    category: 'indicator',
    description: 'Fibonacci Geri Çekilmeleri / Fibonacci Retracement',
    preserveOriginal: true,
  },
  {
    key: 'superTrend',
    tr: 'SuperTrend',
    en: 'SuperTrend',
    category: 'indicator',
    description: 'SuperTrend Göstergesi / SuperTrend Indicator',
    preserveOriginal: true,
  },
  {
    key: 'parabolicSar',
    tr: 'Parabolic SAR',
    en: 'Parabolic SAR',
    category: 'indicator',
    description: 'Parabolik Stop And Reverse',
    preserveOriginal: true,
  },
  {
    key: 'bollingerBands',
    tr: 'Bollinger Bands',
    en: 'Bollinger Bands',
    category: 'indicator',
    description: 'Bollinger Bantları',
    preserveOriginal: true,
  },
  {
    key: 'keltnerChannel',
    tr: 'Keltner Channel',
    en: 'Keltner Channel',
    category: 'indicator',
    description: 'Keltner Kanalı',
    preserveOriginal: true,
  },
  {
    key: 'donchianChannel',
    tr: 'Donchian Channel',
    en: 'Donchian Channel',
    category: 'indicator',
    description: 'Donchian Kanalı',
    preserveOriginal: true,
  },
  {
    key: 'stochasticRsi',
    tr: 'Stochastic RSI',
    en: 'Stochastic RSI',
    category: 'indicator',
    description: 'Stokastik RSI',
    preserveOriginal: true,
  },
  {
    key: 'aroon',
    tr: 'Aroon',
    en: 'Aroon',
    category: 'indicator',
    description: 'Aroon Göstergesi / Aroon Indicator',
    preserveOriginal: true,
  },
  {
    key: 'awesomeOscillator',
    tr: 'Awesome Oscillator',
    en: 'Awesome Oscillator',
    category: 'indicator',
    description: 'Mükemmel Osilatör',
    preserveOriginal: true,
  },
  {
    key: 'bullish',
    tr: 'Yükseliş Eğilimi',
    en: 'Bullish',
    category: 'market',
    description: 'Piyasanın yükseliş eğiliminde olduğunu belirtir.',
    preserveOriginal: false,
  },
  {
    key: 'bearish',
    tr: 'Düşüş Eğilimi',
    en: 'Bearish',
    category: 'market',
    description: 'Piyasanın düşüş eğiliminde olduğunu belirtir.',
    preserveOriginal: false,
  },
  {
    key: 'bullishDivergence',
    tr: 'Pozitif Uyumsuzluk',
    en: 'Bullish Divergence',
    category: 'analysis',
    description: 'Fiyat düşerken gösterge yükseliyor.',
    preserveOriginal: false,
  },
  {
    key: 'bearishDivergence',
    tr: 'Negatif Uyumsuzluk',
    en: 'Bearish Divergence',
    category: 'analysis',
    description: 'Fiyat yükselirken gösterge düşüyor.',
    preserveOriginal: false,
  },
  {
    key: 'breakout',
    tr: 'Direnç Kırılımı',
    en: 'Breakout',
    category: 'analysis',
    description: 'Fiyatın direnç seviyesini yukarı yönlü kırması.',
    preserveOriginal: false,
  },
  {
    key: 'breakdown',
    tr: 'Destek Kırılımı',
    en: 'Breakdown',
    category: 'analysis',
    description: 'Fiyatın destek seviyesini aşağı yönlü kırması.',
    preserveOriginal: false,
  },
  {
    key: 'uptrend',
    tr: 'Yükseliş Trendi',
    en: 'Uptrend',
    category: 'market',
    description: 'Fiyatın higher highs ve higher lows oluşturması.',
    preserveOriginal: false,
  },
  {
    key: 'downtrend',
    tr: 'Düşüş Trendi',
    en: 'Downtrend',
    category: 'market',
    description: 'Fiyatın lower highs ve lower lows oluşturması.',
    preserveOriginal: false,
  },
  {
    key: 'pullback',
    tr: 'Geri Çekilme',
    en: 'Pullback',
    category: 'analysis',
    description: 'Ana trend yönünde kısa süreli ters hareket.',
    preserveOriginal: false,
  },
  {
    key: 'reversal',
    tr: 'Trend Dönüşü',
    en: 'Reversal',
    category: 'analysis',
    description: 'Mevcut trend yönünde kalıcı değişiklik.',
    preserveOriginal: false,
  },
  {
    key: 'consolidation',
    tr: 'Konsolidasyon',
    en: 'Consolidation',
    category: 'market',
    description: 'Fiyatın belirli bir aralıkta yatay hareket etmesi.',
    preserveOriginal: false,
  },
  {
    key: 'sidewaysMarket',
    tr: 'Yatay Piyasa',
    en: 'Sideways Market',
    category: 'market',
    description: 'Belirgin bir trend olmayan piyasa durumu.',
    preserveOriginal: false,
  },
  {
    key: 'support',
    tr: 'Destek',
    en: 'Support',
    category: 'analysis',
    description: 'Fiyatın aşağı yönlü hareketinin zorlaştığı seviye.',
    preserveOriginal: false,
  },
  {
    key: 'resistance',
    tr: 'Direnç',
    en: 'Resistance',
    category: 'analysis',
    description: 'Fiyatın yukarı yönlü hareketinin zorlaştığı seviye.',
    preserveOriginal: false,
  },
  {
    key: 'volume',
    tr: 'Hacim',
    en: 'Volume',
    category: 'common',
    description: 'Belirli bir dönemdeki toplam işlem miktarı.',
    preserveOriginal: false,
  },
  {
    key: 'liquidity',
    tr: 'Likidite',
    en: 'Liquidity',
    category: 'common',
    description: 'Bir varlığın nakde dönüştürülme kolaylığı.',
    preserveOriginal: false,
  },
  {
    key: 'volatility',
    tr: 'Volatilite',
    en: 'Volatility',
    category: 'risk',
    description: 'Fiyat dalgalanma ölçüsü.',
    preserveOriginal: false,
  },
  {
    key: 'marketCap',
    tr: 'Piyasa Değeri',
    en: 'Market Capitalization',
    category: 'common',
    description: 'Hisse fiyatı ile dolaşımdaki pay sayısının çarpımı.',
    preserveOriginal: false,
  },
] as const;

export function getTerminology(key: string, locale: SupportedLocale = 'tr'): string {
  const entry = FINANCIAL_TERMINOLOGY.find((t) => t.key === key);
  if (!entry) return key;
  return entry[locale] || entry.tr;
}

export function getTerminologyByCategory(
  category: TerminologyEntry['category'],
): TerminologyEntry[] {
  return FINANCIAL_TERMINOLOGY.filter((t) => t.category === category);
}

export function getIndicatorTerminology(): TerminologyEntry[] {
  return getTerminologyByCategory('indicator');
}

export function getMarketTerminology(): TerminologyEntry[] {
  return getTerminologyByCategory('market');
}

export function getAnalysisTerminology(): TerminologyEntry[] {
  return getTerminologyByCategory('analysis');
}

export function getRiskTerminology(): TerminologyEntry[] {
  return getTerminologyByCategory('risk');
}

import type { SupportedLocale } from './provider';
