import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PortfolioRiskCard } from '../portfolio-risk-card';
import type { RiskMetrics } from '../portfolio-types';

describe('PortfolioRiskCard', () => {
  const risk: RiskMetrics = {
    beta: 1.15, volatility: 0.22, sharpeRatio: 1.85, sortinoRatio: 2.1,
    maxDrawdown: 0.08, valueAtRisk: 950, diversificationScore: 68, riskScore: 35,
  };

  it('renders title', () => {
    render(<PortfolioRiskCard risk={risk} />);
    expect(screen.getByText('Risk Metrikleri')).toBeDefined();
  });

  it('displays beta', () => {
    render(<PortfolioRiskCard risk={risk} />);
    expect(screen.getByText('1.15')).toBeDefined();
  });

  it('displays volatility as percentage', () => {
    render(<PortfolioRiskCard risk={risk} />);
    expect(screen.getByText('22.00%')).toBeDefined();
  });

  it('displays sharpe ratio', () => {
    render(<PortfolioRiskCard risk={risk} />);
    expect(screen.getByText('1.85')).toBeDefined();
  });

  it('displays sortino ratio', () => {
    render(<PortfolioRiskCard risk={risk} />);
    expect(screen.getByText('2.10')).toBeDefined();
  });

  it('displays max drawdown', () => {
    render(<PortfolioRiskCard risk={risk} />);
    expect(screen.getByText('8.00%')).toBeDefined();
  });

  it('displays value at risk', () => {
    render(<PortfolioRiskCard risk={risk} />);
    expect(screen.getByText('₺950')).toBeDefined();
  });

  it('displays diversification score', () => {
    render(<PortfolioRiskCard risk={risk} />);
    expect(screen.getByText('68/100')).toBeDefined();
  });

  it('displays risk score', () => {
    render(<PortfolioRiskCard risk={risk} />);
    expect(screen.getByText('35/100')).toBeDefined();
  });

  it('returns empty state when all zeros', () => {
    const zeroRisk: RiskMetrics = { beta: 0, volatility: 0, sharpeRatio: 0, sortinoRatio: 0, maxDrawdown: 0, valueAtRisk: 0, diversificationScore: 0, riskScore: 0 };
    render(<PortfolioRiskCard risk={zeroRisk} />);
    expect(screen.getByText('Risk analizi için yeterli veri yok')).toBeDefined();
  });
});
