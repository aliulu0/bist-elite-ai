import {
  Timeframe,
  TIMEFRAME_LABELS,
  TIMEFRAME_ORDER,
  TrendDirection,
  MomentumState,
  VolumeState,
  RiskType,
  RiskSeverity,
  SignalAction,
  SignalStrength,
  DEFAULT_EXPLAINABILITY_CONFIG,
  getExplainabilityConfig,
} from '../types';

describe('Explainability Types', () => {
  describe('Timeframe enum', () => {
    it('has all expected timeframes', () => {
      expect(Timeframe.M4).toBe('M4');
      expect(Timeframe.D1).toBe('D1');
      expect(Timeframe.W1).toBe('W1');
      expect(Timeframe.M1).toBe('M1');
    });
  });

  describe('TIMEFRAME_LABELS', () => {
    it('has Turkish labels for all timeframes', () => {
      expect(TIMEFRAME_LABELS[Timeframe.M4]).toBe('4 Saatlik');
      expect(TIMEFRAME_LABELS[Timeframe.D1]).toBe('Günlük');
      expect(TIMEFRAME_LABELS[Timeframe.W1]).toBe('Haftalık');
      expect(TIMEFRAME_LABELS[Timeframe.M1]).toBe('Aylık');
    });
  });

  describe('TIMEFRAME_ORDER', () => {
    it('orders timeframes from shortest to longest', () => {
      expect(TIMEFRAME_ORDER).toEqual([Timeframe.M4, Timeframe.D1, Timeframe.W1, Timeframe.M1]);
    });
  });

  describe('TrendDirection enum', () => {
    it('has all 7 trend directions', () => {
      expect(Object.values(TrendDirection)).toHaveLength(7);
    });
  });

  describe('MomentumState enum', () => {
    it('has all 5 momentum states', () => {
      expect(Object.values(MomentumState)).toHaveLength(5);
    });
  });

  describe('VolumeState enum', () => {
    it('has all 5 volume states', () => {
      expect(Object.values(VolumeState)).toHaveLength(5);
    });
  });

  describe('RiskType enum', () => {
    it('has all 7 risk types', () => {
      expect(Object.values(RiskType)).toHaveLength(7);
    });
  });

  describe('RiskSeverity enum', () => {
    it('has all 4 severity levels', () => {
      expect(Object.values(RiskSeverity)).toHaveLength(4);
    });
  });

  describe('SignalAction enum', () => {
    it('has all 4 signal actions', () => {
      expect(Object.values(SignalAction)).toHaveLength(4);
    });
  });

  describe('SignalStrength enum', () => {
    it('has all 4 signal strengths', () => {
      expect(Object.values(SignalStrength)).toHaveLength(4);
    });
  });

  describe('DEFAULT_EXPLAINABILITY_CONFIG', () => {
    it('has all required fields', () => {
      expect(DEFAULT_EXPLAINABILITY_CONFIG.enabled).toBe(true);
      expect(DEFAULT_EXPLAINABILITY_CONFIG.defaultTimeframes).toEqual([
        Timeframe.M4, Timeframe.D1, Timeframe.W1, Timeframe.M1,
      ]);
      expect(DEFAULT_EXPLAINABILITY_CONFIG.indicatorWeights).toBeDefined();
      expect(DEFAULT_EXPLAINABILITY_CONFIG.riskWeights).toBeDefined();
      expect(DEFAULT_EXPLAINABILITY_CONFIG.confidenceThresholds).toBeDefined();
      expect(DEFAULT_EXPLAINABILITY_CONFIG.maxEvidenceItems).toBe(20);
      expect(DEFAULT_EXPLAINABILITY_CONFIG.enableCaching).toBe(true);
    });

    it('has valid indicator weights that sum to approximately 1', () => {
      const sum = Object.values(DEFAULT_EXPLAINABILITY_CONFIG.indicatorWeights)
        .reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 1);
    });

    it('has valid risk weights for all risk types', () => {
      for (const riskType of Object.values(RiskType)) {
        expect(DEFAULT_EXPLAINABILITY_CONFIG.riskWeights[riskType]).toBeGreaterThan(0);
      }
    });

    it('has valid confidence thresholds', () => {
      const { high, medium, low } = DEFAULT_EXPLAINABILITY_CONFIG.confidenceThresholds;
      expect(high).toBeGreaterThan(medium);
      expect(medium).toBeGreaterThan(low);
      expect(high).toBeLessThanOrEqual(1);
      expect(low).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getExplainabilityConfig', () => {
    it('returns default config when no overrides', () => {
      const config = getExplainabilityConfig();
      expect(config).toEqual(DEFAULT_EXPLAINABILITY_CONFIG);
    });

    it('merges overrides with defaults', () => {
      const config = getExplainabilityConfig({ maxEvidenceItems: 10 });
      expect(config.maxEvidenceItems).toBe(10);
      expect(config.enabled).toBe(true);
    });

    it('merges nested indicatorWeights', () => {
      const config = getExplainabilityConfig({
        indicatorWeights: { RSI: 0.25 },
      });
      expect(config.indicatorWeights.RSI).toBe(0.25);
      expect(config.indicatorWeights.MACD).toBe(0.15);
    });

    it('merges nested riskWeights', () => {
      const config = getExplainabilityConfig({
        riskWeights: {
          [RiskType.TREND_RISK]: 0.30,
          [RiskType.VOLATILITY_RISK]: 0.18,
          [RiskType.LIQUIDITY_RISK]: 0.15,
          [RiskType.FALSE_BREAKOUT_RISK]: 0.15,
          [RiskType.FALSE_SIGNAL_RISK]: 0.12,
          [RiskType.TIMEFRAME_CONFLICT]: 0.10,
          [RiskType.MARKET_UNCERTAINTY]: 0.10,
        },
      });
      expect(config.riskWeights[RiskType.TREND_RISK]).toBe(0.30);
      expect(config.riskWeights[RiskType.VOLATILITY_RISK]).toBe(0.18);
    });

    it('merges nested confidenceThresholds', () => {
      const config = getExplainabilityConfig({
        confidenceThresholds: { high: 0.80, medium: 0.55, low: 0.30 },
      });
      expect(config.confidenceThresholds.high).toBe(0.80);
      expect(config.confidenceThresholds.medium).toBe(0.55);
      expect(config.confidenceThresholds.low).toBe(0.30);
    });
  });
});
