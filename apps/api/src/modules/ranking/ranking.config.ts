import {
  RankingConfig,
  RankingFactorWeights,
  GradeThresholds,
  RecommendationThresholds,
  NormalizationConfig,
  StabilityConfig,
  HistoryConfig,
} from './ranking.types';

export const DEFAULT_FACTOR_WEIGHTS: RankingFactorWeights = {
  opportunityScore: 0.18,
  scannerScore: 0.15,
  confidence: 0.12,
  risk: 0.10,
  trendStrength: 0.06,
  momentum: 0.06,
  sectorStrength: 0.04,
  liquidity: 0.03,
  financialQuality: 0.05,
  growth: 0.04,
  valuation: 0.03,
  providerConfidence: 0.04,
  aggregationQuality: 0.03,
  freshness: 0.03,
  confirmation: 0.02,
  historicalConsistency: 0.02,
  duplicatePenalty: -0.01,
  age: 0.01,
};

export const DEFAULT_GRADE_THRESHOLDS: GradeThresholds = {
  aaa: 90,
  aa: 80,
  a: 70,
  bbb: 60,
  bb: 50,
  b: 40,
  c: 0,
};

export const DEFAULT_RECOMMENDATION_THRESHOLDS: RecommendationThresholds = {
  strongBuy: 85,
  buy: 70,
  watch: 55,
  neutral: 40,
  reduce: 25,
};

export const DEFAULT_NORMALIZATION: NormalizationConfig = {
  mode: 'PERCENTILE',
  zScoreMean: 50,
  zScoreStdDev: 15,
  minMaxMin: 0,
  minMaxMax: 100,
};

export const DEFAULT_STABILITY: StabilityConfig = {
  enabled: true,
  hysteresisThreshold: 3,
  minRankChangeForMove: 2,
  stabilityWindow: 5,
};

export const DEFAULT_HISTORY: HistoryConfig = {
  maxEntries: 50,
  trackBestWorst: true,
  trackAverage: true,
};

export const DEFAULT_RANKING_CONFIG: RankingConfig = {
  factorWeights: DEFAULT_FACTOR_WEIGHTS,
  gradeThresholds: DEFAULT_GRADE_THRESHOLDS,
  recommendationThresholds: DEFAULT_RECOMMENDATION_THRESHOLDS,
  normalization: DEFAULT_NORMALIZATION,
  stability: DEFAULT_STABILITY,
  history: DEFAULT_HISTORY,
  maxResults: 100,
  minScoreThreshold: 10,
  version: '1.0.0',
};
