import { render, screen, fireEvent } from '@testing-library/react';
import { ScannerFilters } from './scanner-filters';
import { useScannerStore } from '@/stores/scanner-store';

beforeEach(() => {
  useScannerStore.setState({
    leftPanelOpen: true,
    filters: {
      sector: '', eliteScore: {}, opportunityScore: {}, financialScore: {},
      technicalScore: {}, smartMoneyScore: {}, pdRatio: {}, pbRatio: {},
      fdFavok: {}, netIncomeGrowth: {}, volume: {}, liquidity: {},
      beta: {}, dividendYield: {}, marketCap: {}, status: 'all',
    },
  });
});

describe('ScannerFilters', () => {
  it('renders title', () => {
    render(<ScannerFilters />);
    expect(screen.getByText('Filtreler')).toBeInTheDocument();
  });

  it('renders sector select', () => {
    render(<ScannerFilters />);
    expect(screen.getByLabelText('Sektör filtresi')).toBeInTheDocument();
  });

  it('renders status filter chips', () => {
    render(<ScannerFilters />);
    expect(screen.getByText('Tümü')).toBeInTheDocument();
    expect(screen.getByText('Aday')).toBeInTheDocument();
    expect(screen.getByText('İzleme')).toBeInTheDocument();
    expect(screen.getByText('Red')).toBeInTheDocument();
  });

  it('renders score filters', () => {
    render(<ScannerFilters />);
    expect(screen.getByText('Elite Skoru')).toBeInTheDocument();
    expect(screen.getByText('Fırsat')).toBeInTheDocument();
    expect(screen.getByText('Finansal')).toBeInTheDocument();
    expect(screen.getByText('Teknik')).toBeInTheDocument();
    expect(screen.getByText('Akıllı Para')).toBeInTheDocument();
  });

  it('renders multiplier filters', () => {
    render(<ScannerFilters />);
    expect(screen.getByText('PD/DD')).toBeInTheDocument();
    expect(screen.getByText('FD/FAVÖK')).toBeInTheDocument();
  });

  it('renders technical filters', () => {
    render(<ScannerFilters />);
    expect(screen.getByText('Hacim')).toBeInTheDocument();
    expect(screen.getByText('Likidite')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('returns null when panel closed', () => {
    useScannerStore.setState({ leftPanelOpen: false });
    const { container } = render(<ScannerFilters />);
    expect(container.innerHTML).toBe('');
  });

  it('changes sector filter', () => {
    render(<ScannerFilters />);
    const select = screen.getByLabelText('Sektör filtresi');
    fireEvent.change(select, { target: { value: 'Bankacılık' } });
    expect(useScannerStore.getState().filters.sector).toBe('Bankacılık');
  });

  it('changes status filter', () => {
    render(<ScannerFilters />);
    fireEvent.click(screen.getByText('Aday'));
    expect(useScannerStore.getState().filters.status).toBe('TOP_CANDIDATE');
  });

  it('sets range filter min', () => {
    render(<ScannerFilters />);
    const minInput = screen.getByLabelText('Elite Skoru minimum');
    fireEvent.change(minInput, { target: { value: '50' } });
    expect(useScannerStore.getState().filters.eliteScore.min).toBe(50);
  });

  it('sets range filter max', () => {
    render(<ScannerFilters />);
    const maxInput = screen.getByLabelText('Elite Skoru maksimum');
    fireEvent.change(maxInput, { target: { value: '90' } });
    expect(useScannerStore.getState().filters.eliteScore.max).toBe(90);
  });

  it('resets filters', () => {
    useScannerStore.setState({ filters: { ...useScannerStore.getState().filters, sector: 'Bankacılık', status: 'TOP_CANDIDATE' } });
    render(<ScannerFilters />);
    fireEvent.click(screen.getByLabelText('Filtreleri sıfırla'));
    expect(useScannerStore.getState().filters.sector).toBe('');
    expect(useScannerStore.getState().filters.status).toBe('all');
  });
});
