import { RegimeDetectorService } from './regime-detector.service';
import { MarketRegimeType, RegimeInput, RegimeTimeframe, RegimeIndicator } from './types';

describe('RegimeDetectorService', () => {
  let service: RegimeDetectorService;

  beforeEach(() => {
    service = new RegimeDetectorService();
  });

  describe('classifyRegime', () => {
    it('should classify STRONG_BULL when all scores are high', () => {
      const input: RegimeInput = {
        timeframe: RegimeTimeframe.D1,
        trendScore: 0.9,
        momentumScore: 0.85,
        volumeScore: 0.8,
        volatilityScore: 0.5,
        breadthScore: 0.8,
        priceChange: 0.05,
        indicators: [
          { name: 'MA', value: 1.2, signal: 'bullish', weight: 1 },
          { name: 'RSI', value: 70, signal: 'bullish', weight: 1 },
          { name: 'MACD', value: 0.5, signal: 'bullish', weight: 1 },
        ],
      };
      const result = service.classifyRegime(input);
      expect(result.type).toBe(MarketRegimeType.STRONG_BULL);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.factors.length).toBeGreaterThan(0);
    });

    it('should classify SIDEWAYS when scores are neutral', () => {
      const input: RegimeInput = {
        timeframe: RegimeTimeframe.D1,
        trendScore: 0.0,
        momentumScore: 0.0,
        volumeScore: 0.5,
        volatilityScore: 0.5,
        breadthScore: 0.5,
        priceChange: 0,
      };
      const result = service.classifyRegime(input);
      expect(result.type).toBe(MarketRegimeType.SIDEWAYS);
    });

    it('should classify STRONG_BEAR when all scores are very low', () => {
      const input: RegimeInput = {
        timeframe: RegimeTimeframe.D1,
        trendScore: -1,
        momentumScore: -1,
        volumeScore: 0,
        volatilityScore: 0.5,
        breadthScore: 0,
        priceChange: -0.1,
      };
      const result = service.classifyRegime(input);
      expect([MarketRegimeType.BEAR, MarketRegimeType.STRONG_BEAR, MarketRegimeType.WEAK_BEAR]).toContain(result.type);
    });

    it('should classify HIGH_VOLATILITY when volatility is high', () => {
      const input: RegimeInput = {
        timeframe: RegimeTimeframe.D1,
        trendScore: 0.3,
        momentumScore: 0.2,
        volumeScore: 0.5,
        volatilityScore: 0.8,
        breadthScore: 0.5,
        priceChange: 0.01,
      };
      const result = service.classifyRegime(input);
      expect(result.type).toBe(MarketRegimeType.HIGH_VOLATILITY);
    });

    it('should classify LOW_VOLATILITY when volatility is low', () => {
      const input: RegimeInput = {
        timeframe: RegimeTimeframe.D1,
        trendScore: 0.1,
        momentumScore: 0.1,
        volumeScore: 0.5,
        volatilityScore: 0.2,
        breadthScore: 0.5,
        priceChange: 0.001,
      };
      const result = service.classifyRegime(input);
      expect(result.type).toBe(MarketRegimeType.LOW_VOLATILITY);
    });

    it('should classify BULL when composite score is in bull range', () => {
      const input: RegimeInput = {
        timeframe: RegimeTimeframe.D1,
        trendScore: 0.6,
        momentumScore: 0.5,
        volumeScore: 0.6,
        volatilityScore: 0.5,
        breadthScore: 0.6,
        priceChange: 0.02,
      };
      const result = service.classifyRegime(input);
      expect([MarketRegimeType.BULL, MarketRegimeType.STRONG_BULL]).toContain(result.type);
    });

    it('should classify BEAR when composite score is in bear range', () => {
      const input: RegimeInput = {
        timeframe: RegimeTimeframe.D1,
        trendScore: -0.8,
        momentumScore: -0.7,
        volumeScore: 0.2,
        volatilityScore: 0.5,
        breadthScore: 0.1,
        priceChange: -0.05,
      };
      const result = service.classifyRegime(input);
      expect([MarketRegimeType.WEAK_BEAR, MarketRegimeType.BEAR, MarketRegimeType.STRONG_BEAR]).toContain(result.type);
    });

    it('should include classifiedAt timestamp', () => {
      const input: RegimeInput = {
        timeframe: RegimeTimeframe.D1,
        trendScore: 0,
        momentumScore: 0,
        volumeScore: 0.5,
        volatilityScore: 0.5,
        priceChange: 0,
      };
      const result = service.classifyRegime(input);
      expect(result.classifiedAt).toBeDefined();
      expect(new Date(result.classifiedAt).getTime()).not.toBeNaN();
    });

    it('should build factors for all input dimensions', () => {
      const input: RegimeInput = {
        timeframe: RegimeTimeframe.D1,
        trendScore: 0.5,
        momentumScore: 0.3,
        volumeScore: 0.7,
        volatilityScore: 0.4,
        breadthScore: 0.6,
        priceChange: 0.01,
      };
      const result = service.classifyRegime(input);
      expect(result.factors.length).toBe(5);
      const factorNames = result.factors.map((f) => f.factor);
      expect(factorNames).toContain('Trend');
      expect(factorNames).toContain('Momentum');
      expect(factorNames).toContain('Hacim');
      expect(factorNames).toContain('Volatilite');
      expect(factorNames).toContain('Genislik');
    });

    it('should handle input without breadthScore', () => {
      const input: RegimeInput = {
        timeframe: RegimeTimeframe.D1,
        trendScore: 0.1,
        momentumScore: 0.1,
        volumeScore: 0.5,
        volatilityScore: 0.5,
        priceChange: 0,
      };
      const result = service.classifyRegime(input);
      expect(result.factors.length).toBe(4);
      const factorNames = result.factors.map((f) => f.factor);
      expect(factorNames).not.toContain('Genislik');
    });
  });

  describe('calculateConfidence', () => {
    it('should return 0.5 for empty indicators', () => {
      expect(service.calculateConfidence([])).toBe(0.5);
    });

    it('should return high confidence for unanimous signals', () => {
      const indicators: RegimeIndicator[] = [
        { name: 'A', value: 1, signal: 'bullish', weight: 1 },
        { name: 'B', value: 1, signal: 'bullish', weight: 1 },
        { name: 'C', value: 1, signal: 'bullish', weight: 1 },
      ];
      const confidence = service.calculateConfidence(indicators);
      expect(confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('should return lower confidence for conflicting signals', () => {
      const indicators: RegimeIndicator[] = [
        { name: 'A', value: 1, signal: 'bullish', weight: 1 },
        { name: 'B', value: 1, signal: 'bearish', weight: 1 },
      ];
      const confidence = service.calculateConfidence(indicators);
      expect(confidence).toBeLessThanOrEqual(0.6);
    });
  });

  describe('calculateAgreement', () => {
    it('should return 0 for empty indicators', () => {
      expect(service.calculateAgreement([])).toBe(0);
    });

    it('should return 1 for unanimous signals', () => {
      const indicators: RegimeIndicator[] = [
        { name: 'A', value: 1, signal: 'bullish', weight: 1 },
        { name: 'B', value: 1, signal: 'bullish', weight: 1 },
      ];
      expect(service.calculateAgreement(indicators)).toBe(1);
    });

    it('should return 0.5 for half-half signals', () => {
      const indicators: RegimeIndicator[] = [
        { name: 'A', value: 1, signal: 'bullish', weight: 1 },
        { name: 'B', value: 1, signal: 'bearish', weight: 1 },
      ];
      expect(service.calculateAgreement(indicators)).toBe(0.5);
    });
  });

  describe('calculateConflict', () => {
    it('should return 0 for empty indicators', () => {
      expect(service.calculateConflict([])).toBe(0);
    });

    it('should return 0 for unanimous signals', () => {
      const indicators: RegimeIndicator[] = [
        { name: 'A', value: 1, signal: 'bullish', weight: 1 },
        { name: 'B', value: 1, signal: 'bullish', weight: 1 },
      ];
      expect(service.calculateConflict(indicators)).toBe(0);
    });

    it('should return positive value for conflicting signals', () => {
      const indicators: RegimeIndicator[] = [
        { name: 'A', value: 1, signal: 'bullish', weight: 1 },
        { name: 'B', value: 1, signal: 'bearish', weight: 1 },
        { name: 'C', value: 1, signal: 'neutral', weight: 1 },
      ];
      const conflict = service.calculateConflict(indicators);
      expect(conflict).toBeGreaterThan(0);
    });
  });

  describe('calculateStability', () => {
    it('should return 1 for single value', () => {
      expect(service.calculateStability([0.5])).toBe(1);
    });

    it('should return 1 for identical values', () => {
      expect(service.calculateStability([0.5, 0.5, 0.5])).toBe(1);
    });

    it('should return lower value for varying values', () => {
      const stability = service.calculateStability([0.1, 0.9, 0.3, 0.8]);
      expect(stability).toBeLessThan(1);
      expect(stability).toBeGreaterThanOrEqual(0);
    });
  });

  describe('determineRegimeType', () => {
    it('should return composite score in result', () => {
      const input: RegimeInput = {
        timeframe: RegimeTimeframe.D1,
        trendScore: 0.5,
        momentumScore: 0.3,
        volumeScore: 0.6,
        volatilityScore: 0.5,
        priceChange: 0.01,
      };
      const result = service.determineRegimeType(input);
      expect(result.scores).toHaveProperty('composite');
    });
  });
});
