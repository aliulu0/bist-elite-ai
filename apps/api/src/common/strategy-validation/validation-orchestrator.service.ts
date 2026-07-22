import { Injectable } from '@nestjs/common';
import {
  StrategyValidationInput, ValidationSummary, ComparisonResult, ValidationReport,
  ValidationConfig, VALIDATION_CONFIG_DEFAULTS, ValidationType, ValidationStatus,
  TradeRecord, Timeframe, MarketCondition, SignalAction
} from './types';
import { PerformanceMetricsService } from './performance-metrics.service';
import { SignalQualityService } from './signal-quality.service';
import { MarketConditionAnalyzer } from './market-condition.service';
import { MultiTimeframeValidator } from './multi-timeframe-validator.service';
import { EliteScoreValidator } from './elite-score-validator.service';
import { ReportGenerator } from './report-generator.service';
import {
  VALIDATION_STATUS_TURKISH, VALIDATION_TYPE_TURKISH,
  generateValidationSummaryTurkish, generatePerformanceCommentaryTurkish,
  generateMarketConditionCommentaryTurkish
} from './turkish-terms';

@Injectable()
export class ValidationOrchestrator {
  constructor(
    private readonly performanceMetrics: PerformanceMetricsService,
    private readonly signalQuality: SignalQualityService,
    private readonly marketConditionAnalyzer: MarketConditionAnalyzer,
    private readonly multiTimeframeValidator: MultiTimeframeValidator,
    private readonly eliteScoreValidator: EliteScoreValidator,
    private readonly reportGenerator: ReportGenerator
  ) {}

  async validate(input: StrategyValidationInput): Promise<ValidationSummary> {
    const startTime = Date.now();
    const config = { ...VALIDATION_CONFIG_DEFAULTS, ...input.config };

    const performanceMetrics = this.performanceMetrics.calculate(input.trades, config);

    const signalQualityMetrics = this.signalQuality.calculate(
      input.signals.map(s => ({
        date: s.date,
        action: s.action,
        confidence: s.confidence,
        price: s.price,
      })),
      input.trades,
      config
    );

    const marketConditionPerformance = this.marketConditionAnalyzer.analyze(input.trades);

    const timeframeValidation = this.multiTimeframeValidator.validate(
      input.trades,
      input.signals,
      input.timeframes
    );

    let eliteScoreValidation = null;
    if (input.signals.some(s => s.confidence > 0)) {
      const eliteScores = input.signals.map(s => ({
        date: s.date,
        score: s.confidence * 100,
        confidence: s.confidence,
        componentScores: s.indicators,
        actualOutcome: this.findActualOutcome(s.date, input.trades),
      }));
      eliteScoreValidation = this.eliteScoreValidator.validate(eliteScores);
    }

    const overallScore = this.calculateOverallScore(
      performanceMetrics,
      signalQualityMetrics,
      marketConditionPerformance,
      timeframeValidation,
      eliteScoreValidation,
      config
    );

    const confidence = this.calculateConfidence(
      performanceMetrics,
      signalQualityMetrics,
      timeframeValidation,
      input.trades.length
    );

    const strengths = this.identifyStrengths(
      performanceMetrics,
      signalQualityMetrics,
      marketConditionPerformance,
      timeframeValidation
    );

    const weaknesses = this.identifyWeaknesses(
      performanceMetrics,
      signalQualityMetrics,
      marketConditionPerformance,
      timeframeValidation
    );

    const riskAssessment = this.assessRisk(
      performanceMetrics,
      marketConditionPerformance,
      timeframeValidation
    );

    const improvementSuggestions = this.generateImprovementSuggestions(
      performanceMetrics,
      signalQualityMetrics,
      marketConditionPerformance,
      timeframeValidation,
      weaknesses
    );

    const status = this.determineStatus(overallScore, config);

    const validationDuration = Date.now() - startTime;

    return {
      strategyId: input.strategyId,
      strategyName: input.strategyName,
      validationType: input.validationType,
      overallScore,
      status,
      confidence,
      performanceMetrics,
      signalQuality: signalQualityMetrics,
      marketConditionPerformance,
      timeframeValidation,
      eliteScoreValidation,
      strengths,
      weaknesses,
      riskAssessment,
      improvementSuggestions,
      validatedAt: new Date().toISOString(),
      validationDuration,
      disclaimer: 'Bu rapor yalnızca bilgilendirme amaçlıdır ve yatırım tavsiyesi niteliği taşımamaktadır.',
    };
  }

  async compare(inputs: StrategyValidationInput[]): Promise<ComparisonResult> {
    const summaries = await Promise.all(inputs.map(input => this.validate(input)));

    return this.reportGenerator.generateComparisonSummary(
      summaries.map(s => ({
        strategyId: s.strategyId,
        strategyName: s.strategyName,
        overallScore: s.overallScore,
        performanceMetrics: s.performanceMetrics,
        signalQuality: s.signalQuality,
      }))
    );
  }

  async generateReport(
    input: StrategyValidationInput,
    comparison?: ComparisonResult
  ): Promise<ValidationReport> {
    const summary = await this.validate(input);
    return this.reportGenerator.generateReport(summary, input.trades, comparison);
  }

  private findActualOutcome(date: string, trades: TradeRecord[]): number {
    const trade = trades.find(t => t.entryDate === date);
    return trade ? trade.pnlPercent : 0;
  }

  private calculateOverallScore(
    performanceMetrics: any,
    signalQualityMetrics: any,
    marketConditionPerformance: any[],
    timeframeValidation: any[],
    eliteScoreValidation: any,
    config: ValidationConfig
  ): number {
    const { returnWeight, riskWeight, qualityWeight, consistencyWeight } = config.metricWeights;

    const returnScore = this.scoreReturnMetrics(performanceMetrics);
    const riskScore = this.scoreRiskMetrics(performanceMetrics);
    const qualityScore = this.scoreQualityMetrics(signalQualityMetrics);
    const consistencyScore = this.scoreConsistencyMetrics(
      marketConditionPerformance,
      timeframeValidation,
      eliteScoreValidation
    );

    const overallScore =
      returnScore * returnWeight +
      riskScore * riskWeight +
      qualityScore * qualityWeight +
      consistencyScore * consistencyWeight;

    return Math.max(0, Math.min(100, overallScore));
  }

  private scoreReturnMetrics(metrics: any): number {
    let score = 0;

    score += Math.min(30, metrics.winRate * 0.3);
    score += Math.min(30, Math.min(metrics.profitFactor, 3) * 10);
    score += Math.min(20, Math.max(0, metrics.sharpeRatio) * 10);
    score += Math.min(20, Math.max(0, metrics.annualizedReturn) * 2);

    return Math.min(100, score);
  }

  private scoreRiskMetrics(metrics: any): number {
    let score = 100;

    if (metrics.maxDrawdown > 30) score -= 40;
    else if (metrics.maxDrawdown > 20) score -= 30;
    else if (metrics.maxDrawdown > 10) score -= 15;

    if (metrics.sortinoRatio < 0) score -= 20;
    else score += Math.min(10, metrics.sortinoRatio * 5);

    score += Math.min(10, Math.max(0, metrics.recoveryFactor) * 5);

    return Math.max(0, Math.min(100, score));
  }

  private scoreQualityMetrics(metrics: any): number {
    let score = 0;

    score += metrics.precision * 30;
    score += metrics.recall * 25;
    score += metrics.f1Score * 25;
    score += metrics.signalStability * 10;
    score += metrics.signalConsistency * 10;

    return Math.min(100, score);
  }

  private scoreConsistencyMetrics(
    marketConditionPerformance: any[],
    timeframeValidation: any[],
    eliteScoreValidation: any
  ): number {
    let score = 50;

    if (marketConditionPerformance.length > 0) {
      const avgWinRate = marketConditionPerformance.reduce((s, p) => s + p.winRate, 0) / marketConditionPerformance.length;
      score += (avgWinRate - 50) * 0.3;
    }

    if (timeframeValidation.length > 0) {
      const avgAccuracy = timeframeValidation.reduce((s, t) => s + t.agreementAccuracy, 0) / timeframeValidation.length;
      score += (avgAccuracy - 0.5) * 40;
    }

    if (eliteScoreValidation) {
      score += eliteScoreValidation.accuracy * 20;
      score += eliteScoreValidation.confidenceCalibration * 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateConfidence(
    performanceMetrics: any,
    signalQualityMetrics: any,
    timeframeValidation: any[],
    tradeCount: number
  ): number {
    const sampleSizeConfidence = Math.min(1, tradeCount / 100);
    const performanceConfidence = (
      Math.min(1, performanceMetrics.winRate / 60) * 0.3 +
      Math.min(1, performanceMetrics.profitFactor / 2) * 0.3 +
      Math.min(1, Math.max(0, performanceMetrics.sharpeRatio) / 2) * 0.2 +
      Math.min(1, signalQualityMetrics.f1Score / 0.7) * 0.2
    );

    let timeframeConfidence = 0.5;
    if (timeframeValidation.length > 0) {
      const avgAgreement = timeframeValidation.reduce((s, t) => s + t.agreementAccuracy, 0) / timeframeValidation.length;
      timeframeConfidence = avgAgreement;
    }

    return sampleSizeConfidence * 0.3 + performanceConfidence * 0.5 + timeframeConfidence * 0.2;
  }

  private identifyStrengths(
    performanceMetrics: any,
    signalQualityMetrics: any,
    marketConditionPerformance: any[],
    timeframeValidation: any[]
  ): string[] {
    const strengths: string[] = [];

    if (performanceMetrics.winRate >= 60) {
      strengths.push(`Yüksek kazanma oranı: %${performanceMetrics.winRate.toFixed(1)}`);
    }
    if (performanceMetrics.profitFactor >= 2) {
      strengths.push(`Güçlü kâr faktörü: ${performanceMetrics.profitFactor.toFixed(2)}`);
    }
    if (performanceMetrics.sharpeRatio >= 1.5) {
      strengths.push(`İyi risk-getiri oranı: Sharpe ${performanceMetrics.sharpeRatio.toFixed(2)}`);
    }
    if (performanceMetrics.maxDrawdown <= 15) {
      strengths.push(`Kontrollü maksimum drawdown: %${performanceMetrics.maxDrawdown.toFixed(1)}`);
    }
    if (signalQualityMetrics.precision >= 0.7) {
      strengths.push(`Yüksek sinyal hassasiyeti: %${(signalQualityMetrics.precision * 100).toFixed(1)}`);
    }
    if (signalQualityMetrics.f1Score >= 0.7) {
      strengths.push(`Güçlü F1 skoru: %${(signalQualityMetrics.f1Score * 100).toFixed(1)}`);
    }
    if (marketConditionPerformance.length > 0) {
      const bestCondition = marketConditionPerformance.reduce((best, p) =>
        p.winRate > best.winRate ? p : best
      );
      if (bestCondition.winRate >= 65) {
        strengths.push(`En iyi performans: ${bestCondition.condition} koşullarında %${bestCondition.winRate.toFixed(1)} kazanma`);
      }
    }
    if (timeframeValidation.length > 0) {
      const bestTimeframe = timeframeValidation.reduce((best, t) =>
        t.agreementAccuracy > best.agreementAccuracy ? t : best
      );
      if (bestTimeframe.agreementAccuracy >= 0.7) {
        strengths.push(`En güçlü zaman dilimi: ${bestTimeframe.timeframe} - %${(bestTimeframe.agreementAccuracy * 100).toFixed(1)} doğruluk`);
      }
    }

    return strengths;
  }

  private identifyWeaknesses(
    performanceMetrics: any,
    signalQualityMetrics: any,
    marketConditionPerformance: any[],
    timeframeValidation: any[]
  ): string[] {
    const weaknesses: string[] = [];

    if (performanceMetrics.winRate < 50) {
      weaknesses.push(`Düşük kazanma oranı: %${performanceMetrics.winRate.toFixed(1)}`);
    }
    if (performanceMetrics.profitFactor < 1.2) {
      weaknesses.push(`Zayıf kâr faktörü: ${performanceMetrics.profitFactor.toFixed(2)}`);
    }
    if (performanceMetrics.maxDrawdown > 25) {
      weaknesses.push(`Yüksek maksimum drawdown: %${performanceMetrics.maxDrawdown.toFixed(1)}`);
    }
    if (performanceMetrics.sharpeRatio < 0.5) {
      weaknesses.push(`Düşük Sharpe oranı: ${performanceMetrics.sharpeRatio.toFixed(2)}`);
    }
    if (signalQualityMetrics.precision < 0.55) {
      weaknesses.push(`Düşük sinyal hassasiyeti: %${(signalQualityMetrics.precision * 100).toFixed(1)}`);
    }
    if (signalQualityMetrics.falsePositiveRate > 0.4) {
      weaknesses.push(`Yüksek yanlış pozitif oranı: %${(signalQualityMetrics.falsePositiveRate * 100).toFixed(1)}`);
    }
    if (marketConditionPerformance.length > 0) {
      const worstCondition = marketConditionPerformance.reduce((worst, p) =>
        p.winRate < worst.winRate ? p : worst
      );
      if (worstCondition.winRate < 40) {
        weaknesses.push(`En zayıf performans: ${worstCondition.condition} koşullarında %${worstCondition.winRate.toFixed(1)} kazanma`);
      }
    }
    if (timeframeValidation.length > 0) {
      const weakestTimeframe = timeframeValidation.reduce((weakest, t) =>
        t.agreementAccuracy < weakest.agreementAccuracy ? t : weakest
      );
      if (weakestTimeframe.agreementAccuracy < 0.4) {
        weaknesses.push(`En zayıf zaman dilimi: ${weakestTimeframe.timeframe} - %${(weakestTimeframe.agreementAccuracy * 100).toFixed(1)} doğruluk`);
      }
    }

    return weaknesses;
  }

  private assessRisk(
    performanceMetrics: any,
    marketConditionPerformance: any[],
    timeframeValidation: any[]
  ): ValidationSummary['riskAssessment'] {
    const riskFactors: ValidationSummary['riskAssessment']['riskFactors'] = [];
    let overallRisk = 0;

    if (performanceMetrics.maxDrawdown > 20) {
      riskFactors.push({
        type: 'DRAWDOWN_RISK',
        severity: 'HIGH',
        score: performanceMetrics.maxDrawdown,
        description: `Maksimum drawdown %${performanceMetrics.maxDrawdown.toFixed(1)} seviyesinde`,
      });
      overallRisk += 30;
    }

    if (performanceMetrics.volatility > 30) {
      riskFactors.push({
        type: 'VOLATILITY_RISK',
        severity: 'MEDIUM',
        score: performanceMetrics.volatility,
        description: `Yüksek volatilite: %${performanceMetrics.volatility.toFixed(1)}`,
      });
      overallRisk += 20;
    }

    if (performanceMetrics.winRate < 45) {
      riskFactors.push({
        type: 'WIN_RATE_RISK',
        severity: 'HIGH',
        score: 100 - performanceMetrics.winRate,
        description: `Düşük kazanma oranı: %${performanceMetrics.winRate.toFixed(1)}`,
      });
      overallRisk += 25;
    }

    if (performanceMetrics.profitFactor < 1) {
      riskFactors.push({
        type: 'PROFIT_FACTOR_RISK',
        severity: 'CRITICAL',
        score: (1 - performanceMetrics.profitFactor) * 100,
        description: `Kâr faktörü 1'in altında: ${performanceMetrics.profitFactor.toFixed(2)}`,
      });
      overallRisk += 35;
    }

    if (marketConditionPerformance.length > 0) {
      const worstCondition = marketConditionPerformance.reduce((worst, p) =>
        p.winRate < worst.winRate ? p : worst
      );
      if (worstCondition.winRate < 35) {
        riskFactors.push({
          type: 'MARKET_CONDITION_RISK',
          severity: 'MEDIUM',
          score: 100 - worstCondition.winRate,
          description: `${worstCondition.condition} koşullarında zayıf performans`,
        });
        overallRisk += 15;
      }
    }

    if (timeframeValidation.length > 0) {
      const weakTimeframes = timeframeValidation.filter(t => t.agreementAccuracy < 0.4);
      if (weakTimeframes.length > 0) {
        riskFactors.push({
          type: 'TIMEFRAME_RISK',
          severity: 'MEDIUM',
          score: (1 - weakTimeframes[0].agreementAccuracy) * 100,
          description: `${weakTimeframes[0].timeframe} zaman diliminde zayıf doğruluk`,
        });
        overallRisk += 15;
      }
    }

    return {
      overallRisk: Math.min(100, overallRisk),
      riskFactors,
    };
  }

  private generateImprovementSuggestions(
    performanceMetrics: any,
    signalQualityMetrics: any,
    marketConditionPerformance: any[],
    timeframeValidation: any[],
    weaknesses: string[]
  ): string[] {
    const suggestions: string[] = [];

    if (performanceMetrics.winRate < 55) {
      suggestions.push('Kazanma oranını artırmak için sinyal filtrelerini sıkılaştırın');
    }
    if (performanceMetrics.maxDrawdown > 20) {
      suggestions.push('Drawdown\'u azaltmak için stop-loss seviyelerini optimize edin');
    }
    if (performanceMetrics.profitFactor < 1.5) {
      suggestions.push('Kâr faktörünü artırmak için kâr/zarar oranını iyileştirin');
    }
    if (signalQualityMetrics.precision < 0.6) {
      suggestions.push('Sinyal hassasiyetini artırmak için daha fazla onay göstergesi ekleyin');
    }
    if (signalQualityMetrics.falsePositiveRate > 0.3) {
      suggestions.push('Yanlış pozitifleri azaltmak için sinyal kalite eşiğini yükseltin');
    }
    if (marketConditionPerformance.length > 0) {
      const weakConditions = marketConditionPerformance.filter(p => p.winRate < 45);
      if (weakConditions.length > 0) {
        suggestions.push(`${weakConditions.map(p => p.condition).join(', ')} koşullarında stratejiyi devre dışı bırakmayı düşünün`);
      }
    }
    if (timeframeValidation.length > 0) {
      const weakTimeframes = timeframeValidation.filter(t => t.agreementAccuracy < 0.4);
      if (weakTimeframes.length > 0) {
        suggestions.push(`${weakTimeframes.map(t => t.timeframe).join(', ')} zaman dilimlerinde sinyal kalitesini artırın`);
      }
    }
    if (performanceMetrics.signalFrequency < 0.01) {
      suggestions.push('Sinyal sıklığını artırmak için tetikleme koşullarını genişletin');
    }

    return suggestions;
  }

  private determineStatus(overallScore: number, config: ValidationConfig): ValidationStatus {
    if (overallScore >= config.acceptanceCriteria.minOverallScore) {
      return ValidationStatus.PASSED;
    }
    if (overallScore >= config.acceptanceCriteria.minOverallScore * 0.8) {
      return ValidationStatus.WARNING;
    }
    return ValidationStatus.FAILED;
  }
}
