import { api } from "@/lib/api";
import type {
  DashboardData,
  RankedStock,
  ScannerResult,
  AlertItem,
  OpportunityItem,
  WatchlistItem,
  StockDetail,
  PaginatedRankingResponse,
  PortfolioSummary,
  AllocationEntry,
  PerformanceEntry,
  MacroFullAnalysis,
  MacroDataSnapshot,
  MacroScoreResult,
  MarketRegimeAnalysis,
  CentralBankAnalysis,
  CombinedConfidence,
  SectorImpact,
  MacroAlertEvent,
  MacroOpportunity,
  MacroRiskItem,
  PipelineMetrics,
  PipelineContext,
  PipelineStatusResponse,
  EarlyOpportunityIntelligenceResult,
  EarlyOpportunityScanResponse,
  EarlyOpportunityFilters,
  MultiTimeframeOpportunityResult,
  SelfLearningReport,
  MarketOverviewData,
  WatchlistData,
  QuickSearchResult,
  TopListsData,
  TopListItem,
  DashboardPerformanceData,
} from "@/types/dashboard";

export async function fetchDashboard(): Promise<DashboardData> {
  return api.get<DashboardData>("/dashboard");
}

export async function fetchRanking(
  page: number = 1,
  pageSize: number = 50,
  sortBy?: string,
  sortOrder?: string,
  search?: string,
): Promise<PaginatedRankingResponse> {
  return api.get<PaginatedRankingResponse>("/ranking", {
    page,
    pageSize,
    ...(sortBy && { sortBy }),
    ...(sortOrder && { sortOrder }),
    ...(search && { search }),
  });
}

export async function fetchRankedStock(symbol: string): Promise<RankedStock | null> {
  return api.get<RankedStock | null>(`/ranking/${symbol}`);
}

export async function fetchScannerResults(
  filters?: Record<string, string>,
): Promise<ScannerResult[]> {
  return api.get<ScannerResult[]>("/scanner/results", filters);
}

export async function fetchScannerFilterOptions(): Promise<{
  categories: string[];
  riskLevels: string[];
  sectors: string[];
  opportunityTypes: string[];
  watchlists: string[];
}> {
  return api.get("/scanner/filters");
}

export async function fetchAlerts(
  status?: string,
  priority?: string,
  watchlist?: string,
  search?: string,
): Promise<AlertItem[]> {
  return api.get<AlertItem[]>("/alerts", {
    ...(status && { status }),
    ...(priority && { priority }),
    ...(watchlist && { watchlist }),
    ...(search && { search }),
  });
}

export async function acknowledgeAlert(alertId: string): Promise<void> {
  return api.post(`/alerts/${alertId}/acknowledge`);
}

export async function dismissAlert(alertId: string): Promise<void> {
  return api.post(`/alerts/${alertId}/dismiss`);
}

export async function fetchOpportunities(
  minConfidence?: number,
  type?: string,
): Promise<OpportunityItem[]> {
  return api.get<OpportunityItem[]>("/opportunities", {
    ...(minConfidence && { minConfidence }),
    ...(type && { type }),
  });
}

export async function fetchWatchlists(): Promise<WatchlistItem[]> {
  return api.get<WatchlistItem[]>("/watchlists");
}

export async function createWatchlist(name: string): Promise<WatchlistItem> {
  return api.post<WatchlistItem>("/watchlists", { name });
}

export async function deleteWatchlist(id: string): Promise<void> {
  return api.delete(`/watchlists/${id}`);
}

export async function addSymbolToWatchlist(
  watchlistId: string,
  symbol: string,
): Promise<void> {
  return api.post(`/watchlists/${watchlistId}/symbols`, { symbol });
}

export async function removeSymbolFromWatchlist(
  watchlistId: string,
  symbol: string,
): Promise<void> {
  return api.delete(`/watchlists/${watchlistId}/symbols/${symbol}`);
}

export async function fetchStockDetail(symbol: string): Promise<StockDetail> {
  return api.get<StockDetail>(`/stocks/${symbol}`);
}

export async function fetchPortfolioSummary(): Promise<PortfolioSummary> {
  return api.get<PortfolioSummary>("/portfolio/summary");
}

export async function fetchPortfolioAllocation(): Promise<AllocationEntry[]> {
  return api.get<AllocationEntry[]>("/portfolio/allocation");
}

export async function fetchPortfolioPerformance(
  period: string = "1M",
): Promise<PerformanceEntry[]> {
  return api.get<PerformanceEntry[]>("/portfolio/performance", { period });
}

export async function fetchMacroFullAnalysis(): Promise<MacroFullAnalysis> {
  return api.get<MacroFullAnalysis>("/macro");
}

export async function fetchMacroData(): Promise<MacroDataSnapshot> {
  return api.get<MacroDataSnapshot>("/macro/data");
}

export async function fetchMacroScore(): Promise<MacroScoreResult> {
  return api.get<MacroScoreResult>("/macro/score");
}

export async function fetchMarketRegime(): Promise<MarketRegimeAnalysis> {
  return api.get<MarketRegimeAnalysis>("/macro/regime");
}

export async function fetchCentralBankAnalysis(bank: string): Promise<CentralBankAnalysis> {
  return api.get<CentralBankAnalysis>(`/macro/central-bank/${bank}`);
}

export async function fetchCombinedConfidence(eliteScore: number): Promise<CombinedConfidence> {
  return api.get<CombinedConfidence>("/macro/combined-confidence", { eliteScore });
}

export async function fetchSectorImpacts(): Promise<SectorImpact[]> {
  return api.get<SectorImpact[]>("/macro/sectors");
}

export async function fetchMacroAlerts(): Promise<MacroAlertEvent[]> {
  return api.get<MacroAlertEvent[]>("/macro/alerts");
}

export async function fetchMacroOpportunities(eliteScore?: number): Promise<MacroOpportunity[]> {
  return api.get<MacroOpportunity[]>("/macro/opportunities", {
    ...(eliteScore && { eliteScore }),
  });
}

export async function fetchMacroRisk(): Promise<MacroRiskItem[]> {
  return api.get<MacroRiskItem[]>("/macro/risk");
}

export async function fetchPipelineStatus(): Promise<PipelineStatusResponse> {
  return api.get<PipelineStatusResponse>("/pipeline/status");
}

export async function fetchPipelineMetrics(): Promise<PipelineMetrics> {
  return api.get<PipelineMetrics>("/pipeline/metrics");
}

export async function runPipeline(): Promise<PipelineContext> {
  return api.post<PipelineContext>("/pipeline/run");
}

export async function resetPipeline(): Promise<void> {
  return api.post("/pipeline/reset");
}

// Early Opportunity Intelligence API
export async function fetchEarlyOpportunities(
  filters?: EarlyOpportunityFilters,
  limit?: number,
): Promise<EarlyOpportunityScanResponse> {
  const params: Record<string, string | number> = {};
  if (filters?.minEarlyOpportunityScore !== undefined) params.minEarlyOpportunityScore = filters.minEarlyOpportunityScore;
  if (filters?.minConfidence !== undefined) params.minConfidence = filters.minConfidence;
  if (filters?.minExpectedReturn !== undefined) params.minExpectedReturn = filters.minExpectedReturn;
  if (filters?.maxRisk !== undefined) params.maxRisk = filters.maxRisk;
  if (filters?.sector !== undefined) params.sector = filters.sector;
  if (filters?.minEliteScore !== undefined) params.minEliteScore = filters.minEliteScore;
  if (filters?.minSmartMoneyScore !== undefined) params.minSmartMoneyScore = filters.minSmartMoneyScore;
  if (filters?.minCatalystScore !== undefined) params.minCatalystScore = filters.minCatalystScore;
  if (limit !== undefined) params.limit = limit;
  return api.get<EarlyOpportunityScanResponse>("/early-opportunities", params);
}

export async function fetchEarlyOpportunity(ticker: string): Promise<EarlyOpportunityIntelligenceResult | null> {
  return api.get<EarlyOpportunityIntelligenceResult | null>(`/early-opportunities/${ticker}`);
}

export async function fetchEarlyOpportunityExplain(ticker: string): Promise<{ ticker: string; explanation: string | null }> {
  return api.get(`/early-opportunities/explain/${ticker}`);
}

export async function runEarlyOpportunityLearning(): Promise<SelfLearningReport> {
  return api.get<SelfLearningReport>("/early-opportunities/learning/run");
}

// Multi-Timeframe Opportunity API
export async function fetchMultiTimeframeOpportunity(ticker: string): Promise<MultiTimeframeOpportunityResult> {
  return api.get<MultiTimeframeOpportunityResult>(`/multi-timeframe/${ticker}`);
}

export async function fetchMultiTimeframeExplain(ticker: string): Promise<{ ticker: string; explanation: string | null }> {
  return api.get(`/multi-timeframe/${ticker}/explain`);
}

// Market Overview API
export interface MarketOverviewData {
  bist100: { value: number; change: number; changePercent: number };
  sectorHeatmap: { sector: string; changePercent: number; stocks: number }[];
  topGainers: { ticker: string; name: string; changePercent: number; price: number }[];
  topLosers: { ticker: string; name: string; changePercent: number; price: number }[];
  volumeLeaders: { ticker: string; name: string; volume: number; changePercent: number }[];
  smartMoneyLeaders: { ticker: string; name: string; smartMoneyScore: number; accumulation: string }[];
  catalystLeaders: { ticker: string; name: string; catalystScore: number; verified: boolean }[];
}

export async function fetchMarketOverview(): Promise<MarketOverviewData> {
  return api.get<MarketOverviewData>("/market/overview");
}

// Watchlist API
export interface WatchlistData {
  favorites: string[];
  pinned: string[];
  recent: string[];
  aiAlerts: { ticker: string; message: string; priority: string }[];
}

export async function fetchWatchlist(): Promise<WatchlistData> {
  return api.get<WatchlistData>("/watchlist");
}

// Quick Search API
export interface QuickSearchResult {
  ticker: string;
  name: string;
  prediction: {
    bullishPercent: number;
    confidence: number;
    expectedReturn: number;
    trend: string;
    momentum: string;
  };
  research: { consensus: string; agreementLevel: number };
  verification: { status: string; details: string };
  catalyst: { score: number; verified: boolean; summary: string };
  smartMoney: { score: number; accumulation: string };
  entry: { zone: { min: number; max: number }; stop: number; target1: number; target2: number };
  backtest: { winRate: number; totalTrades: number; sharpeRatio: number };
  multiTimeframe: { timeframes: PredictionTimeframe[]; scores: Record<PredictionTimeframe, number> };
}

export async function fetchQuickSearch(ticker: string): Promise<QuickSearchResult | null> {
  return api.get<QuickSearchResult | null>(`/search/${ticker}`);
}

// Top Lists API
export interface TopListItem {
  ticker: string;
  name: string;
  sector: string;
  value: number;
  changePercent?: number;
}

export interface TopListsData {
  smartMoney: TopListItem[];
  catalyst: TopListItem[];
  confidence: TopListItem[];
  expectedReturn: TopListItem[];
  eliteScore: TopListItem[];
  opportunity: TopListItem[];
  riskReward: TopListItem[];
}

export async function fetchTopLists(): Promise<TopListsData> {
  return api.get<TopListsData>("/top-lists");
}

// Dashboard Performance API
export interface DashboardPerformanceData {
  aiAccuracy: number;
  predictionSuccess: number;
  avgExpectedReturn: number;
  avgWinRate: number;
  learningProgress: { scanned: number; updated: number; modifiers: number };
}

export async function fetchDashboardPerformance(): Promise<DashboardPerformanceData> {
  return api.get<DashboardPerformanceData>("/dashboard/performance");
}

import type { PredictionTimeframe } from "@/types/early-opportunity";
