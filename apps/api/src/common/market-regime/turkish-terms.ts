import {
  MarketRegimeType,
  RegimeConfidence,
  TransitionType,
  RegimeTimeframe,
  MarketPhase,
} from './types';

export const MARKET_REGIME_TYPE_TURKISH: Record<MarketRegimeType, string> = {
  [MarketRegimeType.STRONG_BULL]: 'Guclu Yukselis',
  [MarketRegimeType.BULL]: 'Yukselis',
  [MarketRegimeType.WEAK_BULL]: 'Zayif Yukselis',
  [MarketRegimeType.SIDEWAYS]: 'Yatay Piyasa',
  [MarketRegimeType.WEAK_BEAR]: 'Zayif Dusus',
  [MarketRegimeType.BEAR]: 'Dusus',
  [MarketRegimeType.STRONG_BEAR]: 'Guclu Dusus',
  [MarketRegimeType.HIGH_VOLATILITY]: 'Yuksek Volatilite',
  [MarketRegimeType.LOW_VOLATILITY]: 'Dusuk Volatilite',
  [MarketRegimeType.RECOVERY]: 'Toparlanma',
  [MarketRegimeType.CORRECTION]: 'Duzeltme',
  [MarketRegimeType.DISTRIBUTION]: 'Dagitim',
  [MarketRegimeType.ACCUMULATION]: 'Birikim',
};

export const REGIME_CONFIDENCE_TURKISH: Record<RegimeConfidence, string> = {
  [RegimeConfidence.VERY_HIGH]: 'Cok Yuksek',
  [RegimeConfidence.HIGH]: 'Yuksek',
  [RegimeConfidence.MEDIUM]: 'Orta',
  [RegimeConfidence.LOW]: 'Dusuk',
  [RegimeConfidence.VERY_LOW]: 'Cok Dusuk',
};

export const TRANSITION_TYPE_TURKISH: Record<TransitionType, string> = {
  [TransitionType.EMERGING_BULL]: 'Yukselis Trendi Olusuyor',
  [TransitionType.EMERGING_BEAR]: 'Dusus Trendi Olusuyor',
  [TransitionType.TREND_WEAKENING]: 'Trend Zayifliyor',
  [TransitionType.TREND_STRENGTHENING]: 'Trend Gucleniyor',
  [TransitionType.VOLATILITY_EXPANSION]: 'Volatilite Genisliyor',
  [TransitionType.VOLATILITY_CONTRACTION]: 'Volatilite Daraliyor',
  [TransitionType.POSSIBLE_TRANSITION]: 'Olasil Gecis',
};

export const REGIME_TIMEFRAME_TURKISH: Record<RegimeTimeframe, string> = {
  [RegimeTimeframe.M4]: '4 Dakikalik',
  [RegimeTimeframe.D1]: 'Gunluk',
  [RegimeTimeframe.W1]: 'Haftalik',
  [RegimeTimeframe.M1]: 'Aylik',
};

export const MARKET_PHASE_TURKISH: Record<MarketPhase, string> = {
  [MarketPhase.ACCUMULATION]: 'Birikim Asamasi',
  [MarketPhase.MARKUP]: 'Yukselme Asamasi',
  [MarketPhase.DISTRIBUTION]: 'Dagitim Asamasi',
  [MarketPhase.MARKDOWN]: 'Dusus Asamasi',
};

export const REGIME_DESCRIPTIONS_TURKISH: Record<MarketRegimeType, string> = {
  [MarketRegimeType.STRONG_BULL]: 'Piyasa guclu bir yukselis trendinde, yuksek momentum ve guclu hacim destegi var.',
  [MarketRegimeType.BULL]: 'Piyasa genel olarak yukselis trendinde, ancak guclu trend kadar belirgin degil.',
  [MarketRegimeType.WEAK_BULL]: 'Piyasa hafif yukselis egiliminde, ancak belirleyici bir trend yok.',
  [MarketRegimeType.SIDEWAYS]: 'Piyasa yatay hareket ediyor, belirgin bir yon yok.',
  [MarketRegimeType.WEAK_BEAR]: 'Piyasa hafif dusus egiliminde, ancak belirleyici bir trend yok.',
  [MarketRegimeType.BEAR]: 'Piyasa genel olarak dusus trendinde.',
  [MarketRegimeType.STRONG_BEAR]: 'Piyasa guclu bir dusus trendinde, yuksek panik ve satis baskisi hakim.',
  [MarketRegimeType.HIGH_VOLATILITY]: 'Piyasa cok volatil, buyuk fiyat dalgalanmalari gozleniyor.',
  [MarketRegimeType.LOW_VOLATILITY]: 'Piyasa cok sakin, kucuk fiyat dalgalanmalari gozleniyor.',
  [MarketRegimeType.RECOVERY]: 'Piyasa onceki dususten toparlanmaya basliyor.',
  [MarketRegimeType.CORRECTION]: 'Piyasa yuksek seviyelerden duzeltme yapiyor.',
  [MarketRegimeType.DISTRIBUTION]: 'Buyuk oyuncular pozisyonlarini kapatmaya basliyor, piyasa tepesi olusabilir.',
  [MarketRegimeType.ACCUMULATION]: 'Buyuk oyuncular pozisyon olusturmaya basliyor, piyasa dibi olusabilir.',
};

export const REPORT_HEADER_TURKISH = '=== Piyasa Rejimi Analiz Raporu ===';
export const REPORT_FOOTER_TURKISH = '=== Rapor Sonu ===';

export function formatPercentageTurkish(value: number): string {
  return `%${(value * 100).toFixed(1)}`;
}

export function formatScoreTurkish(value: number): string {
  return value.toFixed(2);
}

export function formatConfidenceTurkish(confidence: number): string {
  const percentage = (confidence * 100).toFixed(1);
  return `%${percentage} guvenilirlik`;
}

export function getRegimeEmojiTurkish(type: MarketRegimeType): string {
  const emojis: Record<MarketRegimeType, string> = {
    [MarketRegimeType.STRONG_BULL]: '[++]',
    [MarketRegimeType.BULL]: '[+]',
    [MarketRegimeType.WEAK_BULL]: '[~+]',
    [MarketRegimeType.SIDEWAYS]: '[=]',
    [MarketRegimeType.WEAK_BEAR]: '[~-]',
    [MarketRegimeType.BEAR]: '[-]',
    [MarketRegimeType.STRONG_BEAR]: '[--]',
    [MarketRegimeType.HIGH_VOLATILITY]: '[!]',
    [MarketRegimeType.LOW_VOLATILITY]: '[.]',
    [MarketRegimeType.RECOVERY]: '[^]',
    [MarketRegimeType.CORRECTION]: '[v]',
    [MarketRegimeType.DISTRIBUTION]: '[D]',
    [MarketRegimeType.ACCUMULATION]: '[A]',
  };
  return emojis[type];
}
