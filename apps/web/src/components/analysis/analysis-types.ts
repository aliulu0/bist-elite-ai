export interface AnalysisResult {
  symbol: string;
  timeframe: string;
  indicators: Record<string, unknown>;
  marketStructure: Record<string, unknown>;
  smartMoney: {
    timeframe: string;
    accumulationScore: number;
    distributionScore: number;
    institutionalActivity: string;
    smartMoneyConfidence: number;
    trendAlignment: string;
    signals: Array<{ type: string; strength: number; description: string }>;
    isValid: boolean;
  };
  technicalRules: { rules: Array<{ rule: string; category: string; status: string; description: string }>; isValid: boolean };
  technicalScore: { score: number; grade: string; confidence: number; ruleBreakdown: Array<{ rule: string; category: string; status: string; weight: number; contribution: number }> };
  technicalSummary: { summary: string; overallOpinion: string; strengths: string[]; weaknesses: string[]; risks: string[]; recommendations: string[] };
  financialRules: { rules: Array<{ name: string; status: string; message: string }> };
  financialScore: { score: number; grade: string; confidence: number };
  financialSummary: { summary: string; overallOpinion: string; strengths: string[]; weaknesses: string[]; risks: string[] };
  confluence: {
    confluenceScore: number;
    agreement: string;
    financialAlignment: { score: number; direction: string; confidence: number; factors: string[] };
    technicalAlignment: { score: number; direction: string; confidence: number; factors: string[] };
    smartMoneyAlignment: { score: number; direction: string; confidence: number; factors: string[] };
    trendAlignment: { score: number; direction: string; confidence: number; factors: string[] };
    confidence: number;
  };
  opportunity: {
    opportunityScore: number;
    earlyOpportunity: boolean;
    opportunityLevel: string;
    confidence: number;
    strengths: string[];
    riskFactors: string[];
    reasons: string[];
  };
  eliteScore: {
    eliteScore: number;
    rating: string;
    priority: string;
    confidence: number;
    earlyOpportunity: boolean;
    summary: string;
    breakdown: {
      financial: { score: number; weight: number; contribution: number };
      technical: { score: number; weight: number; contribution: number };
      opportunity: { score: number; weight: number; contribution: number };
      confluence: { score: number; weight: number; contribution: number };
      candidate: { score: number; weight: number; contribution: number };
    };
  };
  pipelineSteps: Array<{ step: string; durationMs: number; success: boolean }>;
  metadata: { totalDurationMs: number; stepsCompleted: number; stepsSuccessful: number };
}
