import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RadarPage from '../radar';

const mocks = {};
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => vi.fn(),
}));

vi.mock('@/lib/sdk', () => ({
  sdkClient: {
    radar: {
      top: vi.fn().mockResolvedValue({
        items: [
          {
            ticker: 'THYAO',
            company: 'Türk Hava Yolları',
            sector: 'Ulaştırma',
            state: 'STRENGTHENING',
            current: {
              earlyOpportunityScore: 85,
              confidence: 78,
              signalConvergence: 72,
              expectedReturn: 12.5,
              risk: 'low',
              dataQualityScore: 90,
              earlyOpportunity: true,
              dataTimestamp: '2026-01-01T00:00:00.000Z',
            },
            previous: { earlyOpportunityScore: 78 },
            scoreChange: 7,
            radarPriority: 1,
            reasons: ['Test'],
            dataFreshness: 'fresh',
          },
          {
            ticker: 'AKBNK',
            company: 'Akbank',
            sector: 'Bankacılık',
            state: 'NEW',
            current: {
              earlyOpportunityScore: 70,
              confidence: 60,
              signalConvergence: 55,
              expectedReturn: 8,
              risk: 'medium',
              dataQualityScore: 80,
              earlyOpportunity: true,
              dataTimestamp: '2026-01-01T00:00:00.000Z',
            },
            previous: null,
            scoreChange: null,
            radarPriority: 2,
            reasons: ['Test 2'],
            dataFreshness: 'fresh',
          },
        ],
        total: 2,
        hasSnapshot: true,
      }),
      status: vi.fn().mockResolvedValue({
        running: false,
        symbolsEvaluated: 300,
        candidates: 2,
        opportunities: { NEW: 1, STRENGTHENING: 1, CONFIRMED: 0, WEAKENING: 0, INVALIDATED: 0 },
        dataQualityWarnings: [],
        errors: 0,
        hasSnapshot: true,
      }),
      learnedConfigs: vi.fn().mockResolvedValue([]),
      run: vi.fn().mockResolvedValue({ success: true }),
    },
  },
}));

describe('RadarPage', () => {
  it('renders title', async () => {
    render(
      <MemoryRouter>
        <RadarPage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getAllByText(/Fırsat Radarı/).length).toBeGreaterThan(0));
  });

  it('renders opportunity items from real radar/top API', async () => {
    render(
      <MemoryRouter>
        <RadarPage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText('THYAO')).toBeInTheDocument());
    expect(screen.getByText('AKBNK')).toBeInTheDocument();
  });

  it('renders summary stat cards', async () => {
    render(
      <MemoryRouter>
        <RadarPage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText('Aktif Fırsat')).toBeInTheDocument());
    expect(screen.getByText('Değerlendirilen Sembol')).toBeInTheDocument();
  });

  it('shows empty state when no snapshot yet', async () => {
    const sdk = (await import('@/lib/sdk')).sdkClient;
    (sdk.radar.top as jest.Mock).mockResolvedValue({ items: [], total: 0, hasSnapshot: false });
    render(
      <MemoryRouter>
        <RadarPage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText(/Radar Taraması Başlat/)).toBeInTheDocument());
  });
});
