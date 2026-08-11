import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AlertsPage from '../alerts';
import { useAlertsStore } from '@/stores/alerts-store';

const mockAlerts = vi.fn();

vi.mock('@/lib/sdk', () => ({
  sdkClient: {
    alerts: () => mockAlerts(),
  },
}));

function mockAlert(id: string, symbol: string | null, overrides?: Record<string, unknown>) {
  return {
    id,
    type: 'OPPORTUNITY',
    priority: 'HIGH',
    title: `Erken Fırsat: ${symbol ?? 'Sistem'}`,
    message: 'Elite skoru yükseldi. Erken fırsat sinyali aktif.',
    symbol,
    channels: ['APPLICATION'],
    status: 'ACTIVE',
    createdAt: '2026-08-01T09:15:00Z',
    deliveredChannels: ['APPLICATION'],
    failedChannels: [],
    durationMs: 12,
    timestamp: '2026-08-01T09:15:00Z',
    ...overrides,
  };
}

function setupSdk() {
  mockAlerts.mockResolvedValue({
    success: true,
    data: {
      alerts: [
        mockAlert('a1', 'THYAO'),
        mockAlert('a2', 'GARAN', { type: 'ELITE_YUKSELDI', status: 'ACKNOWLEDGED' }),
      ],
      total: 2,
      limit: 100,
      offset: 0,
    },
    timestamp: '',
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setupSdk();
  useAlertsStore.setState({
    alerts: [],
    selectedAlert: null,
    activeTab: 'TUMU',
    search: '',
    sortKey: 'timestamp',
    sortDir: 'desc',
    page: 0,
    pageSize: 20,
    filterType: '',
    filterPriority: '',
    filterStatus: '',
    filterRead: '',
    filterSymbol: '',
  });
});

describe('AlertsPage', () => {
  it('renders page title', async () => {
    render(<AlertsPage />);
    expect(await screen.findByText('Alarm Merkezi')).toBeDefined();
  });

  it('renders KPI summary cards', async () => {
    render(<AlertsPage />);
    expect(await screen.findByText('Toplam Alarm')).toBeDefined();
    expect(screen.getByText('Yeni Alarm')).toBeDefined();
    expect(screen.getByText('Okunmamış Alarm')).toBeDefined();
  });

  it('renders filter section', async () => {
    render(<AlertsPage />);
    expect(await screen.findByText('Filtreler')).toBeDefined();
    expect(screen.getByText('Tür Filtresi')).toBeDefined();
  });

  it('renders detail panel with empty state', async () => {
    render(<AlertsPage />);
    expect(await screen.findByText('Alarm detayları için yeterli veri yok')).toBeDefined();
  });

  it('renders settings toggle button', async () => {
    render(<AlertsPage />);
    expect(await screen.findByRole('button', { name: /alarm ayarları/i })).toBeDefined();
  });

  it('renders export buttons', async () => {
    render(<AlertsPage />);
    expect(await screen.findByText('CSV Olarak İndir')).toBeDefined();
    expect(screen.getByText('JSON Olarak İndir')).toBeDefined();
  });

  it('toggles settings panel open', async () => {
    render(<AlertsPage />);
    fireEvent.click(await screen.findByRole('button', { name: /alarm ayarları/i }));
    expect(screen.getByText('Ayarları Gizle')).toBeDefined();
    expect(screen.getAllByRole('switch').length).toBe(6);
  });

  it('toggles settings panel closed', async () => {
    render(<AlertsPage />);
    fireEvent.click(await screen.findByRole('button', { name: /alarm ayarları/i }));
    fireEvent.click(screen.getByText('Ayarları Gizle'));
    expect(screen.queryByRole('switch')).toBeNull();
  });

  it('loads alerts from the API into the store', async () => {
    render(<AlertsPage />);
    await screen.findByText('Alarm Merkezi');
    const s = useAlertsStore.getState();
    expect(s.alerts).toHaveLength(2);
    expect(s.summary?.total).toBe(2);
    expect(mockAlerts).toHaveBeenCalled();
  });

  it('shows all alerts on TUMU tab', async () => {
    render(<AlertsPage />);
    expect(await screen.findByText(/2 sonuç/)).toBeDefined();
  });

  it('switches to PIYASA tab via store', async () => {
    render(<AlertsPage />);
    await screen.findByText('Alarm Merkezi');
    useAlertsStore.getState().setActiveTab('PIYASA');
    expect(useAlertsStore.getState().activeTab).toBe('PIYASA');
  });

  it('switches to WORKFLOW tab via store', async () => {
    render(<AlertsPage />);
    await screen.findByText('Alarm Merkezi');
    useAlertsStore.getState().setActiveTab('WORKFLOW');
    expect(useAlertsStore.getState().activeTab).toBe('WORKFLOW');
  });

  it('renders the mark-all-as-read button', async () => {
    render(<AlertsPage />);
    expect(await screen.findByText('Tümünü Okundu İşaretle')).toBeDefined();
  });

  it('renders the refresh button', async () => {
    render(<AlertsPage />);
    expect(await screen.findByText('Yenile')).toBeDefined();
  });

  it('mark all as read updates summary', async () => {
    render(<AlertsPage />);
    fireEvent.click(await screen.findByText('Tümünü Okundu İşaretle'));
    const s = useAlertsStore.getState();
    expect(s.summary?.unread).toBe(0);
  });

  it('shows error card when API fails', async () => {
    mockAlerts.mockRejectedValue(new Error('Network error'));
    render(<AlertsPage />);
    expect(await screen.findByText('Alarm Merkezi Yüklenemedi')).toBeDefined();
  });
});
