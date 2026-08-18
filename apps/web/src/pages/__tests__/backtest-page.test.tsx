import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BacktestPage from '../backtest';

vi.mock('@/lib/sdk', () => ({
  sdkClient: {
    backtestEO: {
      run: vi.fn().mockResolvedValue({ runId: '123e4567-e89b-12d3-a456-426614174000' }),
      getRun: vi.fn().mockResolvedValue({
        runId: '123e4567-e89b-12d3-a456-426614174000',
        completedAt: '2026-01-01T00:00:00.000Z',
        decisionsEvaluated: 10,
        outcomesEvaluated: 10,
        executionDurationMs: 100,
        providerCalls: 50,
        cacheHits: 20,
        summary: {
          runId: '123e4567-e89b-12d3-a456-426614174000',
          decisionsEvaluated: 10,
          winRate: 60,
          averageReturn: 5,
          medianReturn: 3,
          benchmarkExcessReturn: 1.5,
          maxDrawdown: 10,
          averageLeadTime: 5,
          falsePositiveCount: 2,
          missedOpportunityCount: 1,
          sampleQuality: 'GOOD',
          survivorshipWarning: 'SURVIVORSHIP_BIAS_POSSIBLE',
          pointInTimeVerified: true,
        },
        decisionTable: [
          {
            ticker: 'THYAO',
            decisionDate: '2024-02-01T00:00:00.000Z',
            decision: 'CONFIRMED',
            eliteScore: 80,
            confidence: 75,
            expectedReturn: 10,
            realizedReturn: 8,
            return1M: 6,
            return3M: 9,
            benchmarkReturn: 3,
            excessReturn: 5,
            maxDrawdown: 4,
            leadTime: 3,
            outcome: 'SUCCESS',
            dataQuality: 'GOOD',
          },
        ],
      }),
      failures: vi.fn().mockResolvedValue({ failures: [] }),
      missedOpportunities: vi.fn().mockResolvedValue({ missed: [] }),
      calibration: vi.fn().mockResolvedValue({ bins: [] }),
      leadTime: vi.fn().mockResolvedValue({ days: [] }),
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('BacktestPage', () => {
  it('renders page header', () => {
    render(
      <MemoryRouter>
        <BacktestPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('Erken Fırsat Backtesti')).toBeInTheDocument();
  });

  it('renders symbols input', () => {
    render(
      <MemoryRouter>
        <BacktestPage />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText('Semboller')).toBeInTheDocument();
  });

  it('renders run button', () => {
    render(
      <MemoryRouter>
        <BacktestPage />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText('Backtest çalıştır')).toBeInTheDocument();
  });

  it('empty state before run', () => {
    render(
      <MemoryRouter>
        <BacktestPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('Backtest başlatın')).toBeInTheDocument();
  });

  it('page has proper structure', () => {
    const { container } = render(
      <MemoryRouter>
        <BacktestPage />
      </MemoryRouter>,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('shows description text', () => {
    render(
      <MemoryRouter>
        <BacktestPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByText('Geçmiş erken fırsat kararlarını gerçek verilerle test edin (backtestEO)'),
    ).toBeInTheDocument();
  });

  it('settings section renders', () => {
    render(
      <MemoryRouter>
        <BacktestPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('Backtest Ayarları')).toBeInTheDocument();
  });

  it('symbols input accepts text', () => {
    render(
      <MemoryRouter>
        <BacktestPage />
      </MemoryRouter>,
    );
    const input = screen.getByLabelText('Semboller');
    fireEvent.change(input, { target: { value: 'GARAN' } });
    expect(input).toHaveValue('GARAN');
  });

  it('runs a backtest and renders summary', async () => {
    render(
      <MemoryRouter>
        <BacktestPage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByLabelText('Backtest çalıştır'));
    await waitFor(() => {
      expect(screen.getByText('Kazanma Oranı')).toBeInTheDocument();
    });
    expect(screen.getByText('Karar Tablosu')).toBeInTheDocument();
    expect(screen.getByText('THYAO')).toBeInTheDocument();
  });
});
