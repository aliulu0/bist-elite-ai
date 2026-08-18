import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DailyScanPage from '../daily-scan';

const mocks = vi.hoisted(() => {
  const summary = {
    scanId: 'scan-1',
    timestamp: '2026-01-01T00:00:00.000Z',
    status: 'COMPLETE',
    universeSize: 500,
    equityCount: 480,
    evaluatedCount: 460,
    availableCount: 440,
    unavailableCount: 20,
    rateLimitedCount: 0,
    failedCount: 0,
    signalCount: 2,
    eligibleCount: 10,
    top10: [
      {
        symbol: 'THYAO',
        currentPrice: 300,
        eliteScore: 85,
        financialScore: 80,
        technicalScore: 70,
        confluenceScore: 75,
        smartMoneyScore: 0,
        marketStructureScore: 65,
        multiTimeframeConfluence: 'STRONG',
        multiTimeframeScore: 82,
        earlyOpportunityClassification: 'LEGACY_OPPORTUNITY',
        scannerSignalQuality: 'GOOD',
        marketRegime: 'BULL',
        volumeStatus: 'STRONG',
        relativeVolume20: 1.8,
        volumeSpike: true,
        breakoutStatus: 'PRE_BREAKOUT',
        momentumStatus: 'ACCELERATING',
        momentum5D: 0.03,
        relativeStrength: 1.2,
        rank: 1,
        status: 'TOP_CANDIDATE',
        dataStatus: 'AVAILABLE',
        sourceProvenance: 'YAHOO',
      },
      {
        symbol: 'AKBNK',
        currentPrice: 60,
        eliteScore: 70,
        financialScore: 72,
        technicalScore: 60,
        confluenceScore: 65,
        smartMoneyScore: 0,
        marketStructureScore: 55,
        multiTimeframeConfluence: 'MODERATE',
        multiTimeframeScore: 64,
        earlyOpportunityClassification: 'LEGACY_OPPORTUNITY',
        scannerSignalQuality: 'FAIR',
        marketRegime: 'SIDEWAYS',
        volumeStatus: 'MODERATE',
        relativeVolume20: 1.1,
        volumeSpike: false,
        breakoutStatus: 'NO_BREAKOUT',
        momentumStatus: 'NEUTRAL',
        momentum5D: 0.01,
        relativeStrength: 1.0,
        rank: 2,
        status: 'TOP_CANDIDATE',
        dataStatus: 'AVAILABLE',
        sourceProvenance: 'YAHOO',
      },
    ],
    top20: [],
    top50: [],
    newOpportunities: [
      {
        scanId: 'scan-1',
        type: 'NEW_OPPORTUNITY',
        symbol: 'THYAO',
        previousState: null,
        currentState: 'TOP_CANDIDATE',
        eliteScore: 85,
        previousEliteScore: null,
        rank: 1,
        previousRank: null,
        classification: 'LEGACY_OPPORTUNITY',
        reason: 'Test fırsat',
        factors: ['eliteScore'],
        dataStatus: 'AVAILABLE',
        confidence: 'HIGH',
        sourceProvenance: 'YAHOO',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
    ],
    strengtheningSignals: [],
    rankImprovements: [],
    scoreSurges: [],
    volumeExpansions: [],
    momentumAccelerations: [],
    breakoutDevelopments: [],
    multiTimeframeAlignments: [],
    weakenedSignals: [],
    lostSignals: [],
    providerSummary: [],
    dataQuality: 'VALID',
  };
  const snapshot = {
    scanId: 'scan-1',
    scanTimestamp: '2026-01-01T00:00:00.000Z',
    marketTimestamp: '2026-01-01T00:00:00.000Z',
    version: '1.0.0',
    schemaVersion: 1,
    status: 'COMPLETE',
    universeSize: 500,
    equityCandidateCount: 480,
    evaluatedCount: 460,
    eligibleCount: 10,
    signalCount: 2,
    availableCount: 440,
    unavailableCount: 20,
    rateLimitedCount: 0,
    failedCount: 0,
    results: summary.top10,
    providerSummary: [],
    dataQuality: 'VALID',
    coverage: 'FULL',
    executionDurationMs: 5000,
  };
  return {
    summary,
    snapshot,
    radar: {
      scanId: 'scan-1',
      scanTimestamp: '2026-01-01T00:00:00.000Z',
      eventCount: 1,
      events: summary.newOpportunities,
    },
    run: { scanId: 'scan-2', status: 'COMPLETE', summary, timestamp: '2026-01-01T00:00:00.000Z' },
  };
});

vi.mock('@/lib/sdk', () => ({
  sdkClient: {
    dailyScanSummary: vi.fn().mockResolvedValue(mocks.summary),
    dailyScanLatest: vi.fn().mockResolvedValue(mocks.snapshot),
    dailyScanRadar: vi.fn().mockResolvedValue(mocks.radar),
    dailyScanRun: vi.fn().mockResolvedValue(mocks.run),
  },
}));

describe('DailyScanPage', () => {
  it('renders title', async () => {
    render(
      <MemoryRouter>
        <DailyScanPage />
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(screen.getAllByText(/Günlük BIST Taraması/).length).toBeGreaterThan(0),
    );
  });

  it('renders ranking rows', async () => {
    render(
      <MemoryRouter>
        <DailyScanPage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getAllByText('THYAO').length).toBeGreaterThan(0));
    expect(screen.getAllByText('AKBNK').length).toBeGreaterThan(0);
  });

  it('renders summary stat cards', async () => {
    render(
      <MemoryRouter>
        <DailyScanPage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText('Değerlendirilen')).toBeInTheDocument());
    expect(screen.getByText('Evren')).toBeInTheDocument();
  });

  it('renders radar events section', async () => {
    render(
      <MemoryRouter>
        <DailyScanPage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText(/Fırsat Radarı Olayları/)).toBeInTheDocument());
    expect(screen.getByText('Yeni Fırsat')).toBeInTheDocument();
  });

  it('shows empty state when no snapshot yet', async () => {
    const sdk = (await import('@/lib/sdk')).sdkClient;
    (sdk.dailyScanSummary as jest.Mock).mockRejectedValue(new Error('404'));
    (sdk.dailyScanLatest as jest.Mock).mockRejectedValue(new Error('404'));
    (sdk.dailyScanRadar as jest.Mock).mockResolvedValue({
      scanId: null,
      scanTimestamp: null,
      eventCount: 0,
      events: [],
    });
    render(
      <MemoryRouter>
        <DailyScanPage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText(/Günlük Tarama Başlat/)).toBeInTheDocument());
  });
});
