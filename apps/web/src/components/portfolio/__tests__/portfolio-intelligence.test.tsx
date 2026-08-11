import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PortfolioIntelligence } from '../portfolio-intelligence';

const mockAnalysis = vi.fn();
const mockRefresh = vi.fn();

vi.mock('@/lib/sdk', () => ({
  sdkClient: {
    portfolioIntelligenceAnalysis: () => mockAnalysis(),
    portfolioIntelligenceRefresh: () => mockRefresh(),
  },
}));

const ANALYSIS = {
  success: true,
  timestamp: '',
  data: {
    statusLabel: 'GÜÇLÜ',
    score: 82.5,
    scoreBreakdown: { earlyOpportunity: 0.2, riskInverse: 0.15 },
    risk: {
      totalValue: 21200,
      investedCapital: 18000,
      unrealizedPnl: 3200,
      unrealizedPnlPercent: 17.8,
      maxPositionWeight: 32,
      sectorConcentration: 45,
      diversificationScore: 70,
      portfolioRiskScore: 25,
      portfolioConfidence: 78,
      portfolioOpportunityScore: 75,
      portfolioExpectedReturn: 12.5,
      portfolioDownsideRisk: 5,
      portfolioRiskReward: 1.9,
      warnings: ['Bankacılık sektörü portföyün %45\'ini oluşturuyor.'],
    },
    positions: [
      {
        ticker: 'GARAN', company: 'Garanti Bankası', sector: 'Bankacılık', quantity: 100,
        averageCost: 42.5, currentPrice: 48.2, positionValue: 4820, investedCapital: 4250,
        unrealizedPnl: 570, unrealizedPnlPercent: 13.4, portfolioWeight: 25.1, riskScore: 20,
        eliteScore: 78, earlyOpportunityScore: 72, multiTimeframeScore: 65, confidence: 80,
        expectedReturn: 12, smartMoneyScore: 70, catalystScore: 55, verificationStatus: 'verified',
        status: 'STRONG_HOLD', recommendation: 'Tut', recommendationReason: 'Güçlü',
      },
    ],
    rebalance: [
      {
        ticker: 'THYAO', company: 'Türk Hava Yolları', currentWeight: 28, recommendedMin: 15,
        recommendedMax: 20, status: 'REDUCE_CONCENTRATION', reason: 'Sektör yoğunluğu nedeniyle',
        priority: 'HIGH',
      },
    ],
    scenarios: {
      bull: { expectedPortfolioReturn: 22, mainDrivers: ['Enflasyon düşüşü'], explanation: 'Olumlu' },
      base: { expectedPortfolioReturn: 12, mainDrivers: ['Temkinli'], explanation: 'Beklenen' },
      bear: { expectedPortfolioReturn: -8, mainDrivers: ['Küresel risk'], explanation: 'Olumsuz' },
    },
    opportunities: {
      improvingHoldings: [{ ticker: 'GARAN' }],
      deterioratingHoldings: [],
      newOpportunities: [
        { ticker: 'ASELS', company: 'ASELSAN', earlyOpportunityScore: 88, confidence: 82, expectedReturn: 18 },
      ],
    },
    recommendations: [{ ticker: 'GARAN', text: 'Pozisyon korunabilir.' }],
  },
};

describe('PortfolioIntelligence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAnalysis.mockResolvedValue(ANALYSIS);
  });

  it('renders intelligence score', async () => {
    render(<PortfolioIntelligence />);
    await waitFor(() => expect(screen.getByText('83/100')).toBeDefined());
  });

  it('renders portfolio status label', async () => {
    render(<PortfolioIntelligence />);
    await waitFor(() => expect(screen.getByText('GÜÇLÜ')).toBeDefined());
  });

  it('renders position ticker in holdings table', async () => {
    render(<PortfolioIntelligence />);
    await waitFor(() => expect(screen.getAllByText('GARAN').length).toBeGreaterThan(0));
  });

  it('renders rebalance warning status', async () => {
    render(<PortfolioIntelligence />);
    await waitFor(() => expect(screen.getByText('AZALT')).toBeDefined());
  });

  it('renders scenarios', async () => {
    render(<PortfolioIntelligence />);
    await waitFor(() => expect(screen.getByText('Bull Senaryo')).toBeDefined());
    expect(screen.getByText('Bear Senaryo')).toBeDefined();
  });

  it('renders new opportunities', async () => {
    render(<PortfolioIntelligence />);
    await waitFor(() => expect(screen.getByText('ASELS')).toBeDefined());
  });

  it('renders warnings', async () => {
    render(<PortfolioIntelligence />);
    await waitFor(() => expect(screen.getByText(/Bankacılık sektörü/)).toBeDefined());
  });

  it('shows error state on failure', async () => {
    mockAnalysis.mockRejectedValue(new Error('Network error'));
    render(<PortfolioIntelligence />);
    await waitFor(() =>
      expect(screen.getByText('Portföy zekâsı analizi yüklenirken bir hata oluştu.')).toBeDefined(),
    );
  });
});
