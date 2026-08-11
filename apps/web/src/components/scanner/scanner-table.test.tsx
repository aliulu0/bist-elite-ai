import { render, screen, fireEvent } from '@testing-library/react';
import { ScannerTable } from './scanner-table';
import { useScannerStore } from '@/stores/scanner-store';
import type { ScannerRow } from './scanner-table';

const mockData: ScannerRow[] = [
  { symbol: 'GARAN', name: 'Garanti', sector: 'Bankacılık', eliteScore: 85, opportunityScore: 78, financialScore: 72, technicalScore: 80, smartMoneyScore: 70, totalScore: 78, status: 'TOP_CANDIDATE', rank: 1 },
  { symbol: 'AKBNK', name: 'Akbank', sector: 'Bankacılık', eliteScore: 65, opportunityScore: 55, financialScore: 60, technicalScore: 58, smartMoneyScore: 50, totalScore: 58, status: 'WATCHLIST', rank: 10 },
  { symbol: 'EREGL', name: 'Ereğli', sector: 'Demir-Çelik', eliteScore: 42, opportunityScore: 30, financialScore: 35, technicalScore: 45, smartMoneyScore: 38, totalScore: 38, status: 'REJECTED', rank: 30 },
  { symbol: 'ASELS', name: 'Aselsan', sector: 'Savunma', eliteScore: 90, opportunityScore: 88, financialScore: 85, technicalScore: 92, smartMoneyScore: 87, totalScore: 88, status: 'TOP_CANDIDATE', rank: 2 },
];

beforeEach(() => {
  useScannerStore.setState({ selectedSymbol: null, sortKey: 'score', sortDir: 'desc', columnVisibility: { symbol: true, eliteScore: true, opportunityScore: true, financialScore: true, technicalScore: true, smartMoneyScore: true, totalScore: true, status: true, name: false } });
});

describe('ScannerTable', () => {
  it('renders data', () => {
    render(<ScannerTable data={mockData} />);
    expect(screen.getByText('GARAN')).toBeInTheDocument();
    expect(screen.getByText('AKBNK')).toBeInTheDocument();
    expect(screen.getByText('EREGL')).toBeInTheDocument();
    expect(screen.getByText('ASELS')).toBeInTheDocument();
  });

  it('shows row count', () => {
    render(<ScannerTable data={mockData} />);
    expect(screen.getByText('4 hisse')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<ScannerTable data={mockData} />);
    expect(screen.getByText('Kod')).toBeInTheDocument();
    expect(screen.getByText('Elite')).toBeInTheDocument();
    expect(screen.getByText('Durum')).toBeInTheDocument();
  });

  it('renders status badges', () => {
    render(<ScannerTable data={mockData} />);
    expect(screen.getAllByText('Aday').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('İzleme')).toBeInTheDocument();
    expect(screen.getByText('Red')).toBeInTheDocument();
  });

  it('renders score values', () => {
    render(<ScannerTable data={mockData} />);
    expect(screen.getAllByText('85.0').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('65.0').length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty state', () => {
    render(<ScannerTable data={[]} />);
    expect(screen.getAllByText(/bulunamadı/i).length).toBeGreaterThanOrEqual(1);
  });

  it('shows loading skeleton', () => {
    render(<ScannerTable data={[]} loading={true} />);
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('selects a row on click', () => {
    render(<ScannerTable data={mockData} />);
    fireEvent.click(screen.getByText('GARAN'));
    expect(useScannerStore.getState().selectedSymbol).toBe('GARAN');
  });

  it('deselects on second click', () => {
    render(<ScannerTable data={mockData} />);
    fireEvent.click(screen.getByText('GARAN'));
    expect(useScannerStore.getState().selectedSymbol).toBe('GARAN');
    fireEvent.click(screen.getByText('GARAN'));
    expect(useScannerStore.getState().selectedSymbol).toBeNull();
  });

  it('highlights selected row', () => {
    useScannerStore.setState({ selectedSymbol: 'GARAN' });
    const { container } = render(<ScannerTable data={mockData} />);
    const selectedRow = container.querySelector('[class*="bg-primary"]');
    expect(selectedRow).toBeInTheDocument();
  });

  it('sorts when clicking column header', () => {
    render(<ScannerTable data={mockData} />);
    fireEvent.click(screen.getByText('Elite'));
    expect(useScannerStore.getState().sortKey).toBe('eliteScore');
    expect(useScannerStore.getState().sortDir).toBe('asc');
  });

  it('toggles sort direction on second click', () => {
    useScannerStore.setState({ sortKey: 'eliteScore', sortDir: 'asc' });
    render(<ScannerTable data={mockData} />);
    fireEvent.click(screen.getByText('Elite'));
    expect(useScannerStore.getState().sortDir).toBe('desc');
  });

  it('paginates data', () => {
    const many = Array.from({ length: 25 }, (_, i) => ({
      ...mockData[0],
      symbol: `SYM${i}`,
      eliteScore: 50 + i,
      totalScore: 50 + i,
    }));
    render(<ScannerTable data={many} />);
    expect(screen.getByText('1-20 / 25')).toBeInTheDocument();
  });

  it('navigates pages', () => {
    const many = Array.from({ length: 25 }, (_, i) => ({
      ...mockData[0],
      symbol: `SYM${i}`,
      eliteScore: 50 + i,
      totalScore: 50 + i,
    }));
    render(<ScannerTable data={many} />);
    fireEvent.click(screen.getByLabelText('Sonraki sayfa'));
    expect(screen.getByText('21-25 / 25')).toBeInTheDocument();
  });

  it('opens column toggle', () => {
    render(<ScannerTable data={mockData} />);
    fireEvent.click(screen.getByLabelText('Sütun görünürlüğü'));
    expect(screen.getByText('Şirket')).toBeInTheDocument();
  });
});
