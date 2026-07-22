import { RegimeContextService } from './regime-context.service';
import { MarketRegimeType } from './types';

describe('RegimeContextService', () => {
  let service: RegimeContextService;

  beforeEach(() => {
    service = new RegimeContextService();
  });

  describe('getEliteScoreContext', () => {
    it('should return context with recommended adjustments', () => {
      const ctx = service.getEliteScoreContext(MarketRegimeType.BULL, 0.8);
      expect(ctx.currentRegime).toBe(MarketRegimeType.BULL);
      expect(ctx.confidence).toBe(0.8);
      expect(ctx.recommendedAdjustments.length).toBeGreaterThan(0);
    });

    it('should include risk factors for low confidence', () => {
      const ctx = service.getEliteScoreContext(MarketRegimeType.BEAR, 0.3);
      expect(ctx.riskFactors.length).toBeGreaterThan(0);
      expect(ctx.riskFactors.some((f) => f.includes('Dusuk'))).toBe(true);
    });

    it('should include transition risk factor when high', () => {
      const ctx = service.getEliteScoreContext(MarketRegimeType.SIDEWAYS, 0.5, 0, 0.8);
      expect(ctx.riskFactors.some((f) => f.toLowerCase().includes('gecis'))).toBe(true);
    });
  });

  describe('getExplainabilityContext', () => {
    it('should return context with explainability adjustments', () => {
      const ctx = service.getExplainabilityContext(MarketRegimeType.HIGH_VOLATILITY, 0.7);
      expect(ctx.currentRegime).toBe(MarketRegimeType.HIGH_VOLATILITY);
      expect(ctx.recommendedAdjustments.length).toBeGreaterThan(0);
      const volAdj = ctx.recommendedAdjustments.find((a) => a.parameter === 'includeVolatilityAnalysis');
      expect(volAdj).toBeDefined();
      expect(volAdj!.recommendedValue).toBe(1);
    });
  });

  describe('getConsensusContext', () => {
    it('should return context with consensus adjustments', () => {
      const ctx = service.getConsensusContext(MarketRegimeType.STRONG_BEAR, 0.9);
      expect(ctx.currentRegime).toBe(MarketRegimeType.STRONG_BEAR);
      const agrAdj = ctx.recommendedAdjustments.find((a) => a.parameter === 'minTimeframeAgreement');
      expect(agrAdj).toBeDefined();
      expect(agrAdj!.recommendedValue).toBeGreaterThanOrEqual(0.8);
    });
  });

  describe('getTrackerContext', () => {
    it('should return context for tracker', () => {
      const ctx = service.getTrackerContext(MarketRegimeType.RECOVERY, 0.6);
      expect(ctx.currentRegime).toBe(MarketRegimeType.RECOVERY);
      expect(ctx.recommendedAdjustments.length).toBeGreaterThan(0);
    });
  });

  describe('getPortfolioContext', () => {
    it('should return portfolio-specific adjustments', () => {
      const ctx = service.getPortfolioContext(MarketRegimeType.STRONG_BEAR, 0.9);
      const cashAdj = ctx.recommendedAdjustments.find((a) => a.parameter === 'cashAllocation');
      expect(cashAdj).toBeDefined();
      expect(cashAdj!.recommendedValue).toBeGreaterThanOrEqual(0.5);
    });

    it('should reduce cash allocation for BULL', () => {
      const ctx = service.getPortfolioContext(MarketRegimeType.STRONG_BULL, 0.9);
      const cashAdj = ctx.recommendedAdjustments.find((a) => a.parameter === 'cashAllocation');
      expect(cashAdj).toBeDefined();
      expect(cashAdj!.recommendedValue).toBeLessThan(cashAdj!.currentValue);
    });
  });

  describe('getNotificationContext', () => {
    it('should return notification priority adjustments', () => {
      const ctx = service.getNotificationContext(MarketRegimeType.STRONG_BEAR, 0.9);
      const notifAdj = ctx.recommendedAdjustments.find((a) => a.parameter === 'notificationPriority');
      expect(notifAdj).toBeDefined();
      expect(notifAdj!.recommendedValue).toBe(3);
    });

    it('should have low priority for LOW_VOLATILITY', () => {
      const ctx = service.getNotificationContext(MarketRegimeType.LOW_VOLATILITY, 0.5);
      const notifAdj = ctx.recommendedAdjustments.find((a) => a.parameter === 'notificationPriority');
      expect(notifAdj).toBeDefined();
      expect(notifAdj!.recommendedValue).toBe(0);
    });
  });

  describe('all regimes covered', () => {
    it('should provide context for all 13 regimes', () => {
      const allRegimes = Object.values(MarketRegimeType);
      for (const regime of allRegimes) {
        const ctx = service.getEliteScoreContext(regime, 0.5);
        expect(ctx.currentRegime).toBe(regime);
        expect(ctx.recommendedAdjustments.length).toBeGreaterThan(0);
      }
    });
  });
});
