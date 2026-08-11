import { render, screen } from '@testing-library/react';
import { TabTechnical } from './tab-technical';
import { mockAnalysisResult } from './mock-data';

describe('TabTechnical', () => {
  it('renders Teknik Analiz title', () => {
    render(<TabTechnical data={mockAnalysisResult} />);
    expect(screen.getByText('Teknik Analiz')).toBeInTheDocument();
  });

  it('renders technical score', () => {
    render(<TabTechnical data={mockAnalysisResult} />);
    expect(screen.getByText('73')).toBeInTheDocument();
  });

  it('renders technical grade', () => {
    render(<TabTechnical data={mockAnalysisResult} />);
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('renders technical summary', () => {
    render(<TabTechnical data={mockAnalysisResult} />);
    expect(screen.getByText(/Teknik analiz güçlü/)).toBeInTheDocument();
  });

  it('renders technical rules count', () => {
    render(<TabTechnical data={mockAnalysisResult} />);
    expect(screen.getByText('Teknik Kurallar (3)')).toBeInTheDocument();
  });

  it('renders rule names', () => {
    render(<TabTechnical data={mockAnalysisResult} />);
    expect(screen.getAllByText('EMA_ALIGNMENT').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('RSI_LEVEL').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('MACD_SIGNAL').length).toBeGreaterThanOrEqual(1);
  });

  it('renders rule breakdown', () => {
    render(<TabTechnical data={mockAnalysisResult} />);
    expect(screen.getByText('Kural Katkıları')).toBeInTheDocument();
  });

  it('renders strengths', () => {
    render(<TabTechnical data={mockAnalysisResult} />);
    expect(screen.getByText('Güçlü Yönler')).toBeInTheDocument();
  });

  it('renders weaknesses', () => {
    render(<TabTechnical data={mockAnalysisResult} />);
    expect(screen.getByText('Zayıflıklar')).toBeInTheDocument();
  });

  it('renders recommendations', () => {
    render(<TabTechnical data={mockAnalysisResult} />);
    expect(screen.getByText('Öneriler')).toBeInTheDocument();
  });

  it('renders confidence', () => {
    render(<TabTechnical data={mockAnalysisResult} />);
    expect(screen.getByText('Güven: 85%')).toBeInTheDocument();
  });
});
