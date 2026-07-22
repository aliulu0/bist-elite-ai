import {
  PaperPortfolioType, PositionStatus, OrderStatus, MarketRegime,
  PAPER_PORTFOLIO_DEFAULTS, getPaperPortfolioConfig,
  PaperPortfolioConfig
} from './types';

describe('Paper Portfolio Types', () => {
  describe('Enums', () => {
    it('should have correct PaperPortfolioType values', () => {
      expect(PaperPortfolioType.DEFAULT).toBe('DEFAULT');
      expect(PaperPortfolioType.GROWTH).toBe('GROWTH');
      expect(PaperPortfolioType.CONSERVATIVE).toBe('CONSERVATIVE');
      expect(PaperPortfolioType.BALANCED).toBe('BALANCED');
      expect(PaperPortfolioType.CUSTOM).toBe('CUSTOM');
    });

    it('should have correct PositionStatus values', () => {
      expect(PositionStatus.PENDING).toBe('PENDING');
      expect(PositionStatus.OPEN).toBe('OPEN');
      expect(PositionStatus.CLOSED).toBe('CLOSED');
      expect(PositionStatus.CANCELLED).toBe('CANCELLED');
    });

    it('should have correct OrderStatus values', () => {
      expect(OrderStatus.PENDING).toBe('PENDING');
      expect(OrderStatus.FILLED).toBe('FILLED');
      expect(OrderStatus.PARTIALLY_FILLED).toBe('PARTIALLY_FILLED');
      expect(OrderStatus.CANCELLED).toBe('CANCELLED');
      expect(OrderStatus.REJECTED).toBe('REJECTED');
    });

    it('should have correct MarketRegime values', () => {
      expect(MarketRegime.BULL).toBe('BULL');
      expect(MarketRegime.BEAR).toBe('BEAR');
      expect(MarketRegime.SIDEWAYS).toBe('SIDEWAYS');
      expect(MarketRegime.HIGH_VOLATILITY).toBe('HIGH_VOLATILITY');
      expect(MarketRegime.LOW_VOLATILITY).toBe('LOW_VOLATILITY');
    });
  });

  describe('PAPER_PORTFOLIO_DEFAULTS', () => {
    it('should have valid defaults', () => {
      expect(PAPER_PORTFOLIO_DEFAULTS.enabled).toBe(true);
      expect(PAPER_PORTFOLIO_DEFAULTS.transactionCostPercent).toBe(0.001);
      expect(PAPER_PORTFOLIO_DEFAULTS.slippagePercent).toBe(0.0005);
      expect(PAPER_PORTFOLIO_DEFAULTS.maxPositionSizePercent).toBe(0.20);
      expect(PAPER_PORTFOLIO_DEFAULTS.maxPositions).toBe(20);
      expect(PAPER_PORTFOLIO_DEFAULTS.minPositionSize).toBe(1000);
      expect(PAPER_PORTFOLIO_DEFAULTS.defaultStopLossPercent).toBe(0.08);
      expect(PAPER_PORTFOLIO_DEFAULTS.defaultTakeProfitRatio).toBe(2.0);
      expect(PAPER_PORTFOLIO_DEFAULTS.maxDrawdownLimit).toBe(0.20);
      expect(PAPER_PORTFOLIO_DEFAULTS.defaultCurrency).toBe('TRY');
    });
  });

  describe('getPaperPortfolioConfig', () => {
    it('should return defaults when no overrides', () => {
      const config = getPaperPortfolioConfig();
      expect(config).toEqual(PAPER_PORTFOLIO_DEFAULTS);
    });

    it('should merge overrides into defaults', () => {
      const config = getPaperPortfolioConfig({
        transactionCostPercent: 0.002,
        maxPositions: 30,
      });
      expect(config.transactionCostPercent).toBe(0.002);
      expect(config.maxPositions).toBe(30);
      expect(config.slippagePercent).toBe(PAPER_PORTFOLIO_DEFAULTS.slippagePercent);
    });

    it('should not mutate defaults', () => {
      getPaperPortfolioConfig({ transactionCostPercent: 0.005 });
      expect(PAPER_PORTFOLIO_DEFAULTS.transactionCostPercent).toBe(0.001);
    });
  });
});
