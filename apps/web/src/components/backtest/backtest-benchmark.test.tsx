import { render, screen } from '@testing-library/react';
import { BacktestBenchmark } from './backtest-benchmark';
import type { BenchmarkResult } from './backtest-types';

const mockBenchmark: BenchmarkResult = {
  strategyReturn: 0.284,
  benchmarkReturn: 0.15,
  sectorReturn: 0.12,
  alpha: 0.085,
  beta: 0.85,
  trackingError: 0.05,
  informationRatio: 1.7,
  captureRatio: 1.15,
  excessReturn: 0.134,
  metadata: {},
  isValid: true,
};

describe('BacktestBenchmark', () => {
  it('renders title', () => {
    render(<BacktestBenchmark benchmark={mockBenchmark} />);
    expect(screen.getByText('Benchmark Karşılaştırması')).toBeInTheDocument();
  });

  it('displays alpha', () => {
    render(<BacktestBenchmark benchmark={mockBenchmark} />);
    expect(screen.getByText('0.0850')).toBeInTheDocument();
  });

  it('displays beta', () => {
    render(<BacktestBenchmark benchmark={mockBenchmark} />);
    expect(screen.getByText('0.8500')).toBeInTheDocument();
  });

  it('displays tracking error as percentage', () => {
    render(<BacktestBenchmark benchmark={mockBenchmark} />);
    expect(screen.getByText('5.00%')).toBeInTheDocument();
  });

  it('displays information ratio', () => {
    render(<BacktestBenchmark benchmark={mockBenchmark} />);
    expect(screen.getByText('1.7000')).toBeInTheDocument();
  });

  it('displays capture ratio', () => {
    render(<BacktestBenchmark benchmark={mockBenchmark} />);
    expect(screen.getByText('1.1500')).toBeInTheDocument();
  });

  it('displays excess return as percentage', () => {
    render(<BacktestBenchmark benchmark={mockBenchmark} />);
    expect(screen.getByText('13.40%')).toBeInTheDocument();
  });

  it('displays strategy return', () => {
    render(<BacktestBenchmark benchmark={mockBenchmark} />);
    expect(screen.getByText('28.40%')).toBeInTheDocument();
  });

  it('displays benchmark return', () => {
    render(<BacktestBenchmark benchmark={mockBenchmark} />);
    expect(screen.getByText('15.00%')).toBeInTheDocument();
  });

  it('displays sector return', () => {
    render(<BacktestBenchmark benchmark={mockBenchmark} />);
    expect(screen.getByText('12.00%')).toBeInTheDocument();
  });

  it('renders all metric labels', () => {
    render(<BacktestBenchmark benchmark={mockBenchmark} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Takip Hatası')).toBeInTheDocument();
    expect(screen.getByText('Bilgi Oranı')).toBeInTheDocument();
    expect(screen.getByText('Yakalama Oranı')).toBeInTheDocument();
    expect(screen.getByText('Fazla Getiri')).toBeInTheDocument();
  });
});
