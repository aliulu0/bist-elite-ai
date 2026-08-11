import { create } from 'zustand';
import type {
  HistoricalAllSymbolsReport,
  HistoricalBackfillAllResult,
  HistoricalBackfillInfo,
  HistoricalBackfillResult,
  HistoricalGapReport,
  HistoricalQuality,
  HistoryTab,
  SymbolHistoricalStatus,
} from '@/components/history/history-types';

export interface HistoryState {
  activeTab: HistoryTab;
  timeframe: string;
  report: HistoricalAllSymbolsReport | null;
  selectedSymbol: string | null;
  symbolStatus: SymbolHistoricalStatus | null;
  gaps: HistoricalGapReport | null;
  quality: HistoricalQuality | null;
  backfillInfo: HistoricalBackfillInfo | null;
  backfillResult: HistoricalBackfillResult | null;
  bulkResult: HistoricalBackfillAllResult | null;
  loading: boolean;
  detailLoading: boolean;
  error: string;
  lastRefresh: string | null;

  setActiveTab: (tab: HistoryTab) => void;
  setTimeframe: (timeframe: string) => void;
  setReport: (report: HistoricalAllSymbolsReport) => void;
  setSelectedSymbol: (symbol: string | null) => void;
  setSymbolStatus: (status: SymbolHistoricalStatus | null) => void;
  setGaps: (gaps: HistoricalGapReport | null) => void;
  setQuality: (quality: HistoricalQuality | null) => void;
  setBackfillInfo: (info: HistoricalBackfillInfo | null) => void;
  setBackfillResult: (result: HistoricalBackfillResult | null) => void;
  setBulkResult: (result: HistoricalBackfillAllResult | null) => void;
  setLoading: (loading: boolean) => void;
  setDetailLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setLastRefresh: (ts: string) => void;
  clear: () => void;
}

export const EMPTY_HISTORY_REPORT: HistoricalAllSymbolsReport = {
  generatedAt: '',
  timeframe: '1d',
  totalSymbols: 0,
  symbolsWithHistory: 0,
  symbolsWithoutHistory: 0,
  averageCoverage: 0,
  completeSymbols: 0,
  incompleteSymbols: 0,
  staleSymbols: 0,
  invalidSymbols: 0,
  symbols: [],
};

export const useHistoryStore = create<HistoryState>((set) => ({
  activeTab: 'overview',
  timeframe: '1d',
  report: null,
  selectedSymbol: null,
  symbolStatus: null,
  gaps: null,
  quality: null,
  backfillInfo: null,
  backfillResult: null,
  bulkResult: null,
  loading: false,
  detailLoading: false,
  error: '',
  lastRefresh: null,

  setActiveTab: (activeTab) => set({ activeTab }),
  setTimeframe: (timeframe) => set({ timeframe, report: null, symbolStatus: null, gaps: null, quality: null, backfillInfo: null }),
  setReport: (report) => set({ report, loading: false, error: '', lastRefresh: new Date().toISOString() }),
  setSelectedSymbol: (selectedSymbol) => set({ selectedSymbol, symbolStatus: null, gaps: null, quality: null, backfillInfo: null }),
  setSymbolStatus: (symbolStatus) => set({ symbolStatus }),
  setGaps: (gaps) => set({ gaps }),
  setQuality: (quality) => set({ quality }),
  setBackfillInfo: (backfillInfo) => set({ backfillInfo }),
  setBackfillResult: (backfillResult) => set({ backfillResult }),
  setBulkResult: (bulkResult) => set({ bulkResult }),
  setLoading: (loading) => set({ loading }),
  setDetailLoading: (detailLoading) => set({ detailLoading }),
  setError: (error) => set({ error, loading: false }),
  setLastRefresh: (lastRefresh) => set({ lastRefresh }),
  clear: () =>
    set({
      report: null,
      selectedSymbol: null,
      symbolStatus: null,
      gaps: null,
      quality: null,
      backfillInfo: null,
      backfillResult: null,
      bulkResult: null,
      lastRefresh: null,
    }),
}));
