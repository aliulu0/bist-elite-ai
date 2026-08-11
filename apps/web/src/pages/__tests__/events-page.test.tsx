import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EventsPage from '../events';
import { useEventsStore } from '@/stores/events-store';

vi.mock('@/lib/sdk', () => ({
  sdkClient: {
    eventBus: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  useEventsStore.setState({ events: [], search: '', loading: false, error: '' });
});

describe('EventsPage', () => {
  it('renders page title', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.eventBus).mockResolvedValue({ success: true, data: { events: [], total: 0 }, timestamp: '' } as never);
    render(<MemoryRouter><EventsPage /></MemoryRouter>);
    expect(screen.getByText('Olaylar')).toBeInTheDocument();
  });

  it('shows loading state', async () => {
    const sdk = await import('@/lib/sdk');
    let resolve!: (v: unknown) => void;
    vi.mocked(sdk.sdkClient.eventBus).mockReturnValue(new Promise((r) => { resolve = r; }) as never);
    render(<MemoryRouter><EventsPage /></MemoryRouter>);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    resolve({ success: true, data: { events: [], total: 0 }, timestamp: '' });
  });

  it('shows error with retry', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.eventBus).mockRejectedValue(new Error('fail') as never);
    render(<MemoryRouter><EventsPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Olaylar yüklenirken hata oluştu')).toBeInTheDocument();
    });
    expect(screen.getByText('Tekrar Dene')).toBeInTheDocument();
  });

  it('renders table with events', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.eventBus).mockResolvedValue({
      success: true,
      data: {
        events: [
          { id: '1', type: 'SCANNER_COMPLETED', category: 'scanner', timestamp: 1760000000000, payload: { count: 45 } },
        ],
        total: 1,
      },
      timestamp: '',
    } as never);
    render(<MemoryRouter><EventsPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('SCANNER_COMPLETED')).toBeInTheDocument();
    });
  });

  it('search filters events', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.eventBus).mockResolvedValue({
      success: true,
      data: {
        events: [
          { id: '1', type: 'SCANNER_COMPLETED', category: 'scanner', timestamp: '', payload: '' },
          { id: '2', type: 'WORKFLOW_STARTED', category: 'workflow', timestamp: '', payload: '' },
        ],
        total: 2,
      },
      timestamp: '',
    } as never);
    render(<MemoryRouter><EventsPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('SCANNER_COMPLETED')).toBeInTheDocument();
    });
    const searchInput = screen.getByPlaceholderText('Olay türü veya kategori ara...');
    searchInput.value = '';
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(searchInput, { target: { value: 'WORKFLOW' } });
    expect(screen.queryByText('SCANNER_COMPLETED')).not.toBeInTheDocument();
    expect(screen.getByText('WORKFLOW_STARTED')).toBeInTheDocument();
  });

  it('refresh button works', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.eventBus).mockResolvedValue({ success: true, data: { events: [], total: 0 }, timestamp: '' } as never);
    render(<MemoryRouter><EventsPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Tazele')).toBeInTheDocument();
    });
    screen.getByText('Tazele').click();
    await waitFor(() => {
      expect(sdk.sdkClient.eventBus).toHaveBeenCalledTimes(2);
    });
  });

  it('empty state for no events', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.eventBus).mockResolvedValue({ success: true, data: { events: [], total: 0 }, timestamp: '' } as never);
    render(<MemoryRouter><EventsPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Olay bulunamadı')).toBeInTheDocument();
    });
  });

  it('columns render correctly', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.eventBus).mockResolvedValue({
      success: true,
      data: { events: [{ id: '1', type: 'SCANNER_COMPLETED', category: 'scanner', timestamp: '', payload: {} }], total: 1 },
      timestamp: '',
    } as never);
    render(<MemoryRouter><EventsPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Tür')).toBeInTheDocument();
    });
    expect(screen.getByText('Kategori')).toBeInTheDocument();
    expect(screen.getByText('Zaman')).toBeInTheDocument();
    expect(screen.getByText('Veri')).toBeInTheDocument();
  });

  it('page has proper structure', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.eventBus).mockResolvedValue({ success: true, data: { events: [], total: 0 }, timestamp: '' } as never);
    render(<MemoryRouter><EventsPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Olaylar')).toBeInTheDocument();
    });
  });

  it('calls eventBus on mount', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.eventBus).mockResolvedValue({ success: true, data: { events: [], total: 0 }, timestamp: '' } as never);
    render(<MemoryRouter><EventsPage /></MemoryRouter>);
    expect(sdk.sdkClient.eventBus).toHaveBeenCalled();
  });

  it('handles numeric timestamp payload events', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.eventBus).mockResolvedValue({
      success: true,
      data: { events: [{ id: '1', type: 'TEST', category: 'test', timestamp: 1760000000000, payload: { x: 1 } }], total: 1 },
      timestamp: '',
    } as never);
    render(<MemoryRouter><EventsPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('TEST')).toBeInTheDocument();
    });
  });

  it('shows description text', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.eventBus).mockResolvedValue({ success: true, data: { events: [], total: 0 }, timestamp: '' } as never);
    render(<MemoryRouter><EventsPage /></MemoryRouter>);
    expect(screen.getByText('Sistem olaylarını izleyin')).toBeInTheDocument();
  });
});
