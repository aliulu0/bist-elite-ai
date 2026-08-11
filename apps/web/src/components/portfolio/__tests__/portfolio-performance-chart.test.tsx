import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PortfolioPerformanceChart } from '../portfolio-performance-chart';

describe('PortfolioPerformanceChart', () => {
  it('renders empty state when no data', () => {
    render(<PortfolioPerformanceChart data={[]} />);
    expect(screen.getByText('Henüz portföy verisi bulunmuyor')).toBeDefined();
  });

  it('renders chart title with data', () => {
    const data = [{ date: '2024-01-01', value: 15000 }, { date: '2024-01-02', value: 15500 }];
    render(<PortfolioPerformanceChart data={data} />);
    expect(screen.getByText('Portföy Değeri')).toBeDefined();
  });

  it('renders container with data', () => {
    const data = [{ date: '2024-01-01', value: 15000 }];
    const { container } = render(<PortfolioPerformanceChart data={data} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeDefined();
  });
});
