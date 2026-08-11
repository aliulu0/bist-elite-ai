import { render, screen } from '@testing-library/react';
import { TabBacktest } from './tab-backtest';
import { mockAnalysisResult } from './mock-data';

describe('TabBacktest', () => {
  it('renders Backtest Analizi title', () => {
    render(<TabBacktest data={mockAnalysisResult} />);
    expect(screen.getByText('Backtest Analizi')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<TabBacktest data={mockAnalysisResult} />);
    expect(screen.getByText('Backtest verisi mevcut değil')).toBeInTheDocument();
  });

  it('renders empty state description', () => {
    render(<TabBacktest data={mockAnalysisResult} />);
    expect(screen.getByText(/Bu hisse için henüz backtest çalıştırılmamış/)).toBeInTheDocument();
  });

  it('renders metric cards', () => {
    render(<TabBacktest data={mockAnalysisResult} />);
    expect(screen.getByText('Kazanma Oranı')).toBeInTheDocument();
    expect(screen.getByText('Sharpe')).toBeInTheDocument();
    expect(screen.getByText('Maks. Düşüş')).toBeInTheDocument();
    expect(screen.getByText('Kâr Faktörü')).toBeInTheDocument();
  });

  it('renders placeholder chart', () => {
    render(<TabBacktest data={mockAnalysisResult} />);
    expect(screen.getByText('Geçmiş Performans')).toBeInTheDocument();
  });

  it('renders chart placeholder text', () => {
    render(<TabBacktest data={mockAnalysisResult} />);
    expect(screen.getByText(/Performans grafiği backtest çalıştırıldığında/)).toBeInTheDocument();
  });

  it('renders metric dash values', () => {
    render(<TabBacktest data={mockAnalysisResult} />);
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBe(4);
  });
});
