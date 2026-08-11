import { create } from 'zustand';
import type { Alert, AlertGroup, AlertPriority, AlertStatus, AlertSettings, AlertSummary } from '@/components/alerts/alerts-types';
import { DEFAULT_ALERT_SETTINGS } from '@/components/alerts/alerts-types';

export interface AlertsState {
  alerts: Alert[];
  selectedAlert: Alert | null;
  activeTab: AlertGroup | 'TUMU';
  search: string;
  sortKey: string;
  sortDir: 'asc' | 'desc';
  page: number;
  pageSize: number;
  filterType: string;
  filterPriority: string;
  filterStatus: string;
  filterRead: string;
  filterGroup: string;
  filterSymbol: string;
  settings: AlertSettings;
  summary: AlertSummary | null;
  loading: boolean;
  error: string;

  setAlerts: (alerts: Alert[]) => void;
  setSelectedAlert: (a: Alert | null) => void;
  setActiveTab: (tab: AlertGroup | 'TUMU') => void;
  setSearch: (s: string) => void;
  setSort: (key: string, dir: 'asc' | 'desc') => void;
  setPage: (p: number) => void;
  setFilterType: (t: string) => void;
  setFilterPriority: (p: string) => void;
  setFilterStatus: (s: string) => void;
  setFilterRead: (r: string) => void;
  setFilterGroup: (g: string) => void;
  setFilterSymbol: (s: string) => void;
  setSettings: (s: AlertSettings) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  markAllResolved: () => void;
  setLoading: (l: boolean) => void;
  setError: (e: string) => void;
}

function computeSummary(alerts: Alert[]): AlertSummary {
  const today = new Date().toISOString().slice(0, 10);
  return {
    total: alerts.length,
    unread: alerts.filter((a) => !a.read).length,
    kritik: alerts.filter((a) => a.priority === 'KRITIK').length,
    yuksek: alerts.filter((a) => a.priority === 'YUKSEK').length,
    orta: alerts.filter((a) => a.priority === 'ORTA').length,
    dusuk: alerts.filter((a) => a.priority === 'DUSUK' || a.priority === 'BILGI').length,
    todayCount: alerts.filter((a) => a.timestamp.startsWith(today)).length,
    resolvedCount: alerts.filter((a) => a.status === 'COZULDU').length,
  };
}

export function filterAlerts(alerts: Alert[], search: string): Alert[] {
  if (!search.trim()) return alerts;
  const q = search.toLowerCase();
  return alerts.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.source.toLowerCase().includes(q) ||
      (a.symbol && a.symbol.toLowerCase().includes(q)),
  );
}

export function sortAlerts(alerts: Alert[], sortKey: string, sortDir: 'asc' | 'desc'): Alert[] {
  return [...alerts].sort((a, b) => {
    const aVal = a[sortKey as keyof Alert];
    const bVal = b[sortKey as keyof Alert];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
      return sortDir === 'asc' ? (aVal ? 1 : 0) - (bVal ? 1 : 0) : (bVal ? 1 : 0) - (aVal ? 1 : 0);
    }
    return sortDir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
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
  filterGroup: '',
  filterSymbol: '',
  settings: { ...DEFAULT_ALERT_SETTINGS },
  summary: null,
  loading: false,
  error: '',

  setAlerts: (alerts) => set({ alerts, summary: computeSummary(alerts) }),
  setSelectedAlert: (selectedAlert) => set({ selectedAlert }),
  setActiveTab: (activeTab) => set({ activeTab, page: 0 }),
  setSearch: (search) => set({ search, page: 0 }),
  setSort: (key, dir) => set({ sortKey: key, sortDir: dir }),
  setPage: (page) => set({ page }),
  setFilterType: (filterType) => set({ filterType, page: 0 }),
  setFilterPriority: (filterPriority) => set({ filterPriority, page: 0 }),
  setFilterStatus: (filterStatus) => set({ filterStatus, page: 0 }),
  setFilterRead: (filterRead) => set({ filterRead, page: 0 }),
  setFilterGroup: (filterGroup) => set({ filterGroup, page: 0 }),
  setFilterSymbol: (filterSymbol) => set({ filterSymbol, page: 0 }),
  setSettings: (settings) => set({ settings }),
  markAsRead: (id) =>
    set((s) => {
      const alerts = s.alerts.map((a) => (a.id === id ? { ...a, read: true, status: 'OKUNDU' as const } : a));
      return { alerts, summary: computeSummary(alerts) };
    }),
  markAllAsRead: () =>
    set((s) => {
      const alerts = s.alerts.map((a) => ({ ...a, read: true, status: 'OKUNDU' as const }));
      return { alerts, summary: computeSummary(alerts) };
    }),
  markAllResolved: () =>
    set((s) => {
      const alerts = s.alerts.map((a) => ({ ...a, read: true, status: 'COZULDU' as const }));
      return { alerts, summary: computeSummary(alerts) };
    }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
