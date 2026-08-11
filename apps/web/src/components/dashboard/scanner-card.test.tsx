import { render, screen } from '@testing-library/react';
import { ScannerCard } from './scanner-card';
import type { ScannerResult } from './scanner-card';

const mockResults: ScannerResult[] = [
  { symbol: 'GARAN', score: 92.5, rank: 1 },
  { symbol: 'AKBNK', score: 85.3, rank: 2 },
  { symbol: 'EREGL', score: 78.1, rank: 3 },
  { symbol: 'ASELS', score: 65.4, rank: 8 },
];

describe('ScannerCard', () => {
  it('renders title', () => {
    render(<ScannerCard results={[]} />);
    expect(screen.getByText('Piyasa Tarama')).toBeInTheDocument();
  });

  it('renders results', () => {
    render(<ScannerCard results={mockResults} />);
    expect(screen.getByText('GARAN')).toBeInTheDocument();
    expect(screen.getByText('AKBNK')).toBeInTheDocument();
    expect(screen.getByText('EREGL')).toBeInTheDocument();
  });

  it('renders total count', () => {
    render(<ScannerCard results={mockResults} total={100} />);
    expect(screen.getByText('100 hisse tarandı')).toBeInTheDocument();
  });

  it('shows empty message', () => {
    render(<ScannerCard results={[]} />);
    expect(screen.getByText('Tarama sonucu bulunamadı')).toBeInTheDocument();
  });

  it('shows loading', () => {
    render(<ScannerCard results={[]} loading={true} />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error', () => {
    render(<ScannerCard results={[]} error="Hata" />);
    expect(screen.getByText('Hata')).toBeInTheDocument();
  });

  it('renders scores', () => {
    render(<ScannerCard results={mockResults} />);
    expect(screen.getByText('92.5')).toBeInTheDocument();
    expect(screen.getByText('85.3')).toBeInTheDocument();
  });

  it('renders rank badges', () => {
    render(<ScannerCard results={mockResults} />);
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<ScannerCard results={mockResults} />);
    expect(screen.getByText('Sıra')).toBeInTheDocument();
    expect(screen.getByText('Hisse')).toBeInTheDocument();
  });

  it('limits to 10 results', () => {
    const many = Array.from({ length: 15 }, (_, i) => ({ symbol: `S${i}`, score: 50, rank: i + 1 }));
    render(<ScannerCard results={many} />);
    expect(screen.getByText('S0')).toBeInTheDocument();
    expect(screen.queryByText('S10')).not.toBeInTheDocument();
  });
});
