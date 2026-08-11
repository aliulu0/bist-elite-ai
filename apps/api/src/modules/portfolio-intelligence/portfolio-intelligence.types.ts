import { EarlyOpportunityIntelligenceResult } from '../ai-early-opportunity/early-opportunity.types';
import { MultiTimeframeOpportunityResult } from '../ai-early-opportunity/multi-timeframe/multi-timeframe.types';
import { PortfolioStatusKey, PositionStatus } from './portfolio-intelligence.config';

export interface PortfolioPositionInput {
  ticker: string;
  quantity: number;
  averageCost: number;
  currentPrice?: number | null;
  manualTarget?: number | null;
  manualStop?: number | null;
  notes?: string | null;
  portfolioWeight?: number | null;
}

export interface StoredPortfolioPosition extends PortfolioPositionInput {
  ticker: string;
  quantity: number;
  averageCost: number;
  currentPrice: number | null;
  manualTarget: number | null;
  manualStop: number | null;
  notes: string | null;
  portfolioWeight: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PositionEnrichment {
  intelligence: EarlyOpportunityIntelligenceResult | null;
  multiTimeframe: MultiTimeframeOpportunityResult | null;
  latestPrice: number | null;
  symbol: { canonicalTicker?: string; companyName?: string; sector?: string } | null;
}

export interface PositionAnalysis {
  ticker: string;
  company: string;
  sector: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  positionValue: number;
  investedCapital: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  portfolioWeight: number;
  sectorWeight: number;
  riskLevel: string;
  riskScore: number;
  eliteScore: number;
  earlyOpportunityScore: number;
  earlyOpportunityLevel: string | null;
  multiTimeframeScore: number | null;
  bullishPercent: number;
  confidence: number;
  expectedReturn: number;
  smartMoneyScore: number | null;
  catalystScore: number | null;
  verificationStatus: string;
  entryZone: { min: number; max: number } | null;
  stop: number | null;
  target1: number | null;
  target2: number | null;
  riskRewardRatio: number | null;
  holdingPeriod: { value: number; unit: string } | null;
  trendStage: string | null;
  momentum: string | null;
  liquidityQuality: string | null;
  status: PositionStatus;
  recommendation: string;
  recommendationReason: string;
  evaluation: string;
}

export interface PortfolioRisk {
  totalValue: number;
  investedCapital: number;
  cash: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  maxPositionWeight: number;
  maxPositionTicker: string | null;
  minPositionWeight: number;
  sectorConcentration: number;
  sectorConcentrationSector: string | null;
  top3Concentration: number;
  top5Concentration: number;
  diversificationScore: number;
  portfolioRiskScore: number;
  portfolioConfidence: number;
  portfolioOpportunityScore: number;
  portfolioExpectedReturn: number;
  portfolioDownsideRisk: number;
  portfolioRiskReward: number;
  warnings: string[];
  lowLiquidityWeight: number;
  lowConfidenceWeight: number;
  weakSmartMoneyWeight: number;
  negativeCatalystWeight: number;
  weakVerificationWeight: number;
}

export interface PortfolioScoreBreakdown {
  earlyOpportunity: number;
  eliteScore: number;
  multiTimeframe: number;
  confidence: number;
  smartMoney: number;
  catalyst: number;
  riskInverse: number;
  liquidity: number;
  verification: number;
  diversification: number;
}

export interface PortfolioAnalysis {
  version: string;
  generatedAt: string;
  statusKey: PortfolioStatusKey;
  statusLabel: string;
  score: number;
  scoreBreakdown: PortfolioScoreBreakdown;
  risk: PortfolioRisk;
  positions: PositionAnalysis[];
  sectorAllocation: Array<{ sector: string; weight: number }>;
  rebalance: RebalanceRecommendation[];
  scenarios: ScenarioResult;
  horizons: HorizonResult;
  opportunities: PortfolioOpportunities;
  recommendations: Array<{ ticker: string; text: string }>;
}

export interface RebalanceRecommendation {
  ticker: string;
  company: string;
  currentWeight: number;
  recommendedMin: number;
  recommendedMax: number;
  status: 'REDUCE_CONCENTRATION' | 'CONSIDER_INCREASE' | 'IN_RANGE';
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ScenarioPosition {
  ticker: string;
  expectedReturn: number;
  weight: number;
}

export interface PortfolioScenario {
  name: 'Bull' | 'Base' | 'Bear';
  expectedPortfolioReturn: number;
  risk: string;
  mainDrivers: string[];
  mainRisks: string[];
  mostSensitivePositions: ScenarioPosition[];
  explanation: string;
}

export interface ScenarioResult {
  bull: PortfolioScenario;
  base: PortfolioScenario;
  bear: PortfolioScenario;
}

export interface HorizonMetric {
  timeframe: string;
  label: string;
  return: number;
}

export interface HorizonResult {
  best: HorizonMetric;
  worst: HorizonMetric;
  intraday: HorizonMetric | null;
  swing: HorizonMetric | null;
  position: HorizonMetric | null;
  investment: HorizonMetric | null;
}

export interface OpportunityFit {
  fitsRisk: boolean;
  increasesConcentration: boolean;
  improvesDiversification: boolean;
  sectorOverlap: boolean;
}

export interface PortfolioOpportunity extends OpportunityFit {
  ticker: string;
  company: string;
  sector: string;
  earlyOpportunityScore: number;
  earlyOpportunityLevel: string;
  eliteScore: number;
  confidence: number;
  expectedReturn: number;
  riskLevel: string;
  smartMoneyScore: number | null;
  catalystScore: number | null;
  multiTimeframeScore: number | null;
  reasons: string[];
  evaluatedAt: string;
}

export interface PortfolioOpportunities {
  improvingHoldings: PositionAnalysis[];
  deterioratingHoldings: PositionAnalysis[];
  newOpportunities: PortfolioOpportunity[];
  summary: string;
}

export interface PortfolioSnapshot {
  id: string;
  generatedAt: string;
  score: number;
  statusKey: PortfolioStatusKey;
  statusLabel: string;
  totalValue: number;
  positionScores: Record<string, number>;
  positionStatuses: Record<string, PositionStatus>;
}

export interface SnapshotComparison {
  scoreChange: number;
  statusChange: string;
  improvingPositions: Array<{ ticker: string; change: number }>;
  deterioratingPositions: Array<{ ticker: string; change: number }>;
}

export interface PortfolioLearning {
  snapshotCount: number;
  recommendationAccuracy: number | null;
  positionClassificationAccuracy: number | null;
  expectedVsRealized: Array<{
    ticker: string;
    snapshot: string;
    expectedReturn: number;
    realizedReturn: number;
    error: number;
    modifier: number;
  }>;
}

export type TelegramReportType =
  | 'portfolio'
  | 'portfolio-risk'
  | 'portfolio-opportunities'
  | 'portfolio-rebalance'
  | 'portfolio-report';
