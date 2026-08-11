export type PredictionTimeframe = '1h' | '2h' | '4h' | '1d' | '1w' | '1m' | '3m' | '6m';

export type RiskLevel = 'low' | 'medium' | 'high';

export type VerificationStatus = 'verified' | 'unverified' | 'unknown';

export type EarlyOpportunityLevel =
  | 'ÇOK_GÜÇLÜ_FIRSAT'
  | 'GÜÇLÜ_FIRSAT'
  | 'FIRSAT'
  | 'İZLEME_LISTESI'
  | 'BEKLE';

export type OpportunityStrength = 'Weak' | 'Medium' | 'Strong' | 'Very Strong';

export type TrendStage = 'Early' | 'Growing' | 'Breakout' | 'Extended' | 'Late';

export type HoldingType = 'Intraday' | 'Swing' | 'Position' | 'Investment';

export interface TimeframeSignal {
  timeframe: PredictionTimeframe;
  bullish: number;
  confidence: number;
  momentum: string;
  trend: string;
  trendStrength: string;
  riskScore: number;
  risk: string;
  holdingUnit: string;
}

export interface AlignmentScores {
  timeframeAgreement: number;
  trendAlignment: number;
  momentumAlignment: number;
  riskAlignment: number;
  confidenceAlignment: number;
  smartMoneyAlignment: number;
  catalystAlignment: number;
  macroAlignment: number;
  marketStructureAlignment: number;
}

export interface RiskSummary {
  avgRiskScore: number;
  distribution: { low: number; medium: number; high: number };
  maxRisk: string;
  summary: string;
}

export interface CatalystSummary {
  score: number;
  verified: boolean;
}

export interface SmartMoneySummary {
  score: number;
  accumulation: string;
}

export interface ResearchConsensusSummary {
  agreementLevel: number;
  confidence: number;
  consensusScore: number;
  summary: string;
  evidenceCount: number;
}

export interface EarlyOpportunityIntelligenceResult {
  ticker: string;
  company: string;
  sector: string;
  marketCap: number | null;
  earlyOpportunityScore: number;
  earlyOpportunityLevel: EarlyOpportunityLevel;
  eliteScore: number;
  confidence: number;
  bullishPercent: number;
  risk: RiskLevel;
  expectedReturn: number;
  entryZone: { min: number; max: number } | null;
  stop: number | null;
  target1: number | null;
  target2: number | null;
  riskRewardRatio: number | null;
  holdingPeriod: { value: number; unit: string } | null;
  catalyst: CatalystSummary | null;
  smartMoney: SmartMoneySummary | null;
  verificationStatus: VerificationStatus;
  researchConsensus: ResearchConsensusSummary | null;
  momentum: string;
  trend: string;
  liquidityQuality: string;
  timeframeAgreement: number;
  reasons: string[];
  multiTimeframe?: MultiTimeframeOpportunityResult | null;
  evaluatedAt: string;
}

export interface MultiTimeframeOpportunityResult {
  ticker: string;
  company: string;
  sector: string;
  multiTimeframeScore: number;
  strength: OpportunityStrength;
  strengthLabel: string;
  trendStage: TrendStage;
  holdingType: HoldingType;
  bestTimeframe: PredictionTimeframe;
  worstTimeframe: PredictionTimeframe;
  mostBullishTimeframe: PredictionTimeframe;
  highestConfidenceTimeframe: PredictionTimeframe;
  timeframesAnalyzed: PredictionTimeframe[];
  alignments: AlignmentScores;
  riskSummary: RiskSummary;
  expectedReturn: number;
  bullishPercent: number;
  confidence: number;
  entryZone: { min: number; max: number } | null;
  stop: number | null;
  target1: number | null;
  target2: number | null;
  riskRewardRatio: number | null;
  reasons: string[];
  evaluatedAt: string;
}

export interface EarlyOpportunityScanResponse {
  results: EarlyOpportunityIntelligenceResult[];
  total: number;
  generatedAt: string;
}

export interface EarlyOpportunityFilters {
  minEarlyOpportunityScore?: number;
  minConfidence?: number;
  minExpectedReturn?: number;
  maxRisk?: RiskLevel;
  sector?: string;
  marketCap?: { min?: number; max?: number };
  liquidity?: 'high' | 'medium' | 'low';
  minSmartMoneyScore?: number;
  minCatalystScore?: number;
  minEliteScore?: number;
}

export interface SelfLearningEntry {
  ticker: string;
  predictedBullish: number;
  realizedWinRate: number;
  modifier: number;
  rationale: string;
  lastUpdated: string;
}

export interface SelfLearningReport {
  scanned: number;
  updated: number;
  modifiers: SelfLearningEntry[];
  generatedAt: string;
}

export const EARLY_OPPORTUNITY_LEVEL_META: Record<
  EarlyOpportunityLevel,
  { label: string; emoji: string; minScore: number }
> = {
  ÇOK_GÜÇLÜ_FIRSAT: { label: 'Çok Güçlü Erken Fırsat', emoji: '🔥', minScore: 80 },
  GÜÇLÜ_FIRSAT: { label: 'Güçlü Erken Fırsat', emoji: '🟢', minScore: 70 },
  FIRSAT: { label: 'Erken Fırsat', emoji: '🟢', minScore: 60 },
  İZLEME_LISTESI: { label: 'İzleme Listesi', emoji: '🟡', minScore: 45 },
  BEKLE: { label: 'Bekle', emoji: '⚪', minScore: 0 },
};

export const OPPORTUNITY_STRENGTH_META: Record<
  OpportunityStrength,
  { label: string; minScore: number }
> = {
  Weak: { label: 'Zayıf', minScore: 0 },
  Medium: { label: 'Orta', minScore: 50 },
  Strong: { label: 'Güçlü', minScore: 65 },
  'Very Strong': { label: 'Çok Güçlü', minScore: 80 },
};

export const RISK_LEVEL_ORDER: RiskLevel[] = ['low', 'medium', 'high'];

export const TIMEFRAMES: PredictionTimeframe[] = ['1h', '2h', '4h', '1d', '1w', '1m', '3m', '6m'];