import { PredictionTimeframe } from '../../prediction/prediction.types';

export const EARLY_OPPORTUNITY_DECISION_VERSION = '1.0.0';

/**
 * R2-045 — Early Opportunity Decision & Signal Convergence.
 *
 * A deterministic convergence/decision layer that answers "is this stock
 * currently an EARLY OPPORTUNITY?". It reuses existing engine results
 * (prediction, MTF, smart money, catalyst, fundamentals, signals, verification,
 * data quality, risk/entry) — it never recomputes indicators or refetches data.
 */

export type DecisionDimensionId =
  | 'earlyStage'
  | 'multiTimeframe'
  | 'prediction'
  | 'smartMoney'
  | 'catalyst'
  | 'fundamentals'
  | 'signals'
  | 'verification'
  | 'dataQuality'
  | 'risk';

export const DECISION_DIMENSION_IDS: readonly DecisionDimensionId[] = [
  'earlyStage',
  'multiTimeframe',
  'prediction',
  'smartMoney',
  'catalyst',
  'fundamentals',
  'signals',
  'verification',
  'dataQuality',
  'risk',
];

/**
 * Documented weights (sum to 1.00).
 * Early stage + multi-timeframe + prediction are the primary drivers; the rest
 * provide independent convergence evidence. Data quality and risk act both as
 * weighted evidence and as hard gates (see engine).
 */
export const DECISION_DIMENSION_WEIGHTS: Record<DecisionDimensionId, number> = {
  earlyStage: 0.15,
  multiTimeframe: 0.15,
  prediction: 0.15,
  smartMoney: 0.1,
  catalyst: 0.1,
  fundamentals: 0.1,
  signals: 0.1,
  verification: 0.05,
  dataQuality: 0.05,
  risk: 0.05,
};

export const DECISION_DIMENSION_LABELS: Record<DecisionDimensionId, string> = {
  earlyStage: 'Erken Aşama',
  multiTimeframe: 'Multi-Timeframe Uyumu',
  prediction: 'Tahmin Güveni',
  smartMoney: 'Smart Money',
  catalyst: 'Katalizör',
  fundamentals: 'Temel Analiz',
  signals: 'Sinyal Yakınsaması',
  verification: 'Doğrulama',
  dataQuality: 'Veri Kalitesi',
  risk: 'Risk Çerçevesi',
};

export type EarlyOpportunityDecisionStatus =
  | 'STRONG_EARLY_OPPORTUNITY'
  | 'EARLY_OPPORTUNITY'
  | 'WATCHLIST_OPPORTUNITY'
  | 'CONFIRMED_OPPORTUNITY'
  | 'EXTENDED_OPPORTUNITY'
  | 'WEAK_OPPORTUNITY'
  | 'INVALID_OPPORTUNITY';

export const EARLY_OPPORTUNITY_DECISION_STATUSES: readonly EarlyOpportunityDecisionStatus[] = [
  'STRONG_EARLY_OPPORTUNITY',
  'EARLY_OPPORTUNITY',
  'WATCHLIST_OPPORTUNITY',
  'CONFIRMED_OPPORTUNITY',
  'EXTENDED_OPPORTUNITY',
  'WEAK_OPPORTUNITY',
  'INVALID_OPPORTUNITY',
];

export interface DecisionStatusMeta {
  label: string;
  emoji: string;
  summary: string;
  /** Opportunity strength used by gate caps (higher = stronger). */
  strength: number;
}

export const DECISION_STATUS_META: Record<EarlyOpportunityDecisionStatus, DecisionStatusMeta> = {
  STRONG_EARLY_OPPORTUNITY: {
    label: 'Güçlü Erken Fırsat',
    emoji: '🔥',
    summary: 'Bağımsız boyutlarda güçlü ve erken yakınsama.',
    strength: 6,
  },
  EARLY_OPPORTUNITY: {
    label: 'Erken Fırsat',
    emoji: '🟢',
    summary: 'Çoklu boyutta olumlu erken yakınsama.',
    strength: 5,
  },
  CONFIRMED_OPPORTUNITY: {
    label: 'Doğrulanmış Fırsat',
    emoji: '✅',
    summary: 'Güçlü ancak trend erken aşamayı aşmış.',
    strength: 5,
  },
  EXTENDED_OPPORTUNITY: {
    label: 'Uzatılmış Fırsat',
    emoji: '🟠',
    summary: 'Trend uzamış; erken giriş için geç olabilir.',
    strength: 5,
  },
  WATCHLIST_OPPORTUNITY: {
    label: 'İzleme Listesi',
    emoji: '🟡',
    summary: 'Orta düzey yakınsama; doğrulama beklenmeli.',
    strength: 3,
  },
  WEAK_OPPORTUNITY: {
    label: 'Zayıf Fırsat',
    emoji: '⚪',
    summary: 'Yakınsama zayıf veya çelişkili.',
    strength: 2,
  },
  INVALID_OPPORTUNITY: {
    label: 'Geçersiz Fırsat',
    emoji: '⛔',
    summary: 'Veri yetersiz veya karar engellendi.',
    strength: 1,
  },
};

export type OpportunityType = 'EARLY' | 'CONFIRMED' | 'EXTENDED' | 'WATCH' | 'WEAK' | 'INVALID';

export interface DecisionDimension {
  id: DecisionDimensionId;
  label: string;
  weight: number;
  /** 0–100 dimension score. */
  score: number;
  /** Whether independent evidence exists. Missing ≠ bullish: absent dimensions never add positive score. */
  present: boolean;
  /** Deterministic Turkish note. */
  note: string;
}

export type DecisionGateSeverity = 'invalidate' | 'downgrade';

export interface DecisionGate {
  id: string;
  severity: DecisionGateSeverity;
  reason: string;
}

export interface DecisionSignalSummary {
  convergenceScore: number;
  totalSignals: number;
  strongSignalCount: number;
  earlyCount: number;
  confirmedCount: number;
  categoryCoverage: number;
}

export interface DecisionRiskSummary {
  level: string;
  riskRewardRatio: number | null;
  hasEntry: boolean;
  hasStop: boolean;
  hasTarget: boolean;
}

/**
 * Immutable decision snapshot for R2-046 backtesting. Only contains data that
 * was available at decision time (decisionTimestamp == evaluatedAt of the
 * source intelligence result). No future candles, news, or statements.
 */
export interface EarlyOpportunityDecisionSnapshot {
  decisionTimestamp: string;
  symbol: string;
  timeframeContext: string[];
  decisionScore: number;
  decisionStatus: EarlyOpportunityDecisionStatus;
  earlyOpportunity: boolean;
  entry: { min: number; max: number } | null;
  stop: number | null;
  target1: number | null;
  target2: number | null;
  expectedReturn: number;
  confidence: number;
  evidence: Record<DecisionDimensionId, number>;
  inputDigest: string;
}

export interface EarlyOpportunityDecision {
  ticker: string;
  company: string;
  decisionScore: number;
  decisionStatus: EarlyOpportunityDecisionStatus;
  statusLabel: string;
  statusEmoji: string;
  opportunityType: OpportunityType;
  earlyOpportunity: boolean;
  confidence: number;
  convergence: number;
  /** Fraction (0–100) of total weight covered by present evidence. */
  coverage: number;
  trendStage: string | null;
  timeframeAgreement: number;
  predictionConfidence: number;
  smartMoneyStatus: string;
  catalystStatus: string;
  fundamentalStatus: string;
  financialDataQualityStatus: string;
  signalSummary: DecisionSignalSummary;
  verificationStatus: string;
  riskSummary: DecisionRiskSummary;
  entryZone: { min: number; max: number } | null;
  stop: number | null;
  target1: number | null;
  target2: number | null;
  expectedReturn: number;
  bestTimeframe: string | null;
  worstTimeframe: string | null;
  reasons: string[];
  positiveFactors: string[];
  negativeFactors: string[];
  warnings: string[];
  dataFreshness: string;
  providerStatus: string;
  dimensions: DecisionDimension[];
  gates: { invalidated: DecisionGate[]; downgraded: DecisionGate[] };
  snapshot: EarlyOpportunityDecisionSnapshot;
  /** Deterministic Turkish explanation (no GPT, no randomness). */
  explanation: string;
  generatedAt: string;
}
