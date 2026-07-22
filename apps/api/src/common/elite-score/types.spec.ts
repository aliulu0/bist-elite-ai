import {
  ScoringProfile,
  Timeframe,
  TrendDirection,
  MomentumState,
  VolumeState,
  DEFAULT_SCORING_CONFIG,
  getScoringConfig,
  ScoringConfig,
  ScoreComponentWeights,
} from './types';

describe('Elite Score Types', () => {
  describe('DEFAULT_SCORING_CONFIG', () => {
    it('should have valid default configuration', () => {
      expect(DEFAULT_SCORING_CONFIG.enabled).toBe(true);
      expect(DEFAULT_SCORING_CONFIG.defaultProfile).toBe(ScoringProfile.BALANCED);
      expect(DEFAULT_SCORING_CONFIG.scoreRange).toEqual({ min: 0, max: 100 });
    });

    it('should have all three profile weight sets', () => {
      expect(DEFAULT_SCORING_CONFIG.profiles[ScoringProfile.CONSERVATIVE]).toBeDefined();
      expect(DEFAULT_SCORING_CONFIG.profiles[ScoringProfile.BALANCED]).toBeDefined();
      expect(DEFAULT_SCORING_CONFIG.profiles[ScoringProfile.AGGRESSIVE]).toBeDefined();
    });

    it('should have weights summing approximately to 1.0 for each profile', () => {
      for (const profile of Object.values(ScoringProfile)) {
        const weights = DEFAULT_SCORING_CONFIG.profiles[profile];
        const sum = Object.values(weights).reduce((a, b) => a + b, 0);
        expect(sum).toBeCloseTo(1.0, 2);
      }
    });

    it('should have timeframe weights summing to 1.0', () => {
      const sum = Object.values(DEFAULT_SCORING_CONFIG.timeframeWeights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 2);
    });

    it('should have all timeframe weights defined', () => {
      expect(DEFAULT_SCORING_CONFIG.timeframeWeights[Timeframe.M4]).toBeDefined();
      expect(DEFAULT_SCORING_CONFIG.timeframeWeights[Timeframe.D1]).toBeDefined();
      expect(DEFAULT_SCORING_CONFIG.timeframeWeights[Timeframe.W1]).toBeDefined();
      expect(DEFAULT_SCORING_CONFIG.timeframeWeights[Timeframe.M1]).toBeDefined();
    });

    it('should have normalization config with valid method', () => {
      expect(['linear', 'sigmoid', 'logistic']).toContain(DEFAULT_SCORING_CONFIG.normalization.method);
    });

    it('should have early opportunity config with positive values', () => {
      expect(DEFAULT_SCORING_CONFIG.earlyOpportunity.freshnessDecayRate).toBeGreaterThan(0);
      expect(DEFAULT_SCORING_CONFIG.earlyOpportunity.maxBonus).toBeGreaterThan(0);
      expect(DEFAULT_SCORING_CONFIG.earlyOpportunity.detectionWindowHours).toBeGreaterThan(0);
    });

    it('should have risk adjustment config with valid thresholds', () => {
      expect(DEFAULT_SCORING_CONFIG.riskAdjustment.maxPenalty).toBeGreaterThan(0);
      expect(DEFAULT_SCORING_CONFIG.riskAdjustment.volatilityThreshold).toBeGreaterThan(0);
      expect(DEFAULT_SCORING_CONFIG.riskAdjustment.liquidityThreshold).toBeGreaterThan(0);
    });

    it('should have historical reliability weights summing to 1.0', () => {
      const hr = DEFAULT_SCORING_CONFIG.historicalReliability;
      const sum = hr.winRateWeight + hr.drawdownWeight + hr.returnWeight +
        hr.consistencyWeight + hr.precisionWeight + hr.recallWeight + hr.profitFactorWeight;
      expect(sum).toBeCloseTo(1.0, 2);
    });
  });

  describe('getScoringConfig', () => {
    it('should return default config when no overrides', () => {
      const config = getScoringConfig();
      expect(config).toEqual(DEFAULT_SCORING_CONFIG);
    });

    it('should apply profile overrides', () => {
      const config = getScoringConfig({
        profiles: {
          [ScoringProfile.BALANCED]: {
            technical: 0.20,
            trend: 0.10,
            momentum: 0.10,
            volume: 0.08,
            volatility: 0.08,
            liquidity: 0.07,
            risk: 0.10,
            strategy: 0.10,
            multiTimeframeConsensus: 0.10,
            historicalReliability: 0.05,
            earlyOpportunity: 0.02,
          },
        } as any,
      });
      expect(config.profiles[ScoringProfile.BALANCED].technical).toBe(0.20);
    });

    it('should apply timeframe weight overrides', () => {
      const config = getScoringConfig({
        timeframeWeights: { [Timeframe.M4]: 0.30 } as any,
      });
      expect(config.timeframeWeights[Timeframe.M4]).toBe(0.30);
    });

    it('should merge normalization overrides', () => {
      const config = getScoringConfig({
        normalization: { method: 'linear', center: 60, steepness: 0.2 },
      });
      expect(config.normalization.method).toBe('linear');
      expect(config.normalization.center).toBe(60);
      expect(config.normalization.steepness).toBe(0.2);
    });

    it('should not mutate default config', () => {
      const original = { ...DEFAULT_SCORING_CONFIG };
      getScoringConfig({ enabled: false });
      expect(DEFAULT_SCORING_CONFIG.enabled).toBe(true);
    });
  });
});
