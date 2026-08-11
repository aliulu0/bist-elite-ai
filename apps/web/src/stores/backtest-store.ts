import { create } from 'zustand';
import {
  DEFAULT_BACKTEST_CONFIG,
  type BacktestConfig,
  type BacktestResult,
  type BenchmarkResult,
  type RuleAnalyticsResult,
  type WeightOptimizationResult,
  type WorkflowItem,
  type HistoricalData,
  type BacktestTab,
  type EntryRule,
  type ExitRule,
} from '@/components/backtest/backtest-types';

interface BacktestState {
  symbol: string;
  timeframe: string;
  activeTab: BacktestTab;
  config: BacktestConfig;
  loading: boolean;
  error: string;
  result: BacktestResult | null;
  benchmark: BenchmarkResult | null;
  ruleAnalytics: RuleAnalyticsResult | null;
  weightOptimization: WeightOptimizationResult | null;
  workflows: WorkflowItem[];
  historicalData: HistoricalData | null;
  workflowLoading: boolean;
  sortKey: string;
  sortDir: 'asc' | 'desc';
  tradePage: number;
  tradesPerPage: number;

  setSymbol: (symbol: string) => void;
  setTimeframe: (timeframe: string) => void;
  setActiveTab: (tab: BacktestTab) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setResult: (result: BacktestResult | null) => void;
  setBenchmark: (benchmark: BenchmarkResult | null) => void;
  setRuleAnalytics: (analytics: RuleAnalyticsResult | null) => void;
  setWeightOptimization: (opt: WeightOptimizationResult | null) => void;
  setWorkflows: (workflows: WorkflowItem[]) => void;
  setHistoricalData: (data: HistoricalData | null) => void;
  setWorkflowLoading: (loading: boolean) => void;
  setConfig: (config: Partial<BacktestConfig>) => void;
  addEntryRule: (rule: EntryRule) => void;
  removeEntryRule: (index: number) => void;
  updateEntryRule: (index: number, rule: EntryRule) => void;
  addExitRule: (rule: ExitRule) => void;
  removeExitRule: (index: number) => void;
  updateExitRule: (index: number, rule: ExitRule) => void;
  resetConfig: () => void;
  setSort: (key: string, dir: 'asc' | 'desc') => void;
  setTradePage: (page: number) => void;
}

export const useBacktestStore = create<BacktestState>((set) => ({
  symbol: '',
  timeframe: '1d',
  activeTab: 'ozet',
  config: { ...DEFAULT_BACKTEST_CONFIG, entryRules: [...DEFAULT_BACKTEST_CONFIG.entryRules], exitRules: [...DEFAULT_BACKTEST_CONFIG.exitRules] },
  loading: false,
  error: '',
  result: null,
  benchmark: null,
  ruleAnalytics: null,
  weightOptimization: null,
  workflows: [],
  historicalData: null,
  workflowLoading: false,
  sortKey: 'returnPercent',
  sortDir: 'desc',
  tradePage: 0,
  tradesPerPage: 20,

  setSymbol: (symbol) => set({ symbol }),
  setTimeframe: (timeframe) => set({ timeframe }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setResult: (result) => set({ result }),
  setBenchmark: (benchmark) => set({ benchmark }),
  setRuleAnalytics: (analytics) => set({ ruleAnalytics: analytics }),
  setWeightOptimization: (opt) => set({ weightOptimization: opt }),
  setWorkflows: (workflows) => set({ workflows }),
  setHistoricalData: (data) => set({ historicalData: data }),
  setWorkflowLoading: (loading) => set({ workflowLoading: loading }),
  setConfig: (partial) =>
    set((s) => ({ config: { ...s.config, ...partial } })),
  addEntryRule: (rule) =>
    set((s) => ({ config: { ...s.config, entryRules: [...s.config.entryRules, rule] } })),
  removeEntryRule: (index) =>
    set((s) => ({ config: { ...s.config, entryRules: s.config.entryRules.filter((_, i) => i !== index) } })),
  updateEntryRule: (index, rule) =>
    set((s) => ({
      config: { ...s.config, entryRules: s.config.entryRules.map((r, i) => (i === index ? rule : r)) },
    })),
  addExitRule: (rule) =>
    set((s) => ({ config: { ...s.config, exitRules: [...s.config.exitRules, rule] } })),
  removeExitRule: (index) =>
    set((s) => ({ config: { ...s.config, exitRules: s.config.exitRules.filter((_, i) => i !== index) } })),
  updateExitRule: (index, rule) =>
    set((s) => ({
      config: { ...s.config, exitRules: s.config.exitRules.map((r, i) => (i === index ? rule : r)) },
    })),
  resetConfig: () =>
    set({
      config: {
        ...DEFAULT_BACKTEST_CONFIG,
        entryRules: [...DEFAULT_BACKTEST_CONFIG.entryRules],
        exitRules: [...DEFAULT_BACKTEST_CONFIG.exitRules],
      },
    }),
  setSort: (key, dir) => set({ sortKey: key, sortDir: dir }),
  setTradePage: (page) => set({ tradePage: page }),
}));
