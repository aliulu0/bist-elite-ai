import { EliteScoreRating, EliteScorePriority } from '../elite-score/elite-score.types';
import { OpportunityLevel } from '../opportunity/opportunity.types';
import { CandidatePriority } from '../candidate/candidate.types';
import { Timeframe } from '../market-data/interfaces';

export type SymbolStatus = 'TOP_CANDIDATE' | 'WATCHLIST' | 'REJECTED';

export type DataStatus = 'AVAILABLE' | 'PARTIALLY_AVAILABLE' | 'UNAVAILABLE';

export interface ScannerProvenance {
  symbol: string;
  provider: string;
  timeframe: Timeframe;
  retrievedAt: string;
  marketTimestamp: string;
  source: 'REAL' | 'DERIVED' | 'UNAVAILABLE';
  validationStatus: 'VALID' | 'PARTIAL' | 'INVALID';
}

export interface ScannerResult {
  symbol: string;
  providerSymbol: string;
  timeframe: Timeframe;

  currentPrice: number | null;
  priceChange1D: number | null;
  priceChange5D: number | null;
  priceChange20D: number | null;
  priceChange60D: number | null;

  volume20Average: number | null;
  volume50Average: number | null;
  relativeVolume20: number | null;
  relativeVolume50: number | null;
  volumeSpike: boolean | null;

  sma9: number | null;
  sma20: number | null;
  sma50: number | null;

  rsi14: number | null;

  macd: { macd: number | null; signal: number | null; histogram: number | null } | null;
  stochasticRsiK: number | null;
  stochasticRsiD: number | null;

  distanceTo20DHigh: number | null;
  distanceTo50DHigh: number | null;
  isBreakout: boolean | null;

  momentum5D: number | null;
  momentum20D: number | null;
  momentum60D: number | null;

  relativeStrength: number | null;
  relativeStrengthBenchmark: 'OFFICIAL' | 'SYNTHETIC_PROXY' | null;

  marketRegime: 'BULL' | 'BEAR' | 'SIDEWAYS' | 'UNKNOWN' | null;

  eliteScore: number | null;
  financialScore: number | null;
  technicalScore: number | null;
  confluenceScore: number | null;
  smartMoneyScore: number | null;
  marketStructureScore: number | null;

  dataQuality: 'VALID' | 'PARTIAL' | 'INVALID';
  dataStatus: DataStatus;

  sourceProvenance: ScannerProvenance;
}

/** Per-timeframe data availability and features for multi-timeframe analysis */
export interface TimeframeData {
  timeframe: Timeframe;
  available: boolean;
  dataStatus: DataStatus;
  source: 'REAL' | 'DERIVED' | 'UNAVAILABLE';
  retrievedAt: string;
  marketTimestamp: string;
  /** Price features */
  currentPrice: number | null;
  priceChange1D: number | null;
  priceChange5D: number | null;
  priceChange20D: number | null;
  priceChange60D: number | null;
  /** Volume features */
  volume20Average: number | null;
  volume50Average: number | null;
  relativeVolume20: number | null;
  relativeVolume50: number | null;
  volumeSpike: boolean | null;
  /** Technical features */
  sma9: number | null;
  sma20: number | null;
  sma50: number | null;
  rsi14: number | null;
  macd: { macd: number | null; signal: number | null; histogram: number | null } | null;
  stochasticRsiK: number | null;
  stochasticRsiD: number | null;
  /** Breakout & momentum */
  distanceTo20DHigh: number | null;
  distanceTo50DHigh: number | null;
  isBreakout: boolean | null;
  momentum5D: number | null;
  momentum20D: number | null;
  momentum60D: number | null;
  /** Regime & strength */
  marketRegime: 'BULL' | 'BEAR' | 'SIDEWAYS' | 'UNKNOWN' | null;
  relativeStrength: number | null;
  relativeStrengthBenchmark: 'OFFICIAL' | 'SYNTHETIC_PROXY' | null;
}

/** Multi-timeframe analysis structure */
export interface MultiTimeframeAnalysis {
  symbol: string;
  /** Per-timeframe data availability and features */
  timeframes: Record<Timeframe, TimeframeData>;
  /** Confluence determination */
  confluence: 'STRONG' | 'MODERATE' | 'PARTIAL' | 'CONFLICTED' | 'UNKNOWN';
  /** Number of available timeframes out of 6 (excluding 1H/2H which are always UNAVAILABLE) */
  availableTimeframeCount: number;
  /** Number of bullish timeframes */
  bullishTimeframeCount: number;
  /** Number of bearish timeframes */
  bearishTimeframeCount: number;
  /** Number of conflicted timeframes */
  conflictedTimeframeCount: number;
  /** Confluence score 0-100 (diagnostic, does NOT replace Elite Score) */
  confluenceScore: number;
  /** Breakdown by technical alignment */
  technicalAlignment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'MIXED' | 'UNKNOWN';
  /** Volume confirmation state */
  volumeConfirmation: 'STRONG' | 'MODERATE' | 'WEAK' | 'UNAVAILABLE';
  /** Momentum state */
  momentumState: 'ACCELERATING' | 'POSITIVE' | 'NEUTRAL' | 'WEAKENING' | 'NEGATIVE' | 'UNKNOWN';
}

/** Extended ScannerResult with multi-timeframe analysis */
export interface ExtendedScannerResult extends ScannerResult {
  /** Multi-timeframe analysis (available timeframes only) */
  multiTimeframeAnalysis?: MultiTimeframeAnalysis;
  /** Early opportunity classification */
  earlyOpportunityClassification?:
    | 'EARLY_ACCUMULATION'
    | 'PRE_BREAKOUT'
    | 'BREAKOUT'
    | 'MOMENTUM'
    | 'EXTENDED'
    | 'WEAKENING'
    | 'NO_SIGNAL'
    | 'UNAVAILABLE';
  /** Scanner signal quality */
  scannerSignalQuality: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNAVAILABLE';
}

/** Early opportunity classification states */
export type EarlyOpportunityClassification =
  | 'EARLY_ACCUMULATION'
  | 'PRE_BREAKOUT'
  | 'BREAKOUT'
  | 'MOMENTUM'
  | 'EXTENDED'
  | 'WEAKENING'
  | 'NO_SIGNAL'
  | 'UNAVAILABLE';

/** Scanner signal quality levels */
export type ScannerSignalQuality = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNAVAILABLE';

export interface SymbolAnalysis {
  symbol: string;
  eliteScore: number;
  eliteRating: EliteScoreRating;
  elitePriority: EliteScorePriority;
  opportunityLevel: OpportunityLevel;
  opportunityScore: number;
  candidate: boolean;
  candidateScore: number;
  candidatePriority: CandidatePriority;
  financialScore: number;
  technicalScore: number;
  smartMoneyScore: number;
  confluenceScore: number;
  marketStructureScore: number;
  confidence: number;
  earlyOpportunity: boolean;
  reasons: string[];
  riskFactors: string[];
  /** Timeframe this analysis applies to */
  timeframe?: Timeframe;
  /** Raw scanner features per timeframe */
  scanner?: ScannerResult;
}

export interface RankedSymbol {
  symbol: string;
  status: SymbolStatus;
  eliteScore: number;
  eliteRating: EliteScoreRating;
  opportunityLevel: OpportunityLevel;
  candidateScore: number;
  compositeScore: number;
  rank: number;
  reasons: string[];
}

export interface ScannerStatistics {
  totalSymbols: number;
  topCandidateCount: number;
  watchlistCount: number;
  rejectedCount: number;
  avgEliteScore: number;
  avgOpportunityScore: number;
  avgCandidateScore: number;
  scoreDistribution: Record<string, number>;
}

export interface MarketScannerResult {
  topCandidates: RankedSymbol[];
  watchlist: RankedSymbol[];
  rejected: RankedSymbol[];
  statistics: ScannerStatistics;
  metadata: Record<string, unknown>;
}
