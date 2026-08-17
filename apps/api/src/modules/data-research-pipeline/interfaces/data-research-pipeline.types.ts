import { ProviderDashboardEntry } from '../../market-data/orchestrator/market-data-orchestrator';

export type DataProviderName =
  | 'fintables'
  | 'yahoo'
  | 'kap'
  | 'tcmb'
  | 'mkk'
  | 'serpapi'
  | 'google-news'
  | 'google-search'
  | 'agent-reach'
  | 'yahoo-finance'
  | 'chatgpt'
  | 'gemini'
  | 'perplexity'
  | 'grok';

export type DataProviderCategory =
  | 'market-data'
  | 'fundamental'
  | 'news'
  | 'search'
  | 'research'
  | 'macro'
  | 'regulatory'
  | 'technical';

export type FreshnessState = 'FRESH' | 'ACCEPTABLE' | 'STALE' | 'UNAVAILABLE';

export interface ProviderHealthEntry {
  name: DataProviderName;
  category: DataProviderCategory;
  enabled: boolean;
  configured: boolean;
  lastSuccessfulRequest: string | null;
  lastError: string | null;
  requestCount: number;
  errorCount: number;
  avgLatencyMs: number;
  lastSync: string | null;
  dataFreshness: DataFreshnessInfo;
  circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  authConfigured: boolean;
}

export interface DataFreshnessInfo {
  source: DataProviderName;
  fetchedAt: string | null;
  dataTimestamp: string | null;
  ageSeconds: number | null;
  freshnessState: FreshnessState;
  stalenessThresholdSeconds: number;
}

export type SourceQualityTier = 'TIER_1' | 'TIER_2' | 'TIER_3' | 'UNKNOWN';

export interface SourceQualityEntry {
  provider: DataProviderName;
  tier: SourceQualityTier;
  description: string;
  isOfficial: boolean;
  reliabilityScore: number;
  lastVerified: string | null;
}

export interface ResearchEvidence {
  id: string;
  ticker: string;
  title: string;
  source: DataProviderName;
  sourceTier: SourceQualityTier;
  url: string | null;
  publishedAt: string | null;
  fetchedAt: string;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  relevance: number;
  evidenceType: ResearchEvidenceType;
  credibility: number;
  contentHash: string;
  metadata: Record<string, unknown>;
}

export type ResearchEvidenceType =
  | 'NEWS'
  | 'DISCLOSURE'
  | 'FINANCIAL_REPORT'
  | 'ANALYST_REPORT'
  | 'COMPANY_ANNOUNCEMENT'
  | 'MACRO_INDICATOR'
  | 'TECHNICAL_SIGNAL'
  | 'INSIDER_TRANSACTION'
  | 'SHAREHOLDER_ACTION'
  | 'REGULATORY_FILING'
  | 'EARNINGS_REPORT'
  | 'DIVIDEND_ANNOUNCEMENT'
  | 'CORPORATE_ACTION'
  | 'MANAGEMENT_CHANGE'
  | 'PARTNERSHIP'
  | 'ACQUISITION'
  | 'INVESTMENT'
  | 'CAPACITY_EXPANSION'
  | 'NEW_PRODUCT'
  | 'REGULATORY_CHANGE'
  | 'SECTOR_TAILWIND'
  | 'MAJOR_ORDER'
  | 'EARNINGS_INFLECTION'
  | 'EXPORT_AGREEMENT'
  | 'PRODUCT_LAUNCH'
  | 'NEW_CONTRACT'
  | 'NEW_FACILITY'
  | 'OTHER';

export interface StoryEvidence extends ResearchEvidence {
  storyType: StoryType;
  storyStrength: 'WEAK' | 'MODERATE' | 'STRONG' | 'VERIFIED';
  supportingEvidenceIds: string[];
}

export type StoryType =
  | 'NEW_CONTRACT'
  | 'MAJOR_INVESTMENT'
  | 'CAPACITY_EXPANSION'
  | 'NEW_FACILITY'
  | 'EXPORT_AGREEMENT'
  | 'STRATEGIC_PARTNERSHIP'
  | 'ACQUISITION'
  | 'PRODUCT_LAUNCH'
  | 'REGULATORY_CHANGE'
  | 'SECTOR_TAILWIND'
  | 'MAJOR_ORDER'
  | 'EARNINGS_INFLECTION'
  | 'MANAGEMENT_ACTION'
  | 'OTHER';

export interface DataQualityFlag {
  ticker: string;
  timeframe: string;
  flagType: DataQualityFlagType;
  severity: 'WARNING' | 'ERROR';
  message: string;
  affectedFields: string[];
  detectedAt: string;
}

export type DataQualityFlagType =
  | 'MISSING_OHLCV'
  | 'INVALID_OHLC_RELATIONSHIP'
  | 'NEGATIVE_VOLUME'
  | 'DUPLICATE_TIMESTAMP'
  | 'UNSORTED_TIMESTAMPS'
  | 'ABNORMAL_GAP'
  | 'INSUFFICIENT_HISTORY'
  | 'STALE_DATA'
  | 'ANOMALOUS_PRICE';

export interface MTFDataCoverageEntry {
  ticker: string;
  timeframe: string;
  available: boolean;
  derived: boolean;
  sourceTimeframe: string | null;
  dataAge: number | null;
  sourceProvider: DataProviderName | null;
}

export interface IndicatorCoverageEntry {
  indicatorName: string;
  available: boolean;
  timeframes: string[];
  source: 'builtin' | 'python-ta' | 'ta-lib' | 'custom';
  lastComputed: string | null;
}

export interface VectorBTAdapterStatus {
  available: boolean;
  version: string | null;
  capabilities: string[];
  integrationPath: string | null;
}

export interface DataResearchPipelineConfig {
  freshnessThresholds: {
    FRESH_SECONDS: number;
    ACCEPTABLE_SECONDS: number;
    STALE_SECONDS: number;
  };
  sourceQualityTiers: Record<DataProviderName, SourceQualityTier>;
  dataQualityChecks: {
    enabled: boolean;
    validateOHLCV: boolean;
    validateTimestamps: boolean;
    validateVolume: boolean;
    validateHistory: boolean;
    minHistoryPoints: number;
  };
  freshnessThresholdsByCategory: Record<
    DataProviderCategory,
    {
      freshSeconds: number;
      acceptableSeconds: number;
      staleSeconds: number;
    }
  >;
}

export interface DataHealthReport {
  providers: ProviderHealthEntry[];
  overallHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  generatedAt: string;
  summary: {
    totalProviders: number;
    healthyProviders: number;
    degradedProviders: number;
    unavailableProviders: number;
    missingApiKeys: number;
  };
}

export interface DataFreshnessReport {
  freshness: DataFreshnessInfo[];
  overallFreshness: FreshnessState;
  generatedAt: string;
}

export interface SourceQualityReport {
  sources: SourceQualityEntry[];
  generatedAt: string;
}

export interface ResearchEvidenceReport {
  ticker: string;
  evidence: ResearchEvidence[];
  stories: StoryEvidence[];
  generatedAt: string;
  summary: {
    totalEvidence: number;
    tier1Evidence: number;
    tier2Evidence: number;
    tier3Evidence: number;
    verifiedStories: number;
  };
}

export interface DataQualityReport {
  ticker: string;
  flags: DataQualityFlag[];
  overallQuality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  generatedAt: string;
}

export interface MTFCoverageReport {
  coverage: MTFDataCoverageEntry[];
  summary: {
    totalChecked: number;
    available: number;
    derived: number;
    unavailable: number;
  };
  generatedAt: string;
}

export interface IndicatorCoverageReport {
  indicators: IndicatorCoverageEntry[];
  summary: {
    total: number;
    available: number;
    bySource: Record<string, number>;
  };
  generatedAt: string;
}

export interface AgentReachAdapterStatus {
  available: boolean;
  lastSync: string | null;
  lastError: string | null;
  quotaUsed: number | null;
  quotaLimit: number | null;
}

export interface VectorBTAdapterReport {
  status: VectorBTAdapterStatus;
  generatedAt: string;
}

export const DEFAULT_FRESHNESS_THRESHOLDS = {
  FRESH_SECONDS: 300, // 5 minutes
  ACCEPTABLE_SECONDS: 1800, // 30 minutes
  STALE_SECONDS: 7200, // 2 hours
};

export const DEFAULT_SOURCE_QUALITY_TIERS: Record<DataProviderName, SourceQualityTier> = {
  fintables: 'TIER_1',
  yahoo: 'TIER_2',
  kap: 'TIER_1',
  tcmb: 'TIER_1',
  mkk: 'TIER_1',
  serpapi: 'TIER_3',
  'google-news': 'TIER_3',
  'google-search': 'TIER_3',
  'agent-reach': 'TIER_3',
  'yahoo-finance': 'TIER_2',
  chatgpt: 'TIER_3',
  gemini: 'TIER_3',
  perplexity: 'TIER_3',
  grok: 'TIER_3',
};

export const FRESHNESS_THRESHOLDS_BY_CATEGORY: Record<
  DataProviderCategory,
  { freshSeconds: number; acceptableSeconds: number; staleSeconds: number }
> = {
  'market-data': { freshSeconds: 60, acceptableSeconds: 300, staleSeconds: 1800 },
  fundamental: { freshSeconds: 3600, acceptableSeconds: 86400, staleSeconds: 604800 },
  news: { freshSeconds: 300, acceptableSeconds: 1800, staleSeconds: 7200 },
  search: { freshSeconds: 300, acceptableSeconds: 1800, staleSeconds: 7200 },
  research: { freshSeconds: 1800, acceptableSeconds: 3600, staleSeconds: 86400 },
  macro: { freshSeconds: 3600, acceptableSeconds: 86400, staleSeconds: 604800 },
  regulatory: { freshSeconds: 300, acceptableSeconds: 1800, staleSeconds: 7200 },
  technical: { freshSeconds: 60, acceptableSeconds: 300, staleSeconds: 1800 },
};

export const STORY_TYPE_KEYWORDS: Record<StoryType, string[]> = {
  NEW_CONTRACT: ['yeni sözleşme', 'sözleşme imzalandı', 'new contract', 'contract signed'],
  MAJOR_INVESTMENT: ['büyük yatırım', 'büyük yatırım', 'major investment', 'investment announced'],
  CAPACITY_EXPANSION: [
    'kapasite genişletme',
    'kapasite artırılıyor',
    'capacity expansion',
    'expanding capacity',
  ],
  NEW_FACILITY: ['yeni tesis', 'yeni fabrika', 'new facility', 'new plant'],
  EXPORT_AGREEMENT: ['ihracat anlaşması', 'ihracat sözleşmesi', 'export agreement', 'export deal'],
  STRATEGIC_PARTNERSHIP: [
    'stratejik ortaklık',
    'stratejik işbirliği',
    'strategic partnership',
    'strategic alliance',
  ],
  ACQUISITION: ['satın alma', 'devralma', 'acquisition', 'acquired'],
  PRODUCT_LAUNCH: ['ürün lansmanı', 'yeni ürün', 'product launch', 'new product'],
  REGULATORY_CHANGE: [
    'düzenleme değişikliği',
    'yasa değişikliği',
    'regulatory change',
    'regulation change',
  ],
  SECTOR_TAILWIND: ['sektör rüzgarı', 'sektörde büyüme', 'sector tailwind', 'sector growth'],
  MAJOR_ORDER: ['büyük sipariş', 'büyük tedarik', 'major order', 'large order'],
  EARNINGS_INFLECTION: [
    'kazanç kırılımı',
    'karlılık değişimi',
    'earnings inflection',
    'earnings turn',
  ],
  MANAGEMENT_ACTION: ['yönetim kararı', 'yönetim kurulu', 'management action', 'board decision'],
  OTHER: ['diğer', 'other'],
};

export const DATA_QUALITY_CHECK_DEFAULTS = {
  validateOHLCV: true,
  validateTimestamps: true,
  validateVolume: true,
  validateHistory: true,
  minHistoryPoints: 100,
};

export const DEFAULT_RESEARCH_EVIDENCE_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const DEFAULT_PROVIDER_HEALTH_TTL_MS = 60 * 1000; // 1 minute
export const DEFAULT_FRESHNESS_TTL_MS = 30 * 1000; // 30 seconds
