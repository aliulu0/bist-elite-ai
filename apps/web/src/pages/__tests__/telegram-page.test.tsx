import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TelegramPage from '../telegram';

vi.mock('@/lib/sdk', () => ({
  sdkClient: {
    telegram: {
      status: vi.fn(),
      preview: vi.fn(),
      send: vi.fn(),
      deliveries: vi.fn(),
    },
  },
}));

const statusFixture = {
  configured: true,
  enabled: true,
  dailyRadarEnabled: true,
  authenticated: true,
  botUsername: 'bist_elite_bot',
  botId: 555,
  status: 'VERIFIED',
  timezone: 'Europe/Istanbul',
  schedule: '18:30',
  minScore: 70,
  maxOpportunities: 10,
  dryRun: false,
  lastRunAt: '2026-08-14T12:00:00.000Z',
  lastDeliveryAt: null,
  lastDeliveryStatus: null,
  lastError: null,
  pendingCount: 0,
  sentCount: 2,
  failedCount: 0,
};

const deliveriesFixture = {
  deliveries: [
    {
      id: '1',
      ticker: 'THYAO',
      status: 'SENT',
      messageType: 'daily_radar',
      telegramMessageId: '42',
      deliveredAt: '2026-08-14T12:00:00.000Z',
      errorCode: null,
      errorMessageSanitized: null,
    },
  ],
  total: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TelegramPage', () => {
  it('renders page title and stats', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.telegram.status).mockResolvedValue(statusFixture as never);
    vi.mocked(sdk.sdkClient.telegram.deliveries).mockResolvedValue(deliveriesFixture as never);
    render(<MemoryRouter><TelegramPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Telegram Fırsat Radarı')).toBeInTheDocument();
    });
    expect(screen.getByText('Yapılandırıldı')).toBeInTheDocument();
  });

  it('shows error state on failure', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.telegram.status).mockRejectedValue(new Error('fail') as never);
    render(<MemoryRouter><TelegramPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Telegram durumu yüklenirken hata oluştu')).toBeInTheDocument();
    });
    expect(screen.getByText('Tekrar Dene')).toBeInTheDocument();
  });

  it('renders deliveries table', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.telegram.status).mockResolvedValue(statusFixture as never);
    vi.mocked(sdk.sdkClient.telegram.deliveries).mockResolvedValue(deliveriesFixture as never);
    render(<MemoryRouter><TelegramPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('THYAO')).toBeInTheDocument();
    });
    expect(screen.getByText('1 kayıt')).toBeInTheDocument();
  });

  it('manual send button triggers a real send', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.telegram.status).mockResolvedValue(statusFixture as never);
    vi.mocked(sdk.sdkClient.telegram.deliveries).mockResolvedValue(deliveriesFixture as never);
    vi.mocked(sdk.sdkClient.telegram.send).mockResolvedValue({ status: 'SENT', opportunities: 1 } as never);
    render(<MemoryRouter><TelegramPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Şimdi Gönder')).toBeInTheDocument();
    });
    screen.getByText('Şimdi Gönder').click();
    await waitFor(() => {
      expect(sdk.sdkClient.telegram.send).toHaveBeenCalledWith({ dryRun: false });
    });
  });
});