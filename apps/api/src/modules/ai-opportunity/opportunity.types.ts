import { DecisionId, DecisionInput } from '../decision/decision.types';

export const OPPORTUNITY_ENGINE_VERSION = '1.0.0';

export type OpportunityLevel =
  | 'ÇOK_GÜÇLÜ_FIRSAT'
  | 'GÜÇLÜ_FIRSAT'
  | 'FIRSAT'
  | 'İZLEME_LISTESI'
  | 'BEKLE';

export const OPPORTUNITY_LEVELS: OpportunityLevel[] = [
  'ÇOK_GÜÇLÜ_FIRSAT',
  'GÜÇLÜ_FIRSAT',
  'FIRSAT',
  'İZLEME_LISTESI',
  'BEKLE',
];

export const OPPORTUNITY_LEVEL_META: Record<
  OpportunityLevel,
  { label: string; emoji: string; strength: number }
> = {
  ÇOK_GÜÇLÜ_FIRSAT: { label: 'Çok Güçlü Fırsat', emoji: '🔥', strength: 5 },
  GÜÇLÜ_FIRSAT: { label: 'Güçlü Fırsat', emoji: '🟢', strength: 4 },
  FIRSAT: { label: 'Fırsat', emoji: '🟢', strength: 3 },
  İZLEME_LISTESI: { label: 'İzleme Listesi', emoji: '🟡', strength: 2 },
  BEKLE: { label: 'Bekle', emoji: '⚪', strength: 1 },
};

export type OpportunityTag =
  | 'Erken Kırılım'
  | 'Akıllı Para'
  | 'Dip Toplama'
  | 'Trend Başlangıcı'
  | 'Momentum'
  | 'Hacim Patlaması'
  | 'Doğrulanmış Haber'
  | 'Yeni Katalizör'
  | 'Güçlü Temel'
  | 'Düşük Risk'
  | 'Yüksek Likidite';

export const OPPORTUNITY_TAGS: OpportunityTag[] = [
  'Erken Kırılım',
  'Akıllı Para',
  'Dip Toplama',
  'Trend Başlangıcı',
  'Momentum',
  'Hacim Patlaması',
  'Doğrulanmış Haber',
  'Yeni Katalizör',
  'Güçlü Temel',
  'Düşük Risk',
  'Yüksek Likidite',
];

export interface OpportunityInput extends DecisionInput {}

export interface OpportunityResult {
  ticker: string;
  company: string;
  level: OpportunityLevel;
  levelLabel: string;
  levelEmoji: string;
  opportunityScore: number;
  confidence: number;
  decision: DecisionId;
  decisionLabel: string;
  decisionScore: number;
  decisionConfidence: number;
  aiScore: number | null;
  aiConfidence: number | null;
  strategyId: string;
  strategyName: string;
  strategyScore: number | null;
  verification: number | null;
  catalyst: number | null;
  momentum: number | null;
  trend: number | null;
  risk: number | null;
  liquidity: number | null;
  technical: number | null;
  fundamental: number | null;
  quality: number | null;
  reasons: string[];
  warnings: string[];
  positiveSignals: string[];
  negativeSignals: string[];
  tags: OpportunityTag[];
  evaluatedAt: string;
}

export interface OpportunityRegistryEntry {
  ticker: string;
  input: OpportunityInput;
  result: OpportunityResult;
  evaluatedAt: string;
}
