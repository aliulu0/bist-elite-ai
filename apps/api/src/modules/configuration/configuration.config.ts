import type {
  ConfigDomain,
  DomainConfig,
  ConfigProfileName,
  ConfigProfile,
  ConfigValidationRule,
} from './configuration.types';

export interface ConfigurationEngineConfig {
  maxSnapshots: number;
  maxHistorySize: number;
  maxProfiles: number;
  enableEvents: boolean;
  autoSnapshot: boolean;
}

export const DEFAULT_CONFIGURATION_ENGINE_CONFIG: ConfigurationEngineConfig = {
  maxSnapshots: 100,
  maxHistorySize: 500,
  maxProfiles: 20,
  enableEvents: true,
  autoSnapshot: true,
};

const TECHNICAL_CONFIG: DomainConfig = {
  smaPeriods: [9, 20, 50, 100, 200],
  emaPeriods: [9, 20, 50, 100, 200],
  ichimokuTenkan: 9,
  ichimokuKijun: 26,
  ichimokuSenkouB: 52,
  ichimokuDisplacement: 26,
  rsiPeriod: 14,
  stochRsiPeriod: 14,
  atrPeriod: 14,
  adxPeriod: 14,
  mfiPeriod: 14,
  macdFast: 12,
  macdSlow: 26,
  macdSignal: 9,
  bollingerPeriod: 20,
  bollingerStdDev: 2,
  volumeSmaPeriod: 20,
  cmfPeriod: 20,
  rsiOverbought: 70,
  rsiOversold: 30,
  stochRsiOverbought: 80,
  stochRsiOversold: 20,
  mfiOverbought: 80,
  mfiOversold: 20,
  rocBullishThreshold: 0,
  rocBearishThreshold: 0,
  relativeVolumeHigh: 1.5,
  relativeVolumeLow: 0.5,
  atrHighVolatilityMultiplier: 1.5,
  cmfBullishThreshold: 0,
  cmfBearishThreshold: 0,
  smartMoneyAccumulationThreshold: 0.5,
  smartMoneyDistributionThreshold: 0.5,
  smartMoneyInstitutionalThreshold: 0.5,
  emaAlignmentTolerance: 0,
  smaAlignmentTolerance: 0,
  maxIndicators: 100,
  technicalScoreGradeAPlus: 85,
  technicalScoreGradeA: 75,
  technicalScoreGradeB: 60,
  technicalScoreGradeC: 40,
};

const FINANCIAL_CONFIG: DomainConfig = {
  priceToBookPass: 1.5,
  priceToBookWarning: 3.0,
  evToEbitdaPass: 10,
  evToEbitdaWarning: 15,
  netProfitGrowthPass: 10,
  netProfitGrowthWarning: 0,
  equityGrowthPass: 5,
  equityGrowthWarning: 0,
  debtRatioPass: 0.5,
  debtRatioWarning: 0.7,
  sectorDeviationPass: 20,
  sectorDeviationWarning: 40,
  weightPriceToBook: 20,
  weightEvToEbitda: 20,
  weightNetProfitGrowth: 20,
  weightEquityGrowth: 15,
  weightDebtRatio: 15,
  weightSectorComparison: 10,
  gradeAPlus: 90,
  gradeA: 80,
  gradeB: 70,
  gradeC: 60,
};

const SMART_MONEY_CONFIG: DomainConfig = {
  rsiAccumulationLow: 30,
  rsiAccumulationHigh: 45,
  rsiDistributionLow: 55,
  rsiDistributionHigh: 70,
  obvTrendThreshold: 0,
  volumeSpikeThreshold: 2,
  mfiAccumulation: 20,
  mfiDistribution: 80,
  cmfAccumulation: 0.05,
  cmfDistribution: -0.05,
  compressionSqueeze: 0.02,
  adxStrongTrend: 25,
  weightAccumulation: 0.2,
  weightDistribution: 0.2,
  weightVolume: 0.15,
  weightTrend: 0.15,
  weightMoneyFlow: 0.15,
  weightCompression: 0.1,
  weightInstitutional: 0.1,
};

const OPPORTUNITY_CONFIG: DomainConfig = {
  weightFinancial: 20,
  weightTechnical: 20,
  weightConfluence: 25,
  weightSmartMoney: 20,
  weightMarketStructure: 15,
  levelVeryHigh: 85,
  levelHigh: 70,
  levelMedium: 55,
  levelLow: 40,
  minCandidateScore: 50,
  minConfidence: 0.5,
  financialMinScore: 50,
  financialMinPassed: 2,
  financialMaxFailed: 3,
  technicalMinScore: 50,
  technicalMinPassed: 8,
  confluenceMinScore: 55,
  confluenceMinAgreement: 50,
  smartMoneyMinAccumulation: 30,
  marketStructureMinSupport: 1,
  marketStructureMaxResistance: 2,
};

const CANDIDATE_CONFIG: DomainConfig = {
  weightFinancial: 30,
  weightTechnical: 30,
  weightConfluence: 40,
  scoreMin: 40,
  scoreVeryHigh: 85,
  scoreHigh: 70,
  scoreMedium: 55,
  scoreLow: 40,
  financialMinScore: 50,
  financialMinPassed: 2,
  financialMaxFailed: 3,
  financialMinConfidence: 0.4,
  technicalMinScore: 40,
  technicalMinConfidence: 0.3,
  confluenceMinScore: 45,
  confluenceMinConfidence: 0.3,
};

const CONFLUENCE_CONFIG: DomainConfig = {
  weightFinancial: 25,
  weightTechnical: 30,
  weightSmartMoney: 25,
  weightTrend: 20,
  agreementVeryHigh: 85,
  agreementHigh: 70,
  agreementMedium: 50,
  agreementLow: 30,
  confidenceFinancial: 0.3,
  confidenceTechnical: 0.3,
  confidenceSmartMoney: 0.2,
  confidenceDataCompleteness: 0.2,
  directionBullish: 60,
  directionBearish: 40,
};

const ELITE_SCORE_CONFIG: DomainConfig = {
  weightFinancial: 25,
  weightTechnical: 25,
  weightOpportunity: 20,
  weightConfluence: 15,
  weightCandidate: 15,
  ratingAAA: 90,
  ratingAA: 80,
  ratingA: 70,
  ratingBBB: 60,
  ratingBB: 50,
  ratingB: 40,
  ratingC: 30,
  priorityCritical: 90,
  priorityVeryHigh: 80,
  priorityHigh: 70,
  priorityMedium: 55,
  priorityLow: 40,
};

const WORKFLOW_CONFIG: DomainConfig = {
  maxConcurrentWorkflows: 5,
  maxHistorySize: 200,
  enableEvents: true,
  enablePerformanceTracking: true,
  retryMaxRetriesPerStep: 2,
  retryDelayMs: 60000,
  retryBackoffMultiplier: 2,
  singleStockAnalysisTimeout: 1800000,
  singleStockAnalysisSteps: 13,
  marketScanTimeout: 1800000,
  marketScanSteps: 5,
  backtestTimeout: 5400000,
  backtestSteps: 5,
  optimizationTimeout: 7200000,
  optimizationSteps: 6,
};

const SCHEDULER_CONFIG: DomainConfig = {
  marketOpenScanInterval: 900000,
  marketOpenScanRetries: 3,
  marketOpenScanRetryDelay: 300000,
  incrementalScanInterval: 3600000,
  incrementalScanRetries: 2,
  incrementalScanRetryDelay: 300000,
  nightlyBacktestInterval: 86400000,
  nightlyBacktestRetries: 1,
  nightlyBacktestRetryDelay: 3600000,
  benchmarkInterval: 21600000,
  benchmarkRetries: 2,
  benchmarkRetryDelay: 300000,
  ruleAnalyticsInterval: 43200000,
  ruleAnalyticsRetries: 2,
  ruleAnalyticsRetryDelay: 300000,
  weightOptimizationInterval: 86400000,
  weightOptimizationRetries: 1,
  weightOptimizationRetryDelay: 3600000,
  cacheRefreshInterval: 900000,
  cacheRefreshRetries: 3,
  cacheRefreshRetryDelay: 300000,
  providerHealthCheckInterval: 300000,
  providerHealthCheckRetries: 1,
  providerHealthCheckRetryDelay: 300000,
  maxHistoryPerJob: 100,
  maxConsecutiveFailures: 5,
};

const PROVIDERS_CONFIG: DomainConfig = {
  yahooFinanceEnabled: true,
  yahooFinancePriority: 1,
  yahooFinanceTimeout: 10000,
  yahooFinanceRetries: 3,
  fintablesEnabled: true,
  fintablesPriority: 2,
  fintablesTimeout: 15000,
  fintablesRetries: 2,
  investingEnabled: false,
  investingPriority: 3,
  investingTimeout: 10000,
  investingRetries: 2,
  googleDiscoveryEnabled: false,
  googleDiscoveryPriority: 4,
  googleDiscoveryTimeout: 10000,
  googleDiscoveryRetries: 2,
  primaryProvider: 'yahoo_finance',
  fallbackEnabled: true,
  cacheEnabled: true,
  cacheTtlMs: 300000,
};

const SCANNER_CONFIG: DomainConfig = {
  maxTopCandidates: 10,
  maxWatchlist: 20,
  minEliteScore: 60,
  minOpportunityScore: 40,
  minCandidateScore: 50,
  minConfidence: 0.5,
  watchlistEliteThreshold: 45,
  watchlistOpportunityThreshold: 25,
  compositeWeightElite: 0.35,
  compositeWeightOpportunity: 0.25,
  compositeWeightCandidate: 0.15,
  compositeWeightFinancial: 0.1,
  compositeWeightTechnical: 0.08,
  compositeWeightSmartMoney: 0.07,
};

const BACKTEST_CONFIG: DomainConfig = {
  entrySignal: 'ALWAYS',
  entryThreshold: 0,
  exitSignal: 'HOLD_UNTIL_END',
  stopLossPercent: 5,
  takeProfitPercent: 15,
  trailingStopPercent: 10,
  maxHoldingDays: 365,
  initialCapital: 100000,
  positionSizePercent: 100,
  riskFreeRate: 15,
  tradingDaysPerYear: 252,
  minTradesRequired: 5,
  validationMaxHighLowRangeRatio: 50,
  validationRequireAscendingTimestamps: true,
  validationExpectedInterval: '1day',
  validationAllowGaps: true,
  validationMaxGapMultiplier: 3,
  validationSplitDetectionEnabled: true,
  validationSplitPriceChangeThreshold: 40,
  validationMinDataPoints: 30,
  validationMinCompleteness: 90,
};

const BENCHMARK_CONFIG: DomainConfig = {
  riskFreeRate: 15,
  tradingDaysPerYear: 252,
  minDataPoints: 5,
  benchmarkWeight: 1.0,
  sectorWeight: 1.0,
};

const PERFORMANCE_MONITOR_CONFIG: DomainConfig = {
  maxEntriesPerName: 1000,
  retentionWindowMs: 3600000,
  p95WarningMs: 500,
  p95CriticalMs: 2000,
  cacheHitRateWarning: 70,
  cacheHitRateCritical: 50,
  memoryWarningMb: 50,
  memoryCriticalMb: 100,
};

export const DEFAULT_DOMAIN_CONFIGS: Record<ConfigDomain, DomainConfig> = {
  technical: TECHNICAL_CONFIG,
  financial: FINANCIAL_CONFIG,
  smart_money: SMART_MONEY_CONFIG,
  opportunity: OPPORTUNITY_CONFIG,
  candidate: CANDIDATE_CONFIG,
  confluence: CONFLUENCE_CONFIG,
  elite_score: ELITE_SCORE_CONFIG,
  workflow: WORKFLOW_CONFIG,
  scheduler: SCHEDULER_CONFIG,
  providers: PROVIDERS_CONFIG,
  scanner: SCANNER_CONFIG,
  backtest: BACKTEST_CONFIG,
  benchmark: BENCHMARK_CONFIG,
  performance_monitor: PERFORMANCE_MONITOR_CONFIG,
};

export const ALL_DOMAINS: ConfigDomain[] = [
  'technical',
  'financial',
  'smart_money',
  'opportunity',
  'candidate',
  'confluence',
  'elite_score',
  'workflow',
  'scheduler',
  'providers',
  'scanner',
  'backtest',
  'benchmark',
  'performance_monitor',
];

export const DEFAULT_VALIDATION_RULES: ConfigValidationRule[] = [
  { domain: 'technical', key: 'rsiPeriod', type: 'positive', message: 'RSI period must be > 0' },
  { domain: 'technical', key: 'rsiOverbought', type: 'range', params: { min: 50, max: 100 }, message: 'RSI overbought must be 50-100' },
  { domain: 'technical', key: 'rsiOversold', type: 'range', params: { min: 0, max: 50 }, message: 'RSI oversold must be 0-50' },
  { domain: 'technical', key: 'macdFast', type: 'positive', message: 'MACD fast must be > 0' },
  { domain: 'technical', key: 'macdSlow', type: 'positive', message: 'MACD slow must be > 0' },
  { domain: 'technical', key: 'maxIndicators', type: 'positive', message: 'Max indicators must be > 0' },

  { domain: 'financial', key: 'priceToBookPass', type: 'positive', message: 'Price to book pass must be > 0' },
  { domain: 'financial', key: 'evToEbitdaPass', type: 'positive', message: 'EV/EBITDA pass must be > 0' },
  { domain: 'financial', key: 'debtRatioPass', type: 'range', params: { min: 0, max: 1 }, message: 'Debt ratio must be 0-1' },

  { domain: 'opportunity', key: 'weightFinancial', type: 'range', params: { min: 0, max: 100 }, message: 'Opportunity financial weight must be 0-100' },
  { domain: 'opportunity', key: 'weightTechnical', type: 'range', params: { min: 0, max: 100 }, message: 'Opportunity technical weight must be 0-100' },
  { domain: 'opportunity', key: 'weightConfluence', type: 'range', params: { min: 0, max: 100 }, message: 'Opportunity confluence weight must be 0-100' },
  { domain: 'opportunity', key: 'weightSmartMoney', type: 'range', params: { min: 0, max: 100 }, message: 'Opportunity smart money weight must be 0-100' },
  { domain: 'opportunity', key: 'weightMarketStructure', type: 'range', params: { min: 0, max: 100 }, message: 'Opportunity market structure weight must be 0-100' },
  { domain: 'opportunity', key: 'levelVeryHigh', type: 'range', params: { min: 0, max: 100 }, message: 'Very high level must be 0-100' },
  { domain: 'opportunity', key: 'minConfidence', type: 'range', params: { min: 0, max: 1 }, message: 'Min confidence must be 0-1' },

  { domain: 'elite_score', key: 'weightFinancial', type: 'range', params: { min: 0, max: 100 }, message: 'Elite financial weight must be 0-100' },
  { domain: 'elite_score', key: 'weightTechnical', type: 'range', params: { min: 0, max: 100 }, message: 'Elite technical weight must be 0-100' },
  { domain: 'elite_score', key: 'weightOpportunity', type: 'range', params: { min: 0, max: 100 }, message: 'Elite opportunity weight must be 0-100' },
  { domain: 'elite_score', key: 'weightConfluence', type: 'range', params: { min: 0, max: 100 }, message: 'Elite confluence weight must be 0-100' },
  { domain: 'elite_score', key: 'weightCandidate', type: 'range', params: { min: 0, max: 100 }, message: 'Elite candidate weight must be 0-100' },

  { domain: 'candidate', key: 'weightFinancial', type: 'range', params: { min: 0, max: 100 }, message: 'Candidate financial weight must be 0-100' },
  { domain: 'candidate', key: 'weightTechnical', type: 'range', params: { min: 0, max: 100 }, message: 'Candidate technical weight must be 0-100' },
  { domain: 'candidate', key: 'weightConfluence', type: 'range', params: { min: 0, max: 100 }, message: 'Candidate confluence weight must be 0-100' },

  { domain: 'confluence', key: 'weightFinancial', type: 'range', params: { min: 0, max: 100 }, message: 'Confluence financial weight must be 0-100' },
  { domain: 'confluence', key: 'weightTechnical', type: 'range', params: { min: 0, max: 100 }, message: 'Confluence technical weight must be 0-100' },
  { domain: 'confluence', key: 'weightSmartMoney', type: 'range', params: { min: 0, max: 100 }, message: 'Confluence smart money weight must be 0-100' },
  { domain: 'confluence', key: 'weightTrend', type: 'range', params: { min: 0, max: 100 }, message: 'Confluence trend weight must be 0-100' },

  { domain: 'workflow', key: 'maxConcurrentWorkflows', type: 'positive', message: 'Max concurrent workflows must be > 0' },
  { domain: 'workflow', key: 'retryMaxRetriesPerStep', type: 'non_negative', message: 'Max retries must be >= 0' },
  { domain: 'workflow', key: 'retryDelayMs', type: 'positive', message: 'Retry delay must be > 0' },

  { domain: 'scheduler', key: 'maxHistoryPerJob', type: 'positive', message: 'Max history per job must be > 0' },
  { domain: 'scheduler', key: 'maxConsecutiveFailures', type: 'positive', message: 'Max consecutive failures must be > 0' },

  { domain: 'providers', key: 'yahooFinancePriority', type: 'positive', message: 'Yahoo Finance priority must be > 0' },
  { domain: 'providers', key: 'fintablesPriority', type: 'positive', message: 'Fintables priority must be > 0' },
  { domain: 'providers', key: 'cacheTtlMs', type: 'positive', message: 'Cache TTL must be > 0' },

  { domain: 'scanner', key: 'maxTopCandidates', type: 'positive', message: 'Max top candidates must be > 0' },
  { domain: 'scanner', key: 'minConfidence', type: 'range', params: { min: 0, max: 1 }, message: 'Scanner min confidence must be 0-1' },

  { domain: 'backtest', key: 'stopLossPercent', type: 'non_negative', message: 'Stop loss must be >= 0' },
  { domain: 'backtest', key: 'takeProfitPercent', type: 'non_negative', message: 'Take profit must be >= 0' },
  { domain: 'backtest', key: 'initialCapital', type: 'positive', message: 'Initial capital must be > 0' },
  { domain: 'backtest', key: 'riskFreeRate', type: 'non_negative', message: 'Risk free rate must be >= 0' },
  { domain: 'backtest', key: 'tradingDaysPerYear', type: 'positive', message: 'Trading days per year must be > 0' },
  { domain: 'backtest', key: 'minTradesRequired', type: 'positive', message: 'Min trades required must be > 0' },

  { domain: 'benchmark', key: 'riskFreeRate', type: 'non_negative', message: 'Benchmark risk free rate must be >= 0' },
  { domain: 'benchmark', key: 'tradingDaysPerYear', type: 'positive', message: 'Trading days per year must be > 0' },
  { domain: 'benchmark', key: 'minDataPoints', type: 'positive', message: 'Min data points must be > 0' },

  { domain: 'performance_monitor', key: 'maxEntriesPerName', type: 'positive', message: 'Max entries per name must be > 0' },
  { domain: 'performance_monitor', key: 'retentionWindowMs', type: 'positive', message: 'Retention window must be > 0' },
];

const DEFAULT_TECHNICAL: DomainConfig = { ...TECHNICAL_CONFIG };
const BALANCED_TECHNICAL: DomainConfig = { ...TECHNICAL_CONFIG, rsiOverbought: 75, rsiOversold: 25 };
const AGGRESSIVE_TECHNICAL: DomainConfig = { ...TECHNICAL_CONFIG, rsiOverbought: 80, rsiOversold: 20 };
const CONSERVATIVE_TECHNICAL: DomainConfig = { ...TECHNICAL_CONFIG, rsiOverbought: 65, rsiOversold: 35 };

function buildProfile(
  id: string,
  name: ConfigProfileName,
  label: string,
  description: string,
  overrides: Partial<Record<ConfigDomain, DomainConfig>>,
  isSystem = true,
): ConfigProfile {
  const configs = {} as Record<ConfigDomain, DomainConfig>;
  for (const domain of ALL_DOMAINS) {
    configs[domain] = overrides[domain] ?? { ...DEFAULT_DOMAIN_CONFIGS[domain] };
  }
  return { id, name, label, description, configs, createdAt: new Date().toISOString(), isSystem };
}

export const DEFAULT_PROFILES: ConfigProfile[] = [
  buildProfile('profile-default', 'default', 'Default', 'Standard configuration for all domains', {}),
  buildProfile('profile-balanced', 'balanced', 'Balanced', 'Balanced configuration with moderate thresholds', {
    technical: BALANCED_TECHNICAL,
  }),
  buildProfile('profile-aggressive', 'aggressive', 'Aggressive', 'Aggressive thresholds for higher sensitivity', {
    technical: AGGRESSIVE_TECHNICAL,
  }),
  buildProfile('profile-conservative', 'conservative', 'Conservative', 'Conservative thresholds for fewer signals', {
    technical: CONSERVATIVE_TECHNICAL,
  }),
];
