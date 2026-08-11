import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PortfolioHoldingsTable } from '../portfolio-holdings-table';
import { usePortfolioStore } from '@/stores/portfolio-store';
import type { Holding } from '../portfolio-types';

const mockHoldings: Holding[] = [
  { symbol: 'GARAN', name: 'Garanti Bankası', lots: 100, avgCost: 42.5, currentPrice: 48.2, marketValue: 4820, pnl: 570, pnlPercent: 13.41, portfolioWeight: 25.1, aiScore: 78, risk: 'LOW', eliteRating: 'A', opportunityLevel: 'Orta', sector: 'Bankacılık' },
  { symbol: 'ASELS', name: 'Aselsan', lots: 50, avgCost: 62.0, currentPrice: 58.8, marketValue: 2940, pnl: -160, pnlPercent: -5.16, portfolioWeight: 15.3, aiScore: 65, risk: 'MEDIUM', eliteRating: 'BBB', opportunityLevel: 'Düşük', sector: 'Savunma' },
];

describe('PortfolioHoldingsTable', () => {
  beforeEach(() => {
    usePortfolioStore.setState({ search: '', page: 0, sortKey: 'marketValue', sortDir: 'desc', selectedSymbol: null });
  });

  it('returns empty state when no holdings', () => {
    render(<PortfolioHoldingsTable holdings={[]} />);
    expect(screen.getByText('Henüz portföy verisi bulunmuyor')).toBeDefined();
  });

  it('renders title with count', () => {
    render(<PortfolioHoldingsTable holdings={mockHoldings} />);
    expect(screen.getByText('Hisse Senetleri (2)')).toBeDefined();
  });

  it('displays symbols', () => {
    render(<PortfolioHoldingsTable holdings={mockHoldings} />);
    expect(screen.getByText('GARAN')).toBeDefined();
    expect(screen.getByText('ASELS')).toBeDefined();
  });

  it('displays lots', () => {
    render(<PortfolioHoldingsTable holdings={mockHoldings} />);
    expect(screen.getByText('100')).toBeDefined();
    expect(screen.getByText('50')).toBeDefined();
  });

  it('displays column headers', () => {
    render(<PortfolioHoldingsTable holdings={mockHoldings} />);
    const headers = screen.getAllByRole('columnheader');
    expect(headers.length).toBeGreaterThanOrEqual(5);
  });

  it('displays search input', () => {
    render(<PortfolioHoldingsTable holdings={mockHoldings} />);
    expect(screen.getByLabelText('Hisse ara')).toBeDefined();
  });

  it('filters by symbol search', () => {
    render(<PortfolioHoldingsTable holdings={mockHoldings} />);
    const searchInput = screen.getByLabelText('Hisse ara');
    fireEvent.change(searchInput, { target: { value: 'GAR' } });
    expect(screen.getByText('GARAN')).toBeDefined();
    expect(screen.queryByText('ASELS')).toBeNull();
  });

  it('displays pagination when needed', () => {
    const manyHoldings = Array.from({ length: 25 }, (_, i) => ({
      ...mockHoldings[0], symbol: `SYM${i}`, name: `Company ${i}`,
    }));
    const { container } = render(<PortfolioHoldingsTable holdings={manyHoldings} />);
    const text = container.textContent || '';
    expect(text).toContain('Önceki');
    expect(text).toContain('Sonraki');
  });
});
