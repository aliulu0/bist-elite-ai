import { render, screen, fireEvent } from '@testing-library/react';
import { AnalysisTabs } from './analysis-tabs';
import { ANALYSIS_TABS } from '@/stores/analysis-store';

describe('AnalysisTabs', () => {
  const mockOnTabChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all tab labels', () => {
    render(<AnalysisTabs activeTab="genel" onTabChange={mockOnTabChange}><div /></AnalysisTabs>);
    ANALYSIS_TABS.forEach((tab) => {
      expect(screen.getByText(tab.label)).toBeInTheDocument();
    });
  });

  it('calls onTabChange when clicking a tab', () => {
    render(<AnalysisTabs activeTab="genel" onTabChange={mockOnTabChange}><div /></AnalysisTabs>);
    fireEvent.click(screen.getByText('Finansal'));
    expect(mockOnTabChange).toHaveBeenCalledWith('finansal');
  });

  it('highlights active tab', () => {
    render(<AnalysisTabs activeTab="teknik" onTabChange={mockOnTabChange}><div /></AnalysisTabs>);
    const activeBtn = screen.getByText('Teknik');
    expect(activeBtn.className).toContain('border-primary');
  });

  it('renders children', () => {
    render(<AnalysisTabs activeTab="genel" onTabChange={mockOnTabChange}><div>Tab content</div></AnalysisTabs>);
    expect(screen.getByText('Tab content')).toBeInTheDocument();
  });

  it('renders 8 tabs', () => {
    render(<AnalysisTabs activeTab="genel" onTabChange={mockOnTabChange}><div /></AnalysisTabs>);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(8);
  });

  it('switches active tab on click', () => {
    render(<AnalysisTabs activeTab="genel" onTabChange={mockOnTabChange}><div /></AnalysisTabs>);
    fireEvent.click(screen.getByText('Akıllı Para'));
    expect(mockOnTabChange).toHaveBeenCalledWith('smart-money');
  });

  it('renders backtest tab', () => {
    render(<AnalysisTabs activeTab="genel" onTabChange={mockOnTabChange}><div /></AnalysisTabs>);
    expect(screen.getByText('Geri Test')).toBeInTheDocument();
  });

  it('renders workflow tab', () => {
    render(<AnalysisTabs activeTab="genel" onTabChange={mockOnTabChange}><div /></AnalysisTabs>);
    expect(screen.getByText('İş Akışı')).toBeInTheDocument();
  });
});
