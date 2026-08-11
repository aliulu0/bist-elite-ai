export const PORTFOLIO_OPTIMIZATION_ENGINE_VERSION = '1.0.0';

export interface PortfolioOptimizationInput {
  ticker: string;
  company: string | null;
  analystResult: AnalystResult | null;
  decisionResult: DecisionResult | null;
  opportunityResult: OpportunityResult | null;
  eliteScoreResult: EliteScoreResult | null;
  tomorrowResult: TomorrowCandidateResult | null;
  verificationResult: VerificationResult | null;
  catalysts: CatalystResultDto[];
  indicators: IndicatorResult[];
  sector: string | null;
}

export interface PortfolioOptimizationResult {
  ticker: string;
  company: string | null;
  portfolioScore: number;
  riskScore: number;
  diversificationScore: number;
  sectorDistribution: SectorAllocation[];
  expectedReturn: number;
  expectedRisk: number;
  volatility: number;
  maxDrawdownEstimate: number;
  sharpeEstimate: number;
  betaEstimate: number;
  correlationMatrix: Record<string, number>;
  positionWeights: PositionWeight[];
  suggestedAllocation: Record<string, number>;
  cashRatio: number;
  sectorLimits: Record<string, number>;
  aiComment: string;
  warnings: string[];
  strengths: string[];
  weaknesses: string[];
  recommendedActions: string[];
  evaluatedAt: string;
}

export interface SectorAllocation {
  sector: string;
  weight: number;
}

export interface PositionWeight {
  symbol: string;
  weight: number;
  minWeight: number;
  maxWeight: number;
  reason: string;
}

export interface PortfolioRiskResult {
  riskScore: number;
  volatility: number;
  maxDrawdownEstimate: number;
  sharpeEstimate: number;
  betaEstimate: number;
  warnings: string[];
}

export interface PortfolioDiversificationResult {
  diversificationScore: number;
  sectorDistribution: SectorAllocation[];
  concentrationRisk: string;
  warnings: string[];
}

export interface OptimizationRecommendation {
  action: string;
  confidence: number;
  reason: string;
  expectedImpact: string;
}

export interface PortfolioOptimizationEntry {
  ticker: string;
  input: unknown;
  result: PortfolioOptimizationResult;
  evaluatedAt: string;
}

import { AnalystResult } from '../analyst/analyst.types';
import { DecisionResult } from '../decision/decision.types';
import { OpportunityResult } from '../ai-opportunity/opportunity.types';
import { EliteScoreResult } from '../ai-elite-score/elite-score.types';
import { TomorrowCandidateResult } from '../tomorrow/tomorrow.types';
import { VerificationResult, CatalystResultDto } from '../research/interfaces/verification.types';
import { IndicatorResult } from '../indicators/indicator.types';