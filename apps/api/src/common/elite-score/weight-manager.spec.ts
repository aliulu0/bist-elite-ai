import { WeightManager } from './weight-manager.service';
import { ScoringProfile, Timeframe, getScoringConfig } from './types';

describe('WeightManager', () => {
  let manager: WeightManager;

  beforeEach(() => {
    manager = new WeightManager();
  });

  describe('getConfig', () => {
    it('should return the scoring config', () => {
      const config = manager.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.defaultProfile).toBe(ScoringProfile.BALANCED);
    });
  });

  describe('getWeights', () => {
    it('should return balanced weights by default', () => {
      const weights = manager.getWeights(ScoringProfile.BALANCED);
      expect(weights.technical).toBe(0.1);
      expect(weights.trend).toBe(0.1);
      expect(weights.momentum).toBe(0.1);
    });

    it('should return conservative weights', () => {
      const weights = manager.getWeights(ScoringProfile.CONSERVATIVE);
      expect(weights.risk).toBe(0.15);
      expect(weights.momentum).toBe(0.08);
      expect(weights.earlyOpportunity).toBe(0.03);
    });

    it('should return aggressive weights', () => {
      const weights = manager.getWeights(ScoringProfile.AGGRESSIVE);
      expect(weights.momentum).toBe(0.12);
      expect(weights.earlyOpportunity).toBe(0.17);
      expect(weights.risk).toBe(0.05);
    });

    it('should return a copy of weights', () => {
      const weights1 = manager.getWeights(ScoringProfile.BALANCED);
      const weights2 = manager.getWeights(ScoringProfile.BALANCED);
      weights1.technical = 0.99;
      expect(weights2.technical).toBe(0.1);
    });
  });

  describe('getTimeframeWeights', () => {
    it('should return all four timeframe weights', () => {
      const tf = manager.getTimeframeWeights();
      expect(Object.keys(tf)).toHaveLength(4);
    });

    it('should return a copy', () => {
      const tf1 = manager.getTimeframeWeights();
      const tf2 = manager.getTimeframeWeights();
      tf1[Timeframe.M4] = 0.99;
      expect(tf2[Timeframe.M4]).not.toBe(0.99);
    });
  });

  describe('getTimeframeWeight', () => {
    it('should return weight for known timeframe', () => {
      expect(manager.getTimeframeWeight(Timeframe.D1)).toBe(0.3);
      expect(manager.getTimeframeWeight(Timeframe.W1)).toBe(0.35);
    });

    it('should return default 0.25 for unknown timeframe', () => {
      expect(manager.getTimeframeWeight('UNKNOWN' as Timeframe)).toBe(0.25);
    });
  });

  describe('normalizeScore', () => {
    it('should normalize with sigmoid by default', () => {
      const score = manager.normalizeScore(50);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should clamp between 0 and 100', () => {
      expect(manager.normalizeScore(-100)).toBeGreaterThanOrEqual(0);
      expect(manager.normalizeScore(200)).toBeLessThanOrEqual(100);
    });

    it('should normalize higher values to higher scores', () => {
      const low = manager.normalizeScore(30);
      const high = manager.normalizeScore(70);
      expect(high).toBeGreaterThan(low);
    });
  });

  describe('computeWeightedScore', () => {
    it('should compute weighted average correctly', () => {
      const scores = { technical: 80, trend: 60, momentum: 70 };
      const weights = {
        technical: 0.5,
        trend: 0.3,
        momentum: 0.2,
        volume: 0,
        volatility: 0,
        liquidity: 0,
        risk: 0,
        strategy: 0,
        multiTimeframeConsensus: 0,
        historicalReliability: 0,
        earlyOpportunity: 0,
      };
      const result = manager.computeWeightedScore(scores, weights);
      expect(result).toBeCloseTo(72, 0);
    });

    it('should handle zero weights', () => {
      const scores = { technical: 80 };
      const weights = {
        technical: 0,
        trend: 0,
        momentum: 0,
        volume: 0,
        volatility: 0,
        liquidity: 0,
        risk: 0,
        strategy: 0,
        multiTimeframeConsensus: 0,
        historicalReliability: 0,
        earlyOpportunity: 0,
      };
      expect(manager.computeWeightedScore(scores, weights)).toBe(0);
    });

    it('should handle missing scores gracefully', () => {
      const scores = { technical: 80 };
      const weights = {
        technical: 0.5,
        trend: 0.3,
        momentum: 0.2,
        volume: 0,
        volatility: 0,
        liquidity: 0,
        risk: 0,
        strategy: 0,
        multiTimeframeConsensus: 0,
        historicalReliability: 0,
        earlyOpportunity: 0,
      };
      const result = manager.computeWeightedScore(scores, weights);
      expect(result).toBeCloseTo(80, 0);
    });
  });

  describe('applyRiskAdjustment', () => {
    it('should reduce score by adjustment factor', () => {
      const adjusted = manager.applyRiskAdjustment(80, 0.8);
      expect(adjusted).toBeCloseTo(64, 0);
    });

    it('should clamp to minimum', () => {
      const adjusted = manager.applyRiskAdjustment(10, 0.1);
      expect(adjusted).toBeGreaterThanOrEqual(0);
    });

    it('should clamp to maximum', () => {
      const adjusted = manager.applyRiskAdjustment(90, 1.5);
      expect(adjusted).toBeLessThanOrEqual(100);
    });
  });

  describe('custom config', () => {
    it('should use custom configuration', () => {
      const custom = new WeightManager();
      const score = custom.normalizeScore(50);
      expect(score).toBe(50);
    });
  });
});
