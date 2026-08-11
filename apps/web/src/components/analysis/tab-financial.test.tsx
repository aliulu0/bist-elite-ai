import { render, screen } from '@testing-library/react';
import { TabFinancial } from './tab-financial';
import { mockAnalysisResult } from './mock-data';

describe('TabFinancial', () => {
  it('renders Finansal Analiz title', () => {
    render(<TabFinancial data={mockAnalysisResult} />);
    expect(screen.getByText('Finansal Analiz')).toBeInTheDocument();
  });

  it('renders financial score', () => {
    render(<TabFinancial data={mockAnalysisResult} />);
    expect(screen.getByText('68')).toBeInTheDocument();
  });

  it('renders financial grade', () => {
    render(<TabFinancial data={mockAnalysisResult} />);
    expect(screen.getByText('B+')).toBeInTheDocument();
  });

  it('renders financial summary', () => {
    render(<TabFinancial data={mockAnalysisResult} />);
    expect(screen.getByText(/Finansal durum genel olarak sağlıklı/)).toBeInTheDocument();
  });

  it('renders financial rules count', () => {
    render(<TabFinancial data={mockAnalysisResult} />);
    expect(screen.getByText('Finansal Kurallar (3)')).toBeInTheDocument();
  });

  it('renders rule names', () => {
    render(<TabFinancial data={mockAnalysisResult} />);
    expect(screen.getByText('Fiyat/Kitap Oranı')).toBeInTheDocument();
    expect(screen.getByText('Borç/Özkaynak')).toBeInTheDocument();
    expect(screen.getByText('Karlılık')).toBeInTheDocument();
  });

  it('renders rule statuses', () => {
    render(<TabFinancial data={mockAnalysisResult} />);
    expect(screen.getAllByText('Geçti').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Uyarı')).toBeInTheDocument();
  });

  it('renders strengths', () => {
    render(<TabFinancial data={mockAnalysisResult} />);
    expect(screen.getByText('Güçlü Yönler')).toBeInTheDocument();
  });

  it('renders weaknesses', () => {
    render(<TabFinancial data={mockAnalysisResult} />);
    expect(screen.getByText('Zayıflıklar')).toBeInTheDocument();
  });

  it('renders risks', () => {
    render(<TabFinancial data={mockAnalysisResult} />);
    expect(screen.getByText('Riskler')).toBeInTheDocument();
  });

  it('renders confidence', () => {
    render(<TabFinancial data={mockAnalysisResult} />);
    expect(screen.getByText('Güven: 78%')).toBeInTheDocument();
  });

  it('renders overall opinion', () => {
    render(<TabFinancial data={mockAnalysisResult} />);
    expect(screen.getByText(/Şirket finansal olarak güçlü/)).toBeInTheDocument();
  });
});
