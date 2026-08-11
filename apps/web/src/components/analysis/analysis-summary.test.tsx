import { render, screen } from '@testing-library/react';
import { AnalysisSummary } from './analysis-summary';
import { mockAnalysisResult } from './mock-data';

describe('AnalysisSummary', () => {
  it('renders Elite Derece', () => {
    render(<AnalysisSummary data={mockAnalysisResult} />);
    expect(screen.getByText('Elite Derece')).toBeInTheDocument();
  });

  it('renders Fırsat', () => {
    render(<AnalysisSummary data={mockAnalysisResult} />);
    expect(screen.getByText('Fırsat')).toBeInTheDocument();
  });

  it('renders Güven', () => {
    render(<AnalysisSummary data={mockAnalysisResult} />);
    expect(screen.getByText('Güven')).toBeInTheDocument();
  });

  it('renders Öncelik', () => {
    render(<AnalysisSummary data={mockAnalysisResult} />);
    expect(screen.getByText('Öncelik')).toBeInTheDocument();
  });

  it('renders Risk', () => {
    render(<AnalysisSummary data={mockAnalysisResult} />);
    expect(screen.getByText('Risk')).toBeInTheDocument();
  });

  it('renders rating value', () => {
    render(<AnalysisSummary data={mockAnalysisResult} />);
    expect(screen.getAllByText('AA').length).toBeGreaterThanOrEqual(1);
  });

  it('renders priority value', () => {
    render(<AnalysisSummary data={mockAnalysisResult} />);
    expect(screen.getAllByText('HIGH').length).toBeGreaterThanOrEqual(1);
  });

  it('renders opportunity score', () => {
    render(<AnalysisSummary data={mockAnalysisResult} />);
    expect(screen.getAllByText('75').length).toBeGreaterThanOrEqual(1);
  });

  it('renders confidence percentage', () => {
    render(<AnalysisSummary data={mockAnalysisResult} />);
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('renders 5 summary cards', () => {
    render(<AnalysisSummary data={mockAnalysisResult} />);
    expect(screen.getByText('Elite Derece')).toBeInTheDocument();
    expect(screen.getByText('Fırsat')).toBeInTheDocument();
    expect(screen.getByText('Güven')).toBeInTheDocument();
    expect(screen.getByText('Öncelik')).toBeInTheDocument();
    expect(screen.getByText('Risk')).toBeInTheDocument();
  });

  it('handles missing data gracefully', () => {
    const emptyData = { ...mockAnalysisResult, eliteScore: undefined, opportunity: undefined } as never;
    render(<AnalysisSummary data={emptyData} />);
    expect(screen.getByText('Elite Derece')).toBeInTheDocument();
  });
});
