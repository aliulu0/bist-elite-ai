import { describe, it, expect, beforeEach } from 'vitest';
import { useAlertsStore, filterAlerts, sortAlerts } from '@/stores/alerts-store';
import type { Alert } from '@/components/alerts/alerts-types';

const ALERTS: Alert[] = [
  { id: 'a1', type: 'ERKEN_FIRSAT', title: 'THYAO Fırsatı', description: 'Açıklama 1', priority: 'YUKSEK', status: 'YENI', group: 'PIYASA', source: 'Engine', symbol: 'THYAO', timestamp: '2026-07-26T09:00:00Z', read: false },
  { id: 'a2', type: 'WORKFLOW_HATA', title: 'Workflow Hatası', description: 'Açıklama 2', priority: 'KRITIK', status: 'OKUNDU', group: 'WORKFLOW', source: 'Scheduler', workflowId: 'wf-1', timestamp: '2026-07-26T10:00:00Z', read: true },
  { id: 'a3', type: 'PROVIDER_OFFLINE', title: 'Provider Çevrimdışı', description: 'Açıklama 3', priority: 'ORTA', status: 'COZULDU', group: 'PROVIDER', source: 'HealthService', providerName: 'Fintables', timestamp: '2026-07-26T08:00:00Z', read: true },
  { id: 'a4', type: 'SISTEM_UYARISI', title: 'CPU Uyarısı', description: 'Açıklama 4', priority: 'DUSUK', status: 'YENI', group: 'SISTEM', source: 'SystemMonitor', timestamp: '2026-07-26T11:00:00Z', read: false },
];

beforeEach(() => {
  useAlertsStore.setState({
    alerts: ALERTS,
    selectedAlert: null,
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

describe('filterAlerts', () => {
  it('returns all alerts when search is empty', () => {
    expect(filterAlerts(ALERTS, '')).toHaveLength(4);
  });

  it('filters by title', () => {
    expect(filterAlerts(ALERTS, 'THYAO')).toHaveLength(1);
  });

  it('filters by source', () => {
    expect(filterAlerts(ALERTS, 'Scheduler')).toHaveLength(1);
  });

  it('filters by symbol', () => {
    expect(filterAlerts(ALERTS, 'THYAO')).toHaveLength(1);
  });

  it('filters by description', () => {
    expect(filterAlerts(ALERTS, 'Açıklama 2')).toHaveLength(1);
  });

  it('case-insensitive filter', () => {
    expect(filterAlerts(ALERTS, 'thyao')).toHaveLength(1);
  });

  it('empty result when no match', () => {
    expect(filterAlerts(ALERTS, 'ZZZZZ')).toHaveLength(0);
  });
});

describe('sortAlerts', () => {
  it('sorts by timestamp desc', () => {
    const sorted = sortAlerts(ALERTS, 'timestamp', 'desc');
    expect(sorted[0].id).toBe('a4');
  });

  it('sorts by timestamp asc', () => {
    const sorted = sortAlerts(ALERTS, 'timestamp', 'asc');
    expect(sorted[0].id).toBe('a3');
  });

  it('sorts by title', () => {
    const sorted = sortAlerts(ALERTS, 'title', 'asc');
    expect(sorted[0].title).toContain('CPU');
  });

  it('sorts by read boolean', () => {
    const sorted = sortAlerts(ALERTS, 'read', 'asc');
    expect(sorted[0].read).toBe(false);
  });
});

describe('useAlertsStore', () => {
  it('setAlerts updates alerts and summary', () => {
    useAlertsStore.getState().setAlerts(ALERTS);
    const s = useAlertsStore.getState();
    expect(s.alerts).toHaveLength(4);
    expect(s.summary?.total).toBe(4);
  });

  it('setSelectedAlert updates selection', () => {
    useAlertsStore.getState().setAlerts(ALERTS);
    useAlertsStore.getState().setSelectedAlert(ALERTS[0]);
    expect(useAlertsStore.getState().selectedAlert?.id).toBe('a1');
  });

  it('setActiveTab resets page', () => {
    useAlertsStore.setState({ page: 5 });
    useAlertsStore.getState().setActiveTab('WORKFLOW');
    expect(useAlertsStore.getState().page).toBe(0);
    expect(useAlertsStore.getState().activeTab).toBe('WORKFLOW');
  });

  it('setSearch updates search and resets page', () => {
    useAlertsStore.setState({ page: 3 });
    useAlertsStore.getState().setSearch('test');
    expect(useAlertsStore.getState().search).toBe('test');
    expect(useAlertsStore.getState().page).toBe(0);
  });

  it('setSort updates sort key and direction', () => {
    useAlertsStore.getState().setSort('title', 'asc');
    expect(useAlertsStore.getState().sortKey).toBe('title');
    expect(useAlertsStore.getState().sortDir).toBe('asc');
  });

  it('setPage updates page', () => {
    useAlertsStore.getState().setPage(3);
    expect(useAlertsStore.getState().page).toBe(3);
  });

  it('markAsRead marks single alert', () => {
    useAlertsStore.getState().setAlerts(ALERTS);
    useAlertsStore.getState().markAsRead('a1');
    expect(useAlertsStore.getState().alerts[0].read).toBe(true);
    expect(useAlertsStore.getState().alerts[0].status).toBe('OKUNDU');
  });

  it('markAllAsRead marks all alerts', () => {
    useAlertsStore.getState().setAlerts(ALERTS);
    useAlertsStore.getState().markAllAsRead();
    expect(useAlertsStore.getState().alerts.every((a) => a.read)).toBe(true);
    expect(useAlertsStore.getState().summary?.unread).toBe(0);
  });

  it('markAllResolved marks all as COZULDU', () => {
    useAlertsStore.getState().setAlerts(ALERTS);
    useAlertsStore.getState().markAllResolved();
    expect(useAlertsStore.getState().alerts.every((a) => a.status === 'COZULDU')).toBe(true);
    expect(useAlertsStore.getState().summary?.resolvedCount).toBe(4);
  });

  it('summary computes correctly', () => {
    useAlertsStore.getState().setAlerts(ALERTS);
    const s = useAlertsStore.getState().summary!;
    expect(s.total).toBe(4);
    expect(s.unread).toBe(2);
    expect(s.kritik).toBe(1);
    expect(s.yuksek).toBe(1);
    expect(s.orta).toBe(1);
    expect(s.resolvedCount).toBe(1);
  });

  it('setFilterType resets page', () => {
    useAlertsStore.setState({ page: 2 });
    useAlertsStore.getState().setFilterType('ERKEN_FIRSAT');
    expect(useAlertsStore.getState().filterType).toBe('ERKEN_FIRSAT');
    expect(useAlertsStore.getState().page).toBe(0);
  });

  it('setFilterPriority resets page', () => {
    useAlertsStore.setState({ page: 2 });
    useAlertsStore.getState().setFilterPriority('KRITIK');
    expect(useAlertsStore.getState().filterPriority).toBe('KRITIK');
    expect(useAlertsStore.getState().page).toBe(0);
  });

  it('setFilterStatus resets page', () => {
    useAlertsStore.setState({ page: 2 });
    useAlertsStore.getState().setFilterStatus('YENI');
    expect(useAlertsStore.getState().page).toBe(0);
  });

  it('setFilterRead resets page', () => {
    useAlertsStore.setState({ page: 2 });
    useAlertsStore.getState().setFilterRead('unread');
    expect(useAlertsStore.getState().page).toBe(0);
  });

  it('setFilterSymbol resets page', () => {
    useAlertsStore.setState({ page: 2 });
    useAlertsStore.getState().setFilterSymbol('THYAO');
    expect(useAlertsStore.getState().page).toBe(0);
  });

  it('setSettings updates settings', () => {
    useAlertsStore.getState().setSettings({ piyasa: false, workflow: true, provider: true, sistem: true, portfoy: true, watchlist: true });
    expect(useAlertsStore.getState().settings.piyasa).toBe(false);
  });

  it('setLoading updates loading', () => {
    useAlertsStore.getState().setLoading(true);
    expect(useAlertsStore.getState().loading).toBe(true);
  });

  it('setError updates error', () => {
    useAlertsStore.getState().setError('Hata oluştu');
    expect(useAlertsStore.getState().error).toBe('Hata oluştu');
  });
});
