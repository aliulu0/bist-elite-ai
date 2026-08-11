import { Injectable, Logger, Optional } from '@nestjs/common';
import {
  OpportunityResult,
  OpportunityLevel,
  OpportunityType,
  OpportunityAge,
  ConfirmationLevel,
  DetectionModuleResult,
  OpportunityHistoryEntry,
  PenaltyRecord,
  OPPORTUNITY_DETECTION_VERSION,
} from './opportunity-detection.types';
import {
  OpportunityDetectionConfig,
  DEFAULT_OPPORTUNITY_DETECTION_CONFIG,
} from './opportunity-detection.config';
import { IDetectionModule } from './interfaces/detection-module.interface';
import { AnalysisResult } from '../ai-analysis/ai-analysis.types';
import { PriceStructureDetector } from './modules/price-structure.detector';
import { VolumeBehaviourDetector } from './modules/volume-behaviour.detector';
import { MomentumShiftDetector } from './modules/momentum-shift.detector';
import { TrendTransitionDetector } from './modules/trend-transition.detector';
import { MovingAverageStructureDetector } from './modules/moving-average-structure.detector';
import { RSIBehaviourDetector } from './modules/rsi-behaviour.detector';
import { MACDBehaviourDetector } from './modules/macd-behaviour.detector';
import { ATRExpansionDetector } from './modules/atr-expansion.detector';
import { VolatilityCompressionDetector } from './modules/volatility-compression.detector';
import { LiquidityImprovementDetector } from './modules/liquidity-improvement.detector';
import { RelativeStrengthDetector } from './modules/relative-strength.detector';
import { SectorStrengthDetector } from './modules/sector-strength.detector';
import { FundamentalChangeDetector } from './modules/fundamental-change.detector';
import { ValuationDiscountDetector } from './modules/valuation-discount.detector';
import { FinancialQualityDetector } from './modules/financial-quality.detector';
import { CashFlowImprovementDetector } from './modules/cash-flow-improvement.detector';
import { DebtImprovementDetector } from './modules/debt-improvement.detector';
import { GrowthAccelerationDetector } from './modules/growth-acceleration.detector';
import { InstitutionalInterestDetector } from './modules/institutional-interest.detector';
import { CompositeOpportunityDetector } from './modules/composite-opportunity.detector';
import { ScoreCalculator } from './services/score-calculator.service';
import { PriorityEngine } from './services/priority-engine.service';
import { AgeTracker } from './services/age-tracker.service';
import { DuplicateDetector } from './services/duplicate-detector.service';
import { ConfirmationEngine } from './services/confirmation-engine.service';
import { PenaltyEngine } from './services/penalty-engine.service';
import { ExplanationEngine } from './services/explanation-engine.service';
import { MetricsCollector } from './services/metrics-collector.service';

@Injectable()
export class OpportunityDetectionEngine {
  private readonly logger = new Logger(OpportunityDetectionEngine.name);
  private readonly config: OpportunityDetectionConfig;
  private readonly modules: IDetectionModule[];
  private readonly opportunityHistory: Map<string, OpportunityHistoryEntry[]> = new Map();

  constructor(
    private readonly priceStructure: PriceStructureDetector,
    private readonly volumeBehaviour: VolumeBehaviourDetector,
    private readonly momentumShift: MomentumShiftDetector,
    private readonly trendTransition: TrendTransitionDetector,
    private readonly movingAverage: MovingAverageStructureDetector,
    private readonly rsiBehaviour: RSIBehaviourDetector,
    private readonly macdBehaviour: MACDBehaviourDetector,
    private readonly atrExpansion: ATRExpansionDetector,
    private readonly volatilityCompression: VolatilityCompressionDetector,
    private readonly liquidityImprovement: LiquidityImprovementDetector,
    private readonly relativeStrength: RelativeStrengthDetector,
    private readonly sectorStrength: SectorStrengthDetector,
    private readonly fundamentalChange: FundamentalChangeDetector,
    private readonly valuationDiscount: ValuationDiscountDetector,
    private readonly financialQuality: FinancialQualityDetector,
    private readonly cashFlowImprovement: CashFlowImprovementDetector,
    private readonly debtImprovement: DebtImprovementDetector,
    private readonly growthAcceleration: GrowthAccelerationDetector,
    private readonly institutionalInterest: InstitutionalInterestDetector,
    private readonly compositeOpportunity: CompositeOpportunityDetector,
    private readonly scoreCalculator: ScoreCalculator,
    private readonly priorityEngine: PriorityEngine,
    private readonly ageTracker: AgeTracker,
    private readonly duplicateDetector: DuplicateDetector,
    private readonly confirmationEngine: ConfirmationEngine,
    private readonly penaltyEngine: PenaltyEngine,
    private readonly explanationEngine: ExplanationEngine,
    private readonly metricsCollector: MetricsCollector,
    @Optional() config?: Partial<OpportunityDetectionConfig>,
  ) {
    this.config = { ...DEFAULT_OPPORTUNITY_DETECTION_CONFIG, ...config };
    this.modules = this.buildModuleList();
  }

  detect(input: AnalysisResult): OpportunityResult {
    const startTime = Date.now();
    const symbol = input.symbol;
    const moduleResults: DetectionModuleResult[] = [];
    const moduleDurations: Record<string, number> = {};

    const enabledModules = this.modules.filter(
      (m) => m.enabled && this.isModuleEnabled(m.name),
    );

    for (const mod of enabledModules) {
      const modStart = Date.now();
      try {
        moduleResults.push(mod.detect(input));
        moduleDurations[mod.name] = Date.now() - modStart;
      } catch (error) {
        this.logger.warn(`Module ${mod.name} failed: ${error instanceof Error ? error.message : String(error)}`);
        moduleResults.push(this.buildFailedModuleResult(mod.name));
        moduleDurations[mod.name] = Date.now() - modStart;
      }
    }

    const { level: confirmationLevel, count: confirmationCount } =
      this.confirmationEngine.calculate(moduleResults, this.config.confirmation);

    const rawScore = this.scoreCalculator.calculateWeightedScore(
      moduleResults,
      this.config.moduleWeights,
    );

    const penalties = this.penaltyEngine.calculate(
      moduleResults,
      this.config.penalty,
      input.providerMetadata.qualityScore,
      input.confidenceScore,
    );

    const afterPenaltyScore = this.scoreCalculator.applyPenalties(rawScore, penalties);
    const confirmationBonus = this.confirmationEngine.getConfirmationScore(confirmationLevel);
    const opportunityScore = Math.min(100, afterPenaltyScore + confirmationBonus * 0.2);

    const strengths = this.explanationEngine.collectStrengths(moduleResults);
    const weaknesses = this.explanationEngine.collectWeaknesses(moduleResults);
    const risks = this.explanationEngine.collectRisks(moduleResults);
    const warnings = this.explanationEngine.collectWarnings(moduleResults);

    const riskScore = this.calculateRiskScore(risks, penalties);
    const confidence = this.calculateConfidence(input, moduleResults, confirmationLevel);
    const opportunityLevel = this.determineLevel(opportunityScore);
    const opportunityTypes = this.detectTypes(moduleResults, input);
    const primaryType = this.determinePrimaryType(opportunityTypes);
    const age = this.determineAge(symbol, opportunityScore);
    const ageFactor = this.ageTracker.getAgeFactor(age);

    const history = this.opportunityHistory.get(symbol) ?? [];
    const duplicateCheck = this.duplicateDetector.detect(symbol, opportunityScore, history);

    const freshness = this.calculateFreshness(input);
    const priority = this.priorityEngine.calculate(
      opportunityScore,
      confidence,
      riskScore,
      freshness,
      ageFactor,
      this.config.priorityThresholds,
    );

    this.updateHistory(symbol, opportunityScore, opportunityLevel, priority);
    this.metricsCollector.recordDetection(opportunityLevel, opportunityScore, confidence, riskScore);

    const durationMs = Date.now() - startTime;

    const explanation = this.explanationEngine.buildExplanation(
      opportunityScore,
      opportunityLevel,
      opportunityTypes,
      confirmationLevel,
      strengths,
      weaknesses,
      penalties,
    );

    const supportingMetrics = this.explanationEngine.buildSupportingMetrics(moduleResults);

    return {
      symbol,
      opportunityScore,
      confidence,
      opportunityLevel,
      opportunityType: primaryType,
      priority,
      recommendation: this.buildRecommendation(priority, opportunityLevel),
      age,
      confirmationLevel,
      confirmationCount,
      reasons: this.buildReasons(opportunityLevel, opportunityTypes, strengths, weaknesses),
      strengths,
      weaknesses,
      risks,
      warnings,
      explanation,
      supportingMetrics,
      detectionModuleResults: moduleResults,
      opportunityTypes,
      penalties,
      metadata: {
        detectionDurationMs: durationMs,
        moduleCount: this.modules.length,
        enabledModuleCount: enabledModules.length,
        failedModuleCount: moduleResults.filter((m) => m.metadata.failed === true).length,
        confirmationLevel,
        confirmationCount,
        ageStatus: age,
        previousScore: history.length > 0 ? history[history.length - 1].score : null,
        scoreDelta: history.length > 0 ? opportunityScore - history[history.length - 1].score : null,
        duplicateCount: duplicateCheck.duplicateCount,
        aggregationQuality: input.providerMetadata.qualityScore,
        providerConfidence: input.confidenceScore,
        metrics: moduleDurations,
      },
      timestamp: new Date().toISOString(),
      version: OPPORTUNITY_DETECTION_VERSION,
    };
  }

  private buildModuleList(): IDetectionModule[] {
    return [
      this.priceStructure,
      this.volumeBehaviour,
      this.momentumShift,
      this.trendTransition,
      this.movingAverage,
      this.rsiBehaviour,
      this.macdBehaviour,
      this.atrExpansion,
      this.volatilityCompression,
      this.liquidityImprovement,
      this.relativeStrength,
      this.sectorStrength,
      this.fundamentalChange,
      this.valuationDiscount,
      this.financialQuality,
      this.cashFlowImprovement,
      this.debtImprovement,
      this.growthAcceleration,
      this.institutionalInterest,
      this.compositeOpportunity,
    ];
  }

  private isModuleEnabled(moduleName: string): boolean {
    const enabledMap: Record<string, boolean> = {
      priceStructure: this.config.moduleEnabled.priceStructure,
      volumeBehaviour: this.config.moduleEnabled.volumeBehaviour,
      momentumShift: this.config.moduleEnabled.momentumShift,
      trendTransition: this.config.moduleEnabled.trendTransition,
      movingAverageStructure: this.config.moduleEnabled.movingAverageStructure,
      rsiBehaviour: this.config.moduleEnabled.rsiBehaviour,
      macdBehaviour: this.config.moduleEnabled.macdBehaviour,
      atrExpansion: this.config.moduleEnabled.atrExpansion,
      volatilityCompression: this.config.moduleEnabled.volatilityCompression,
      liquidityImprovement: this.config.moduleEnabled.liquidityImprovement,
      relativeStrength: this.config.moduleEnabled.relativeStrength,
      sectorStrength: this.config.moduleEnabled.sectorStrength,
      fundamentalChange: this.config.moduleEnabled.fundamentalChange,
      valuationDiscount: this.config.moduleEnabled.valuationDiscount,
      financialQuality: this.config.moduleEnabled.financialQuality,
      cashFlowImprovement: this.config.moduleEnabled.cashFlowImprovement,
      debtImprovement: this.config.moduleEnabled.debtImprovement,
      growthAcceleration: this.config.moduleEnabled.growthAcceleration,
      institutionalInterest: this.config.moduleEnabled.institutionalInterest,
      compositeOpportunity: this.config.moduleEnabled.compositeOpportunity,
    };
    return enabledMap[moduleName] ?? true;
  }

  private determineLevel(score: number): OpportunityLevel {
    const t = this.config.levelThresholds;
    if (score >= t.exceptional) return 'EXCEPTIONAL';
    if (score >= t.veryStrong) return 'VERY_STRONG';
    if (score >= t.strong) return 'STRONG';
    if (score >= t.emerging) return 'EMERGING';
    if (score >= t.interesting) return 'INTERESTING';
    if (score >= t.watch) return 'WATCH';
    if (score >= t.none) return 'NONE';
    return 'SUPPORT';
  }

  private detectTypes(moduleResults: DetectionModuleResult[], input: AnalysisResult): OpportunityType[] {
    const types: OpportunityType[] = [];

    const momentum = moduleResults.find((m) => m.module === 'momentumShift');
    if (momentum && momentum.score > 65) types.push('MOMENTUM_BREAKOUT');

    const volume = moduleResults.find((m) => m.module === 'volumeBehaviour');
    if (volume && volume.score > 65) types.push('VOLUME_EXPANSION');

    const trend = moduleResults.find((m) => m.module === 'trendTransition');
    if (trend && trend.score > 65) types.push('TREND_REVERSAL');

    const fundamental = moduleResults.find((m) => m.module === 'fundamentalChange');
    if (fundamental && fundamental.score > 65) types.push('FUNDAMENTAL_IMPROVEMENT');

    const valuation = moduleResults.find((m) => m.module === 'valuationDiscount');
    if (valuation && valuation.score > 65) types.push('UNDERVALUATION');

    const sector = moduleResults.find((m) => m.module === 'sectorStrength');
    if (sector && sector.score > 65) types.push('SECTOR_ROTATION');

    const institutional = moduleResults.find((m) => m.module === 'institutionalInterest');
    if (institutional && institutional.score > 65) types.push('INSTITUTIONAL_ACCUMULATION');

    if (input.signal === 'BUY' || input.signal === 'STRONG_BUY') {
      types.push('EARNINGS_OPPORTUNITY');
    }

    if (types.length >= 3) {
      types.push('MULTI_FACTOR');
    }

    if (types.length === 0) types.push('CUSTOM');

    return types;
  }

  private determinePrimaryType(types: OpportunityType[]): OpportunityType {
    if (types.includes('MULTI_FACTOR')) return 'MULTI_FACTOR';
    if (types.includes('MOMENTUM_BREAKOUT')) return 'MOMENTUM_BREAKOUT';
    if (types.includes('FUNDAMENTAL_IMPROVEMENT')) return 'FUNDAMENTAL_IMPROVEMENT';
    if (types.includes('UNDERVALUATION')) return 'UNDERVALUATION';
    if (types.length > 0) return types[0];
    return 'CUSTOM';
  }

  private calculateRiskScore(risks: string[], penalties: PenaltyRecord[]): number {
    let risk = 0;
    risk += risks.length * 8;
    risk += penalties.length * 5;
    for (const p of penalties) {
      risk += p.amount * 0.3;
    }
    return Math.min(100, Math.max(0, risk));
  }

  private calculateConfidence(
    input: AnalysisResult,
    moduleResults: DetectionModuleResult[],
    confirmationLevel: ConfirmationLevel,
  ): number {
    let confidence = input.confidenceScore;

    const validModules = moduleResults.filter((m) => m.confidence > 0);
    if (validModules.length > 0) {
      const avgModuleConfidence =
        validModules.reduce((sum, m) => sum + m.confidence, 0) / validModules.length;
      confidence = (confidence + avgModuleConfidence) / 2;
    }

    const confirmationBonus =
      confirmationLevel === 'MULTI' ? 10 :
      confirmationLevel === 'TRIPLE' ? 7 :
      confirmationLevel === 'DOUBLE' ? 4 :
      confirmationLevel === 'SINGLE' ? 2 : 0;

    return Math.min(100, Math.max(0, confidence + confirmationBonus));
  }

  private calculateFreshness(input: AnalysisResult): number {
    const age = Date.now() - new Date(input.timestamp).getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    if (age < oneDay) return 100;
    if (age < 3 * oneDay) return 80;
    if (age < 7 * oneDay) return 60;
    if (age < 30 * oneDay) return 40;
    return 20;
  }

  private determineAge(symbol: string, currentScore: number): OpportunityAge {
    const history = this.opportunityHistory.get(symbol) ?? [];
    return this.ageTracker.determineAge(history, this.config.age);
  }

  private updateHistory(
    symbol: string,
    score: number,
    level: OpportunityLevel,
    priority: string,
  ): void {
    const history = this.opportunityHistory.get(symbol) ?? [];
    history.push({
      timestamp: new Date().toISOString(),
      score,
      level,
      priority: priority as any,
    });
    const merged = this.duplicateDetector.mergeEntries(history, this.config.maxDuplicateHistory);
    this.opportunityHistory.set(symbol, merged);
  }

  private buildRecommendation(priority: string, level: OpportunityLevel): string {
    if (priority === 'CRITICAL') return 'Investigate immediately — critical opportunity detected';
    if (priority === 'HIGH') return 'Investigate soon — high-priority opportunity';
    if (priority === 'MEDIUM') return 'Monitor and investigate when convenient';
    if (priority === 'LOW') return 'Add to watchlist for passive monitoring';
    return 'Below threshold — no action recommended';
  }

  private buildReasons(
    level: OpportunityLevel,
    types: OpportunityType[],
    strengths: string[],
    weaknesses: string[],
  ): string[] {
    const reasons: string[] = [];
    if (level === 'SUPPORT' || level === 'NONE') {
      reasons.push('No significant opportunity detected');
      return reasons;
    }
    reasons.push(`Opportunity level: ${level}`);
    if (types.length > 0) reasons.push(`Types: ${types.join(', ')}`);
    for (const s of strengths.slice(0, 3)) reasons.push(s);
    for (const w of weaknesses.slice(0, 2)) reasons.push(`Risk: ${w}`);
    return reasons;
  }

  private buildFailedModuleResult(moduleName: string): DetectionModuleResult {
    return {
      module: moduleName,
      score: 0,
      confidence: 0,
      signals: [],
      strengths: [],
      weaknesses: [`Module ${moduleName} failed to execute`],
      risks: [`Data from ${moduleName} unavailable`],
      warnings: [`Module ${moduleName} execution error`],
      metrics: {},
      explanation: `Module ${moduleName} failed during detection`,
      metadata: { failed: true },
    };
  }

  getHistory(symbol: string): OpportunityHistoryEntry[] {
    return this.opportunityHistory.get(symbol) ?? [];
  }

  clearHistory(symbol?: string): void {
    if (symbol) {
      this.opportunityHistory.delete(symbol);
    } else {
      this.opportunityHistory.clear();
    }
  }
}
