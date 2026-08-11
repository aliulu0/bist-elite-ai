import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PortfolioSummaryCards } from '../portfolio-summary';
import type { PortfolioSummary } from '../portfolio-types';

const mockSummary: PortfolioSummary = {
  totalValue: 19010, totalCost: 16760, cashBalance: 3500,
  dayPnl: 320, dayPnlPercent: 1.72,
  totalPnl: 2250, totalPnlPercent: 13.38,
  realizedPnl: 890, unrealizedPnl: 1360,
  maxDrawdown: 0.08, volatility: 0.22,
  sharpeRatio: 1.85, aiScore: 74,
};

describe('PortfolioSummaryCards', () => {
  it('returns null when summary is null', () => {
    const { container } = render(<PortfolioSummaryCards summary={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders all 10 stat cards', () => {
    render(<PortfolioSummaryCards summary={mockSummary} />);
    expect(screen.getByText('Toplam Portföy Değeri')).toBeDefined();
    expect(screen.getByText('Nakit Durumu')).toBeDefined();
    expect(screen.getByText('Bugünkü K/Z')).toBeDefined();
    expect(screen.getByText('Toplam Getiri')).toBeDefined();
    expect(screen.getByText('Gerçekleşmiş K/Z')).toBeDefined();
    expect(screen.getByText('Gerçekleşmemiş K/Z')).toBeDefined();
    expect(screen.getByText('Maks. Drawdown')).toBeDefined();
    expect(screen.getByText('Volatilite')).toBeDefined();
    expect(screen.getByText('Sharpe')).toBeDefined();
    expect(screen.getByText('AI Portföy Skoru')).toBeDefined();
  });

  it('displays formatted values via text content', () => {
    const { container } = render(<PortfolioSummaryCards summary={mockSummary} />);
    const text = container.textContent || '';
    expect(text).toContain('19.010');
    expect(text).toContain('3.500');
  });

  it('displays positive pnl description with + prefix', () => {
    render(<PortfolioSummaryCards summary={mockSummary} />);
    expect(screen.getByText('+1.72%')).toBeDefined();
    expect(screen.getByText('+13.38%')).toBeDefined();
  });

  it('displays max drawdown as percentage', () => {
    render(<PortfolioSummaryCards summary={mockSummary} />);
    expect(screen.getByText('8.00%')).toBeDefined();
  });

  it('displays volatility as percentage', () => {
    render(<PortfolioSummaryCards summary={mockSummary} />);
    expect(screen.getByText('22.00%')).toBeDefined();
  });

  it('displays sharpe ratio', () => {
    render(<PortfolioSummaryCards summary={mockSummary} />);
    expect(screen.getByText('1.85')).toBeDefined();
  });

  it('displays AI score', () => {
    render(<PortfolioSummaryCards summary={mockSummary} />);
    expect(screen.getByText('74')).toBeDefined();
  });

  it('handles negative day pnl via text content', () => {
    const summary = { ...mockSummary, dayPnl: -100, dayPnlPercent: -0.53 };
    const { container } = render(<PortfolioSummaryCards summary={summary} />);
    const text = container.textContent || '';
    expect(text).toContain('-0.53%');
  });

  it('handles zero AI score', () => {
    const summary = { ...mockSummary, aiScore: 0 };
    render(<PortfolioSummaryCards summary={summary} />);
    expect(screen.getByText('0')).toBeDefined();
  });
});
