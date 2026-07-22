import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../logger/logger.service';
import { CacheService } from '../cache/cache.service';
import {
  ExplanationInput,
  ExplanationOutput,
  ExplainabilityConfig,
  getExplainabilityConfig,
  IndicatorEvidence,
} from './types';
import { ConfidenceCalculator } from './confidence.service';
import { RiskAnalyzer } from './risk.service';
import { MultiTimeframeAnalyzer } from './multi-timeframe.service';
import { MarketInterpreter } from './market-interpreter.service';
import { getDisclaimer } from './turkish-terms';

@Injectable()
export class ExplainabilityService {
  private readonly config: ExplainabilityConfig;

  constructor(
    private readonly logger: AppLoggerService,
    private readonly cacheService: CacheService,
    private readonly confidenceCalculator: ConfidenceCalculator,
    private readonly riskAnalyzer: RiskAnalyzer,
    private readonly multiTimeframeAnalyzer: MultiTimeframeAnalyzer,
    private readonly marketInterpreter: MarketInterpreter,
  ) {
    this.config = getExplainabilityConfig();
  }

  generateExplanation(input: ExplanationInput): ExplanationOutput {
    const cacheKey = `explain:${input.stockSymbol}:${input.currentPrice}`;
    if (this.config.enableCaching) {
      const cached = this.cacheService.get<ExplanationOutput>(cacheKey, 'scores');
      if (cached) {
        this.logger.debug(`Cache hit for explanation: ${input.stockSymbol}`, 'ExplainabilityService');
        return cached;
      }
    }

    this.logger.log(`Generating explanation for ${input.stockSymbol}`, 'ExplainabilityService');

    const trendAnalysis = this.marketInterpreter.interpretTrend(input);
    const momentumAnalysis = this.marketInterpreter.interpretMomentum(input);
    const volumeAnalysis = this.marketInterpreter.interpretVolume(input);
    const supportResistance = this.marketInterpreter.interpretSupportResistance(input);
    const riskAnalysis = this.riskAnalyzer.analyze(input);
    const confidenceExplanation = this.confidenceCalculator.calculate(input);
    const multiTimeframeSummary = this.multiTimeframeAnalyzer.analyze(input);
    const eliteScoreExplanation = this.marketInterpreter.explainEliteScore(input);

    const limitedEvidence = this.limitEvidence(input.indicators || []);

    const output: ExplanationOutput = {
      stockSymbol: input.stockSymbol,
      stockName: input.stockName,
      generatedAt: new Date().toISOString(),
      generalSummary: this.marketInterpreter.buildGeneralSummary(input),
      technicalAnalysis: this.marketInterpreter.buildTechnicalAnalysis(input),
      trendAnalysis,
      momentumAnalysis,
      volumeAnalysis,
      supportResistance,
      riskAnalysis,
      positiveFactors: eliteScoreExplanation.positiveFactors,
      negativeFactors: eliteScoreExplanation.negativeFactors,
      eliteScoreExplanation,
      confidenceExplanation,
      multiTimeframeSummary,
      suggestedObservation: this.marketInterpreter.buildSuggestedObservation(input),
      finalEvaluation: this.marketInterpreter.buildFinalEvaluation(input),
      disclaimer: getDisclaimer(),
      evidenceTrail: limitedEvidence,
    };

    if (this.config.enableCaching) {
      this.cacheService.set(cacheKey, output, this.config.cacheTtlMs, 'scores');
    }

    this.logger.log(`Explanation generated for ${input.stockSymbol}`, 'ExplainabilityService', {
      compositeScore: input.eliteScore?.composite,
      confidence: confidenceExplanation.score,
      riskCount: riskAnalysis.length,
    });

    return output;
  }

  generateExplanationSummary(input: ExplanationInput): string {
    const output = this.generateExplanation(input);
    return this.buildSummaryText(output);
  }

  getEvidenceForIndicator(input: ExplanationInput, indicatorName: string): IndicatorEvidence[] {
    return (input.indicators || []).filter(i => i.indicator === indicatorName);
  }

  getPositiveFactorsSummary(input: ExplanationInput): string[] {
    const explanation = this.generateExplanation(input);
    return explanation.positiveFactors.positive.map(f => `${f.factor}: ${f.evidence}`);
  }

  getNegativeFactorsSummary(input: ExplanationInput): string[] {
    const explanation = this.generateExplanation(input);
    return explanation.negativeFactors.negative.map(f => `${f.factor}: ${f.evidence}`);
  }

  getRiskSummary(input: ExplanationInput): string[] {
    const risks = this.riskAnalyzer.analyze(input);
    const overallLevel = this.riskAnalyzer.getOverallRiskLevel(risks);
    const highRisks = risks.filter(r => r.severity === 'high' || r.severity === 'critical');

    const summary: string[] = [];
    summary.push(`Genel risk seviyesi: ${overallLevel.toUpperCase()}`);

    if (highRisks.length > 0) {
      summary.push(`Yüksek risk faktörleri: ${highRisks.map(r => r.type).join(', ')}`);
    }

    return summary;
  }

  private limitEvidence(evidence: IndicatorEvidence[]): IndicatorEvidence[] {
    return evidence.slice(0, this.config.maxEvidenceItems);
  }

  private buildSummaryText(output: ExplanationOutput): string {
    const parts: string[] = [];

    parts.push(output.generalSummary);
    parts.push('');
    parts.push('--- Teknik Analiz ---');
    parts.push(output.technicalAnalysis);
    parts.push('');
    parts.push('--- Trend ---');
    parts.push(output.trendAnalysis.description);
    parts.push('');
    parts.push('--- Momentum ---');
    parts.push(output.momentumAnalysis.description);
    parts.push('');
    parts.push('--- Hacim ---');
    parts.push(output.volumeAnalysis.description);
    parts.push('');
    parts.push('--- Destek / Direnç ---');
    parts.push(output.supportResistance.description);

    if (output.riskAnalysis.length > 0) {
      parts.push('');
      parts.push('--- Risk Analizi ---');
      for (const risk of output.riskAnalysis) {
        if (risk.severity !== 'low') {
          parts.push(`• ${risk.description}`);
        }
      }
    }

    parts.push('');
    parts.push('--- Çoklu Zaman Dilimi ---');
    parts.push(output.multiTimeframeSummary.shortTermView);
    parts.push(output.multiTimeframeSummary.mediumTermView);
    parts.push(output.multiTimeframeSummary.longTermView);
    if (output.multiTimeframeSummary.hasConflict) {
      parts.push(`Uyarı: ${output.multiTimeframeSummary.conflictDescription}`);
    }

    parts.push('');
    parts.push('--- Elite Skor ---');
    parts.push(output.eliteScoreExplanation.description);

    parts.push('');
    parts.push('--- Güven ---');
    parts.push(output.confidenceExplanation.description);

    parts.push('');
    parts.push('--- Öneri ---');
    parts.push(output.suggestedObservation);

    parts.push('');
    parts.push('--- Son Değerlendirme ---');
    parts.push(output.finalEvaluation);

    parts.push('');
    parts.push(output.disclaimer);

    return parts.join('\n');
  }
}
