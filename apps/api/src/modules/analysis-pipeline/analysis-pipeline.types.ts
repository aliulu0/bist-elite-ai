import { Timeframe } from '../indicators/indicator.types';
import { IndicatorResult } from '../indicators/indicator.types';
import { MarketStructureResult } from '../market-structure/market-structure.types';
import { SmartMoneyResult } from '../smart-money/smart-money.types';
import { TechnicalRulesOutput } from '../technical-rules/technical-rules.types';
import { TechnicalScoreOutput } from '../technical-score/technical-score.types';
import { TechnicalSummary } from '../technical-summary/technical-summary.types';
import { FinancialRulesOutput } from '../financial-rules/rule.types';
import { FinancialScoreResult } from '../financial-rules/score.types';
import { FinancialSummary } from '../financial-rules/summary.types';
import { ConfluenceResult } from '../confluence/confluence.types';
import { CandidateResult } from '../candidate/candidate.types';
import { OpportunityResult } from '../opportunity/opportunity.types';
import { EliteScoreResult } from '../elite-score/elite-score.types';

export interface PipelineStepResult {
  step: string;
  durationMs: number;
  success: boolean;
  error?: string;
}

export interface AnalysisResult {
  symbol: string;
  timeframe: Timeframe;
  indicators: IndicatorResult[];
  marketStructure: MarketStructureResult;
  smartMoney: SmartMoneyResult;
  technicalRules: TechnicalRulesOutput;
  technicalScore: TechnicalScoreOutput;
  technicalSummary: TechnicalSummary;
  financialRules: FinancialRulesOutput;
  financialScore: FinancialScoreResult;
  financialSummary: FinancialSummary;
  confluence: ConfluenceResult;
  candidate: CandidateResult;
  opportunity: OpportunityResult;
  eliteScore: EliteScoreResult;
  pipelineSteps: PipelineStepResult[];
  metadata: Record<string, unknown>;
  isValid: boolean;
}
