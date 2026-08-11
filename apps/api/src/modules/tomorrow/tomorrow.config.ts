import { TomorrowCategory } from './tomorrow.types';

export interface TomorrowCategoryMeta {
  category: TomorrowCategory;
  label: string;
  stars: string;
  minScore: number;
}

export const TOMORROW_CATEGORIES: TomorrowCategoryMeta[] = [
  { category: 'VERY_HIGH', label: 'Çok Yüksek Fırsat', stars: '★★★★★', minScore: 85 },
  { category: 'HIGH', label: 'Yüksek Fırsat', stars: '★★★★☆', minScore: 70 },
  { category: 'MEDIUM', label: 'Orta Fırsat', stars: '★★★☆☆', minScore: 55 },
  { category: 'WATCH', label: 'İzle', stars: '★★☆☆☆', minScore: 40 },
  { category: 'WEAK', label: 'Zayıf', stars: '★☆☆☆☆', minScore: 0 },
];

export type TomorrowScoreDimension =
  | 'eliteDaily'
  | 'eliteWeekly'
  | 'opportunityScore'
  | 'aiScore'
  | 'decisionScore'
  | 'verification'
  | 'catalyst';

export const TOMORROW_SCORE_WEIGHTS: Record<TomorrowScoreDimension, number> = {
  eliteDaily: 0.3,
  eliteWeekly: 0.15,
  opportunityScore: 0.2,
  aiScore: 0.1,
  decisionScore: 0.1,
  verification: 0.075,
  catalyst: 0.075,
};

export const TOMORROW_DIMENSION_LABELS: Record<TomorrowScoreDimension, string> = {
  eliteDaily: 'Günlük Elite Skor',
  eliteWeekly: 'Haftalık Elite Skor',
  opportunityScore: 'Fırsat Skoru',
  aiScore: 'AI Skoru',
  decisionScore: 'Karar Skoru',
  verification: 'Doğrulama',
  catalyst: 'Katalizör',
};

export const NIGHT_ANALYSIS_WINDOW = {
  baslik: 'Gece Analizi',
  saatler: ['22:00', '23:00', '00:00'],
  durum: 'mimari-hazir',
  not: 'Sonuçlar TomorrowRegistry içinde saklanır; zamanlayıcı ileride eklenecek.',
};
