import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PortfolioExport } from '../portfolio-export';
import type { Holding } from '../portfolio-types';

const mockHoldings: Holding[] = [
  { symbol: 'GARAN', name: 'Garanti Bankası', lots: 100, avgCost: 42.5, currentPrice: 48.2, marketValue: 4820, pnl: 570, pnlPercent: 13.41, portfolioWeight: 25.1, aiScore: 78, risk: 'LOW', eliteRating: 'A', opportunityLevel: 'Orta', sector: 'Bankacılık' },
];

describe('PortfolioExport', () => {
  it('renders export button', () => {
    render(<PortfolioExport holdings={mockHoldings} />);
    expect(screen.getByText('CSV Dışa Aktar')).toBeDefined();
  });

  it('disables button when no holdings', () => {
    render(<PortfolioExport holdings={[]} />);
    const btn = screen.getByText('CSV Dışa Aktar');
    expect(btn.hasAttribute('disabled')).toBe(true);
  });

  it('enables button when holdings exist', () => {
    render(<PortfolioExport holdings={mockHoldings} />);
    const btn = screen.getByText('CSV Dışa Aktar');
    expect(btn.hasAttribute('disabled')).toBe(false);
  });
});
