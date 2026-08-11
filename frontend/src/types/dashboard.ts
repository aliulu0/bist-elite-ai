export interface RankedStock {
  rank: number;
  symbol: string;
  name: string;
  score: number;
  confidence: number;
  investmentGrade: string;
  recommendation: string;
  risk: number;
  trend: string;
  sector: string;
  price: number;
  changePercent: number;
  freshness: number;
}

export interface ScannerResult {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  price: number;
  changePercent: number;
  volume: number;
  marketCap: string;
  risk: number;
  score: number;
  opportunity: string;
  watchlist: string[];
  categories: string[];
}

export interface AlertItem {
  id: string;
  type: 'PRICE' | 'VOLUME' | 'TECHNICAL' | 'FUNDAMENTAL' | 'PORTFOLIO' | 'RISK' | 'OPPORTUNITY';
  symbol: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'DISMISSED';
  createdAt: string;
  acknowledgedAt?: string;
  watchlist?: string;
}

export interface OpportunityItem {
  id: string;
  symbol: string;
  name: string;
  confidence: number;
  score: number;
  reasons: string[];
  strengths: string[];
  weaknesses: string[];
  type: string;
  detectedAt: string;
}

export interface WatchlistItem {
  id: string;
  name: string;
  type: 'DEFAULT' | 'CUSTOM';
  symbols: string[];
  createdAt: string;
}

export interface PortfolioSummary {
  totalValue: number;
  cash: number;
  investedCapital: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  positionCount: number;
  cashAllocation: number;
  stockAllocation: number;
}

export interface AllocationEntry {
  name: string;
  value: number;
  percentage: number;
}

export interface PerformanceEntry {
  date: string;
  value: number;
  benchmark?: number;
}

export interface DashboardData {
  portfolioSummary: PortfolioSummary;
  topRanked: RankedStock[];
  latestOpportunities: OpportunityItem[];
  activeAlerts: AlertItem[];
  watchlists: WatchlistItem[];
  marketStatus: { market: string; status: string; change: number };
  aiRecommendations: { symbol: string; recommendation: string; confidence: number }[];
  performance: PerformanceEntry[];
}

export interface StockDetail {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  ranking: RankedStock | null;
  aiAnalysis: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  financialSummary: {
    pe: number;
    pb: number;
    dividendYield: number;
    revenue: number;
    profit: number;
    debtToEquity: number;
    roe: number;
  };
  technicalSummary: {
    rsi: number;
    macd: string;
    sma20: number;
    sma50: number;
    sma200: number;
    trend: string;
  };
  opportunityHistory: OpportunityItem[];
  alertHistory: AlertItem[];
  portfolioPosition: {
    hasPosition: boolean;
    quantity?: number;
    averageCost?: number;
    currentValue?: number;
    profitLoss?: number;
    profitLossPercent?: number;
  };
}

export interface PaginatedRankingResponse {
  items: RankedStock[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ScannerFilterOptions {
  categories: string[];
  riskLevels: string[];
  sectors: string[];
  opportunityTypes: string[];
  watchlists: string[];
}

export interface MacroDataPoint {
  source: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  timestamp: string;
  status: string;
  label: string;
  unit: string;
}

export interface MacroDataSnapshot {
  points: MacroDataPoint[];
  fetchedAt: string;
  sourceCount: number;
  healthyCount: number;
  staleCount: number;
  errorCount: number;
}

export type CentralBankTone = 'hawkish' | 'dovish' | 'neutral' | 'hawkish_leaning' | 'dovish_leaning';
export type MarketImpact = 'positive' | 'negative' | 'neutral';
export type MarketRegimeType = 'risk_on' | 'neutral' | 'risk_off' | 'extreme_risk';

export interface CentralBankAnalysis {
  bank: string;
  tone: CentralBankTone;
  confidence: number;
  marketImpact: MarketImpact;
  sectorImpacts: Record<string, MarketImpact>;
  expectedInflation?: number;
  expectedGrowth?: number;
  liquidity: string;
  risk: string;
  summary: string;
  analyzedAt: string;
}

export interface MarketRegimeAnalysis {
  regime: MarketRegimeType;
  score: number;
  components: {
    vix: { value: number; impact: number };
    dxy: { value: number; impact: number };
    us10y: { value: number; impact: number };
    cds: { value: number; impact: number };
    liquidity: { value: number; impact: number };
    momentum: { value: number; impact: number };
  };
  signals: string[];
  analyzedAt: string;
}

export interface MacroScoreResult {
  macroScore: number;
  components: {
    monetaryPolicy: number;
    globalRisk: number;
    domesticRisk: number;
    growth: number;
    liquidity: number;
  };
  confidence: number;
  calculatedAt: string;
}

export interface SectorImpact {
  sector: string;
  impact: MarketImpact;
  score: number;
  drivers: string[];
}

export interface CombinedConfidence {
  eliteScore: number;
  macroScore: number;
  combined: number;
  weightElite: number;
  weightMacro: number;
  calculatedAt: string;
}

export interface MacroAlertEvent {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  source: string;
  timestamp: string;
}

export interface MacroFullAnalysis {
  data: MacroDataSnapshot;
  tcmb: CentralBankAnalysis;
  fed: CentralBankAnalysis;
  ecb: CentralBankAnalysis;
  regime: MarketRegimeAnalysis;
  score: MacroScoreResult;
  sectors: SectorImpact[];
}

export interface MacroOpportunity {
  ticker: string;
  name: string;
  sector: string;
  eliteScore: number;
  macroScore: number;
  combinedConfidence: number;
  reason: string;
  sectorImpact: MarketImpact;
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
}

export interface MacroRiskItem {
  ticker: string;
  name: string;
  sector: string;
  riskType: 'rate_sensitive' | 'currency_sensitive' | 'global_risk_exposed' | 'weak_sector' | 'high_macro_risk';
  riskDescription: string;
  macroScore: number;
  severity: string;
  timestamp: string;
}

export interface PipelineMetrics {
  pipelineDurationMs: number;
  providerAvgLatencyMs: number;
  macroRefreshDurationMs: number;
  schedulerDurationMs: number;
  providerFailures: number;
  circuitBreakerStatus: Record<string, string>;
  macroUpdateTimestamp: string | null;
  dashboardRefreshMs: number;
}

export interface PipelineStepRecord {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt: string;
  completedAt: string | null;
  durationMs: number;
  error?: string;
}

export interface PipelineContext {
  startedAt: string;
  steps: PipelineStepRecord[];
  error?: string;
}

export interface PipelineStatusResponse {
  metrics: PipelineMetrics;
  stepDurations: Record<string, number>;
}

// Market Overview
export interface MarketOverviewData {
  bist100: { value: number; change: number; changePercent: number };
  sectorHeatmap: { sector: string; changePercent: number; stocks: number }[];
  topGainers: { ticker: string; name: string; changePercent: number; price: number }[];
  topLosers: { ticker: string; name: string; changePercent: number; price: number }[];
  volumeLeaders: { ticker: string; name: string; volume: number; changePercent: number }[];
  smartMoneyLeaders: { ticker: string; name: string; smartMoneyScore: number; accumulation: string }[];
  catalystLeaders: { ticker: string; name: string; catalystScore: number; verified: boolean }[];
}

// Watchlist
export interface WatchlistData {
  favorites: string[];
  pinned: string[];
  recent: string[];
  aiAlerts: { ticker: string; message: string; priority: string }[];
}

// Quick Search
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
  multiTimeframe: { timeframes: string[]; scores: Record<string, number> };
}

// Top Lists
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

// Dashboard Performance
export interface DashboardPerformanceData {
  aiAccuracy: number;
  predictionSuccess: number;
  avgExpectedReturn: number;
  avgWinRate: number;
  learningProgress: { scanned: number; updated: number; modifiers: number };
}

export * from "./early-opportunity";
