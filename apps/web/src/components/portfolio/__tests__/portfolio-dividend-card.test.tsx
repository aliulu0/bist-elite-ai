import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PortfolioDividendCard } from '../portfolio-dividend-card';
import type { DividendInfo } from '../portfolio-types';

describe('PortfolioDividendCard', () => {
  const dividends: DividendInfo = {
    totalReceived: 255, expectedAnnual: 680, yieldPercent: 3.58,
    lastPaymentDate: '2024-03-15', lastPaymentAmount: 210,
    history: [
      { date: '2024-03-15', amount: 210, symbol: 'GARAN' },
      { date: '2024-02-28', amount: 45, symbol: 'THYAO' },
    ],
  };

  it('renders title', () => {
    render(<PortfolioDividendCard dividends={dividends} />);
    expect(screen.getByText('Temettü Bilgisi')).toBeDefined();
  });

  it('displays metric labels', () => {
    render(<PortfolioDividendCard dividends={dividends} />);
    expect(screen.getByText('Toplam Alınan')).toBeDefined();
    expect(screen.getByText('Yıllık Beklenen')).toBeDefined();
    expect(screen.getByText('Verim Oranı')).toBeDefined();
    expect(screen.getByText('Son Ödeme')).toBeDefined();
  });

  it('displays yield percent', () => {
    render(<PortfolioDividendCard dividends={dividends} />);
    expect(screen.getByText('3.58%')).toBeDefined();
  });

  it('displays last payment date', () => {
    render(<PortfolioDividendCard dividends={dividends} />);
    expect(screen.getAllByText('2024-03-15').length).toBeGreaterThanOrEqual(1);
  });

  it('displays history section', () => {
    render(<PortfolioDividendCard dividends={dividends} />);
    expect(screen.getByText('Ödeme Geçmişi')).toBeDefined();
  });

  it('displays history symbols', () => {
    render(<PortfolioDividendCard dividends={dividends} />);
    const garan = screen.getAllByText('GARAN');
    expect(garan.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('THYAO')).toBeDefined();
  });

  it('returns empty state when no data', () => {
    const empty: DividendInfo = { totalReceived: 0, expectedAnnual: 0, yieldPercent: 0, lastPaymentDate: '', lastPaymentAmount: 0, history: [] };
    render(<PortfolioDividendCard dividends={empty} />);
    expect(screen.getByText('Temettü verisi yok')).toBeDefined();
  });
});
