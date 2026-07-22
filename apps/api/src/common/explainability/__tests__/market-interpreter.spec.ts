import { MarketInterpreter } from '../market-interpreter.service';
import {
  ExplanationInput,
  Timeframe,
  TrendDirection,
  MomentumState,
  VolumeState,
  SignalAction,
  SignalStrength,
} from '../types';

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
      support: 50,
      resistance: 50,
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
      { indicator: 'ADX', timeframe: Timeframe.D1, value: 30, signal: 'bullish', interpretation: 'Güçlü trend', weight: 0.10, isPositive: true },
      { indicator: 'BollingerBands', timeframe: Timeframe.D1, value: 0.6, signal: 'neutral', interpretation: 'Bant ortasında', weight: 0.10, isPositive: true },
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
    },
    ...overrides,
  };
}

describe('MarketInterpreter', () => {
  let interpreter: MarketInterpreter;

  beforeEach(() => {
    interpreter = new MarketInterpreter();
  });

  describe('interpretTrend', () => {
    it('returns TrendAnalysis with all fields', () => {
      const result = interpreter.interpretTrend(createFullInput());
      expect(result).toHaveProperty('direction');
      expect(result).toHaveProperty('strength');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('supportingIndicators');
    });

    it('returns Turkish description', () => {
      const result = interpreter.interpretTrend(createFullInput());
      expect(result.description).toBeTruthy();
      expect(typeof result.description).toBe('string');
    });

    it('detects uptrend from positive indicators', () => {
      const result = interpreter.interpretTrend(createFullInput());
      expect([TrendDirection.STRONG_UPTREND, TrendDirection.UPTREND]).toContain(result.direction);
    });

    it('detects downtrend from negative indicators', () => {
      const input = createFullInput({
        indicators: [
          { indicator: 'EMA', timeframe: Timeframe.D1, value: 0.2, signal: 'bearish', interpretation: 'test', weight: 0.12, isPositive: false },
          { indicator: 'SMA', timeframe: Timeframe.D1, value: 0.25, signal: 'bearish', interpretation: 'test', weight: 0.10, isPositive: false },
          { indicator: 'ADX', timeframe: Timeframe.D1, value: 28, signal: 'bearish', interpretation: 'test', weight: 0.10, isPositive: false },
        ],
      });
      const result = interpreter.interpretTrend(input);
      expect([TrendDirection.DOWNTREND, TrendDirection.STRONG_DOWNTREND, TrendDirection.WEAK_DOWNTREND]).toContain(result.direction);
    });

    it('returns sideways when no indicators', () => {
      const result = interpreter.interpretTrend({
        stockSymbol: 'TEST',
        stockName: 'Test',
        currentPrice: 100,
        technicalScore: { trend: 40, composite: 40 },
      });
      expect(result.direction).toBe(TrendDirection.SIDEWAYS);
    });
  });

  describe('interpretMomentum', () => {
    it('returns MomentumAnalysis with all fields', () => {
      const result = interpreter.interpretMomentum(createFullInput());
      expect(result).toHaveProperty('state');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('supportingIndicators');
    });

    it('returns Turkish description', () => {
      const result = interpreter.interpretMomentum(createFullInput());
      expect(result.description).toBeTruthy();
    });

    it('detects overbought from RSI', () => {
      const input = createFullInput({
        indicators: [
          { indicator: 'RSI', timeframe: Timeframe.D1, value: 75, signal: 'overbought', interpretation: 'test', weight: 0.15, isPositive: true },
        ],
      });
      const result = interpreter.interpretMomentum(input);
      expect(result.state).toBe(MomentumState.OVERBOUGHT);
      expect(result.rsiValue).toBe(75);
    });

    it('detects oversold from RSI', () => {
      const input = createFullInput({
        indicators: [
          { indicator: 'RSI', timeframe: Timeframe.D1, value: 25, signal: 'oversold', interpretation: 'test', weight: 0.15, isPositive: false },
        ],
      });
      const result = interpreter.interpretMomentum(input);
      expect(result.state).toBe(MomentumState.OVERSOLD);
    });
  });

  describe('interpretVolume', () => {
    it('returns VolumeAnalysis with all fields', () => {
      const result = interpreter.interpretVolume(createFullInput());
      expect(result).toHaveProperty('state');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('supportingIndicators');
    });

    it('returns Turkish description', () => {
      const result = interpreter.interpretVolume(createFullInput());
      expect(result.description).toBeTruthy();
    });

    it('detects high volume', () => {
      const input = createFullInput({
        technicalScore: { momentum: 65, trend: 60, volatility: 45, volume: 75, composite: 58 },
      });
      const result = interpreter.interpretVolume(input);
      expect(result.state).toBe(VolumeState.HIGH_VOLUME);
    });
  });

  describe('interpretSupportResistance', () => {
    it('returns SupportResistance with all fields', () => {
      const result = interpreter.interpretSupportResistance(createFullInput());
      expect(result).toHaveProperty('supportLevels');
      expect(result).toHaveProperty('resistanceLevels');
      expect(result).toHaveProperty('currentPrice');
      expect(result).toHaveProperty('distanceToSupport');
      expect(result).toHaveProperty('distanceToResistance');
      expect(result).toHaveProperty('description');
    });

    it('has support below current price', () => {
      const result = interpreter.interpretSupportResistance(createFullInput());
      const nearestSupport = result.supportLevels.find(s => s < result.currentPrice);
      expect(nearestSupport).toBeDefined();
    });

    it('has resistance above current price', () => {
      const result = interpreter.interpretSupportResistance(createFullInput());
      const nearestResistance = result.resistanceLevels.find(r => r > result.currentPrice);
      expect(nearestResistance).toBeDefined();
    });

    it('returns Turkish description', () => {
      const result = interpreter.interpretSupportResistance(createFullInput());
      expect(result.description).toContain('Mevcut fiyat');
    });
  });

  describe('explainEliteScore', () => {
    it('returns EliteScoreExplanation with all fields', () => {
      const result = interpreter.explainEliteScore(createFullInput());
      expect(result).toHaveProperty('technicalScore');
      expect(result).toHaveProperty('financialScore');
      expect(result).toHaveProperty('confidenceScore');
      expect(result).toHaveProperty('compositeScore');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('positiveFactors');
      expect(result).toHaveProperty('negativeFactors');
    });

    it('returns Turkish description', () => {
      const result = interpreter.explainEliteScore(createFullInput());
      expect(result.description).toContain('Elite Skor');
    });

    it('handles missing elite score', () => {
      const result = interpreter.explainEliteScore({
        stockSymbol: 'TEST',
        stockName: 'Test',
        currentPrice: 100,
      });
      expect(result.compositeScore).toBe(0);
      expect(result.description).toContain('bulunamadı');
    });

    it('extracts positive factors from indicators', () => {
      const result = interpreter.explainEliteScore(createFullInput());
      expect(result.positiveFactors.positive.length).toBeGreaterThan(0);
    });
  });

  describe('buildGeneralSummary', () => {
    it('includes stock symbol and name', () => {
      const result = interpreter.buildGeneralSummary(createFullInput());
      expect(result).toContain('THYAO');
      expect(result).toContain('Türk Hava Yolları');
    });

    it('includes elite score when available', () => {
      const result = interpreter.buildGeneralSummary(createFullInput());
      expect(result).toContain('Elite Skor');
    });

    it('includes signal type when available', () => {
      const result = interpreter.buildGeneralSummary(createFullInput());
      expect(result).toContain('Alım sinyali');
    });
  });

  describe('buildTechnicalAnalysis', () => {
    it('returns Turkish analysis text', () => {
      const result = interpreter.buildTechnicalAnalysis(createFullInput());
      expect(result).toContain('Teknik göstergeler');
    });

    it('reports positive indicators majority', () => {
      const result = interpreter.buildTechnicalAnalysis(createFullInput());
      expect(result).toContain('pozitif');
    });

    it('reports component scores', () => {
      const result = interpreter.buildTechnicalAnalysis(createFullInput());
      expect(result).toContain('Teknik bileşenler');
      expect(result).toContain('momentum');
    });

    it('handles no data', () => {
      const result = interpreter.buildTechnicalAnalysis({
        stockSymbol: 'TEST',
        stockName: 'Test',
        currentPrice: 100,
      });
      expect(result).toBeTruthy();
    });
  });

  describe('buildSuggestedObservation', () => {
    it('suggests entry for buy signal', () => {
      const result = interpreter.buildSuggestedObservation(createFullInput());
      expect(result).toContain('Alım sinyali');
      expect(result).toContain('Stop-loss');
      expect(result).toContain('Hedef fiyat');
    });

    it('suggests exit for sell signal', () => {
      const input = createFullInput({
        decisionSignal: { action: SignalAction.SELL, strength: SignalStrength.STRONG },
      });
      const result = interpreter.buildSuggestedObservation(input);
      expect(result).toContain('Satım sinyali');
    });

    it('suggests watching for watch signal', () => {
      const input = createFullInput({
        decisionSignal: { action: SignalAction.WATCH, strength: SignalStrength.MODERATE },
      });
      const result = interpreter.buildSuggestedObservation(input);
      expect(result).toContain('izleme listesine');
    });
  });

  describe('buildFinalEvaluation', () => {
    it('provides positive evaluation for high score + high confidence', () => {
      const result = interpreter.buildFinalEvaluation(createFullInput());
      expect(result).toContain('THYAO');
    });

    it('provides cautious evaluation for low score', () => {
      const input = createFullInput({
        eliteScore: { technical: 20, financial: 25, confidence: 0.3, composite: 22 },
        confidenceScore: { dataQuality: 0.3, modelConsistency: 0.3, regimeStability: 0.3, composite: 0.3 },
      });
      const result = interpreter.buildFinalEvaluation(input);
      expect(result).toContain('zayıf');
    });

    it('handles missing data', () => {
      const result = interpreter.buildFinalEvaluation({
        stockSymbol: 'TEST',
        stockName: 'Test',
        currentPrice: 100,
      });
      expect(result).toBeTruthy();
    });
  });
});
