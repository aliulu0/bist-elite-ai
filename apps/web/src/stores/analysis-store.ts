import { create } from 'zustand';

export type AnalysisTab = 'genel' | 'finansal' | 'teknik' | 'smart-money' | 'confluence' | 'opportunity' | 'workflow' | 'backtest';

export const ANALYSIS_TABS: { key: AnalysisTab; label: string }[] = [
  { key: 'genel', label: 'Genel' },
  { key: 'finansal', label: 'Finansal' },
  { key: 'teknik', label: 'Teknik' },
  { key: 'smart-money', label: 'Akıllı Para' },
  { key: 'confluence', label: 'Uyum' },
  { key: 'opportunity', label: 'Fırsat' },
  { key: 'workflow', label: 'İş Akışı' },
  { key: 'backtest', label: 'Geri Test' },
];

export interface AnalysisState {
  symbol: string;
  timeframe: string;
  activeTab: AnalysisTab;
  searchInput: string;

  setSymbol: (symbol: string) => void;
  setTimeframe: (timeframe: string) => void;
  setActiveTab: (tab: AnalysisTab) => void;
  setSearchInput: (input: string) => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  symbol: '',
  timeframe: '1d',
  activeTab: 'genel',
  searchInput: '',

  setSymbol: (symbol) => set({ symbol: symbol.toUpperCase() }),
  setTimeframe: (timeframe) => set({ timeframe }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchInput: (input) => set({ searchInput: input }),
}));
