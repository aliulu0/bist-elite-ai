import { ExplainabilityService } from '../explainability.service';
import { ConfidenceCalculator } from '../confidence.service';
import { RiskAnalyzer } from '../risk.service';
import { MultiTimeframeAnalyzer } from '../multi-timeframe.service';
import { MarketInterpreter } from '../market-interpreter.service';
import { AppLoggerService } from '../../logger/logger.service';
import { CacheService } from '../../cache/cache.service';
import {
  ExplanationInput,
  Timeframe,
  TrendDirection,
  MomentumState,
  SignalAction,
  SignalStrength,
} from '../types';

jest.mock('../../logger/logger.service', () => ({
  AppLoggerService: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

jest.mock('../../cache/cache.service', () => ({
  CacheService: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockReturnValue(undefined),
    set: jest.fn(),
    has: jest.fn().mockReturnValue(false),
  })),
}));

function createFullInput(overrides?: Partial<ExplanationInput>): ExplanationInput {
  return {
    stockSymbol: 'THYAO',
    stockName: 'Türk Hava Yolları',
    currentPrice: 285.5,
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
      {
        indicator: 'RSI',
        timeframe: Timeframe.D1,
        value: 62,
        signal: 'bullish',
        interpretation: 'RSI yükselişte',
        weight: 0.15,
        isPositive: true,
      },
      {
        indicator: 'MACD',
        timeframe: Timeframe.D1,
        value: 1.5,
        signal: 'bullish',
        interpretation: 'MACD pozitif',
        weight: 0.15,
        isPositive: true,
      },
      {
        indicator: 'EMA',
        timeframe: Timeframe.D1,
        value: 0.7,
        signal: 'bullish',
        interpretation: 'Fiyat EMA üzerinde',
        weight: 0.12,
        isPositive: true,
      },
      {
        indicator: 'SMA',
        timeframe: Timeframe.D1,
        value: 0.65,
        signal: 'bullish',
        interpretation: 'Fiyat SMA üzerinde',
        weight: 0.1,
        isPositive: true,
      },
      {
        indicator: 'ADX',
        timeframe: Timeframe.D1,
        value: 30,
        signal: 'bullish',
        interpretation: 'Güçlü trend',
        weight: 0.1,
        isPositive: true,
      },
      {
        indicator: 'BollingerBands',
        timeframe: Timeframe.D1,
        value: 0.6,
        signal: 'neutral',
        interpretation: 'Bant ortasında',
        weight: 0.1,
        isPositive: true,
      },
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

describe('ExplainabilityService', () => {
  let service: ExplainabilityService;
  let mockLogger: AppLoggerService;
  let mockCache: CacheService;

  beforeEach(() => {
    mockLogger = new AppLoggerService(null as any);
    mockCache = new CacheService();

    service = new ExplainabilityService(
      mockLogger,
      mockCache,
      new ConfidenceCalculator(),
      new RiskAnalyzer(),
      new MultiTimeframeAnalyzer(),
      new MarketInterpreter(),
    );
  });

  describe('generateExplanation', () => {
    it('returns full ExplanationOutput', () => {
      const result = service.generateExplanation(createFullInput());
      expect(result).toHaveProperty('stockSymbol', 'THYAO');
      expect(result).toHaveProperty('stockName', 'Türk Hava Yolları');
      expect(result).toHaveProperty('generatedAt');
      expect(result).toHaveProperty('generalSummary');
      expect(result).toHaveProperty('technicalAnalysis');
      expect(result).toHaveProperty('trendAnalysis');
      expect(result).toHaveProperty('momentumAnalysis');
      expect(result).toHaveProperty('volumeAnalysis');
      expect(result).toHaveProperty('supportResistance');
      expect(result).toHaveProperty('riskAnalysis');
      expect(result).toHaveProperty('positiveFactors');
      expect(result).toHaveProperty('negativeFactors');
      expect(result).toHaveProperty('eliteScoreExplanation');
      expect(result).toHaveProperty('confidenceExplanation');
      expect(result).toHaveProperty('multiTimeframeSummary');
      expect(result).toHaveProperty('suggestedObservation');
      expect(result).toHaveProperty('finalEvaluation');
      expect(result).toHaveProperty('disclaimer');
      expect(result).toHaveProperty('evidenceTrail');
    });

    it('all text fields are in Turkish', () => {
      const result = service.generateExplanation(createFullInput());
      expect(result.generalSummary).toBeTruthy();
      expect(result.technicalAnalysis).toBeTruthy();
      expect(result.trendAnalysis.description).toBeTruthy();
      expect(result.momentumAnalysis.description).toBeTruthy();
      expect(result.volumeAnalysis.description).toBeTruthy();
      expect(result.supportResistance.description).toBeTruthy();
      expect(result.suggestedObservation).toBeTruthy();
      expect(result.finalEvaluation).toBeTruthy();
      expect(result.disclaimer).toBeTruthy();
    });

    it('risk analysis has at least 7 risk factors', () => {
      const result = service.generateExplanation(createFullInput());
      expect(result.riskAnalysis.length).toBeGreaterThanOrEqual(7);
    });

    it('multi-timeframe summary has all views', () => {
      const result = service.generateExplanation(createFullInput());
      expect(result.multiTimeframeSummary.shortTermView).toBeTruthy();
      expect(result.multiTimeframeSummary.mediumTermView).toBeTruthy();
      expect(result.multiTimeframeSummary.longTermView).toBeTruthy();
    });

    it('generates valid ISO timestamp', () => {
      const result = service.generateExplanation(createFullInput());
      expect(new Date(result.generatedAt).toISOString()).toBe(result.generatedAt);
    });

    it('evidence trail respects maxEvidenceItems', () => {
      const manyIndicators = Array.from({ length: 25 }, (_, i) => ({
        indicator: `Indicator${i}`,
        timeframe: Timeframe.D1,
        value: 0.5,
        signal: 'test',
        interpretation: `test ${i}`,
        weight: 0.05,
        isPositive: i % 2 === 0,
      }));

      const result = service.generateExplanation(
        createFullInput({
          indicators: manyIndicators,
        }),
      );
      expect(result.evidenceTrail.length).toBeLessThanOrEqual(20);
    });

    it('handles empty input', () => {
      const result = service.generateExplanation({
        stockSymbol: 'TEST',
        stockName: 'Test',
        currentPrice: 100,
      });
      expect(result.stockSymbol).toBe('TEST');
      expect(result.generalSummary).toBeTruthy();
      expect(result.riskAnalysis.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('generateExplanationSummary', () => {
    it('returns a text summary', () => {
      const result = service.generateExplanationSummary(createFullInput());
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(100);
    });

    it('includes section headers', () => {
      const result = service.generateExplanationSummary(createFullInput());
      expect(result).toContain('Teknik Analiz');
      expect(result).toContain('Trend');
      expect(result).toContain('Momentum');
      expect(result).toContain('Hacim');
      expect(result).toContain('Risk Analizi');
      expect(result).toContain('Çoklu Zaman Dilimi');
      expect(result).toContain('Elite Skor');
      expect(result).toContain('Güven');
      expect(result).toContain('Öneri');
      expect(result).toContain('Son Değerlendirme');
    });
  });

  describe('getPositiveFactorsSummary', () => {
    it('returns array of positive factor strings', () => {
      const result = service.getPositiveFactorsSummary(createFullInput());
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      for (const item of result) {
        expect(typeof item).toBe('string');
        expect(item).toContain(':');
      }
    });
  });

  describe('getNegativeFactorsSummary', () => {
    it('returns array of negative factor strings', () => {
      const result = service.getNegativeFactorsSummary(createFullInput());
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getRiskSummary', () => {
    it('returns risk summary with overall level', () => {
      const result = service.getRiskSummary(createFullInput());
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toContain('Genel risk seviyesi');
    });
  });

  describe('getEvidenceForIndicator', () => {
    it('filters evidence by indicator name', () => {
      const input = createFullInput();
      const rsiEvidence = service.getEvidenceForIndicator(input, 'RSI');
      expect(rsiEvidence.length).toBe(1);
      expect(rsiEvidence[0].indicator).toBe('RSI');
    });

    it('returns empty for non-existent indicator', () => {
      const input = createFullInput();
      const result = service.getEvidenceForIndicator(input, 'NONEXISTENT');
      expect(result.length).toBe(0);
    });
  });
});
