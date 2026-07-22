import {
  Timeframe,
  TrendDirection,
  MomentumState,
  VolumeState,
  ConflictType,
  ConflictSeverity,
  ConsensusStrength,
  SignalType,
  DEFAULT_CONSENSUS_CONFIG,
  getConsensusConfig,
  TIMEFRAME_LABELS,
  TIMEFRAME_ORDER,
  SHORT_TERM_TIMEFRAMES,
  MEDIUM_TERM_TIMEFRAMES,
  LONG_TERM_TIMEFRAMES,
} from './types';

describe('Multi-Timeframe Consensus Types', () => {
  describe('DEFAULT_CONSENSUS_CONFIG', () => {
    it('should have valid default configuration', () => {
      expect(DEFAULT_CONSENSUS_CONFIG.enabled).toBe(true);
      expect(DEFAULT_CONSENSUS_CONFIG.enableCaching).toBe(true);
      expect(DEFAULT_CONSENSUS_CONFIG.cacheTtlMs).toBe(300_000);
    });

    it('should have timeframe weights summing to 1.0', () => {
      const sum = Object.values(DEFAULT_CONSENSUS_CONFIG.timeframeWeights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 2);
    });

    it('should have trend weights summing to 1.0', () => {
      const sum = Object.values(DEFAULT_CONSENSUS_CONFIG.trendWeights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 2);
    });

    it('should have momentum weights summing to 1.0', () => {
      const sum = Object.values(DEFAULT_CONSENSUS_CONFIG.momentumWeights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 2);
    });

    it('should have volume weights summing to 1.0', () => {
      const sum = Object.values(DEFAULT_CONSENSUS_CONFIG.volumeWeights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 2);
    });

    it('should have indicator weights', () => {
      expect(Object.keys(DEFAULT_CONSENSUS_CONFIG.indicatorWeights).length).toBeGreaterThan(0);
    });

    it('should have valid conflict thresholds', () => {
      const ct = DEFAULT_CONSENSUS_CONFIG.conflictThresholds;
      expect(ct.low).toBeLessThan(ct.medium);
      expect(ct.medium).toBeLessThan(ct.high);
      expect(ct.high).toBeLessThan(ct.critical);
    });

    it('should have valid consensus thresholds', () => {
      const ct = DEFAULT_CONSENSUS_CONFIG.consensusThresholds;
      expect(ct.strong).toBeGreaterThan(ct.moderate);
      expect(ct.moderate).toBeGreaterThan(ct.weak);
    });

    it('should have valid early alignment config', () => {
      const ea = DEFAULT_CONSENSUS_CONFIG.earlyAlignment;
      expect(ea.minAlignmentScore).toBeGreaterThan(0);
      expect(ea.minConfirmationLevel).toBeGreaterThan(0);
      expect(ea.leadingIndicatorBonus).toBeGreaterThan(0);
    });

    it('should have valid risk adjustment config', () => {
      const ra = DEFAULT_CONSENSUS_CONFIG.riskAdjustment;
      expect(ra.maxPenalty).toBeGreaterThan(0);
      expect(ra.conflictPenaltyRate).toBeGreaterThan(0);
    });
  });

  describe('getConsensusConfig', () => {
    it('should return default config when no overrides', () => {
      const config = getConsensusConfig();
      expect(config).toEqual(DEFAULT_CONSENSUS_CONFIG);
    });

    it('should apply overrides', () => {
      const config = getConsensusConfig({ enabled: false });
      expect(config.enabled).toBe(false);
      expect(config.timeframeWeights).toEqual(DEFAULT_CONSENSUS_CONFIG.timeframeWeights);
    });

    it('should merge nested objects', () => {
      const config = getConsensusConfig({
        conflictThresholds: { low: 0.4, medium: 0.6, high: 0.8, critical: 0.95 },
      });
      expect(config.conflictThresholds.low).toBe(0.4);
      expect(config.conflictThresholds.medium).toBe(0.6);
    });

    it('should not mutate default config', () => {
      getConsensusConfig({ enabled: false });
      expect(DEFAULT_CONSENSUS_CONFIG.enabled).toBe(true);
    });
  });

  describe('constants', () => {
    it('should have all timeframe labels', () => {
      expect(TIMEFRAME_LABELS[Timeframe.M4]).toBeDefined();
      expect(TIMEFRAME_LABELS[Timeframe.D1]).toBeDefined();
      expect(TIMEFRAME_LABELS[Timeframe.W1]).toBeDefined();
      expect(TIMEFRAME_LABELS[Timeframe.M1]).toBeDefined();
    });

    it('should have correct timeframe order', () => {
      expect(TIMEFRAME_ORDER).toEqual([Timeframe.M4, Timeframe.D1, Timeframe.W1, Timeframe.M1]);
    });

    it('should have short/medium/long term timeframes', () => {
      expect(SHORT_TERM_TIMEFRAMES).toContain(Timeframe.M4);
      expect(MEDIUM_TERM_TIMEFRAMES).toContain(Timeframe.D1);
      expect(LONG_TERM_TIMEFRAMES).toContain(Timeframe.M1);
    });
  });
});
