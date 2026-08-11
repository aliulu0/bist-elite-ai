import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PortfolioSectorChart } from '../portfolio-sector-chart';

describe('PortfolioSectorChart', () => {
  it('renders empty state when no data', () => {
    render(<PortfolioSectorChart data={[]} />);
    expect(screen.getByText('Sektör verisi yok')).toBeDefined();
  });

  it('renders chart title with data', () => {
    const data = [{ name: 'Bankacılık', value: 5000, percent: 50, color: '#3b82f6' }];
    render(<PortfolioSectorChart data={data} />);
    expect(screen.getByText('Sektör Dağılımı')).toBeDefined();
  });
});
