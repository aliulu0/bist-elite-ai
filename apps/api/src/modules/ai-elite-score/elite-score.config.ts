import { EliteScoreHorizon } from './elite-score.types';

export const HORIZON_META: Record<EliteScoreHorizon, { etiket: string; emoji: string }> = {
  GUNLUK: { etiket: 'Günlük', emoji: '🔥' },
  HAFTALIK: { etiket: 'Haftalık', emoji: '📈' },
  AYLIK: { etiket: 'Aylık', emoji: '📊' },
  UC_AYLIK: { etiket: '3 Aylık', emoji: '📅' },
  ALTI_AYLIK: { etiket: '6 Aylık', emoji: '📆' },
};

export type EliteScoreDimension =
  | 'aiScore'
  | 'decisionScore'
  | 'opportunityScore'
  | 'strategyScore'
  | 'verification'
  | 'catalyst'
  | 'technical'
  | 'fundamental'
  | 'momentum'
  | 'trend'
  | 'liquidity'
  | 'quality'
  | 'risk';

export const ELITE_SCORE_DIMENSIONS: EliteScoreDimension[] = [
  'aiScore',
  'decisionScore',
  'opportunityScore',
  'strategyScore',
  'verification',
  'catalyst',
  'technical',
  'fundamental',
  'momentum',
  'trend',
  'liquidity',
  'quality',
  'risk',
];

export const DIMENSION_LABELS: Record<EliteScoreDimension, string> = {
  aiScore: 'AI Skoru',
  decisionScore: 'Karar Skoru',
  opportunityScore: 'Fırsat Skoru',
  strategyScore: 'Strateji Skoru',
  verification: 'Doğrulama',
  catalyst: 'Katalizör',
  technical: 'Teknik',
  fundamental: 'Temel',
  momentum: 'Momentum',
  trend: 'Trend',
  liquidity: 'Likidite',
  quality: 'Kalite',
  risk: 'Risk Profili',
};

export const HORIZON_WEIGHTS: Record<EliteScoreHorizon, Record<EliteScoreDimension, number>> = {
  GUNLUK: {
    aiScore: 0.12,
    decisionScore: 0.1,
    opportunityScore: 0.1,
    strategyScore: 0.05,
    verification: 0.08,
    catalyst: 0.08,
    technical: 0.12,
    fundamental: 0.02,
    momentum: 0.15,
    trend: 0.03,
    liquidity: 0.05,
    quality: 0.02,
    risk: 0.08,
  },
  HAFTALIK: {
    aiScore: 0.11,
    decisionScore: 0.11,
    opportunityScore: 0.1,
    strategyScore: 0.05,
    verification: 0.09,
    catalyst: 0.09,
    technical: 0.1,
    fundamental: 0.04,
    momentum: 0.12,
    trend: 0.06,
    liquidity: 0.04,
    quality: 0.03,
    risk: 0.06,
  },
  AYLIK: {
    aiScore: 0.1,
    decisionScore: 0.12,
    opportunityScore: 0.12,
    strategyScore: 0.06,
    verification: 0.08,
    catalyst: 0.08,
    technical: 0.08,
    fundamental: 0.07,
    momentum: 0.08,
    trend: 0.09,
    liquidity: 0.03,
    quality: 0.05,
    risk: 0.04,
  },
  UC_AYLIK: {
    aiScore: 0.08,
    decisionScore: 0.11,
    opportunityScore: 0.12,
    strategyScore: 0.07,
    verification: 0.07,
    catalyst: 0.07,
    technical: 0.06,
    fundamental: 0.1,
    momentum: 0.05,
    trend: 0.11,
    liquidity: 0.03,
    quality: 0.07,
    risk: 0.06,
  },
  ALTI_AYLIK: {
    aiScore: 0.06,
    decisionScore: 0.1,
    opportunityScore: 0.11,
    strategyScore: 0.08,
    verification: 0.06,
    catalyst: 0.06,
    technical: 0.04,
    fundamental: 0.13,
    momentum: 0.03,
    trend: 0.12,
    liquidity: 0.03,
    quality: 0.1,
    risk: 0.08,
  },
};

export const HORIZON_ORDER: Record<EliteScoreHorizon, number> = {
  GUNLUK: 0,
  HAFTALIK: 1,
  AYLIK: 2,
  UC_AYLIK: 3,
  ALTI_AYLIK: 4,
};
