import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDashboard,
  fetchRanking,
  fetchRankedStock,
  fetchScannerResults,
  fetchScannerFilterOptions,
  fetchAlerts,
  acknowledgeAlert,
  dismissAlert,
  fetchOpportunities,
  fetchWatchlists,
  createWatchlist,
  deleteWatchlist,
  addSymbolToWatchlist,
  removeSymbolFromWatchlist,
  fetchStockDetail,
  fetchPortfolioSummary,
  fetchPortfolioAllocation,
  fetchPortfolioPerformance,
  fetchMacroFullAnalysis,
  fetchMacroData,
  fetchMacroScore,
  fetchMarketRegime,
  fetchCentralBankAnalysis,
  fetchCombinedConfidence,
  fetchSectorImpacts,
  fetchMacroAlerts,
  fetchMacroOpportunities,
  fetchMacroRisk,
  fetchPipelineStatus,
  fetchPipelineMetrics,
  runPipeline,
  resetPipeline,
  fetchEarlyOpportunities,
  fetchEarlyOpportunity,
  fetchEarlyOpportunityExplain,
  runEarlyOpportunityLearning,
  fetchMultiTimeframeOpportunity,
  fetchMultiTimeframeExplain,
  fetchMarketOverview,
  fetchWatchlist,
  fetchQuickSearch,
  fetchTopLists,
  fetchDashboardPerformance,
} from "@/services/dashboard";
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
  DashboardPerformanceData,
} from "@/types/dashboard";

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    refetchInterval: 60_000,
  });
}

export function useRanking(
  page: number = 1,
  pageSize: number = 50,
  sortBy?: string,
  sortOrder?: string,
  search?: string,
) {
  return useQuery<PaginatedRankingResponse>({
    queryKey: ["ranking", page, pageSize, sortBy, sortOrder, search],
    queryFn: () => fetchRanking(page, pageSize, sortBy, sortOrder, search),
    placeholderData: (prev) => prev,
  });
}

export function useRankedStock(symbol: string | undefined) {
  return useQuery<RankedStock | null>({
    queryKey: ["ranked-stock", symbol],
    queryFn: () => fetchRankedStock(symbol!),
    enabled: !!symbol,
  });
}

export function useScannerResults(filters?: Record<string, string>) {
  return useQuery<ScannerResult[]>({
    queryKey: ["scanner-results", filters],
    queryFn: () => fetchScannerResults(filters),
  });
}

export function useScannerFilterOptions() {
  return useQuery({
    queryKey: ["scanner-filters"],
    queryFn: fetchScannerFilterOptions,
  });
}

export function useAlerts(
  status?: string,
  priority?: string,
  watchlist?: string,
  search?: string,
) {
  return useQuery<AlertItem[]>({
    queryKey: ["alerts", status, priority, watchlist, search],
    queryFn: () => fetchAlerts(status, priority, watchlist, search),
    refetchInterval: 30_000,
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acknowledgeAlert,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useDismissAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dismissAlert,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useOpportunities(minConfidence?: number, type?: string) {
  return useQuery<OpportunityItem[]>({
    queryKey: ["opportunities", minConfidence, type],
    queryFn: () => fetchOpportunities(minConfidence, type),
    refetchInterval: 60_000,
  });
}

export function useWatchlists() {
  return useQuery<WatchlistItem[]>({
    queryKey: ["watchlists"],
    queryFn: fetchWatchlists,
  });
}

export function useCreateWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createWatchlist(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["watchlists"] }),
  });
}

export function useDeleteWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteWatchlist,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["watchlists"] }),
  });
}

export function useAddSymbolToWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ watchlistId, symbol }: { watchlistId: string; symbol: string }) =>
      addSymbolToWatchlist(watchlistId, symbol),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["watchlists"] }),
  });
}

export function useRemoveSymbolFromWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ watchlistId, symbol }: { watchlistId: string; symbol: string }) =>
      removeSymbolFromWatchlist(watchlistId, symbol),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["watchlists"] }),
  });
}

export function useStockDetail(symbol: string | undefined) {
  return useQuery<StockDetail>({
    queryKey: ["stock-detail", symbol],
    queryFn: () => fetchStockDetail(symbol!),
    enabled: !!symbol,
  });
}

export function usePortfolioSummary() {
  return useQuery<PortfolioSummary>({
    queryKey: ["portfolio-summary"],
    queryFn: fetchPortfolioSummary,
    refetchInterval: 30_000,
  });
}

export function usePortfolioAllocation() {
  return useQuery<AllocationEntry[]>({
    queryKey: ["portfolio-allocation"],
    queryFn: fetchPortfolioAllocation,
    refetchInterval: 30_000,
  });
}

export function usePortfolioPerformance(period: string = "1M") {
  return useQuery<PerformanceEntry[]>({
    queryKey: ["portfolio-performance", period],
    queryFn: () => fetchPortfolioPerformance(period),
    refetchInterval: 60_000,
  });
}

export function useMacroFullAnalysis() {
  return useQuery<MacroFullAnalysis>({
    queryKey: ["macro-full-analysis"],
    queryFn: fetchMacroFullAnalysis,
    refetchInterval: 15 * 60 * 1000,
  });
}

export function useMacroData() {
  return useQuery<MacroDataSnapshot>({
    queryKey: ["macro-data"],
    queryFn: fetchMacroData,
    refetchInterval: 15 * 60 * 1000,
  });
}

export function useMacroScore() {
  return useQuery<MacroScoreResult>({
    queryKey: ["macro-score"],
    queryFn: fetchMacroScore,
    refetchInterval: 15 * 60 * 1000,
  });
}

export function useMarketRegime() {
  return useQuery<MarketRegimeAnalysis>({
    queryKey: ["market-regime"],
    queryFn: fetchMarketRegime,
    refetchInterval: 15 * 60 * 1000,
  });
}

export function useCentralBankAnalysis(bank: string) {
  return useQuery<CentralBankAnalysis>({
    queryKey: ["central-bank", bank],
    queryFn: () => fetchCentralBankAnalysis(bank),
    refetchInterval: 60 * 60 * 1000,
  });
}

export function useCombinedConfidence(eliteScore: number) {
  return useQuery<CombinedConfidence>({
    queryKey: ["combined-confidence", eliteScore],
    queryFn: () => fetchCombinedConfidence(eliteScore),
    refetchInterval: 15 * 60 * 1000,
  });
}

export function useSectorImpacts() {
  return useQuery<SectorImpact[]>({
    queryKey: ["sector-impacts"],
    queryFn: fetchSectorImpacts,
    refetchInterval: 15 * 60 * 1000,
  });
}

export function useMacroAlerts() {
  return useQuery<MacroAlertEvent[]>({
    queryKey: ["macro-alerts"],
    queryFn: fetchMacroAlerts,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useMacroOpportunities(eliteScore?: number) {
  return useQuery<MacroOpportunity[]>({
    queryKey: ["macro-opportunities", eliteScore],
    queryFn: () => fetchMacroOpportunities(eliteScore),
    refetchInterval: 15 * 60 * 1000,
  });
}

export function useMacroRisk() {
  return useQuery<MacroRiskItem[]>({
    queryKey: ["macro-risk"],
    queryFn: fetchMacroRisk,
    refetchInterval: 15 * 60 * 1000,
  });
}

export function usePipelineStatus() {
  return useQuery<PipelineStatusResponse>({
    queryKey: ["pipeline-status"],
    queryFn: fetchPipelineStatus,
    refetchInterval: 10_000,
  });
}

export function usePipelineMetrics() {
  return useQuery<PipelineMetrics>({
    queryKey: ["pipeline-metrics"],
    queryFn: fetchPipelineMetrics,
    refetchInterval: 10_000,
  });
}

export function useRunPipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: runPipeline,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-status"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline-metrics"] });
    },
  });
}

export function useResetPipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resetPipeline,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-status"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline-metrics"] });
    },
  });
}

// Early Opportunity Intelligence Hooks
export function useEarlyOpportunities(
  filters?: EarlyOpportunityFilters,
  limit?: number,
) {
  return useQuery<EarlyOpportunityScanResponse>({
    queryKey: ["early-opportunities", filters, limit],
    queryFn: () => fetchEarlyOpportunities(filters, limit),
    refetchInterval: 60_000,
  });
}

export function useEarlyOpportunity(ticker: string | undefined) {
  return useQuery<EarlyOpportunityIntelligenceResult | null>({
    queryKey: ["early-opportunity", ticker],
    queryFn: () => fetchEarlyOpportunity(ticker!),
    enabled: !!ticker,
    refetchInterval: 60_000,
  });
}

export function useEarlyOpportunityExplain(ticker: string | undefined) {
  return useQuery<{ ticker: string; explanation: string | null }>({
    queryKey: ["early-opportunity-explain", ticker],
    queryFn: () => fetchEarlyOpportunityExplain(ticker!),
    enabled: !!ticker,
  });
}

export function useRunEarlyOpportunityLearning() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: runEarlyOpportunityLearning,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["early-opportunities"] }),
  });
}

// Multi-Timeframe Opportunity Hooks
export function useMultiTimeframeOpportunity(ticker: string | undefined) {
  return useQuery<MultiTimeframeOpportunityResult>({
    queryKey: ["multi-timeframe", ticker],
    queryFn: () => fetchMultiTimeframeOpportunity(ticker!),
    enabled: !!ticker,
    refetchInterval: 60_000,
  });
}

export function useMultiTimeframeExplain(ticker: string | undefined) {
  return useQuery<{ ticker: string; explanation: string | null }>({
    queryKey: ["multi-timeframe-explain", ticker],
    queryFn: () => fetchMultiTimeframeExplain(ticker!),
    enabled: !!ticker,
  });
}

// Market Overview Hook
export function useMarketOverview() {
  return useQuery<MarketOverviewData>({
    queryKey: ["market-overview"],
    queryFn: fetchMarketOverview,
    refetchInterval: 30_000,
  });
}

// Watchlist Hook
export function useWatchlistData() {
  return useQuery<WatchlistData>({
    queryKey: ["watchlist-data"],
    queryFn: fetchWatchlist,
    refetchInterval: 60_000,
  });
}

// Quick Search Hook
export function useQuickSearch(ticker: string | undefined) {
  return useQuery<QuickSearchResult | null>({
    queryKey: ["quick-search", ticker],
    queryFn: () => fetchQuickSearch(ticker!),
    enabled: !!ticker && ticker.length >= 2,
  });
}

// Top Lists Hook
export function useTopLists() {
  return useQuery<TopListsData>({
    queryKey: ["top-lists"],
    queryFn: fetchTopLists,
    refetchInterval: 60_000,
  });
}

// Dashboard Performance Hook
export function useDashboardPerformance() {
  return useQuery<DashboardPerformanceData>({
    queryKey: ["dashboard-performance"],
    queryFn: fetchDashboardPerformance,
    refetchInterval: 5 * 60 * 1000,
  });
}
