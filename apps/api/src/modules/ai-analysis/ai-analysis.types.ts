import {
  Company,
  FinancialStatement,
  UnifiedBalanceSheet,
  UnifiedIncomeStatement,
  CashFlow,
  Sector,
  Disclosure,
} from '../market-data/interfaces/unified-domain.types';
import { AggregatedResult, AggregationMetadata } from '../market-data/aggregation/aggregation.types';

export type AnalysisSignal =
  | 'STRONG_BUY'
  | 'BUY'
  | 'ACCUMULATE'
  | 'NEUTRAL'
  | 'REDUCE'
  | 'SELL'
  | 'STRONG_SELL';

export type AnalysisRecommendation = AnalysisSignal;

export interface PipelineInput {
  company: AggregatedResult<Company>;
  financials?: AggregatedResult<FinancialStatement>;
  balanceSheet?: AggregatedResult<UnifiedBalanceSheet>;
  incomeStatement?: AggregatedResult<UnifiedIncomeStatement>;
  cashFlow?: AggregatedResult<CashFlow>;
  sector?: AggregatedResult<Sector>;
  disclosures?: AggregatedResult<Disclosure[]>;
}

export interface ModuleResult {
  module: string;
  score: number;
  confidence: number;
  signals: string[];
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  warnings: string[];
  metrics: Record<string, number>;
  explanation: string;
  metadata: Record<string, unknown>;
}

export interface SupportingMetric {
  name: string;
  value: number | string;
  description: string;
  module: string;
}

export interface AnalysisResult {
  symbol: string;
  overallScore: number;
  confidenceScore: number;
  signal: AnalysisSignal;
  recommendation: AnalysisRecommendation;
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  warnings: string[];
  explanation: string;
  supportingMetrics: SupportingMetric[];
  providerMetadata: AggregationMetadata;
  moduleResults: ModuleResult[];
  timestamp: string;
  version: string;
}

export const AI_ANALYSIS_VERSION = '1.0.0';
