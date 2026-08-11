import { OpportunityResult, OpportunityLevel, OpportunityType, Priority, OpportunityAge, ConfirmationLevel, SupportingMetric, PenaltyRecord } from '../opportunity-detection/opportunity-detection.types';
import { AggregationMetadata } from '../market-data/aggregation/aggregation.types';

export const SCANNER_VERSION = '1.0.0';

export type ScannerSortMode =
  | 'SCORE_DESC'
  | 'CONFIDENCE_DESC'
  | 'RISK_ASC'
  | 'NEWEST'
  | 'SECTOR'
  | 'ALPHABETICAL'
  | 'CUSTOM';

export type ScannerCategory =
  | 'HOT'
  | 'TRENDING'
  | 'EMERGING'
  | 'RECOVERY'
  | 'UNDERVALUED'
  | 'MOMENTUM'
  | 'INCOME'
  | 'GROWTH'
  | 'SPECULATIVE'
  | 'DEFENSIVE'
  | 'CUSTOM';

export type ScannerGroupBy =
  | 'SECTOR'
  | 'INDUSTRY'
  | 'OPPORTUNITY_TYPE'
  | 'RISK'
  | 'PRIORITY'
  | 'AGE'
  | 'SIGNAL_STRENGTH'
  | 'CATEGORY'
  | 'NONE';

export type WatchlistName =
  | 'ALL'
  | 'TOP_OPPORTUNITIES'
  | 'BREAKOUT_WATCH'
  | 'UNDERVALUED'
  | 'MOMENTUM'
  | 'TREND_REVERSAL'
  | 'GROWTH'
  | 'FINANCIAL_IMPROVEMENT'
  | 'INSTITUTIONAL_INTEREST'
  | 'LOW_RISK'
  | 'HIGH_CONFIDENCE'
  | 'CUSTOM';

export interface ScanHistoryEntry {
  timestamp: string;
  scannerScore: number;
  opportunityScore: number;
  priority: Priority;
  category: ScannerCategory;
  status: ScanStatus;
  firstSeen: string;
}

export type ScanStatus = 'NEW' | 'ACTIVE' | 'DECLINING' | 'EXPIRED' | 'REMOVED';

export interface ScannerFilterConfig {
  minOpportunityScore: number;
  maxOpportunityScore: number;
  minConfidence: number;
  maxRisk: number;
  allowedOpportunityTypes: OpportunityType[];
  allowedSectors: string[];
  minLiquidity: number;
  minMarketCap: number;
  maxVolatility: number;
  minQualityScore: number;
  minAggregationConfidence: number;
  minConfirmationCount: number;
  allowedPriorityLevels: Priority[];
  allowedAgeStatuses: OpportunityAge[];
  allowedConfirmationLevels: ConfirmationLevel[];
  excludeWatchlists: WatchlistName[];
}

export interface ScannerRankingConfig {
  opportunityScoreWeight: number;
  confidenceWeight: number;
  riskWeight: number;
  freshnessWeight: number;
  ageWeight: number;
  providerConfidenceWeight: number;
  aggregationQualityWeight: number;
  aiAnalysisScoreWeight: number;
  financialQualityWeight: number;
  trendStrengthWeight: number;
  momentumWeight: number;
  liquidityWeight: number;
  sectorStrengthWeight: number;
  valuationWeight: number;
  penaltyWeight: number;
  duplicatePenaltyWeight: number;
}

export interface CategoryThresholds {
  hot: number;
  trending: number;
  emerging: number;
  recovery: number;
  undervalued: number;
  momentum: number;
  income: number;
  growth: number;
  speculative: number;
  defensive: number;
}

export interface GroupConfig {
  enabledGroups: ScannerGroupBy[];
  maxGroupSize: number;
  sortWithinGroup: ScannerSortMode;
}

export interface DuplicateMergeConfig {
  timeWindowMs: number;
  scoreThreshold: number;
  mergeStrategy: 'HIGHEST' | 'AVERAGE' | 'MOST_RECENT';
  maxHistory: number;
}

export interface WatchlistConfig {
  name: WatchlistName;
  filters: Partial<ScannerFilterConfig>;
  sortMode: ScannerSortMode;
  maxItems: number;
  autoRefresh: boolean;
  refreshIntervalMs: number;
}

export interface ScannerConfig {
  filters: ScannerFilterConfig;
  ranking: ScannerRankingConfig;
  categoryThresholds: CategoryThresholds;
  groupConfig: GroupConfig;
  duplicateMerge: DuplicateMergeConfig;
  watchlists: WatchlistConfig[];
  sortMode: ScannerSortMode;
  maxResults: number;
  minScoreThreshold: number;
  version: string;
}

export interface ScannerResult {
  symbol: string;
  scannerScore: number;
  opportunityScore: number;
  confidence: number;
  risk: number;
  priority: Priority;
  age: OpportunityAge;
  opportunityLevel: OpportunityLevel;
  opportunityTypes: OpportunityType[];
  category: ScannerCategory;
  recommendation: string;
  reasons: string[];
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  timestamp: string;
  firstSeen: string;
  lastSeen: string;
  status: ScanStatus;
  metadata: ScannerResultMetadata;
}

export interface ScannerResultMetadata {
  scanDurationMs: number;
  filterPassed: boolean;
  filterRejectionReason: string | null;
  duplicateCount: number;
  historyEntries: number;
  scoreDelta: number | null;
  priorityDelta: Priority | null;
  categoryDelta: ScannerCategory | null;
  aggregationQuality: number;
  providerConfidence: number;
  supportingMetrics: SupportingMetric[];
  penalties: PenaltyRecord[];
  scanMode: ScanMode;
}

export type ScanMode = 'FULL' | 'INCREMENTAL' | 'SECTOR' | 'SINGLE' | 'WATCHLIST';

export interface ScannerMetrics {
  scanDurationMs: number;
  candidatesFound: number;
  totalScanned: number;
  rejectedCount: number;
  averageScore: number;
  averageConfidence: number;
  averageRisk: number;
  duplicateCount: number;
  filterStats: FilterStats;
  categoryDistribution: Record<ScannerCategory, number>;
  levelDistribution: Record<OpportunityLevel, number>;
  priorityDistribution: Record<Priority, number>;
  scanMode: ScanMode;
  timestamp: string;
}

export interface FilterStats {
  totalBefore: number;
  totalAfter: number;
  filteredByScore: number;
  filteredByConfidence: number;
  filteredByRisk: number;
  filteredByType: number;
  filteredBySector: number;
  filteredByLiquidity: number;
  filteredByMarketCap: number;
  filteredByVolatility: number;
  filteredByQuality: number;
  filteredByPriority: number;
  filteredByAge: number;
  filteredByConfirmation: number;
  totalFiltered: number;
}
