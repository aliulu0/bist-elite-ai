import { ConfidenceCalculator } from '../confidence.service';
import { ExplanationInput, Timeframe, TrendDirection, MomentumState, SignalAction, SignalStrength } from '../types';

function createFullInput(overrides?: Partial<ExplanationInput>): ExplanationInput {
  return {
    stockSymbol: 'THYAO',
    stockName: 'Türk Hava Yolları',
    currentPrice: 285.50,
    technicalScore: {
      momentum: 72,
      trend: 68,
      volatility: 45,
      volume: 55,
      composite: 65,
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
      technical: 65,
      financial: 64,
      confidence: 0.72,
      composite: 68,
      rank: 15,
    },
    confidenceScore: {
      dataQuality: 0.85,
      modelConsistency: 0.78,
      regimeStability: 0.65,
      composite: 0.72,
    },
    indicators: [
      { indicator: 'RSI', timeframe: Timeframe.D1, value: 62, signal: 'bullish', interpretation: 'RSI yükselişte', weight: 0.15, isPositive: true },
      { indicator: 'MACD', timeframe: Timeframe.D1, value: 1.5, signal: 'bullish', interpretation: 'MACD pozitif', weight: 0.15, isPositive: true },
      { indicator: 'EMA', timeframe: Timeframe.D1, value: 0.7, signal: 'bullish', interpretation: 'Fiyat EMA üzerinde', weight: 0.12, isPositive: true },
      { indicator: 'SMA', timeframe: Timeframe.D1, value: 0.65, signal: 'bullish', interpretation: 'Fiyat SMA üzerinde', weight: 0.10, isPositive: true },
      { indicator: 'BollingerBands', timeframe: Timeframe.D1, value: 0.6, signal: 'neutral', interpretation: 'Bant ortasında', weight: 0.10, isPositive: true },
      { indicator: 'ADX', timeframe: Timeframe.D1, value: 30, signal: 'bullish', interpretation: 'Güçlü trend', weight: 0.10, isPositive: true },
    ],
    decisionSignal: {
      action: SignalAction.BUY,
      strength: SignalStrength.STRONG,
      entryPrice: 285,
      targetPrice: 320,
      stopLossPrice: 270,
      riskRewardRatio: 2.33,
    },
    timeframeData: {
      [Timeframe.M4]: { trend: TrendDirection.UPTREND, momentum: MomentumState.BULLISH_MOMENTUM },
      [Timeframe.D1]: { trend: TrendDirection.UPTREND, momentum: MomentumState.BULLISH_MOMENTUM },
      [Timeframe.W1]: { trend: TrendDirection.UPTREND, momentum: MomentumState.BULLISH_MOMENTUM },
      [Timeframe.M1]: { trend: TrendDirection.SIDEWAYS, momentum: MomentumState.NEUTRAL },
    },
    ...overrides,
  };
}

describe('ConfidenceCalculator', () => {
  let calculator: ConfidenceCalculator;

  beforeEach(() => {
    calculator = new ConfidenceCalculator();
  });

  describe('calculate', () => {
    it('returns a confidence explanation with all fields', () => {
      const result = calculator.calculate(createFullInput());
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('indicatorAgreement');
      expect(result).toHaveProperty('strategyAgreement');
      expect(result).toHaveProperty('historicalSimilarity');
      expect(result).toHaveProperty('signalQuality');
      expect(result).toHaveProperty('marketConditions');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('factors');
    });

    it('calculates score between 0 and 1', () => {
      const result = calculator.calculate(createFullInput());
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('returns Turkish description', () => {
      const result = calculator.calculate(createFullInput());
      expect(result.description).toBeTruthy();
      expect(typeof result.description).toBe('string');
    });

    it('returns factors as string array', () => {
      const result = calculator.calculate(createFullInput());
      expect(Array.isArray(result.factors)).toBe(true);
      for (const factor of result.factors) {
        expect(typeof factor).toBe('string');
      }
    });

    it('produces higher confidence when indicators agree', () => {
      const allPositive = createFullInput({
        indicators: [
          { indicator: 'RSI', timeframe: Timeframe.D1, value: 65, signal: 'bullish', interpretation: 'pozitif', weight: 0.15, isPositive: true },
          { indicator: 'MACD', timeframe: Timeframe.D1, value: 1.5, signal: 'bullish', interpretation: 'pozitif', weight: 0.15, isPositive: true },
          { indicator: 'EMA', timeframe: Timeframe.D1, value: 0.7, signal: 'bullish', interpretation: 'pozitif', weight: 0.12, isPositive: true },
        ],
      });

      const mixed = createFullInput({
        indicators: [
          { indicator: 'RSI', timeframe: Timeframe.D1, value: 65, signal: 'bullish', interpretation: 'pozitif', weight: 0.15, isPositive: true },
          { indicator: 'MACD', timeframe: Timeframe.D1, value: 0.3, signal: 'bearish', interpretation: 'negatif', weight: 0.15, isPositive: false },
          { indicator: 'EMA', timeframe: Timeframe.D1, value: 0.4, signal: 'bearish', interpretation: 'negatif', weight: 0.12, isPositive: false },
        ],
      });

      const highConf = calculator.calculate(allPositive);
      const lowConf = calculator.calculate(mixed);
      expect(highConf.score).toBeGreaterThan(lowConf.score);
    });

    it('produces higher confidence when strategy agreement is high', () => {
      const highAgreement = createFullInput({
        eliteScore: { technical: 75, financial: 72, confidence: 0.8, composite: 74 },
        decisionSignal: { action: SignalAction.BUY, strength: SignalStrength.STRONG },
      });

      const lowAgreement = createFullInput({
        eliteScore: { technical: 30, financial: 70, confidence: 0.4, composite: 50 },
        decisionSignal: { action: SignalAction.WATCH, strength: SignalStrength.WEAK },
      });

      const high = calculator.calculate(highAgreement);
      const low = calculator.calculate(lowAgreement);
      expect(high.strategyAgreement).toBeGreaterThanOrEqual(low.strategyAgreement);
    });

    it('handles empty input gracefully', () => {
      const result = calculator.calculate({
        stockSymbol: 'TEST',
        stockName: 'Test',
        currentPrice: 100,
      });
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('handles missing technical and financial scores', () => {
      const result = calculator.calculate({
        stockSymbol: 'TEST',
        stockName: 'Test',
        currentPrice: 100,
        indicators: [
          { indicator: 'RSI', timeframe: Timeframe.D1, value: 55, signal: 'neutral', interpretation: 'test', weight: 0.15, isPositive: true },
        ],
      });
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('reduces confidence with high risk factors', () => {
      const withRisks = createFullInput({
        riskFactors: [
          { type: 'volatility_risk' as any, severity: 'high' as any, score: 0.8, description: 'test', indicators: [] },
          { type: 'trend_risk' as any, severity: 'critical' as any, score: 0.9, description: 'test', indicators: [] },
        ],
      });

      const withoutRisks = createFullInput();
      const withRiskResult = calculator.calculate(withRisks);
      const withoutRiskResult = calculator.calculate(withoutRisks);
      expect(withRiskResult.marketConditions).toBeLessThanOrEqual(withoutRiskResult.marketConditions);
    });
  });
});
