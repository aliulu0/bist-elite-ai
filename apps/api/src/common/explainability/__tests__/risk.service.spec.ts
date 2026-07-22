import { RiskAnalyzer } from '../risk.service';
import {
  ExplanationInput,
  RiskType,
  RiskSeverity,
  TrendDirection,
  MomentumState,
  Timeframe,
  SignalAction,
  SignalStrength,
} from '../types';

function createFullInput(overrides?: Partial<ExplanationInput>): ExplanationInput {
  return {
    stockSymbol: 'THYAO',
    stockName: 'Türk Hava Yolları',
    currentPrice: 285.50,
    technicalScore: {
      momentum: 65,
      trend: 60,
      volatility: 45,
      volume: 55,
      support: 50,
      resistance: 50,
      composite: 58,
    },
    financialScore: {
      growth: 60,
      profitability: 70,
      valuation: 55,
      quality: 65,
      health: 72,
      composite: 64,
    },
    eliteScore: {
      technical: 58,
      financial: 64,
      confidence: 0.68,
      composite: 62,
    },
    confidenceScore: {
      dataQuality: 0.8,
      modelConsistency: 0.75,
      regimeStability: 0.7,
      composite: 0.72,
    },
    indicators: [
      { indicator: 'RSI', timeframe: Timeframe.D1, value: 62, signal: 'bullish', interpretation: 'test', weight: 0.15, isPositive: true },
      { indicator: 'MACD', timeframe: Timeframe.D1, value: 1.5, signal: 'bullish', interpretation: 'test', weight: 0.15, isPositive: true },
      { indicator: 'ADX', timeframe: Timeframe.D1, value: 30, signal: 'bullish', interpretation: 'test', weight: 0.10, isPositive: true },
    ],
    timeframeData: {
      [Timeframe.M4]: { trend: TrendDirection.UPTREND },
      [Timeframe.D1]: { trend: TrendDirection.UPTREND },
      [Timeframe.W1]: { trend: TrendDirection.UPTREND },
    },
    ...overrides,
  };
}

describe('RiskAnalyzer', () => {
  let analyzer: RiskAnalyzer;

  beforeEach(() => {
    analyzer = new RiskAnalyzer();
  });

  describe('analyze', () => {
    it('returns array of risk factors', () => {
      const risks = analyzer.analyze(createFullInput());
      expect(Array.isArray(risks)).toBe(true);
      expect(risks.length).toBeGreaterThanOrEqual(7);
    });

    it('includes all 7 risk types', () => {
      const risks = analyzer.analyze(createFullInput());
      const types = risks.map(r => r.type);
      expect(types).toContain(RiskType.TREND_RISK);
      expect(types).toContain(RiskType.VOLATILITY_RISK);
      expect(types).toContain(RiskType.LIQUIDITY_RISK);
      expect(types).toContain(RiskType.FALSE_BREAKOUT_RISK);
      expect(types).toContain(RiskType.FALSE_SIGNAL_RISK);
      expect(types).toContain(RiskType.TIMEFRAME_CONFLICT);
      expect(types).toContain(RiskType.MARKET_UNCERTAINTY);
    });

    it('each risk has valid structure', () => {
      const risks = analyzer.analyze(createFullInput());
      for (const risk of risks) {
        expect(risk.type).toBeTruthy();
        expect(risk.severity).toBeTruthy();
        expect(typeof risk.score).toBe('number');
        expect(risk.score).toBeGreaterThanOrEqual(0);
        expect(risk.score).toBeLessThanOrEqual(1);
        expect(risk.description).toBeTruthy();
        expect(Array.isArray(risk.indicators)).toBe(true);
      }
    });

    it('detects high volatility risk', () => {
      const input = createFullInput({
        technicalScore: { momentum: 65, trend: 60, volatility: 85, volume: 55, composite: 58 },
        indicators: [
          { indicator: 'ATR', timeframe: Timeframe.D1, value: 4.5, signal: 'high_vol', interpretation: 'test', weight: 0.08, isPositive: false },
        ],
      });
      const risks = analyzer.analyze(input);
      const volRisk = risks.find(r => r.type === RiskType.VOLATILITY_RISK);
      expect(volRisk).toBeDefined();
      expect(volRisk!.severity).toBe(RiskSeverity.HIGH);
    });

    it('detects timeframe conflict', () => {
      const input = createFullInput({
        timeframeData: {
          [Timeframe.M4]: { trend: TrendDirection.STRONG_UPTREND },
          [Timeframe.D1]: { trend: TrendDirection.STRONG_UPTREND },
          [Timeframe.W1]: { trend: TrendDirection.STRONG_DOWNTREND },
          [Timeframe.M1]: { trend: TrendDirection.STRONG_DOWNTREND },
        },
      });
      const risks = analyzer.analyze(input);
      const tfRisk = risks.find(r => r.type === RiskType.TIMEFRAME_CONFLICT);
      expect(tfRisk).toBeDefined();
      expect(tfRisk!.severity).toBe(RiskSeverity.HIGH);
    });

    it('detects false signal risk when indicators disagree heavily', () => {
      const input = createFullInput({
        indicators: [
          { indicator: 'RSI', timeframe: Timeframe.D1, value: 51, signal: 'neutral', interpretation: 'test', weight: 0.15, isPositive: true },
          { indicator: 'MACD', timeframe: Timeframe.D1, value: 50, signal: 'neutral', interpretation: 'test', weight: 0.15, isPositive: false },
          { indicator: 'EMA', timeframe: Timeframe.D1, value: 50, signal: 'neutral', interpretation: 'test', weight: 0.12, isPositive: true },
          { indicator: 'SMA', timeframe: Timeframe.D1, value: 49, signal: 'neutral', interpretation: 'test', weight: 0.10, isPositive: false },
          { indicator: 'ADX', timeframe: Timeframe.D1, value: 50, signal: 'neutral', interpretation: 'test', weight: 0.10, isPositive: true },
          { indicator: 'Stochastic', timeframe: Timeframe.D1, value: 50, signal: 'neutral', interpretation: 'test', weight: 0.07, isPositive: false },
          { indicator: 'BollingerBands', timeframe: Timeframe.D1, value: 50, signal: 'neutral', interpretation: 'test', weight: 0.10, isPositive: true },
          { indicator: 'VWAP', timeframe: Timeframe.D1, value: 50, signal: 'neutral', interpretation: 'test', weight: 0.08, isPositive: false },
        ],
      });
      const risks = analyzer.analyze(input);
      const falseSignalRisk = risks.find(r => r.type === RiskType.FALSE_SIGNAL_RISK);
      expect(falseSignalRisk).toBeDefined();
      expect(falseSignalRisk!.severity).toBe(RiskSeverity.HIGH);
    });

    it('detects market uncertainty with low confidence', () => {
      const input = createFullInput({
        confidenceScore: { dataQuality: 0.3, modelConsistency: 0.25, regimeStability: 0.2, composite: 0.25 },
        indicators: [
          { indicator: 'ADX', timeframe: Timeframe.D1, value: 15, signal: 'weak', interpretation: 'test', weight: 0.10, isPositive: false },
        ],
      });
      const risks = analyzer.analyze(input);
      const uncertaintyRisk = risks.find(r => r.type === RiskType.MARKET_UNCERTAINTY);
      expect(uncertaintyRisk).toBeDefined();
      expect(uncertaintyRisk!.severity).toBe(RiskSeverity.HIGH);
    });

    it('handles empty input', () => {
      const risks = analyzer.analyze({
        stockSymbol: 'TEST',
        stockName: 'Test',
        currentPrice: 100,
      });
      expect(risks.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('getOverallRiskLevel', () => {
    it('returns CRITICAL when any critical risk exists', () => {
      const risks = [
        { type: RiskType.TREND_RISK, severity: RiskSeverity.LOW, score: 0.2, description: '', indicators: [] },
        { type: RiskType.VOLATILITY_RISK, severity: RiskSeverity.CRITICAL, score: 0.95, description: '', indicators: [] },
      ];
      expect(analyzer.getOverallRiskLevel(risks)).toBe(RiskSeverity.CRITICAL);
    });

    it('returns HIGH when 2+ high risks exist', () => {
      const risks = [
        { type: RiskType.TREND_RISK, severity: RiskSeverity.HIGH, score: 0.8, description: '', indicators: [] },
        { type: RiskType.VOLATILITY_RISK, severity: RiskSeverity.HIGH, score: 0.75, description: '', indicators: [] },
        { type: RiskType.LIQUIDITY_RISK, severity: RiskSeverity.LOW, score: 0.2, description: '', indicators: [] },
      ];
      expect(analyzer.getOverallRiskLevel(risks)).toBe(RiskSeverity.HIGH);
    });

    it('returns HIGH when 1 high + 2 medium risks', () => {
      const risks = [
        { type: RiskType.TREND_RISK, severity: RiskSeverity.HIGH, score: 0.8, description: '', indicators: [] },
        { type: RiskType.VOLATILITY_RISK, severity: RiskSeverity.MEDIUM, score: 0.5, description: '', indicators: [] },
        { type: RiskType.LIQUIDITY_RISK, severity: RiskSeverity.MEDIUM, score: 0.5, description: '', indicators: [] },
      ];
      expect(analyzer.getOverallRiskLevel(risks)).toBe(RiskSeverity.HIGH);
    });

    it('returns MEDIUM when 2+ medium risks exist', () => {
      const risks = [
        { type: RiskType.TREND_RISK, severity: RiskSeverity.MEDIUM, score: 0.5, description: '', indicators: [] },
        { type: RiskType.VOLATILITY_RISK, severity: RiskSeverity.MEDIUM, score: 0.5, description: '', indicators: [] },
      ];
      expect(analyzer.getOverallRiskLevel(risks)).toBe(RiskSeverity.MEDIUM);
    });

    it('returns LOW when all risks are low', () => {
      const risks = [
        { type: RiskType.TREND_RISK, severity: RiskSeverity.LOW, score: 0.2, description: '', indicators: [] },
        { type: RiskType.VOLATILITY_RISK, severity: RiskSeverity.LOW, score: 0.2, description: '', indicators: [] },
      ];
      expect(analyzer.getOverallRiskLevel(risks)).toBe(RiskSeverity.LOW);
    });
  });
});
