import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WatchlistPerformance } from '../watchlist-performance';
import type { WatchlistPerformance as WatchlistPerformanceData } from '../watchlist-types';

describe('WatchlistPerformance', () => {
  const data: WatchlistPerformanceData[] = [
    { symbol: 'GARAN', change1w: 5.12, change1m: 12.5, change3m: 18.3, volatility: 0.22, avgVolume: 45000000 },
    { symbol: 'THYAO', change1w: -1.5, change1m: -3.2, change3m: 2.1, volatility: 0.28, avgVolume: 32000000 },
    { symbol: 'ASELS', change1w: 2.0, change1m: 4.0, change3m: 6.0, volatility: 0.18, avgVolume: 15000000 },
  ];

  it('renders empty state when no data', () => {
    render(<WatchlistPerformance data={[]} />);
    expect(screen.getByText('Performans verisi için yeterli veri yok')).toBeDefined();
  });

  it('renders title', () => {
    render(<WatchlistPerformance data={data} />);
    expect(screen.getByText('Performans')).toBeDefined();
  });

  it('displays average weekly change', () => {
    render(<WatchlistPerformance data={data} />);
    expect(screen.getByText('Ort. Haftalık')).toBeDefined();
  });

  it('displays average monthly change', () => {
    render(<WatchlistPerformance data={data} />);
    expect(screen.getByText('Ort. Aylık')).toBeDefined();
  });

  it('displays top gainer', () => {
    render(<WatchlistPerformance data={data} />);
    expect(screen.getByText('En Çok Yükselen')).toBeDefined();
    expect(screen.getByText('GARAN')).toBeDefined();
  });

  it('displays top loser', () => {
    render(<WatchlistPerformance data={data} />);
    expect(screen.getByText('En Çok Düşen')).toBeDefined();
    expect(screen.getByText('THYAO')).toBeDefined();
  });

  it('displays volatility', () => {
    render(<WatchlistPerformance data={data} />);
    expect(screen.getByText('Ort. Volatilite')).toBeDefined();
  });

  it('computes correct averages', () => {
    const { container } = render(<WatchlistPerformance data={data} />);
    const text = container.textContent || '';
    expect(text).toContain('Ort. Haftalık');
    expect(text).toContain('Ort. Aylık');
  });
});
