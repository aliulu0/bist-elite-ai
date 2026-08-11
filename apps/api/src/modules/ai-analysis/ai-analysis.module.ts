import { Module } from '@nestjs/common';
import { AiAnalysisPipeline } from './ai-analysis-pipeline.service';
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

const handlers = [
  TechnicalAnalysisHandler,
  FundamentalAnalysisHandler,
  FinancialHealthHandler,
  GrowthAnalysisHandler,
  MomentumAnalysisHandler,
  RiskAnalysisHandler,
  LiquidityAnalysisHandler,
  VolatilityAnalysisHandler,
  TrendAnalysisHandler,
  ValuationAnalysisHandler,
];

@Module({
  providers: [
    ...handlers,
    ScoreAggregator,
    ConfidenceCalculator,
    SignalGenerator,
    ExplanationBuilder,
    AiAnalysisPipeline,
  ],
  exports: [
    AiAnalysisPipeline,
    ScoreAggregator,
    ConfidenceCalculator,
    SignalGenerator,
    ExplanationBuilder,
    ...handlers,
  ],
})
export class AiAnalysisModule {}
