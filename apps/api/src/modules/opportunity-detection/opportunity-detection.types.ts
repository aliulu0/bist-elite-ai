import { AnalysisResult } from '../ai-analysis/ai-analysis.types';

export const OPPORTUNITY_DETECTION_VERSION = '1.0.0';

export type OpportunityLevel =
  | 'SUPPORT'
  | 'NONE'
  | 'WATCH'
  | 'INTERESTING'
  | 'EMERGING'
  | 'STRONG'
  | 'VERY_STRONG'
  | 'EXCEPTIONAL';

export type OpportunityType =
  | 'MOMENTUM_BREAKOUT'
  | 'VOLUME_EXPANSION'
  | 'TREND_REVERSAL'
  | 'FUNDAMENTAL_IMPROVEMENT'
  | 'UNDERVALUATION'
  | 'SECTOR_ROTATION'
  | 'INSTITUTIONAL_ACCUMULATION'
  | 'EARNINGS_OPPORTUNITY'
  | 'MULTI_FACTOR'
  | 'CUSTOM';

export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'IGNORE';

export type OpportunityAge = 'NEW' | 'GROWING' | 'STABLE' | 'WEAKENING' | 'EXPIRED';

export type ConfirmationLevel =
  | 'NONE'
  | 'SINGLE'
  | 'DOUBLE'
  | 'TRIPLE'
  | 'MULTI';

export interface DetectionModuleResult {
  module: string;
  score: number;
  confidence: number;
  signals: string[];
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  warnings: string[];
  metrics: Record<string, number>;
  explanation: string;
  metadata: Record<string, unknown>;
}

export interface ConfirmationRecord {
  module: string;
  timestamp: string;
  score: number;
  signal: string;
}

export interface OpportunityHistoryEntry {
  timestamp: string;
  score: number;
  level: OpportunityLevel;
  priority: Priority;
}

export interface SupportingMetric {
  name: string;
  value: number | string;
  description: string;
  module: string;
}

export interface OpportunityResult {
  symbol: string;
  opportunityScore: number;
  confidence: number;
  opportunityLevel: OpportunityLevel;
  opportunityType: OpportunityType;
  priority: Priority;
  recommendation: string;
  age: OpportunityAge;
  confirmationLevel: ConfirmationLevel;
  confirmationCount: number;
  reasons: string[];
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  warnings: string[];
  explanation: string;
  supportingMetrics: SupportingMetric[];
  detectionModuleResults: DetectionModuleResult[];
  opportunityTypes: OpportunityType[];
  penalties: PenaltyRecord[];
  metadata: OpportunityMetadata;
  timestamp: string;
  version: string;
}

export interface PenaltyRecord {
  type: string;
  amount: number;
  reason: string;
  module: string;
}

export interface OpportunityMetadata {
  detectionDurationMs: number;
  moduleCount: number;
  enabledModuleCount: number;
  failedModuleCount: number;
  confirmationLevel: ConfirmationLevel;
  confirmationCount: number;
  ageStatus: OpportunityAge;
  previousScore: number | null;
  scoreDelta: number | null;
  duplicateCount: number;
  aggregationQuality: number;
  providerConfidence: number;
  metrics: Record<string, number>;
}

export interface OpportunityDetectionMetrics {
  detectionTimeMs: number;
  moduleDurations: Record<string, number>;
  opportunityDistribution: Record<OpportunityLevel, number>;
  averageScore: number;
  averageConfidence: number;
  averageRisk: number;
  detectionCount: number;
  rejectedOpportunities: number;
}
