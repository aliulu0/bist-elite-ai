import { render, screen } from '@testing-library/react';
import { TabGeneral } from './tab-general';
import { mockAnalysisResult } from './mock-data';

describe('TabGeneral', () => {
  it('renders Genel Bakış title', () => {
    render(<TabGeneral data={mockAnalysisResult} />);
    expect(screen.getByText('Genel Bakış')).toBeInTheDocument();
  });

  it('renders Elite Skor Dağılımı', () => {
    render(<TabGeneral data={mockAnalysisResult} />);
    expect(screen.getByText('Elite Skor Dağılımı')).toBeInTheDocument();
  });

  it('renders score breakdown labels', () => {
    render(<TabGeneral data={mockAnalysisResult} />);
    expect(screen.getAllByText(/Finansal/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Teknik/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Fırsat/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders summary card', () => {
    render(<TabGeneral data={mockAnalysisResult} />);
    expect(screen.getByText('Özet')).toBeInTheDocument();
  });

  it('renders elite summary', () => {
    render(<TabGeneral data={mockAnalysisResult} />);
    expect(screen.getByText(/GARAN güçlü/)).toBeInTheDocument();
  });

  it('renders strengths card', () => {
    render(<TabGeneral data={mockAnalysisResult} />);
    expect(screen.getByText('Güçlü Yönler')).toBeInTheDocument();
  });

  it('renders weaknesses card', () => {
    render(<TabGeneral data={mockAnalysisResult} />);
    expect(screen.getByText('Zayıflıklar')).toBeInTheDocument();
  });

  it('renders pipeline steps', () => {
    render(<TabGeneral data={mockAnalysisResult} />);
    expect(screen.getByText('Pipeline Adımları')).toBeInTheDocument();
    expect(screen.getByText('indicators')).toBeInTheDocument();
  });

  it('renders pipeline step status', () => {
    render(<TabGeneral data={mockAnalysisResult} />);
    expect(screen.getAllByText('Başarılı').length).toBeGreaterThanOrEqual(1);
  });

  it('renders financial opinion', () => {
    render(<TabGeneral data={mockAnalysisResult} />);
    expect(screen.getByText('Finansal Görüş')).toBeInTheDocument();
  });

  it('renders technical opinion', () => {
    render(<TabGeneral data={mockAnalysisResult} />);
    expect(screen.getByText('Teknik Görüş')).toBeInTheDocument();
  });

  it('handles empty data', () => {
    const emptyData = { ...mockAnalysisResult, pipelineSteps: [], eliteScore: undefined, technicalSummary: undefined, financialSummary: undefined } as never;
    render(<TabGeneral data={emptyData} />);
    expect(screen.getByText('Pipeline adımı bulunamadı')).toBeInTheDocument();
  });
});
