import { Module } from '@nestjs/common';
import { OpportunityDetectionEngine } from './opportunity-detection-engine.service';
import { ScoreCalculator } from './services/score-calculator.service';
import { PriorityEngine } from './services/priority-engine.service';
import { AgeTracker } from './services/age-tracker.service';
import { DuplicateDetector } from './services/duplicate-detector.service';
import { ConfirmationEngine } from './services/confirmation-engine.service';
import { PenaltyEngine } from './services/penalty-engine.service';
import { ExplanationEngine } from './services/explanation-engine.service';
import { MetricsCollector } from './services/metrics-collector.service';
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

const detectors = [
  PriceStructureDetector,
  VolumeBehaviourDetector,
  MomentumShiftDetector,
  TrendTransitionDetector,
  MovingAverageStructureDetector,
  RSIBehaviourDetector,
  MACDBehaviourDetector,
  ATRExpansionDetector,
  VolatilityCompressionDetector,
  LiquidityImprovementDetector,
  RelativeStrengthDetector,
  SectorStrengthDetector,
  FundamentalChangeDetector,
  ValuationDiscountDetector,
  FinancialQualityDetector,
  CashFlowImprovementDetector,
  DebtImprovementDetector,
  GrowthAccelerationDetector,
  InstitutionalInterestDetector,
  CompositeOpportunityDetector,
];

@Module({
  providers: [
    ...detectors,
    ScoreCalculator,
    PriorityEngine,
    AgeTracker,
    DuplicateDetector,
    ConfirmationEngine,
    PenaltyEngine,
    ExplanationEngine,
    MetricsCollector,
    OpportunityDetectionEngine,
  ],
  exports: [
    OpportunityDetectionEngine,
    ScoreCalculator,
    PriorityEngine,
    AgeTracker,
    DuplicateDetector,
    ConfirmationEngine,
    PenaltyEngine,
    ExplanationEngine,
    MetricsCollector,
    ...detectors,
  ],
})
export class OpportunityDetectionModule {}
