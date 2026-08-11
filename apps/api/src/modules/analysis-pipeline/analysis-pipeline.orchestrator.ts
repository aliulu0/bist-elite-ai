import { Injectable, Optional } from '@nestjs/common';
import { IndicatorEngine } from '../indicators/indicator-engine.service';
import { MarketStructureEngine } from '../market-structure/market-structure.engine';
import { SmartMoneyEngine } from '../smart-money/smart-money.engine';
import { TechnicalRulesEngine } from '../technical-rules/technical-rules.engine';
import { TechnicalScoreEngine } from '../technical-score/technical-score.engine';
import { TechnicalSummaryGenerator } from '../technical-summary/technical-summary.generator';
import { FinancialRulesEngine } from '../financial-rules/financial-rules-engine.service';
import { FinancialScoreEngine } from '../financial-rules/financial-score-engine.service';
import { FinancialSummaryGenerator } from '../financial-rules/financial-summary-generator.service';
import { ConfluenceEngine } from '../confluence/confluence.engine';
import { CandidateEngine } from '../candidate/candidate.engine';
import { OpportunityEngine } from '../opportunity/opportunity.engine';
import { EliteScoreEngine } from '../elite-score/elite-score.engine';
import { HistoricalDataset } from '../historical-data/historical-data.types';
import { AnalysisResult, PipelineStepResult } from './analysis-pipeline.types';
import { AnalysisPipelineConfig, DEFAULT_ANALYSIS_PIPELINE_CONFIG } from './analysis-pipeline.config';
import { mapToFinancialData } from './fundamental.mapper';

@Injectable()
export class AnalysisPipelineOrchestrator {
  private readonly config: AnalysisPipelineConfig;

  constructor(
    private readonly indicatorEngine: IndicatorEngine,
    private readonly marketStructureEngine: MarketStructureEngine,
    private readonly smartMoneyEngine: SmartMoneyEngine,
    private readonly technicalRulesEngine: TechnicalRulesEngine,
    private readonly technicalScoreEngine: TechnicalScoreEngine,
    private readonly technicalSummaryGenerator: TechnicalSummaryGenerator,
    private readonly financialRulesEngine: FinancialRulesEngine,
    private readonly financialScoreEngine: FinancialScoreEngine,
    private readonly financialSummaryGenerator: FinancialSummaryGenerator,
    private readonly confluenceEngine: ConfluenceEngine,
    private readonly candidateEngine: CandidateEngine,
    private readonly opportunityEngine: OpportunityEngine,
    private readonly eliteScoreEngine: EliteScoreEngine,
    @Optional() config?: Partial<AnalysisPipelineConfig>,
  ) {
    this.config = { ...DEFAULT_ANALYSIS_PIPELINE_CONFIG, ...config };
  }

  async analyze(dataset: HistoricalDataset): Promise<AnalysisResult> {
    const { symbol, timeframe, bars, fundamentals } = dataset;
    const pipelineSteps: PipelineStepResult[] = [];

    // Step 1: Indicators
    const indicators = this.runStep('indicators', pipelineSteps, () =>
      this.indicatorEngine.calculateAll(bars, timeframe),
    );

    // Step 2: Market Structure
    const marketStructure = this.runStep('marketStructure', pipelineSteps, () =>
      this.marketStructureEngine.analyze(bars, timeframe),
    );

    // Step 3: Smart Money
    const smartMoney = this.config.enableSmartMoneyAnalysis
      ? this.runStep('smartMoney', pipelineSteps, () =>
          this.smartMoneyEngine.evaluate(indicators, marketStructure, timeframe),
        )
      : this.emptySmartMoney(timeframe);

    // Step 4: Technical Rules
    const technicalRules = this.config.enableTechnicalAnalysis
      ? this.runStep('technicalRules', pipelineSteps, () =>
          this.technicalRulesEngine.evaluate(indicators, marketStructure, smartMoney, timeframe),
        )
      : { timeframe, rules: [], isValid: false };

    // Step 5: Technical Score
    const technicalScore = this.config.enableTechnicalAnalysis
      ? this.runStep('technicalScore', pipelineSteps, () =>
          this.technicalScoreEngine.calculate(technicalRules.rules, timeframe),
        )
      : { timeframe, score: 0, grade: 'D' as const, confidence: 0, ruleBreakdown: [], metadata: {}, isValid: false };

    // Step 6: Technical Summary
    const technicalSummary = this.config.enableTechnicalAnalysis
      ? this.runStep('technicalSummary', pipelineSteps, () =>
          this.technicalSummaryGenerator.generate(technicalScore, technicalRules.rules, timeframe),
        )
      : { timeframe, summary: '', overallOpinion: '', strengths: [], weaknesses: [], risks: [], recommendations: [], metadata: {}, isValid: false };

    // Step 7: Financial Analysis
    const financialData = this.mapToFinancialData(symbol, fundamentals);
    const financialRules = this.config.enableFinancialAnalysis
      ? this.runStep('financialRules', pipelineSteps, () =>
          this.financialRulesEngine.evaluate(financialData),
        )
      : { symbol, rules: [] };

    const financialScore = this.config.enableFinancialAnalysis
      ? this.runStep('financialScore', pipelineSteps, () =>
          this.financialScoreEngine.evaluate(financialRules),
        )
      : { symbol, score: 0, grade: 'D' as const, passedRules: 0, warningRules: 0, failedRules: 0, confidence: 0, breakdown: { items: [], totalWeight: 0 } };

    const financialSummary = this.config.enableFinancialAnalysis
      ? this.runStep('financialSummary', pipelineSteps, () =>
          this.financialSummaryGenerator.generate(financialScore, financialRules.rules),
        )
      : { summary: '', strengths: [], weaknesses: [], risks: [], positives: [], overallOpinion: '' };

    // Step 8: Confluence
    const confluence = this.config.enableConfluence
      ? this.runStep('confluence', pipelineSteps, () =>
          this.confluenceEngine.evaluate({
            financialScore,
            financialSummary,
            technicalScore,
            technicalSummary,
            smartMoney,
            marketStructure,
          }),
        )
      : { confluenceScore: 0, agreement: 'VERY_LOW' as const, financialAlignment: { score: 0, direction: 'neutral' as const, confidence: 0, factors: [] }, technicalAlignment: { score: 0, direction: 'neutral' as const, confidence: 0, factors: [] }, smartMoneyAlignment: { score: 0, direction: 'neutral' as const, confidence: 0, factors: [] }, trendAlignment: { score: 0, direction: 'neutral' as const, confidence: 0, factors: [] }, confidence: 0, metadata: {}, isValid: false };

    // Step 9: Candidate
    const candidate = this.config.enableCandidate
      ? this.runStep('candidate', pipelineSteps, () =>
          this.candidateEngine.evaluate({ symbol, financialScore, technicalScore, confluence }),
        )
      : { candidate: false, candidateScore: 0, priority: 'REJECT' as const, reasons: [], confidence: 0, metadata: {}, isValid: false };

    // Step 10: Opportunity
    const opportunity = this.config.enableOpportunity
      ? this.runStep('opportunity', pipelineSteps, () =>
          this.opportunityEngine.evaluate({ symbol, candidate, confluence, financialScore, technicalScore, smartMoney, marketStructure }),
        )
      : { opportunityScore: 0, earlyOpportunity: false, opportunityLevel: 'NONE' as const, confidence: 0, strengths: [], riskFactors: [], reasons: [], metadata: {}, isValid: false };

    // Step 11: Elite Score
    const eliteScore = this.config.enableEliteScore
      ? this.runStep('eliteScore', pipelineSteps, () =>
          this.eliteScoreEngine.evaluate({ symbol, opportunity, candidate, confluence, financialScore, technicalScore }),
        )
      : { eliteScore: 0, rating: 'D' as const, priority: 'NONE' as const, confidence: 0, earlyOpportunity: false, summary: '', breakdown: { financial: { score: 0, weight: 0, contribution: 0 }, technical: { score: 0, weight: 0, contribution: 0 }, opportunity: { score: 0, weight: 0, contribution: 0 }, confluence: { score: 0, weight: 0, contribution: 0 }, candidate: { score: 0, weight: 0, contribution: 0 } }, metadata: {}, isValid: false };

    const totalDuration = pipelineSteps.reduce((sum, s) => sum + s.durationMs, 0);
    const allSuccess = pipelineSteps.every((s) => s.success);

    return {
      symbol,
      timeframe,
      indicators,
      marketStructure,
      smartMoney,
      technicalRules,
      technicalScore,
      technicalSummary,
      financialRules,
      financialScore,
      financialSummary,
      confluence,
      candidate,
      opportunity,
      eliteScore,
      pipelineSteps,
      metadata: {
        totalDurationMs: totalDuration,
        stepsCompleted: pipelineSteps.length,
        stepsSuccessful: pipelineSteps.filter((s) => s.success).length,
        config: this.config,
        analyzedAt: new Date().toISOString(),
      },
      isValid: allSuccess,
    };
  }

  private runStep<T>(step: string, steps: PipelineStepResult[], fn: () => T): T {
    const start = Date.now();
    try {
      const result = fn();
      steps.push({ step, durationMs: Date.now() - start, success: true });
      return result;
    } catch (error) {
      steps.push({
        step,
        durationMs: Date.now() - start,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private mapToFinancialData(symbol: string, fundamentals: HistoricalDataset['fundamentals']) {
    return mapToFinancialData(symbol, fundamentals);
  }

  private emptySmartMoney(timeframe: import('../indicators/indicator.types').Timeframe) {
    return {
      timeframe,
      accumulationScore: 0,
      distributionScore: 0,
      institutionalActivity: 'neutral' as const,
      smartMoneyConfidence: 0,
      trendAlignment: 'sideways' as const,
      signals: [],
      metadata: {},
      isValid: false,
    };
  }
}
