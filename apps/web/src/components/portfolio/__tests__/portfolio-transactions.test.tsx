import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PortfolioTransactions } from '../portfolio-transactions';
import type { Transaction } from '../portfolio-types';

describe('PortfolioTransactions', () => {
  const transactions: Transaction[] = [
    { id: '1', date: '2024-01-15', type: 'BUY', symbol: 'GARAN', lots: 100, price: 42.5, amount: 4250, notes: 'Alım notu' },
    { id: '2', date: '2024-03-15', type: 'DIVIDEND', symbol: 'THYAO', lots: 0, price: 0, amount: 210, notes: 'Temettü notu' },
    { id: '3', date: '2024-02-01', type: 'SELL', symbol: 'ASELS', lots: 20, price: 65.0, amount: 1300, notes: 'Satış notu' },
  ];

  it('renders empty state when no transactions', () => {
    render(<PortfolioTransactions transactions={[]} />);
    expect(screen.getByText('İşlem geçmişi boş')).toBeDefined();
  });

  it('renders title with count', () => {
    render(<PortfolioTransactions transactions={transactions} />);
    expect(screen.getByText('İşlem Geçmişi (3)')).toBeDefined();
  });

  it('displays all symbols using getAllByText', () => {
    render(<PortfolioTransactions transactions={transactions} />);
    expect(screen.getAllByText('GARAN').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('ASELS').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('THYAO').length).toBeGreaterThanOrEqual(1);
  });

  it('displays notes', () => {
    render(<PortfolioTransactions transactions={transactions} />);
    expect(screen.getByText('Alım notu')).toBeDefined();
    expect(screen.getByText('Temettü notu')).toBeDefined();
    expect(screen.getByText('Satış notu')).toBeDefined();
  });

  it('displays amounts via text content', () => {
    const { container } = render(<PortfolioTransactions transactions={transactions} />);
    const text = container.textContent || '';
    expect(text).toContain('4.250');
    expect(text).toContain('1.300');
  });

  it('displays BUY type label', () => {
    render(<PortfolioTransactions transactions={transactions} />);
    expect(screen.getAllByText('Alış').length).toBeGreaterThanOrEqual(1);
  });

  it('displays SELL type label', () => {
    render(<PortfolioTransactions transactions={transactions} />);
    expect(screen.getAllByText('Satış').length).toBeGreaterThanOrEqual(1);
  });
});
