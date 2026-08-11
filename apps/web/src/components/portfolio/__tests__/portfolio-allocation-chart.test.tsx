import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PortfolioAllocationChart } from '../portfolio-allocation-chart';

describe('PortfolioAllocationChart', () => {
  it('renders empty state when no data', () => {
    render(<PortfolioAllocationChart data={[]} />);
    expect(screen.getByText('Dağılım verisi yok')).toBeDefined();
  });

  it('renders chart title with data', () => {
    const data = [{ name: 'Bankacılık', value: 5000, percent: 50, color: '#3b82f6' }];
    render(<PortfolioAllocationChart data={data} />);
    expect(screen.getByText('Varlık Dağılımı')).toBeDefined();
  });
});
