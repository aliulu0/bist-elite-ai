import { render, screen, fireEvent } from '@testing-library/react';
import { BacktestTradesTable } from './backtest-trades-table';
import { useBacktestStore } from '@/stores/backtest-store';
import type { BacktestTrade } from './backtest-types';

const mockTrades: BacktestTrade[] = [
  {
    entryIndex: 0, entryTimestamp: '2024-01-01', entryPrice: 50,
    exitIndex: 3, exitTimestamp: '2024-01-04', exitPrice: 55,
    holdingDays: 3, returnPercent: 0.1, returnAbsolute: 5000, exitReason: 'TAKE_PROFIT',
  },
  {
    entryIndex: 5, entryTimestamp: '2024-01-06', entryPrice: 55,
    exitIndex: 8, exitTimestamp: '2024-01-09', exitPrice: 50,
    holdingDays: 7, returnPercent: -0.091, returnAbsolute: -5000, exitReason: 'STOP_LOSS',
  },
  {
    entryIndex: 10, entryTimestamp: '2024-01-11', entryPrice: 50,
    exitIndex: 15, exitTimestamp: '2024-01-16', exitPrice: 52,
    holdingDays: 5, returnPercent: 0.04, returnAbsolute: 2000, exitReason: 'RSI_OVERBOUGHT',
  },
];

describe('BacktestTradesTable', () => {
  beforeEach(() => {
    useBacktestStore.setState({
      sortKey: 'returnPercent', sortDir: 'desc', tradePage: 0, tradesPerPage: 20,
    });
  });

  it('renders trade count', () => {
    render(<BacktestTradesTable trades={mockTrades} />);
    expect(screen.getByText('İşlemler (3)')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<BacktestTradesTable trades={mockTrades} />);
    expect(screen.getByText('Giriş')).toBeInTheDocument();
    expect(screen.getByText('Çıkış')).toBeInTheDocument();
    expect(screen.getByText('Giriş Fiyatı')).toBeInTheDocument();
    expect(screen.getByText('Çıkış Fiyatı')).toBeInTheDocument();
    expect(screen.getAllByText(/Getiri/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Çıkış Nedeni')).toBeInTheDocument();
  });

  it('renders trade data with unique values', () => {
    render(<BacktestTradesTable trades={mockTrades} />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('displays positive return', () => {
    render(<BacktestTradesTable trades={mockTrades} />);
    expect(screen.getAllByText(/\+10\.00%/).length).toBeGreaterThanOrEqual(1);
  });

  it('displays negative return', () => {
    render(<BacktestTradesTable trades={mockTrades} />);
    expect(screen.getAllByText(/-9\.10%/).length).toBeGreaterThanOrEqual(1);
  });

  it('displays exit reasons in Turkish', () => {
    render(<BacktestTradesTable trades={mockTrades} />);
    expect(screen.getByText('Kâr Hedefleme')).toBeInTheDocument();
    expect(screen.getByText('Zarar Durdurma')).toBeInTheDocument();
    expect(screen.getByText('RSI Aşırı Alım')).toBeInTheDocument();
  });

  it('shows empty state when no trades', () => {
    render(<BacktestTradesTable trades={[]} />);
    expect(screen.getByText('İşlemler (0)')).toBeInTheDocument();
    expect(screen.getByText('İşlem bulunamadı')).toBeInTheDocument();
  });

  it('sorts by column when header clicked', () => {
    render(<BacktestTradesTable trades={mockTrades} />);
    fireEvent.click(screen.getByText('Gün'));
    expect(screen.getByText(/Gün ↓/)).toBeInTheDocument();
  });

  it('toggles sort direction on repeated click', () => {
    render(<BacktestTradesTable trades={mockTrades} />);
    const header = screen.getByText('Gün');
    fireEvent.click(header);
    fireEvent.click(header);
    expect(screen.getByText(/Gün ↑/)).toBeInTheDocument();
  });

  it('formats prices with locale', () => {
    render(<BacktestTradesTable trades={mockTrades} />);
    expect(screen.getAllByText(/₺/).length).toBeGreaterThanOrEqual(1);
  });
});
