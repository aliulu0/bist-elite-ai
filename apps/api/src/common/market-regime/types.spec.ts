import {
  MarketRegimeType,
  RegimeConfidence,
  TransitionType,
  RegimeTimeframe,
  MarketPhase,
  MARKET_REGIME_CONFIG_DEFAULTS,
  createRegimeClassification,
  getConfidenceLevel,
  MARKET_REGIME_LIST,
} from './types';

describe('MarketRegime Types', () => {
  describe('MarketRegimeType enum', () => {
    it('should have 13 regime types', () => {
      expect(Object.keys(MarketRegimeType)).toHaveLength(13);
    });

    it('should include all expected values', () => {
      expect(MarketRegimeType.STRONG_BULL).toBe('STRONG_BULL');
      expect(MarketRegimeType.BULL).toBe('BULL');
      expect(MarketRegimeType.WEAK_BULL).toBe('WEAK_BULL');
      expect(MarketRegimeType.SIDEWAYS).toBe('SIDEWAYS');
      expect(MarketRegimeType.WEAK_BEAR).toBe('WEAK_BEAR');
      expect(MarketRegimeType.BEAR).toBe('BEAR');
      expect(MarketRegimeType.STRONG_BEAR).toBe('STRONG_BEAR');
      expect(MarketRegimeType.HIGH_VOLATILITY).toBe('HIGH_VOLATILITY');
      expect(MarketRegimeType.LOW_VOLATILITY).toBe('LOW_VOLATILITY');
      expect(MarketRegimeType.RECOVERY).toBe('RECOVERY');
      expect(MarketRegimeType.CORRECTION).toBe('CORRECTION');
      expect(MarketRegimeType.DISTRIBUTION).toBe('DISTRIBUTION');
      expect(MarketRegimeType.ACCUMULATION).toBe('ACCUMULATION');
    });
  });

  describe('RegimeConfidence enum', () => {
    it('should have 5 confidence levels', () => {
      expect(Object.keys(RegimeConfidence)).toHaveLength(5);
    });
  });

  describe('TransitionType enum', () => {
    it('should have 7 transition types', () => {
      expect(Object.keys(TransitionType)).toHaveLength(7);
    });
  });

  describe('RegimeTimeframe enum', () => {
    it('should have 4 timeframes', () => {
      expect(Object.keys(RegimeTimeframe)).toHaveLength(4);
    });
  });

  describe('MarketPhase enum', () => {
    it('should have 4 market phases', () => {
      expect(Object.keys(MarketPhase)).toHaveLength(4);
    });
  });

  describe('MARKET_REGIME_CONFIG_DEFAULTS', () => {
    it('should have valid thresholds', () => {
      const t = MARKET_REGIME_CONFIG_DEFAULTS.regimeThresholds;
      expect(t.strongBull).toBeGreaterThan(t.bull);
      expect(t.bull).toBeGreaterThan(t.weakBull);
      expect(t.weakBull).toBeGreaterThanOrEqual(t.sidewaysUpper);
      expect(t.sidewaysLower).toBeLessThan(0);
      expect(t.weakBear).toBeLessThan(0);
      expect(t.bear).toBeLessThan(t.weakBear);
      expect(t.strongBear).toBeLessThan(t.bear);
    });

    it('should have valid weights summing close to 1', () => {
      const w = MARKET_REGIME_CONFIG_DEFAULTS.weights;
      const sum = w.trend + w.momentum + w.volume + w.volatility + w.breadth;
      expect(sum).toBeCloseTo(1.0, 2);
    });
  });

  describe('createRegimeClassification', () => {
    it('should create a valid classification with defaults', () => {
      const c = createRegimeClassification(MarketRegimeType.BULL, 0.8, 0.7, 0.1, 0.9);
      expect(c.type).toBe(MarketRegimeType.BULL);
      expect(c.confidence).toBe(0.8);
      expect(c.agreementScore).toBe(0.7);
      expect(c.conflictScore).toBe(0.1);
      expect(c.stabilityScore).toBe(0.9);
      expect(c.factors).toEqual([]);
      expect(c.classifiedAt).toBeDefined();
    });
  });

  describe('getConfidenceLevel', () => {
    it('should return VERY_HIGH for >= 0.9', () => {
      expect(getConfidenceLevel(0.95)).toBe(RegimeConfidence.VERY_HIGH);
      expect(getConfidenceLevel(0.9)).toBe(RegimeConfidence.VERY_HIGH);
    });

    it('should return HIGH for >= 0.75', () => {
      expect(getConfidenceLevel(0.85)).toBe(RegimeConfidence.HIGH);
      expect(getConfidenceLevel(0.75)).toBe(RegimeConfidence.HIGH);
    });

    it('should return MEDIUM for >= 0.5', () => {
      expect(getConfidenceLevel(0.6)).toBe(RegimeConfidence.MEDIUM);
      expect(getConfidenceLevel(0.5)).toBe(RegimeConfidence.MEDIUM);
    });

    it('should return LOW for >= 0.3', () => {
      expect(getConfidenceLevel(0.4)).toBe(RegimeConfidence.LOW);
      expect(getConfidenceLevel(0.3)).toBe(RegimeConfidence.LOW);
    });

    it('should return VERY_LOW for < 0.3', () => {
      expect(getConfidenceLevel(0.1)).toBe(RegimeConfidence.VERY_LOW);
      expect(getConfidenceLevel(0.0)).toBe(RegimeConfidence.VERY_LOW);
    });
  });

  describe('MARKET_REGIME_LIST', () => {
    it('should contain all 13 regimes', () => {
      expect(MARKET_REGIME_LIST).toHaveLength(13);
    });
  });
});
