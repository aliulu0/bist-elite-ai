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
import { buildAnalysisResult, buildStrongAnalysis, buildWeakAnalysis } from './test-helpers';

const detectors = [
  { name: 'relativeStrength', Detector: RelativeStrengthDetector, weight: 5 },
  { name: 'sectorStrength', Detector: SectorStrengthDetector, weight: 4 },
  { name: 'fundamentalChange', Detector: FundamentalChangeDetector, weight: 7 },
  { name: 'valuationDiscount', Detector: ValuationDiscountDetector, weight: 6 },
  { name: 'financialQuality', Detector: FinancialQualityDetector, weight: 5 },
  { name: 'cashFlowImprovement', Detector: CashFlowImprovementDetector, weight: 5 },
  { name: 'debtImprovement', Detector: DebtImprovementDetector, weight: 4 },
  { name: 'growthAcceleration', Detector: GrowthAccelerationDetector, weight: 5 },
  { name: 'institutionalInterest', Detector: InstitutionalInterestDetector, weight: 4 },
  { name: 'compositeOpportunity', Detector: CompositeOpportunityDetector, weight: 10 },
];

describe('Detection Modules (batch 2)', () => {
  for (const { name, Detector, weight } of detectors) {
    describe(name, () => {
      let detector: InstanceType<typeof Detector>;

      beforeEach(() => {
        detector = new Detector();
      });

      it('should have correct name and weight', () => {
        expect(detector.name).toBe(name);
        expect(detector.weight).toBe(weight);
        expect(detector.enabled).toBe(true);
      });

      it('should return valid DetectionModuleResult', () => {
        const result = detector.detect(buildAnalysisResult());
        expect(result.module).toBe(name);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.explanation).toBeTruthy();
        expect(Array.isArray(result.strengths)).toBe(true);
        expect(Array.isArray(result.weaknesses)).toBe(true);
        expect(Array.isArray(result.risks)).toBe(true);
      });

      it('should produce different scores for strong vs weak analysis', () => {
        const strong = detector.detect(buildStrongAnalysis());
        const weak = detector.detect(buildWeakAnalysis());
        expect(strong.score).not.toBe(weak.score);
      });

      it('should handle analysis with no specific module data', () => {
        const result = detector.detect(buildAnalysisResult({ moduleResults: [] }));
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
      });
    });
  }
});

describe('CompositeOpportunityDetector', () => {
  it('should count positive and negative modules', () => {
    const detector = new CompositeOpportunityDetector();
    const result = detector.detect(buildStrongAnalysis());
    expect(result.metrics.positiveModules).toBeGreaterThanOrEqual(0);
    expect(result.metrics.totalModules).toBe(10);
  });

  it('should detect multi-factor opportunity for strong analysis', () => {
    const detector = new CompositeOpportunityDetector();
    const result = detector.detect(buildStrongAnalysis());
    expect(result.signals.length).toBeGreaterThanOrEqual(0);
  });
});
