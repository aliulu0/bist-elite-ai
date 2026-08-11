import { SymbolAnalysis } from '../../market-scanner/market-scanner.types';
import { AnalysisResult } from '../../analysis-pipeline/analysis-pipeline.types';

export function mapToSymbolAnalysis(result: AnalysisResult): SymbolAnalysis | null {
  if (!result || !result.isValid) return null;

  return {
    symbol: result.symbol,
    eliteScore: result.eliteScore?.eliteScore ?? 0,
    eliteRating: result.eliteScore?.rating ?? 'D',
    elitePriority: result.eliteScore?.priority ?? 'NONE',
    opportunityLevel: result.opportunity?.opportunityLevel ?? 'NONE',
    opportunityScore: result.opportunity?.opportunityScore ?? 0,
    candidate: result.candidate?.candidate ?? false,
    candidateScore: result.candidate?.candidateScore ?? 0,
    candidatePriority: result.candidate?.priority ?? 'REJECT',
    financialScore: result.financialScore?.score ?? 0,
    technicalScore: result.technicalScore?.score ?? 0,
    smartMoneyScore: result.smartMoney?.smartMoneyConfidence ?? 0,
    confluenceScore: result.confluence?.confluenceScore ?? 0,
    marketStructureScore: result.marketStructure?.trend === 'uptrend' ? 75 :
      result.marketStructure?.trend === 'downtrend' ? 25 : 50,
    confidence: result.eliteScore?.confidence ?? 0,
    earlyOpportunity: result.opportunity?.earlyOpportunity ?? false,
    reasons: [
      ...(result.opportunity?.strengths ?? []),
      ...(result.candidate?.reasons ?? []),
    ],
    riskFactors: result.opportunity?.riskFactors ?? [],
  };
}
