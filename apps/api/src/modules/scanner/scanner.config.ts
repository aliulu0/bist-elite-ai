import {
  ScannerConfig,
  ScannerFilterConfig,
  ScannerRankingConfig,
  CategoryThresholds,
  GroupConfig,
  DuplicateMergeConfig,
  WatchlistConfig,
} from './scanner.types';

export const DEFAULT_SCANNER_FILTERS: ScannerFilterConfig = {
  minOpportunityScore: 30,
  maxOpportunityScore: 100,
  minConfidence: 40,
  maxRisk: 80,
  allowedOpportunityTypes: [],
  allowedSectors: [],
  minLiquidity: 0,
  minMarketCap: 0,
  maxVolatility: 100,
  minQualityScore: 0,
  minAggregationConfidence: 0,
  minConfirmationCount: 0,
  allowedPriorityLevels: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
  allowedAgeStatuses: ['NEW', 'GROWING', 'STABLE'],
  allowedConfirmationLevels: ['NONE', 'SINGLE', 'DOUBLE', 'TRIPLE', 'MULTI'],
  excludeWatchlists: [],
};

export const DEFAULT_SCANNER_RANKING: ScannerRankingConfig = {
  opportunityScoreWeight: 0.25,
  confidenceWeight: 0.15,
  riskWeight: 0.10,
  freshnessWeight: 0.08,
  ageWeight: 0.05,
  providerConfidenceWeight: 0.07,
  aggregationQualityWeight: 0.05,
  aiAnalysisScoreWeight: 0.08,
  financialQualityWeight: 0.04,
  trendStrengthWeight: 0.04,
  momentumWeight: 0.04,
  liquidityWeight: 0.02,
  sectorStrengthWeight: 0.02,
  valuationWeight: 0.01,
  penaltyWeight: -0.01,
  duplicatePenaltyWeight: -0.02,
};

export const DEFAULT_CATEGORY_THRESHOLDS: CategoryThresholds = {
  hot: 85,
  trending: 75,
  emerging: 60,
  recovery: 55,
  undervalued: 50,
  momentum: 65,
  income: 45,
  growth: 60,
  speculative: 40,
  defensive: 35,
};

export const DEFAULT_GROUP_CONFIG: GroupConfig = {
  enabledGroups: ['NONE'],
  maxGroupSize: 50,
  sortWithinGroup: 'SCORE_DESC',
};

export const DEFAULT_DUPLICATE_MERGE: DuplicateMergeConfig = {
  timeWindowMs: 60 * 60 * 1000,
  scoreThreshold: 10,
  mergeStrategy: 'HIGHEST',
  maxHistory: 50,
};

export const DEFAULT_WATCHLISTS: WatchlistConfig[] = [
  {
    name: 'ALL',
    filters: {},
    sortMode: 'SCORE_DESC',
    maxItems: 500,
    autoRefresh: true,
    refreshIntervalMs: 60 * 60 * 1000,
  },
  {
    name: 'TOP_OPPORTUNITIES',
    filters: { minOpportunityScore: 70, allowedPriorityLevels: ['CRITICAL', 'HIGH'] },
    sortMode: 'SCORE_DESC',
    maxItems: 50,
    autoRefresh: true,
    refreshIntervalMs: 30 * 60 * 1000,
  },
  {
    name: 'BREAKOUT_WATCH',
    filters: { allowedOpportunityTypes: ['MOMENTUM_BREAKOUT', 'VOLUME_EXPANSION'] },
    sortMode: 'SCORE_DESC',
    maxItems: 30,
    autoRefresh: true,
    refreshIntervalMs: 15 * 60 * 1000,
  },
  {
    name: 'UNDERVALUED',
    filters: { allowedOpportunityTypes: ['UNDERVALUATION'] },
    sortMode: 'SCORE_DESC',
    maxItems: 30,
    autoRefresh: true,
    refreshIntervalMs: 60 * 60 * 1000,
  },
  {
    name: 'MOMENTUM',
    filters: { allowedOpportunityTypes: ['MOMENTUM_BREAKOUT'] },
    sortMode: 'SCORE_DESC',
    maxItems: 30,
    autoRefresh: true,
    refreshIntervalMs: 15 * 60 * 1000,
  },
  {
    name: 'TREND_REVERSAL',
    filters: { allowedOpportunityTypes: ['TREND_REVERSAL'] },
    sortMode: 'SCORE_DESC',
    maxItems: 30,
    autoRefresh: true,
    refreshIntervalMs: 30 * 60 * 1000,
  },
  {
    name: 'GROWTH',
    filters: { allowedOpportunityTypes: ['FUNDAMENTAL_IMPROVEMENT'] },
    sortMode: 'SCORE_DESC',
    maxItems: 30,
    autoRefresh: true,
    refreshIntervalMs: 60 * 60 * 1000,
  },
  {
    name: 'INSTITUTIONAL_INTEREST',
    filters: { allowedOpportunityTypes: ['INSTITUTIONAL_ACCUMULATION'] },
    sortMode: 'SCORE_DESC',
    maxItems: 30,
    autoRefresh: true,
    refreshIntervalMs: 60 * 60 * 1000,
  },
  {
    name: 'LOW_RISK',
    filters: { maxRisk: 30, minConfidence: 60 },
    sortMode: 'RISK_ASC',
    maxItems: 30,
    autoRefresh: true,
    refreshIntervalMs: 60 * 60 * 1000,
  },
  {
    name: 'HIGH_CONFIDENCE',
    filters: { minConfidence: 75 },
    sortMode: 'CONFIDENCE_DESC',
    maxItems: 30,
    autoRefresh: true,
    refreshIntervalMs: 30 * 60 * 1000,
  },
];

export const DEFAULT_SCANNER_CONFIG: ScannerConfig = {
  filters: DEFAULT_SCANNER_FILTERS,
  ranking: DEFAULT_SCANNER_RANKING,
  categoryThresholds: DEFAULT_CATEGORY_THRESHOLDS,
  groupConfig: DEFAULT_GROUP_CONFIG,
  duplicateMerge: DEFAULT_DUPLICATE_MERGE,
  watchlists: DEFAULT_WATCHLISTS,
  sortMode: 'SCORE_DESC',
  maxResults: 100,
  minScoreThreshold: 15,
  version: '1.0.0',
};
