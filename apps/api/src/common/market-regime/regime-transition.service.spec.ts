import { RegimeTransitionService } from './regime-transition.service';
import { MarketRegimeType, RegimeTimeframe } from './types';

describe('RegimeTransitionService', () => {
  let service: RegimeTransitionService;

  beforeEach(() => {
    service = new RegimeTransitionService();
  });

  describe('detectTransitions', () => {
    it('should return empty array for empty history', () => {
      const result = service.detectTransitions(MarketRegimeType.BULL, []);
      expect(result).toEqual([]);
    });

    it('should detect transition when history changes', () => {
      const history = [
        MarketRegimeType.BEAR,
        MarketRegimeType.BEAR,
        MarketRegimeType.BULL,
      ];
      const result = service.detectTransitions(MarketRegimeType.BULL, history);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].from).toBe(MarketRegimeType.BEAR);
      expect(result[0].to).toBe(MarketRegimeType.BULL);
    });

    it('should not detect transition for constant history', () => {
      const history = [
        MarketRegimeType.BULL,
        MarketRegimeType.BULL,
        MarketRegimeType.BULL,
      ];
      const result = service.detectTransitions(MarketRegimeType.BULL, history);
      expect(result).toEqual([]);
    });

    it('should include timeframe in transition', () => {
      const history = [
        MarketRegimeType.BEAR,
        MarketRegimeType.BULL,
      ];
      const result = service.detectTransitions(MarketRegimeType.BULL, history, RegimeTimeframe.W1);
      expect(result[0].timeframe).toBe(RegimeTimeframe.W1);
    });

    it('should include detectedAt timestamp', () => {
      const history = [
        MarketRegimeType.BEAR,
        MarketRegimeType.BULL,
      ];
      const result = service.detectTransitions(MarketRegimeType.BULL, history);
      expect(result[0].detectedAt).toBeDefined();
    });
  });

  describe('calculateTransitionProbability', () => {
    it('should return probability between 0 and 1', () => {
      const prob = service.calculateTransitionProbability(MarketRegimeType.BULL, {} as any);
      expect(prob).toBeGreaterThanOrEqual(0.05);
      expect(prob).toBeLessThanOrEqual(1);
    });

    it('should return different probabilities for different regimes', () => {
      const bullProb = service.calculateTransitionProbability(MarketRegimeType.BULL, {} as any);
      const bearProb = service.calculateTransitionProbability(MarketRegimeType.BEAR, {} as any);
      expect(typeof bullProb).toBe('number');
      expect(typeof bearProb).toBe('number');
    });

    it('should account for momentum in probability', () => {
      const inputHighMomentum = { momentumScore: 0.9 } as any;
      const inputLowMomentum = { momentumScore: -0.9 } as any;
      const highProb = service.calculateTransitionProbability(MarketRegimeType.SIDEWAYS, inputHighMomentum);
      const lowProb = service.calculateTransitionProbability(MarketRegimeType.SIDEWAYS, inputLowMomentum);
      expect(highProb).not.toBe(lowProb);
    });
  });

  describe('detectEmergingTrends', () => {
    it('should return empty for short history', () => {
      expect(service.detectEmergingTrends([])).toEqual([]);
      expect(service.detectEmergingTrends([MarketRegimeType.BULL])).toEqual([]);
    });

    it('should detect EMERGING_BULL from bear to bull shift', () => {
      const history = [
        MarketRegimeType.BEAR,
        MarketRegimeType.WEAK_BEAR,
        MarketRegimeType.RECOVERY,
      ];
      const result = service.detectEmergingTrends(history);
      expect(result).toContain('EMERGING_BULL');
    });

    it('should detect EMERGING_BEAR from bull to bear shift', () => {
      const history = [
        MarketRegimeType.BULL,
        MarketRegimeType.WEAK_BULL,
        MarketRegimeType.CORRECTION,
      ];
      const result = service.detectEmergingTrends(history);
      expect(result).toContain('EMERGING_BEAR');
    });

    it('should not detect trends for stable history', () => {
      const history = [
        MarketRegimeType.BULL,
        MarketRegimeType.BULL,
        MarketRegimeType.BULL,
      ];
      const result = service.detectEmergingTrends(history);
      expect(result).toEqual([]);
    });
  });

  describe('detectVolatilityChanges', () => {
    it('should return empty for short history', () => {
      expect(service.detectVolatilityChanges([])).toEqual([]);
    });

    it('should detect VOLATILITY_EXPANSION when volatility increases', () => {
      const history = [0.3, 0.3, 0.6];
      const result = service.detectVolatilityChanges(history);
      expect(result).toContain('VOLATILITY_EXPANSION');
    });

    it('should detect VOLATILITY_CONTRACTION when volatility decreases', () => {
      const history = [0.8, 0.8, 0.3];
      const result = service.detectVolatilityChanges(history);
      expect(result).toContain('VOLATILITY_CONTRACTION');
    });

    it('should return empty for stable volatility', () => {
      const history = [0.5, 0.5, 0.5];
      const result = service.detectVolatilityChanges(history);
      expect(result).toEqual([]);
    });
  });

  describe('getTransitionHistory', () => {
    it('should sort transitions by detectedAt descending', () => {
      const transitions = [
        { from: MarketRegimeType.BULL, to: MarketRegimeType.BEAR, detectedAt: '2026-01-01' } as any,
        { from: MarketRegimeType.BEAR, to: MarketRegimeType.BULL, detectedAt: '2026-06-01' } as any,
      ];
      const result = service.getTransitionHistory(transitions);
      expect(result[0].detectedAt).toBe('2026-06-01');
      expect(result[1].detectedAt).toBe('2026-01-01');
    });
  });
});
