import { OpportunityResult } from '../ai-opportunity/opportunity.types';
import { EntryZoneResult } from '../entry/entry-zone.types';
import { AnalystResult } from '../analyst/analyst.types';

export const OPPORTUNITY_CENTER_VERSION = '1.0.0';

export type OpportunityCenterTabId =
  | 'BUGUNUN_FIRSATLARI'
  | 'YARIN_ARTACAKLAR'
  | 'ELITE_SCORE'
  | 'HAFTALIK'
  | 'AYLIK'
  | 'UC_AYLIK'
  | 'ALTI_AYLIK'
  | 'TOP_10'
  | 'TOP_20'
  | 'MOMENTUM'
  | 'DEGER_AVCILARI'
  | 'SMART_MONEY';

export interface OpportunityCenterTabMeta {
  id: OpportunityCenterTabId;
  baslik: string;
  emoji: string;
  description: string;
}

export const OPPORTUNITY_CENTER_TABS: OpportunityCenterTabMeta[] = [
  {
    id: 'BUGUNUN_FIRSATLARI',
    baslik: 'Bugünün Fırsatları',
    emoji: '🔥',
    description: 'Bugünün en yüksek skorlu fırsatları',
  },
  {
    id: 'YARIN_ARTACAKLAR',
    baslik: 'Yarın Artacaklar',
    emoji: '🟢',
    description: 'Gece analizi aday listesi (tahmin değil, mimari hazır)',
  },
  {
    id: 'ELITE_SCORE',
    baslik: 'Elite Score',
    emoji: '⭐',
    description: 'Günlük/Haftalık/Aylık/3 Aylık/6 Aylık yer tutucu skorlar',
  },
  {
    id: 'HAFTALIK',
    baslik: 'Haftalık',
    emoji: '📈',
    description: 'Haftalık görünüm (yer tutucu, hesaplama yok)',
  },
  {
    id: 'AYLIK',
    baslik: 'Aylık',
    emoji: '📊',
    description: 'Aylık görünüm (yer tutucu, hesaplama yok)',
  },
  {
    id: 'UC_AYLIK',
    baslik: '3 Aylık',
    emoji: '📅',
    description: '3 aylık görünüm (yer tutucu, hesaplama yok)',
  },
  {
    id: 'ALTI_AYLIK',
    baslik: '6 Aylık',
    emoji: '📆',
    description: '6 aylık görünüm (yer tutucu, hesaplama yok)',
  },
  {
    id: 'TOP_10',
    baslik: 'Top 10',
    emoji: '💎',
    description: 'En güçlü 10 fırsat',
  },
  {
    id: 'TOP_20',
    baslik: 'Top 20',
    emoji: '🏆',
    description: 'En güçlü 20 fırsat',
  },
  {
    id: 'MOMENTUM',
    baslik: 'Momentum',
    emoji: '🚀',
    description: 'Momentum stratejisi adayları',
  },
  {
    id: 'DEGER_AVCILARI',
    baslik: 'Değer Avcıları',
    emoji: '💰',
    description: 'Değer Avcısı stratejisi adayları',
  },
  {
    id: 'SMART_MONEY',
    baslik: 'Smart Money',
    emoji: '🧠',
    description: 'Akıllı Para stratejisi adayları',
  },
];

export type EliteScoreTimeframe =
  | 'GUNLUK'
  | 'HAFTALIK'
  | 'AYLIK'
  | 'UC_AYLIK'
  | 'ALTI_AYLIK';

export const ELITE_SCORE_TIMEFRAMES: Array<{ zaman: EliteScoreTimeframe; etiket: string }> = [
  { zaman: 'GUNLUK', etiket: 'Günlük' },
  { zaman: 'HAFTALIK', etiket: 'Haftalık' },
  { zaman: 'AYLIK', etiket: 'Aylık' },
  { zaman: 'UC_AYLIK', etiket: '3 Aylık' },
  { zaman: 'ALTI_AYLIK', etiket: '6 Aylık' },
];

export type OpportunityEntryArea = EntryZoneResult;

export interface OpportunityCenterCard extends OpportunityResult {
  entryArea: OpportunityEntryArea | null;
  analyst: AnalystResult | null;
}

export interface EliteScoreBreakdown {
  gunluk: number;
  haftalik: number;
  aylik: number;
  ucAylik: number;
  altiAylik: number;
}

export interface EliteScoreCard extends OpportunityCenterCard {
  eliteScore: EliteScoreBreakdown;
}

export interface OpportunityCenterRegistryEntry {
  ticker: string;
  kart: OpportunityCenterCard;
  evaluatedAt: string;
}

export interface EliteScoreTimeframeResult {
  zaman: EliteScoreTimeframe;
  etiket: string;
  skor: number;
  kartlar: EliteScoreCard[];
}
