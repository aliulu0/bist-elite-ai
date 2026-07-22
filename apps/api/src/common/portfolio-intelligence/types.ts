export enum DashboardWidget {
  PORTFOLIO_SUMMARY = 'PORTFOLIO_SUMMARY',
  INTELLIGENCE_PANEL = 'INTELLIGENCE_PANEL',
  PERFORMANCE_ANALYTICS = 'PERFORMANCE_ANALYTICS',
  RISK_CENTER = 'RISK_CENTER',
  EXPLAINABILITY_CENTER = 'EXPLAINABILITY_CENTER',
  NOTIFICATION_CENTER = 'NOTIFICATION_CENTER',
  TIMELINE = 'TIMELINE',
}

export enum DashboardFilterType {
  SECTOR = 'SECTOR',
  INDUSTRY = 'INDUSTRY',
  ELITE_SCORE = 'ELITE_SCORE',
  CONFIDENCE = 'CONFIDENCE',
  MARKET_REGIME = 'MARKET_REGIME',
  OPPORTUNITY_STAGE = 'OPPORTUNITY_STAGE',
  TIMEFRAME = 'TIMEFRAME',
  RISK_LEVEL = 'RISK_LEVEL',
  STRATEGY = 'STRATEGY',
}

export enum AlertPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AlertCategory {
  PORTFOLIO = 'PORTFOLIO',
  OPPORTUNITY = 'OPPORTUNITY',
  RISK = 'RISK',
  PERFORMANCE = 'PERFORMANCE',
  REGIME = 'REGIME',
  SYSTEM = 'SYSTEM',
}

export enum TrendDirection {
  UP = 'UP',
  DOWN = 'DOWN',
  FLAT = 'FLAT',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface DashboardConfig {
  refreshIntervals: {
    portfolioSummary: number;
    intelligencePanel: number;
    performanceAnalytics: number;
    riskCenter: number;
    notifications: number;
    timeline: number;
  };
  defaultFilters: DashboardFilter[];
  widgets: {
    enabled: DashboardWidget[];
    layout: string;
  };
  maxAlerts: number;
  maxTimelineEvents: number;
  maxOpportunities: number;
}

export interface DashboardFilter {
  type: DashboardFilterType;
  value: string;
  label: string;
}

export interface FilterOptions {
  sectors: string[];
  industries: string[];
  strategies: string[];
  marketRegimes: string[];
  opportunityStages: string[];
  timeframes: string[];
  riskLevels: string[];
}

export interface PortfolioSummaryWidget {
  totalValue: number;
  cashBalance: number;
  investedValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  todayReturn: number;
  todayReturnPercent: number;
  weekReturn: number;
  weekReturnPercent: number;
  monthReturn: number;
  monthReturnPercent: number;
  openPositionsCount: number;
  closedPositionsCount: number;
  winRate: number;
  portfolioRiskScore: number;
  riskLevel: RiskLevel;
  cashAllocation: number;
  investedAllocation: number;
  lastUpdated: string;
}

export interface PositionSummary {
  symbol: string;
  sector: string;
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  holdingDays: number;
  eliteScoreAtEntry: number;
  currentEliteScore: number;
  riskLevel: RiskLevel;
}

export interface OpportunitySummary {
  id: string;
  symbol: string;
  stage: string;
  eliteScore: number;
  confidence: number;
  consensusScore: number;
  healthScore: number;
  detectedAt: string;
  ageHours: number;
  direction: string;
  trend: string;
  sector: string;
  strategy: string;
}

export interface IntelligencePanelWidget {
  topOpportunities: OpportunitySummary[];
  highestEliteScores: OpportunitySummary[];
  highestConfidence: OpportunitySummary[];
  strongestConsensus: OpportunitySummary[];
  emergingOpportunities: OpportunitySummary[];
  weakeningOpportunities: OpportunitySummary[];
  currentMarketRegime: string;
  marketRegimeConfidence: number;
  totalActiveOpportunities: number;
  lastUpdated: string;
}

export interface PerformanceMetric {
  label: string;
  value: number;
  unit: string;
  trend: TrendDirection;
  changePercent: number;
}

export interface StrategyPerformance {
  strategy: string;
  winRate: number;
  totalTrades: number;
  avgReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
}

export interface SectorPerformance {
  sector: string;
  avgReturn: number;
  winRate: number;
  exposure: number;
  opportunityCount: number;
}

export interface TimeframePerformance {
  timeframe: string;
  avgReturn: number;
  winRate: number;
  signalCount: number;
  consensusAccuracy: number;
}

export interface PerformanceAnalyticsWidget {
  overallMetrics: PerformanceMetric[];
  recommendationSuccessRate: number;
  strategyPerformance: StrategyPerformance[];
  sectorPerformance: SectorPerformance[];
  timeframePerformance: TimeframePerformance[];
  historicalPerformance: { period: string; returnPercent: number }[];
  benchmarkComparison: { benchmark: string; portfolioReturn: number; benchmarkReturn: number; alpha: number };
  lastUpdated: string;
}

export interface RiskMetric {
  label: string;
  value: number;
  threshold: number;
  level: RiskLevel;
  description: string;
}

export interface SectorConcentration {
  sector: string;
  weight: number;
  riskLevel: RiskLevel;
}

export interface RiskCenterWidget {
  overallRiskScore: number;
  overallRiskLevel: RiskLevel;
  riskMetrics: RiskMetric[];
  sectorConcentration: SectorConcentration[];
  maxDrawdown: number;
  currentDrawdown: number;
  volatility: number;
  liquidityRisk: RiskLevel;
  timeframeConflicts: number;
  regimeRisk: RiskLevel;
  riskAlerts: string[];
  lastUpdated: string;
}

export interface ExplanationWidget {
  symbol: string;
  eliteScore: number;
  confidence: number;
  positiveFactors: { factor: string; contribution: number; description: string }[];
  negativeFactors: { factor: string; contribution: number; description: string }[];
  riskFactors: { type: string; severity: string; score: number; description: string; mitigation: string }[];
  consensusSummary: string;
  regimeContext: string;
  explanation: string;
  lastUpdated: string;
}

export interface DashboardAlert {
  id: string;
  category: AlertCategory;
  priority: AlertPriority;
  title: string;
  message: string;
  symbol?: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface NotificationCenterWidget {
  totalAlerts: number;
  unreadAlerts: number;
  highPriorityAlerts: number;
  alerts: DashboardAlert[];
  alertHistory: DashboardAlert[];
  lastUpdated: string;
}

export interface TimelineEvent {
  id: string;
  type: string;
  symbol: string;
  title: string;
  description: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface DashboardTimelineWidget {
  opportunityTimeline: TimelineEvent[];
  recommendationTimeline: TimelineEvent[];
  portfolioTimeline: TimelineEvent[];
  regimeTimeline: TimelineEvent[];
  lastUpdated: string;
}

export interface DashboardResponse {
  portfolioSummary: PortfolioSummaryWidget;
  intelligencePanel: IntelligencePanelWidget;
  performanceAnalytics: PerformanceAnalyticsWidget;
  riskCenter: RiskCenterWidget;
  explainabilityCenter: ExplanationWidget;
  notificationCenter: NotificationCenterWidget;
  timeline: DashboardTimelineWidget;
  activeFilters: DashboardFilter[];
  lastUpdated: string;
}

export const DASHBOARD_CONFIG_DEFAULTS: DashboardConfig = {
  refreshIntervals: {
    portfolioSummary: 30000,
    intelligencePanel: 60000,
    performanceAnalytics: 300000,
    riskCenter: 60000,
    notifications: 15000,
    timeline: 120000,
  },
  defaultFilters: [],
  widgets: {
    enabled: Object.values(DashboardWidget),
    layout: 'grid',
  },
  maxAlerts: 50,
  maxTimelineEvents: 100,
  maxOpportunities: 20,
};
