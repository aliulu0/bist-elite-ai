import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AnalysisPage from './analysis';
import { useAnalysisStore } from '@/stores/analysis-store';

vi.mock('@/lib/sdk', () => ({
  sdkClient: {
    analysis: vi.fn().mockResolvedValue({
      symbol: 'GARAN',
      timeframe: '1d',
      indicators: {},
      marketStructure: {},
      smartMoney: {
        timeframe: '1d',
        accumulationScore: 0.72,
        distributionScore: 0.28,
        institutionalActivity: 'accumulating',
        smartMoneyConfidence: 0.65,
        trendAlignment: 'bullish',
        signals: [],
        isValid: true,
      },
      technicalRules: { rules: [], isValid: true },
      technicalScore: { score: 72, grade: 'B', confidence: 0.85, ruleBreakdown: [] },
      technicalSummary: { summary: 'Test summary', overallOpinion: 'Test opinion', strengths: [], weaknesses: [], risks: [], recommendations: [] },
      financialRules: { rules: [] },
      financialScore: { score: 68, grade: 'B+', confidence: 0.78 },
      financialSummary: { summary: 'Financial summary', overallOpinion: 'Financial opinion', strengths: [], weaknesses: [], risks: [] },
      confluence: { confluenceScore: 68, agreement: 'HIGH', financialAlignment: { score: 80, direction: 'bullish', confidence: 0.9, factors: [] }, technicalAlignment: { score: 75, direction: 'bullish', confidence: 0.85, factors: [] }, smartMoneyAlignment: { score: 60, direction: 'bullish', confidence: 0.7, factors: [] }, trendAlignment: { score: 70, direction: 'bullish', confidence: 0.8, factors: [] }, confidence: 0.82 },
      opportunity: { opportunityScore: 75, earlyOpportunity: true, opportunityLevel: 'HIGH', confidence: 0.8, strengths: [], riskFactors: [], reasons: [] },
      eliteScore: { eliteScore: 82, rating: 'AA', priority: 'HIGH', confidence: 0.85, earlyOpportunity: true, summary: 'Elite summary', breakdown: { financial: { score: 85, weight: 30, contribution: 25.5 }, technical: { score: 72, weight: 25, contribution: 18 }, opportunity: { score: 75, weight: 20, contribution: 15 }, confluence: { score: 68, weight: 15, contribution: 10.2 }, candidate: { score: 80, weight: 10, contribution: 8 } } },
      pipelineSteps: [],
      metadata: { totalDurationMs: 100, stepsCompleted: 5, stepsSuccessful: 5 },
      timestamp: '2025-01-15',
    }),
  },
}));

const renderPage = () =>
  render(
    <BrowserRouter>
      <AnalysisPage />
    </BrowserRouter>,
  );

describe('AnalysisPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalysisStore.setState({ symbol: '', timeframe: '1d', activeTab: 'genel', searchInput: '' });
  });

  it('renders page title', () => {
    renderPage();
    expect(screen.getByText('Hisse Analiz')).toBeInTheDocument();
  });

  it('renders page description', () => {
    renderPage();
    expect(screen.getByText(/Kapsamlı hisse analizi/)).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderPage();
    expect(screen.getByLabelText('Hisse kodu')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    renderPage();
    expect(screen.getByText('Analiz Et')).toBeInTheDocument();
  });

  it('renders empty state initially', () => {
    renderPage();
    expect(screen.getByText('Hisse analizi başlatın')).toBeInTheDocument();
  });

  it('runs analysis on submit', async () => {
    const sdk = await import('@/lib/sdk');
    renderPage();
    fireEvent.change(screen.getByLabelText('Hisse kodu'), { target: { value: 'GARAN' } });
    fireEvent.click(screen.getByText('Analiz Et'));
    await waitFor(() => {
      expect(sdk.sdkClient.analysis).toHaveBeenCalledWith('GARAN', '1d');
    });
  });

  it('shows analysis results after submit', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('Hisse kodu'), { target: { value: 'GARAN' } });
    fireEvent.click(screen.getByText('Analiz Et'));
    await waitFor(() => {
      expect(screen.getAllByText('GARAN').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows Elite Derece after analysis', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('Hisse kodu'), { target: { value: 'GARAN' } });
    fireEvent.click(screen.getByText('Analiz Et'));
    await waitFor(() => {
      expect(screen.getByText('Elite Derece')).toBeInTheDocument();
    });
  });

  it('shows tabs after analysis', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('Hisse kodu'), { target: { value: 'GARAN' } });
    fireEvent.click(screen.getByText('Analiz Et'));
    await waitFor(() => {
      expect(screen.getByText('Genel')).toBeInTheDocument();
    });
    expect(screen.getAllByText('Finansal').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Teknik').length).toBeGreaterThanOrEqual(1);
  });

  it('handles analysis error', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.analysis).mockRejectedValueOnce(new Error('fail'));
    renderPage();
    fireEvent.change(screen.getByLabelText('Hisse kodu'), { target: { value: 'GARAN' } });
    fireEvent.click(screen.getByText('Analiz Et'));
    await waitFor(() => {
      expect(screen.getByText(/analiz edilirken hata oluştu/)).toBeInTheDocument();
    });
  });

  it('disables submit when input is empty', () => {
    renderPage();
    expect(screen.getByText('Analiz Et')).toBeDisabled();
  });

  it('enables submit when input has value', () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('Hisse kodu'), { target: { value: 'GARAN' } });
    expect(screen.getByText('Analiz Et')).not.toBeDisabled();
  });
});
