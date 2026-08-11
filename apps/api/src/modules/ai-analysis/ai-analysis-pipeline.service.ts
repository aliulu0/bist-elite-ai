import { Injectable, Logger, Optional } from '@nestjs/common';
import { PipelineInput, AnalysisResult, ModuleResult, AI_ANALYSIS_VERSION } from './ai-analysis.types';
import { AiAnalysisConfig, DEFAULT_AI_ANALYSIS_CONFIG } from './config/ai-analysis.config';
import { IAnalysisModule } from './interfaces/analysis-module.interface';
import { ScoreAggregator } from './score-aggregator.service';
import { ConfidenceCalculator } from './confidence-calculator.service';
import { SignalGenerator } from './signal-generator.service';
import { ExplanationBuilder } from './explanation-builder.service';
import { TechnicalAnalysisHandler } from './modules/technical-analysis.handler';
import { FundamentalAnalysisHandler } from './modules/fundamental-analysis.handler';
import { FinancialHealthHandler } from './modules/financial-health.handler';
import { GrowthAnalysisHandler } from './modules/growth-analysis.handler';
import { MomentumAnalysisHandler } from './modules/momentum-analysis.handler';
import { RiskAnalysisHandler } from './modules/risk-analysis.handler';
import { LiquidityAnalysisHandler } from './modules/liquidity-analysis.handler';
import { VolatilityAnalysisHandler } from './modules/volatility-analysis.handler';
import { TrendAnalysisHandler } from './modules/trend-analysis.handler';
import { ValuationAnalysisHandler } from './modules/valuation-analysis.handler';

@Injectable()
export class AiAnalysisPipeline {
  private readonly logger = new Logger(AiAnalysisPipeline.name);
  private readonly config: AiAnalysisConfig;
  private readonly modules: IAnalysisModule[];

  constructor(
    private readonly technicalHandler: TechnicalAnalysisHandler,
    private readonly fundamentalHandler: FundamentalAnalysisHandler,
    private readonly financialHealthHandler: FinancialHealthHandler,
    private readonly growthHandler: GrowthAnalysisHandler,
    private readonly momentumHandler: MomentumAnalysisHandler,
    private readonly riskHandler: RiskAnalysisHandler,
    private readonly liquidityHandler: LiquidityAnalysisHandler,
    private readonly volatilityHandler: VolatilityAnalysisHandler,
    private readonly trendHandler: TrendAnalysisHandler,
    private readonly valuationHandler: ValuationAnalysisHandler,
    private readonly scoreAggregator: ScoreAggregator,
    private readonly confidenceCalculator: ConfidenceCalculator,
    private readonly signalGenerator: SignalGenerator,
    private readonly explanationBuilder: ExplanationBuilder,
    @Optional() config?: Partial<AiAnalysisConfig>,
  ) {
    this.config = { ...DEFAULT_AI_ANALYSIS_CONFIG, ...config };
    this.modules = this.buildModuleList();
  }

  async analyze(input: PipelineInput): Promise<AnalysisResult> {
    const startTime = Date.now();
    const symbol = input.company.data.symbol;
    const moduleResults: ModuleResult[] = [];

    const enabledModules = this.modules.filter((m) => m.enabled && this.isModuleEnabled(m.name));

    const results = await Promise.allSettled(
      enabledModules.map(async (mod) => {
        try {
          return await mod.analyze(input);
        } catch (error) {
          this.logger.warn(`Module ${mod.name} failed: ${error instanceof Error ? error.message : String(error)}`);
          return this.buildFailedModuleResult(mod.name);
        }
      }),
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        moduleResults.push(result.value);
      } else {
        moduleResults.push(this.buildFailedModuleResult('unknown'));
      }
    }

    const overallScore = this.scoreAggregator.calculateOverallScore(moduleResults, this.config.weights);
    const confidenceScore = this.confidenceCalculator.calculate(
      moduleResults,
      input,
      input.company.metadata,
    );
    const signal = this.signalGenerator.generate(overallScore, this.config.signalThresholds);
    const explanation = this.explanationBuilder.buildExplanation(overallScore, signal, moduleResults);
    const strengths = this.explanationBuilder.collectStrengths(moduleResults);
    const weaknesses = this.explanationBuilder.collectWeaknesses(moduleResults);
    const risks = this.explanationBuilder.collectRisks(moduleResults);
    const warnings = this.explanationBuilder.collectWarnings(moduleResults);
    const supportingMetrics = this.explanationBuilder.buildSupportingMetrics(moduleResults);

    const durationMs = Date.now() - startTime;
    this.logger.debug(`Pipeline completed for ${symbol}: score=${overallScore}, signal=${signal}, duration=${durationMs}ms`);

    return {
      symbol,
      overallScore,
      confidenceScore,
      signal,
      recommendation: signal,
      strengths,
      weaknesses,
      risks,
      warnings,
      explanation,
      supportingMetrics,
      providerMetadata: input.company.metadata,
      moduleResults,
      timestamp: new Date().toISOString(),
      version: AI_ANALYSIS_VERSION,
    };
  }

  private buildModuleList(): IAnalysisModule[] {
    return [
      this.technicalHandler,
      this.fundamentalHandler,
      this.financialHealthHandler,
      this.growthHandler,
      this.momentumHandler,
      this.riskHandler,
      this.liquidityHandler,
      this.volatilityHandler,
      this.trendHandler,
      this.valuationHandler,
    ];
  }

  private isModuleEnabled(moduleName: string): boolean {
    const enabledMap: Record<string, boolean> = {
      technical: this.config.enabled.technical,
      fundamental: this.config.enabled.fundamental,
      financialHealth: this.config.enabled.financialHealth,
      growth: this.config.enabled.growth,
      momentum: this.config.enabled.momentum,
      risk: this.config.enabled.risk,
      liquidity: this.config.enabled.liquidity,
      volatility: this.config.enabled.volatility,
      trend: this.config.enabled.trend,
      valuation: this.config.enabled.valuation,
    };
    return enabledMap[moduleName] ?? true;
  }

  private buildFailedModuleResult(moduleName: string): ModuleResult {
    return {
      module: moduleName,
      score: 0,
      confidence: 0,
      signals: [],
      strengths: [],
      weaknesses: [`Module ${moduleName} failed to execute`],
      risks: [`Data from ${moduleName} module unavailable`],
      warnings: [`Module ${moduleName} execution error`],
      metrics: {},
      explanation: `Module ${moduleName} failed during analysis`,
      metadata: { failed: true },
    };
  }
}
