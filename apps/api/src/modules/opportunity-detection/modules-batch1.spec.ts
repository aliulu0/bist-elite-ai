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
import { buildAnalysisResult, buildStrongAnalysis, buildWeakAnalysis } from './test-helpers';

const detectors = [
  { name: 'priceStructure', Detector: PriceStructureDetector, weight: 6 },
  { name: 'volumeBehaviour', Detector: VolumeBehaviourDetector, weight: 6 },
  { name: 'momentumShift', Detector: MomentumShiftDetector, weight: 7 },
  { name: 'trendTransition', Detector: TrendTransitionDetector, weight: 6 },
  { name: 'movingAverageStructure', Detector: MovingAverageStructureDetector, weight: 5 },
  { name: 'rsiBehaviour', Detector: RSIBehaviourDetector, weight: 5 },
  { name: 'macdBehaviour', Detector: MACDBehaviourDetector, weight: 5 },
  { name: 'atrExpansion', Detector: ATRExpansionDetector, weight: 4 },
  { name: 'volatilityCompression', Detector: VolatilityCompressionDetector, weight: 5 },
  { name: 'liquidityImprovement', Detector: LiquidityImprovementDetector, weight: 5 },
];

describe('Detection Modules (batch 1)', () => {
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
