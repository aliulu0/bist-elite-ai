import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PerformancePage from '@/pages/performance';
import { usePerformanceStore } from '@/stores/performance-store';

vi.mock('@/lib/sdk', () => ({
  sdkClient: {
    performanceMonitor: vi.fn().mockResolvedValue({ metrics: {}, memoryUsage: 0, uptime: 0 }),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  usePerformanceStore.setState({
    activeTab: 'overview',
    snapshot: null,
    loading: false,
    error: '',
    lastRefresh: null,
  });
});

describe('PerformancePage', () => {
  it('renders page title', async () => {
    render(<PerformancePage />);
    expect(screen.getByText('Performans Monitörü')).toBeDefined();
  });

  it('renders refresh button', () => {
    render(<PerformancePage />);
    expect(screen.getByText('Yenile')).toBeDefined();
  });

  it('renders export button', () => {
    render(<PerformancePage />);
    expect(screen.getByText('Dışa Aktar')).toBeDefined();
  });

  it('renders clear button', () => {
    render(<PerformancePage />);
    expect(screen.getByText('Temizle')).toBeDefined();
  });

  it('renders all tabs', () => {
    render(<PerformancePage />);
    expect(screen.getByText('Genel')).toBeDefined();
    expect(screen.getByText('Motorlar')).toBeDefined();
    expect(screen.getByText('Pipeline')).toBeDefined();
    expect(screen.getByText('API')).toBeDefined();
    expect(screen.getByText('Önbellek')).toBeDefined();
    expect(screen.getByText('Sistem')).toBeDefined();
    expect(screen.getByText('İş Akışı')).toBeDefined();
    expect(screen.getByText('Kuyruk')).toBeDefined();
    expect(screen.getByText('Sağlayıcılar')).toBeDefined();
    expect(screen.getByText('Uyarılar')).toBeDefined();
  });

  it('renders summary cards', async () => {
    render(<PerformancePage />);
    await waitFor(() => {
      expect(screen.getByText('Toplam İstek')).toBeDefined();
    });
  });

  it('renders overview panel by default', async () => {
    render(<PerformancePage />);
    await waitFor(() => {
      expect(screen.getByText('Sistem Durumu')).toBeDefined();
    });
  });

  it('renders export panel on overview tab', async () => {
    render(<PerformancePage />);
    await waitFor(() => {
      expect(screen.getByText('Performans verilerini dışa aktarın')).toBeDefined();
    });
  });

  it('calls SDK on mount', async () => {
    const { sdkClient } = await import('@/lib/sdk');
    render(<PerformancePage />);
    await waitFor(() => {
      expect(sdkClient.performanceMonitor).toHaveBeenCalled();
    });
  });

  it('shows empty state when snapshot is null', () => {
    render(<PerformancePage />);
    expect(screen.getByText('Henüz performans verisi bulunmuyor')).toBeDefined();
  });
});
