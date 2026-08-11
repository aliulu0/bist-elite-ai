import { PortfolioConfig, RiskLimits } from '../types/portfolio.types';

export const DEFAULT_RISK_LIMITS: RiskLimits = {
  maxSectorConcentrationPercent: 30,
  maxPositionSizePercent: 20,
  minCashRatio: 5,
  maxDrawdownPercent: 25,
  maxVolatilityPercent: 40,
};

export const DEFAULT_PORTFOLIO_CONFIG: PortfolioConfig = {
  defaultCurrency: 'TRY',
  calculationPrecision: 2,
  benchmark: 'BIST100',
  maxPortfolios: 10,
  maxPositionsPerPortfolio: 50,
  riskLimits: DEFAULT_RISK_LIMITS,
  version: '1.0.0',
};
