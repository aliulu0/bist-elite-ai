import { ScannerResult, ScannerCategory } from '../scanner/scanner.types';
import {
  OpportunityLevel,
  OpportunityType,
  Priority,
  OpportunityAge,
  ConfirmationLevel,
  SupportingMetric,
} from '../opportunity-detection/opportunity-detection.types';

export const RANKING_VERSION = '1.0.0';

export type InvestmentGrade = 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'C' | 'REJECT';

export type RankingRecommendation =
  | 'STRONG_BUY'
  | 'BUY'
  | 'WATCH'
  | 'NEUTRAL'
  | 'REDUCE'
  | 'AVOID';

export type NormalizationMode = 'PERCENTILE' | 'Z_SCORE' | 'MIN_MAX';

export type RankingTrend = 'IMPROVING' | 'STABLE' | 'DECLINING' | 'NEW';

export type ComparisonView =
  | 'TOP_GAINERS'
  | 'TOP_LOSERS'
  | 'MOST_IMPROVED'
  | 'MOST_CONSISTENT'
  | 'HIGHEST_CONFIDENCE'
  | 'LOWEST_RISK'
  | 'HIGHEST_GROWTH'
  | 'HIGHEST_VALUE';

export interface RankingFactorWeights {
  opportunityScore: number;
  scannerScore: number;
  confidence: number;
  risk: number;
  trendStrength: number;
  momentum: number;
  sectorStrength: number;
  liquidity: number;
  financialQuality: number;
  growth: number;
  valuation: number;
  providerConfidence: number;
  aggregationQuality: number;
  freshness: number;
  confirmation: number;
  historicalConsistency: number;
  duplicatePenalty: number;
  age: number;
}

export interface GradeThresholds {
  aaa: number;
  aa: number;
  a: number;
  bbb: number;
  bb: number;
  b: number;
  c: number;
}

export interface RecommendationThresholds {
  strongBuy: number;
  buy: number;
  watch: number;
  neutral: number;
  reduce: number;
}

export interface NormalizationConfig {
  mode: NormalizationMode;
  zScoreMean: number;
  zScoreStdDev: number;
  minMaxMin: number;
  minMaxMax: number;
}

export interface StabilityConfig {
  enabled: boolean;
  hysteresisThreshold: number;
  minRankChangeForMove: number;
  stabilityWindow: number;
}

export interface HistoryConfig {
  maxEntries: number;
  trackBestWorst: boolean;
  trackAverage: boolean;
}

export interface RankingConfig {
  factorWeights: RankingFactorWeights;
  gradeThresholds: GradeThresholds;
  recommendationThresholds: RecommendationThresholds;
  normalization: NormalizationConfig;
  stability: StabilityConfig;
  history: HistoryConfig;
  maxResults: number;
  minScoreThreshold: number;
  version: string;
}

export interface RankedOpportunity {
  symbol: string;
  rank: number;
  rankingScore: number;
  scannerScore: number;
  opportunityScore: number;
  confidence: number;
  priority: Priority;
  risk: number;
  expectedReturnEstimate: number;
  riskRewardRatio: number;
  investmentGrade: InvestmentGrade;
  recommendation: RankingRecommendation;
  recommendationExplanation: string;
  reasons: string[];
  rankingFactors: RankingFactor[];
  timestamp: string;
  firstSeen: string;
  lastSeen: string;
  metadata: RankedOpportunityMetadata;
}

export interface RankingFactor {
  name: string;
  rawValue: number;
  normalizedValue: number;
  weight: number;
  contribution: number;
  description: string;
}

export interface RankedOpportunityMetadata {
  rankingDurationMs: number;
  previousRank: number | null;
  rankChange: number | null;
  bestRank: number;
  worstRank: number;
  averageRank: number;
  rankingTrend: RankingTrend;
  historyEntries: number;
  normalizedScore: number;
  gradeDistribution: Record<InvestmentGrade, number>;
  recommendationDistribution: Record<RankingRecommendation, number>;
}

export interface RankHistoryEntry {
  timestamp: string;
  rank: number;
  rankingScore: number;
  grade: InvestmentGrade;
  recommendation: RankingRecommendation;
}

export interface RankingMetrics {
  rankingDurationMs: number;
  totalRanked: number;
  averageRankingScore: number;
  averageRank: number;
  gradeDistribution: Record<InvestmentGrade, number>;
  recommendationDistribution: Record<RankingRecommendation, number>;
  rankChangeDistribution: Record<string, number>;
  topMovers: TopMover[];
  timestamp: string;
}

export interface TopMover {
  symbol: string;
  rankChange: number;
  scoreChange: number;
  direction: 'UP' | 'DOWN' | 'NEW';
}
