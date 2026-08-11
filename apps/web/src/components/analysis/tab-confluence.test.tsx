import { render, screen } from '@testing-library/react';
import { TabConfluence } from './tab-confluence';
import { mockAnalysisResult } from './mock-data';

describe('TabConfluence', () => {
  it('renders Uyum Analizi title', () => {
    render(<TabConfluence data={mockAnalysisResult} />);
    expect(screen.getByText('Uyum Analizi')).toBeInTheDocument();
  });

  it('renders confluence score', () => {
    render(<TabConfluence data={mockAnalysisResult} />);
    expect(screen.getByText('68')).toBeInTheDocument();
  });

  it('renders agreement level', () => {
    render(<TabConfluence data={mockAnalysisResult} />);
    expect(screen.getAllByText('HIGH').length).toBeGreaterThanOrEqual(1);
  });

  it('renders dimension cards', () => {
    render(<TabConfluence data={mockAnalysisResult} />);
    expect(screen.getAllByText('Finansal').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Teknik').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Akıllı Para').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Trend').length).toBeGreaterThanOrEqual(1);
  });

  it('renders dimension scores', () => {
    render(<TabConfluence data={mockAnalysisResult} />);
    expect(screen.getByText('Skor: 80.0')).toBeInTheDocument();
    expect(screen.getByText('Skor: 75.0')).toBeInTheDocument();
    expect(screen.getByText('Skor: 60.0')).toBeInTheDocument();
    expect(screen.getByText('Skor: 70.0')).toBeInTheDocument();
  });

  it('renders confidence', () => {
    render(<TabConfluence data={mockAnalysisResult} />);
    expect(screen.getByText('Güven: 82%')).toBeInTheDocument();
  });

  it('renders direction badges', () => {
    render(<TabConfluence data={mockAnalysisResult} />);
    const bullishBadges = screen.getAllByText('Yükseliş');
    expect(bullishBadges.length).toBeGreaterThanOrEqual(4);
  });

  it('renders factors', () => {
    render(<TabConfluence data={mockAnalysisResult} />);
    expect(screen.getByText('• Sağlıklı karlılık')).toBeInTheDocument();
  });

  it('renders Boyut Uyumu', () => {
    render(<TabConfluence data={mockAnalysisResult} />);
    expect(screen.getByText('Boyut Uyumu')).toBeInTheDocument();
  });

  it('renders Uyum Skoru card', () => {
    render(<TabConfluence data={mockAnalysisResult} />);
    expect(screen.getByText('Uyum Skoru')).toBeInTheDocument();
  });
});
