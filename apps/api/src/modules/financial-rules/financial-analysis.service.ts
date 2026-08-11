import { Injectable, Logger } from '@nestjs/common';
import { FinancialRulesEngine } from './financial-rules-engine.service';
import { FinancialScoreEngine } from './financial-score-engine.service';
import { FinancialSummaryGenerator } from './financial-summary-generator.service';
import { FinancialData, RuleResult } from './rule.types';
import { FinancialScoreResult } from './score.types';
import { FinancialSummary } from './summary.types';

export interface FinancialAnalysisResult {
  symbol: string;
  score: number;
  grade: string;
  confidence: number;
  rules: RuleResult[];
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  summary: string;
  overallOpinion: string;
}

@Injectable()
export class FinancialAnalysisService {
  private readonly logger = new Logger(FinancialAnalysisService.name);

  constructor(
    private readonly rulesEngine: FinancialRulesEngine,
    private readonly scoreEngine: FinancialScoreEngine,
    private readonly summaryGenerator: FinancialSummaryGenerator,
  ) {}

  analyze(data: FinancialData): FinancialAnalysisResult {
    const rulesOutput = this.rulesEngine.evaluate(data);
    const scoreResult = this.scoreEngine.evaluate(rulesOutput);
    const summary = this.summaryGenerator.generate(scoreResult, rulesOutput.rules);

    this.logger.debug(
      `Analysis complete for ${data.symbol}: ${scoreResult.score} (${scoreResult.grade})`,
    );

    return {
      symbol: scoreResult.symbol,
      score: scoreResult.score,
      grade: scoreResult.grade,
      confidence: scoreResult.confidence,
      rules: rulesOutput.rules,
      strengths: summary.strengths,
      weaknesses: summary.weaknesses,
      risks: summary.risks,
      summary: summary.summary,
      overallOpinion: summary.overallOpinion,
    };
  }
}
