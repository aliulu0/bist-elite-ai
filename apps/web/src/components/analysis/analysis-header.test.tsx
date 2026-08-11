import { render, screen, fireEvent } from '@testing-library/react';
import { AnalysisHeader } from './analysis-header';
import { mockAnalysisResult } from './mock-data';

describe('AnalysisHeader', () => {
  const defaultProps = {
    data: mockAnalysisResult,
    timeframe: '1d',
    onTimeframeChange: vi.fn(),
    onRefresh: vi.fn(),
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders symbol', () => {
    render(<AnalysisHeader {...defaultProps} />);
    expect(screen.getAllByText('GARAN').length).toBeGreaterThanOrEqual(1);
  });

  it('renders timeframe label', () => {
    render(<AnalysisHeader {...defaultProps} />);
    expect(screen.getByText('Günlük')).toBeInTheDocument();
  });

  it('renders timeframe buttons', () => {
    render(<AnalysisHeader {...defaultProps} />);
    expect(screen.getByText('Haftalık')).toBeInTheDocument();
    expect(screen.getByText('Aylık')).toBeInTheDocument();
  });

  it('calls onTimeframeChange when clicking timeframe', () => {
    render(<AnalysisHeader {...defaultProps} />);
    fireEvent.click(screen.getByText('Haftalık'));
    expect(defaultProps.onTimeframeChange).toHaveBeenCalledWith('1w');
  });

  it('calls onRefresh when clicking refresh', () => {
    render(<AnalysisHeader {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Tazele'));
    expect(defaultProps.onRefresh).toHaveBeenCalled();
  });

  it('disables refresh when loading', () => {
    render(<AnalysisHeader {...defaultProps} loading={true} />);
    expect(screen.getByLabelText('Tazele')).toBeDisabled();
  });

  it('shows active timeframe', () => {
    render(<AnalysisHeader {...defaultProps} timeframe="1w" />);
    const weeklyBtn = screen.getByText('Haftalık');
    expect(weeklyBtn.className).toContain('bg-primary');
  });

  it('renders refresh button text', () => {
    render(<AnalysisHeader {...defaultProps} />);
    expect(screen.getByText('Tazele')).toBeInTheDocument();
  });

  it('renders all timeframe buttons', () => {
    render(<AnalysisHeader {...defaultProps} />);
    expect(screen.getByText('Günlük')).toBeInTheDocument();
    expect(screen.getByText('Haftalık')).toBeInTheDocument();
    expect(screen.getByText('Aylık')).toBeInTheDocument();
  });

  it('renders timeframe in header', () => {
    render(<AnalysisHeader {...defaultProps} />);
    expect(screen.getAllByText('1d').length).toBeGreaterThanOrEqual(1);
  });
});
