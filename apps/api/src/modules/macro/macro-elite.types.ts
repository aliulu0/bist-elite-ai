import { TCMBDecisionAnalysis } from './engines/tcmb-decision-analyzer';

export interface MacroEliteComponentScore {
  name: string;
  score: number;
  weight: number;
  weighted: number;
  status: 'ready' | 'pending' | 'stale';
  detail: string;
}

export interface MacroEliteScoreInput {
  macroScore: number;
  macroConfidence: number;
  regime: 'risk_on' | 'neutral' | 'risk_off' | 'extreme_risk';
  tcmbDecision: TCMBDecisionAnalysis | null;
  vix: number | null;
  dxy: number | null;
  us10y: number | null;
  gold: number | null;
  brent: number | null;
  usdtry: number | null;
  inflation: number | null;
  policyRate: number | null;
}

export interface MacroEliteScoreResult {
  eliteScore: number;
  components: MacroEliteComponentScore[];
  confidence: number;
  calculatedAt: string;
}

export interface TCMBDecisionRecord {
  id: string;
  meetingDate: string;
  policyRate: number | null;
  previousPolicyRate: number | null;
  analysis: TCMBDecisionAnalysis;
  rawText: string;
  storedAt: string;
}

export interface DecisionNotificationPayload {
  decisionId: string;
  meetingDate: string;
  policyRate: number | null;
  sentiment: TCMBDecisionAnalysis['sentiment'];
  hawkishScore: number;
  dovishScore: number;
  confidence: number;
  summary: string;
  createdAt: string;
}

export type MacroTrend = 'improving' | 'stable' | 'deteriorating';

export type MacroRecommendationAction = 'opportunistic' | 'selective' | 'defensive' | 'cash';

export interface MacroRecommendation {
  action: MacroRecommendationAction;
  summary: string;
  reasons: string[];
  score: number;
}

export interface MacroRiskAssessment {
  level: 'low' | 'moderate' | 'high' | 'extreme';
  score: number;
  drivers: string[];
}

export interface MacroTrendResult {
  trend: MacroTrend;
  change: number;
  currentScore: number;
  previousScore: number | null;
  drivers: string[];
  timestamp: string;
}

export interface MacroEliteResult {
  eliteScore: number;
  confidence: number;
  trend: MacroTrend;
  risk: MacroRiskAssessment;
  recommendation: MacroRecommendation;
  components: MacroEliteComponentScore[];
  decision: TCMBDecisionRecord | null;
  calculatedAt: string;
}

export interface ProviderObservability {
  name: string;
  connected: boolean;
  enabled: boolean;
  priority: number;
  circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  lastSuccessAgeMs: number | null;
  lastHealthCheck: string | null;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatencyMs: number;
}

export interface MacroObservability {
  macroScore: number;
  macroConfidence: number;
  decision: {
    ageHours: number | null;
    source: string | null;
    meetingDate: string | null;
    sentiment: TCMBDecisionAnalysis['sentiment'] | null;
  };
  providers: ProviderObservability[];
  lastUpdate: string;
}

export interface CombinedConfidenceResult {
  eliteConfidence: number;
  macroConfidence: number;
  combined: number;
  weightElite: number;
  weightMacro: number;
  calculatedAt: string;
}

export interface TCMBDecisionCaptureInput {
  meetingDate: string;
  policyRate: number | null;
  previousPolicyRate: number | null;
  rawText: string;
}
