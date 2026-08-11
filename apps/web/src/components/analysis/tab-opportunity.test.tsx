import { render, screen } from '@testing-library/react';
import { TabOpportunity } from './tab-opportunity';
import { mockAnalysisResult } from './mock-data';

describe('TabOpportunity', () => {
  it('renders Fırsat Analizi title', () => {
    render(<TabOpportunity data={mockAnalysisResult} />);
    expect(screen.getByText('Fırsat Analizi')).toBeInTheDocument();
  });

  it('renders opportunity score', () => {
    render(<TabOpportunity data={mockAnalysisResult} />);
    expect(screen.getAllByText('75').length).toBeGreaterThanOrEqual(1);
  });

  it('renders opportunity level', () => {
    render(<TabOpportunity data={mockAnalysisResult} />);
    expect(screen.getAllByText('HIGH').length).toBeGreaterThanOrEqual(1);
  });

  it('renders early opportunity badge', () => {
    render(<TabOpportunity data={mockAnalysisResult} />);
    expect(screen.getByText('Erken Fırsat')).toBeInTheDocument();
  });

  it('renders confidence', () => {
    render(<TabOpportunity data={mockAnalysisResult} />);
    expect(screen.getByText('Güven: 80%')).toBeInTheDocument();
  });

  it('renders reasons', () => {
    render(<TabOpportunity data={mockAnalysisResult} />);
    expect(screen.getByText('Nedenler')).toBeInTheDocument();
    expect(screen.getByText('Yükseliş trendi devam ediyor')).toBeInTheDocument();
  });

  it('renders strengths', () => {
    render(<TabOpportunity data={mockAnalysisResult} />);
    expect(screen.getByText('Güçlü Yönler')).toBeInTheDocument();
    expect(screen.getByText('Güçlü temeller')).toBeInTheDocument();
  });

  it('renders risk factors', () => {
    render(<TabOpportunity data={mockAnalysisResult} />);
    expect(screen.getByText('Risk Faktörleri')).toBeInTheDocument();
    expect(screen.getByText('Piyasa dalgalanması')).toBeInTheDocument();
  });

  it('renders score comparison', () => {
    render(<TabOpportunity data={mockAnalysisResult} />);
    expect(screen.getByText('Skor Karşılaştırması')).toBeInTheDocument();
  });

  it('renders all dimension scores', () => {
    render(<TabOpportunity data={mockAnalysisResult} />);
    expect(screen.getByText('Elite')).toBeInTheDocument();
    expect(screen.getAllByText('Finansal').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Teknik').length).toBeGreaterThanOrEqual(1);
  });
});
