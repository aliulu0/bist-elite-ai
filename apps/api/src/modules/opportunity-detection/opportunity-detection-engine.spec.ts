import { Test, TestingModule } from '@nestjs/testing';
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
import { OpportunityResult, OPPORTUNITY_DETECTION_VERSION } from './opportunity-detection.types';
import { buildAnalysisResult, buildStrongAnalysis, buildWeakAnalysis } from './test-helpers';

describe('OpportunityDetectionEngine', () => {
  let engine: OpportunityDetectionEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpportunityDetectionEngine,
        ScoreCalculator,
        PriorityEngine,
        AgeTracker,
        DuplicateDetector,
        ConfirmationEngine,
        PenaltyEngine,
        ExplanationEngine,
        MetricsCollector,
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
      ],
    }).compile();

    engine = module.get(OpportunityDetectionEngine);
  });

  describe('detect', () => {
    it('should return a valid OpportunityResult', () => {
      const result = engine.detect(buildAnalysisResult());
      expect(result).toBeDefined();
      expect(result.symbol).toBe('THYAO');
      expect(result.version).toBe(OPPORTUNITY_DETECTION_VERSION);
      expect(result.timestamp).toBeTruthy();
    });

    it('should have all required fields', () => {
      const result = engine.detect(buildAnalysisResult());
      expect(result).toHaveProperty('opportunityScore');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('opportunityLevel');
      expect(result).toHaveProperty('opportunityType');
      expect(result).toHaveProperty('priority');
      expect(result).toHaveProperty('recommendation');
      expect(result).toHaveProperty('age');
      expect(result).toHaveProperty('confirmationLevel');
      expect(result).toHaveProperty('confirmationCount');
      expect(result).toHaveProperty('reasons');
      expect(result).toHaveProperty('strengths');
      expect(result).toHaveProperty('weaknesses');
      expect(result).toHaveProperty('risks');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('explanation');
      expect(result).toHaveProperty('supportingMetrics');
      expect(result).toHaveProperty('detectionModuleResults');
      expect(result).toHaveProperty('opportunityTypes');
      expect(result).toHaveProperty('penalties');
      expect(result).toHaveProperty('metadata');
    });

    it('should have opportunity score between 0 and 100', () => {
      const result = engine.detect(buildAnalysisResult());
      expect(result.opportunityScore).toBeGreaterThanOrEqual(0);
      expect(result.opportunityScore).toBeLessThanOrEqual(100);
    });

    it('should execute all 20 modules', () => {
      const result = engine.detect(buildAnalysisResult());
      expect(result.detectionModuleResults.length).toBe(20);
    });

    it('should produce higher score for strong analysis', () => {
      const strong = engine.detect(buildStrongAnalysis());
      const weak = engine.detect(buildWeakAnalysis());
      expect(strong.opportunityScore).toBeGreaterThan(weak.opportunityScore);
    });

    it('should produce valid opportunity level', () => {
      const validLevels = ['SUPPORT', 'NONE', 'WATCH', 'INTERESTING', 'EMERGING', 'STRONG', 'VERY_STRONG', 'EXCEPTIONAL'];
      const result = engine.detect(buildAnalysisResult());
      expect(validLevels).toContain(result.opportunityLevel);
    });

    it('should produce valid priority', () => {
      const validPriorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'IGNORE'];
      const result = engine.detect(buildAnalysisResult());
      expect(validPriorities).toContain(result.priority);
    });

    it('should produce valid opportunity types', () => {
      const validTypes = [
        'MOMENTUM_BREAKOUT', 'VOLUME_EXPANSION', 'TREND_REVERSAL',
        'FUNDAMENTAL_IMPROVEMENT', 'UNDERVALUATION', 'SECTOR_ROTATION',
        'INSTITUTIONAL_ACCUMULATION', 'EARNINGS_OPPORTUNITY', 'MULTI_FACTOR', 'CUSTOM',
      ];
      const result = engine.detect(buildAnalysisResult());
      for (const t of result.opportunityTypes) {
        expect(validTypes).toContain(t);
      }
    });

    it('should produce valid confirmation levels', () => {
      const valid = ['NONE', 'SINGLE', 'DOUBLE', 'TRIPLE', 'MULTI'];
      const result = engine.detect(buildAnalysisResult());
      expect(valid).toContain(result.confirmationLevel);
    });

    it('should collect supporting metrics from modules', () => {
      const result = engine.detect(buildAnalysisResult());
      expect(result.supportingMetrics.length).toBeGreaterThan(0);
    });

    it('should include metadata with detection info', () => {
      const result = engine.detect(buildAnalysisResult());
      expect(result.metadata.detectionDurationMs).toBeGreaterThanOrEqual(0);
      expect(result.metadata.moduleCount).toBe(20);
      expect(result.metadata.enabledModuleCount).toBe(20);
    });

    it('should include explanation', () => {
      const result = engine.detect(buildAnalysisResult());
      expect(result.explanation).toBeTruthy();
      expect(result.explanation.length).toBeGreaterThan(10);
    });
  });

  describe('opportunity score vs analysis score', () => {
    it('should produce different score than analysis score', () => {
      const input = buildAnalysisResult({ overallScore: 65 });
      const result = engine.detect(input);
      expect(result.opportunityScore).not.toBe(input.overallScore);
    });
  });

  describe('strong analysis detection', () => {
    it('should detect strong opportunity from strong analysis', () => {
      const result = engine.detect(buildStrongAnalysis());
      expect(result.opportunityScore).toBeGreaterThan(50);
      expect(result.opportunityLevel).not.toBe('SUPPORT');
      expect(result.opportunityLevel).not.toBe('NONE');
    });
  });

  describe('weak analysis detection', () => {
    it('should detect weak opportunity from weak analysis', () => {
      const result = engine.detect(buildWeakAnalysis());
      expect(result.opportunityScore).toBeLessThan(50);
    });
  });

  describe('history tracking', () => {
    it('should track opportunity history per symbol', () => {
      engine.detect(buildAnalysisResult({ symbol: 'THYAO' }));
      engine.detect(buildAnalysisResult({ symbol: 'THYAO' }));
      const history = engine.getHistory('THYAO');
      expect(history.length).toBe(2);
    });

    it('should clear history for specific symbol', () => {
      engine.detect(buildAnalysisResult({ symbol: 'THYAO' }));
      engine.clearHistory('THYAO');
      expect(engine.getHistory('THYAO')).toHaveLength(0);
    });

    it('should clear all history', () => {
      engine.detect(buildAnalysisResult({ symbol: 'THYAO' }));
      engine.detect(buildAnalysisResult({ symbol: 'GARAN' }));
      engine.clearHistory();
      expect(engine.getHistory('THYAO')).toHaveLength(0);
      expect(engine.getHistory('GARAN')).toHaveLength(0);
    });
  });

  describe('module failure handling', () => {
    it('should handle module failures gracefully', () => {
      const result = engine.detect(buildAnalysisResult());
      expect(result).toBeDefined();
      expect(result.opportunityScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('penalty system', () => {
    it('should apply penalties for low quality data', () => {
      const input = buildAnalysisResult();
      input.providerMetadata.qualityScore = 20;
      const result = engine.detect(input);
      expect(result.penalties.length).toBeGreaterThan(0);
    });
  });

  describe('recommendation generation', () => {
    it('should generate recommendation based on priority', () => {
      const result = engine.detect(buildStrongAnalysis());
      expect(result.recommendation).toBeTruthy();
      expect(typeof result.recommendation).toBe('string');
    });
  });
});
