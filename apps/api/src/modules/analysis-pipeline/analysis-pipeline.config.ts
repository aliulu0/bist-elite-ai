export interface AnalysisPipelineConfig {
  enableFinancialAnalysis: boolean;
  enableTechnicalAnalysis: boolean;
  enableSmartMoneyAnalysis: boolean;
  enableConfluence: boolean;
  enableCandidate: boolean;
  enableOpportunity: boolean;
  enableEliteScore: boolean;
  maxIndicators: number;
}

export const DEFAULT_ANALYSIS_PIPELINE_CONFIG: AnalysisPipelineConfig = {
  enableFinancialAnalysis: true,
  enableTechnicalAnalysis: true,
  enableSmartMoneyAnalysis: true,
  enableConfluence: true,
  enableCandidate: true,
  enableOpportunity: true,
  enableEliteScore: true,
  maxIndicators: 100,
};
