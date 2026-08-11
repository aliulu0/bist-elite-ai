export interface Holding {
  symbol: string;
  name: string;
  lots: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  pnl: number;
  pnlPercent: number;
  portfolioWeight: number;
  aiScore: number;
  risk: string;
  eliteRating: string;
  opportunityLevel: string;
  sector: string;
}

export interface Transaction {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL' | 'DIVIDEND' | 'COMMISSION' | 'TAX' | 'TRANSFER';
  date: string;
  lots: number;
  price: number;
  amount: number;
  notes: string;
}

export interface CashBalance {
  available: number;
  reserved: number;
  total: number;
}

export interface DividendInfo {
  totalReceived: number;
  expectedAnnual: number;
  yieldPercent: number;
  lastPaymentDate: string;
  lastPaymentAmount: number;
  history: Array<{ date: string; amount: number; symbol: string }>;
}

export interface RiskMetrics {
  beta: number;
  volatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  valueAtRisk: number;
  diversificationScore: number;
  riskScore: number;
}

export interface AIAnalysis {
  portfolioQuality: string;
  riskLevel: string;
  concentrationRisk: string;
  sectorRisk: string;
  liquidity: string;
  diversification: string;
  recommendations: string[];
  warnings: string[];
}

export interface AllocationItem {
  name: string;
  value: number;
  percent: number;
  color: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalPnl: number;
  totalPnlPercent: number;
  dayPnl: number;
  dayPnlPercent: number;
  realizedPnl: number;
  unrealizedPnl: number;
  maxDrawdown: number;
  volatility: number;
  sharpeRatio: number;
  aiScore: number;
  cashBalance: number;
}

export interface PortfolioState {
  summary: PortfolioSummary | null;
  holdings: Holding[];
  transactions: Transaction[];
  cash: CashBalance;
  dividends: DividendInfo;
  risk: RiskMetrics;
  aiAnalysis: AIAnalysis;
  performanceHistory: Array<{ date: string; value: number }>;
  allocation: AllocationItem[];
  sectorAllocation: AllocationItem[];
  loading: boolean;
  error: string;
  search: string;
  sortKey: string;
  sortDir: 'asc' | 'desc';
  page: number;
  pageSize: number;
  selectedSymbol: string | null;
  compactMode: boolean;

  setSummary: (s: PortfolioSummary | null) => void;
  setHoldings: (h: Holding[]) => void;
  setTransactions: (t: Transaction[]) => void;
  setCash: (c: CashBalance) => void;
  setDividends: (d: DividendInfo) => void;
  setRisk: (r: RiskMetrics) => void;
  setAiAnalysis: (a: AIAnalysis) => void;
  setPerformanceHistory: (p: Array<{ date: string; value: number }>) => void;
  setAllocation: (a: AllocationItem[]) => void;
  setSectorAllocation: (a: AllocationItem[]) => void;
  setLoading: (l: boolean) => void;
  setError: (e: string) => void;
  setSearch: (s: string) => void;
  setSort: (key: string, dir: 'asc' | 'desc') => void;
  setPage: (p: number) => void;
  setSelectedSymbol: (s: string | null) => void;
  setCompactMode: (m: boolean) => void;
  toggleCompact: () => void;
  refresh: () => void;
}

export const PORTFOLIO_TAB = {
  PORTFOLIO: 'portfolio',
  ALLOCATION: 'allocation',
  HOLDINGS: 'holdings',
  TRANSACTIONS: 'transactions',
  RISK: 'risk',
  TEMETTU: 'temettu',
} as const;

export type PortfolioTabType = typeof PORTFOLIO_TAB[keyof typeof PORTFOLIO_TAB];

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  BUY: 'Alış',
  SELL: 'Satış',
  DIVIDEND: 'Temettü',
  COMMISSION: 'Komisyon',
  TAX: 'Vergi',
  TRANSFER: 'Transfer',
};

export const RISK_LEVEL_LABELS: Record<string, string> = {
  LOW: 'Düşük',
  MEDIUM: 'Orta',
  HIGH: 'Yüksek',
  VERY_HIGH: 'Çok Yüksek',
};

export const RATING_LABELS: Record<string, string> = {
  AAA: 'AAA',
  AA: 'AA',
  A: 'A',
  BBB: 'BBB',
  BB: 'BB',
  B: 'B',
  C: 'C',
  D: 'D',
};

export const ALLOCATION_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
];
