import { render, screen } from '@testing-library/react';
import { ScannerKpi } from './scanner-kpi';
import type { ScannerRow } from './scanner-table';

const mockData: ScannerRow[] = [
  { symbol: 'GARAN', name: '', sector: '', eliteScore: 85, opportunityScore: 0, financialScore: 0, technicalScore: 0, smartMoneyScore: 0, totalScore: 0, status: 'TOP_CANDIDATE' },
  { symbol: 'AKBNK', name: '', sector: '', eliteScore: 65, opportunityScore: 0, financialScore: 0, technicalScore: 0, smartMoneyScore: 0, totalScore: 0, status: 'WATCHLIST' },
  { symbol: 'EREGL', name: '', sector: '', eliteScore: 42, opportunityScore: 0, financialScore: 0, technicalScore: 0, smartMoneyScore: 0, totalScore: 0, status: 'REJECTED' },
  { symbol: 'ASELS', name: '', sector: '', eliteScore: 90, opportunityScore: 0, financialScore: 0, technicalScore: 0, smartMoneyScore: 0, totalScore: 0, status: 'TOP_CANDIDATE' },
];

describe('ScannerKpi', () => {
  it('renders all KPI labels', () => {
    render(<ScannerKpi data={mockData} />);
    expect(screen.getByText('Toplam Taranan')).toBeInTheDocument();
    expect(screen.getByText('Filtrelenen')).toBeInTheDocument();
    expect(screen.getByText('AAA')).toBeInTheDocument();
    expect(screen.getByText('İzleme Listesi')).toBeInTheDocument();
    expect(screen.getByText('Reddedilen')).toBeInTheDocument();
  });

  it('counts total', () => {
    render(<ScannerKpi data={mockData} />);
    const totalElements = screen.getAllByText('4');
    expect(totalElements.length).toBeGreaterThanOrEqual(2);
  });

  it('counts AAA (elite >= 80)', () => {
    render(<ScannerKpi data={mockData} />);
    const aaaElements = screen.getAllByText('2');
    expect(aaaElements.length).toBeGreaterThanOrEqual(1);
  });

  it('shows loading', () => {
    render(<ScannerKpi data={[]} loading={true} />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('handles empty data', () => {
    render(<ScannerKpi data={[]} />);
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(1);
  });

  it('counts mixed statuses correctly', () => {
    const data: ScannerRow[] = [
      { ...mockData[0], status: 'WATCHLIST' },
      { ...mockData[1], status: 'WATCHLIST' },
      { ...mockData[2], status: 'REJECTED' },
    ];
    render(<ScannerKpi data={data} />);
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
  });

  it('shows 5 KPI cards', () => {
    render(<ScannerKpi data={mockData} />);
    expect(screen.getAllByText('Toplam Taranan').length).toBe(1);
    expect(screen.getAllByText('Filtrelenen').length).toBe(1);
    expect(screen.getAllByText('AAA').length).toBe(1);
    expect(screen.getAllByText('İzleme Listesi').length).toBe(1);
    expect(screen.getAllByText('Reddedilen').length).toBe(1);
  });
});
