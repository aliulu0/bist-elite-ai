import { Timeframe } from '../indicators/indicator.types';
import { AnalysisResult } from '../analysis-pipeline/analysis-pipeline.types';
import { MarketScannerResult, RankedSymbol } from '../market-scanner/market-scanner.types';
import { ProviderHealthSnapshot, ProviderHealthState } from '../provider-health-monitor/provider-health-monitor.types';

// ==========================================================
// Analysis Result Persistence
// ==========================================================

export interface SaveAnalysisInput {
  result: AnalysisResult;
}

export interface AnalysisResultRecord {
  id: string;
  symbol: string;
  timeframe: string;
  isValid: boolean;
  eliteScore: number | null;
  eliteRating: string | null;
  elitePriority: string | null;
  opportunityScore: number | null;
  opportunityLevel: string | null;
  financialScore: number | null;
  technicalScore: number | null;
  smartMoneyScore: number | null;
  confluenceScore: number | null;
  candidateScore: number | null;
  candidatePriority: string | null;
  confidence: number | null;
  earlyOpportunity: boolean;
  indicators: unknown;
  marketStructure: unknown;
  smartMoney: unknown;
  technicalRules: unknown;
  technicalSummary: unknown;
  financialRules: unknown;
  financialSummary: unknown;
  confluence: unknown;
  candidate: unknown;
  opportunityDetail: unknown;
  eliteScoreDetail: unknown;
  pipelineSteps: unknown;
  metadata: unknown;
  createdAt: Date;
}

// ==========================================================
// Scanner Result Persistence
// ==========================================================

export interface SaveScannerInput {
  scanType: string;
  result: MarketScannerResult;
}

export interface ScannerRunRecord {
  id: string;
  scanType: string;
  totalSymbols: number;
  topCandidateCount: number;
  watchlistCount: number;
  rejectedCount: number;
  avgEliteScore: number | null;
  avgOpportunityScore: number | null;
  avgCandidateScore: number | null;
  scoreDistribution: unknown;
  topCandidates: unknown;
  watchlist: unknown;
  rejected: unknown;
  metadata: unknown;
  createdAt: Date;
  symbols: ScannerSymbolRecord[];
}

export interface ScannerSymbolRecord {
  id: string;
  scannerRunId: string;
  symbol: string;
  status: string;
  eliteScore: number | null;
  eliteRating: string | null;
  opportunityLevel: string | null;
  opportunityScore: number | null;
  candidateScore: number | null;
  compositeScore: number | null;
  rank: number | null;
  reasons: unknown;
  createdAt: Date;
}

// ==========================================================
// Backtest Pipeline Persistence
// ==========================================================

export interface SaveBacktestPipelineInput {
  symbolsProcessed: number;
  symbolsSucceeded: number;
  symbolsFailed: number;
  totalTrades: number;
  winRate: number | null;
  avgReturn: number | null;
  maxDrawdown: number | null;
  profitFactor: number | null;
  benchmarkAlpha: number | null;
  benchmarkBeta: number | null;
  perSymbolResults: unknown;
  benchmarkReturns: unknown;
  metadata: unknown;
  status: string;
  error: string | null;
  startedAt: Date;
  completedAt: Date | null;
}

export interface BacktestPipelineRunRecord {
  id: string;
  symbolsProcessed: number;
  symbolsSucceeded: number;
  symbolsFailed: number;
  totalTrades: number;
  winRate: number | null;
  avgReturn: number | null;
  maxDrawdown: number | null;
  profitFactor: number | null;
  benchmarkAlpha: number | null;
  benchmarkBeta: number | null;
  perSymbolResults: unknown;
  benchmarkReturns: unknown;
  metadata: unknown;
  completionStatus: string;
  errorMessage: string | null;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
}

// ==========================================================
// Provider Health Persistence
// ==========================================================

export interface SaveProviderHealthInput {
  snapshot: ProviderHealthSnapshot;
}

export interface ProviderHealthRecord {
  id: string;
  provider: string;
  status: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  timeoutCount: number;
  consecutiveFailures: number;
  avgLatencyMs: number | null;
  p50LatencyMs: number | null;
  p95LatencyMs: number | null;
  p99LatencyMs: number | null;
  reliabilityScore: number | null;
  successRate: number | null;
  errorRate: number | null;
  uptime: number | null;
  lastFailureTime: Date | null;
  lastSuccessTime: Date | null;
  lastRequestTime: Date | null;
  recoveryTimeMs: number | null;
  snapshotTime: Date;
  createdAt: Date;
}

// ==========================================================
// Scheduler Job Run Persistence
// ==========================================================

export interface SaveJobRunInput {
  jobName: string;
  status: string;
  symbolsProcessed: number;
  symbolsSucceeded: number;
  symbolsFailed: number;
  durationMs: number | null;
  error: string | null;
  metadata: unknown;
  startedAt: Date;
  completedAt: Date | null;
}

export interface SchedulerJobRunRecord {
  id: string;
  jobName: string;
  completionStatus: string;
  symbolsProcessed: number;
  symbolsSucceeded: number;
  symbolsFailed: number;
  durationMs: number | null;
  errorMessage: string | null;
  metadata: unknown;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
}

// ==========================================================
// Query Options
// ==========================================================

export interface AnalysisQueryOptions {
  symbol?: string;
  timeframe?: string;
  limit?: number;
  offset?: number;
  since?: Date;
  until?: Date;
}

export interface ScannerQueryOptions {
  scanType?: string;
  limit?: number;
  offset?: number;
  since?: Date;
}

export interface ProviderHealthQueryOptions {
  provider?: string;
  limit?: number;
  since?: Date;
}

export interface JobRunQueryOptions {
  jobName?: string;
  limit?: number;
  since?: Date;
}
