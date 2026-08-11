import { create } from 'zustand';
import type { AuditTab, AuditSnapshot, AuditSeverity, AuditLogEntry } from '@/components/audit/audit-types';
export type { AuditLogEntry } from '@/components/audit/audit-types';
import { MODULE_TAB_MAP } from '@/components/audit/audit-types';

export interface AuditState {
  activeTab: AuditTab;
  snapshot: AuditSnapshot | null;
  loading: boolean;
  error: string;
  lastRefresh: string | null;
  search: string;
  sortKey: string;
  sortDir: 'asc' | 'desc';
  selectedLogId: string | null;
  page: number;
  pageSize: number;
  filterSeverity: AuditSeverity | '';
  filterModule: string;
  filterAction: string;

  setActiveTab: (tab: AuditTab) => void;
  setSnapshot: (snapshot: AuditSnapshot) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setLastRefresh: (ts: string) => void;
  setSearch: (search: string) => void;
  setSort: (key: string, dir: 'asc' | 'desc') => void;
  setSelectedLogId: (id: string | null) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setFilterSeverity: (severity: AuditSeverity | '') => void;
  setFilterModule: (module: string) => void;
  setFilterAction: (action: string) => void;
  clearFilters: () => void;
  clearSnapshot: () => void;
}

export const EMPTY_SNAPSHOT: AuditSnapshot = {
  logs: [],
  moduleStats: [],
  severityCounts: { INFO: 0, WARNING: 0, ERROR: 0, CRITICAL: 0 },
  totalCount: 0,
  todayCount: 0,
  lastEntry: null,
  activeModules: 0,
};

export function buildSnapshot(data: Record<string, unknown>): AuditSnapshot {
  const logsRaw = data['logs'] as Array<Record<string, unknown>> | undefined;
  const logs: AuditLogEntry[] = Array.isArray(logsRaw)
    ? logsRaw.map((l) => ({
        id: (l['id'] as string) || '',
        timestamp: (l['timestamp'] as string) || '',
        module: (l['module'] as string) || '',
        action: (l['action'] as string) || 'CUSTOM',
        severity: (l['severity'] as AuditSeverity) || 'INFO',
        user: (l['user'] as string) || undefined,
        targetType: (l['targetType'] as string) || undefined,
        targetId: (l['targetId'] as string) || undefined,
        oldValue: (l['oldValue'] as string) || undefined,
        newValue: (l['newValue'] as string) || undefined,
        details: typeof l['details'] === 'string' ? l['details'] : JSON.stringify(l['details'] || ''),
      }))
    : [];

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const severityCounts: Record<AuditSeverity, number> = { INFO: 0, WARNING: 0, ERROR: 0, CRITICAL: 0 };
  const moduleMap = new Map<string, { count: number; lastActivity: string | null }>();

  for (const log of logs) {
    severityCounts[log.severity] = (severityCounts[log.severity] || 0) + 1;

    const existing = moduleMap.get(log.module);
    if (existing) {
      existing.count++;
      if (log.timestamp > (existing.lastActivity || '')) {
        existing.lastActivity = log.timestamp;
      }
    } else {
      moduleMap.set(log.module, { count: 1, lastActivity: log.timestamp });
    }
  }

  const moduleStats = Array.from(moduleMap.entries()).map(([module, data]) => ({
    module,
    count: data.count,
    lastActivity: data.lastActivity,
  })).sort((a, b) => b.count - a.count);

  const todayCount = logs.filter((l) => l.timestamp >= todayStart).length;
  const lastEntry = logs.length > 0 ? logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0].timestamp : null;

  return {
    logs,
    moduleStats,
    severityCounts,
    totalCount: logs.length,
    todayCount,
    lastEntry,
    activeModules: moduleMap.size,
  };
}

export function filterLogs(
  logs: AuditLogEntry[],
  search: string,
  filterSeverity: AuditSeverity | '',
  filterModule: string,
  filterAction: string,
  activeTab: AuditTab,
): AuditLogEntry[] {
  let result = logs;

  if (activeTab !== 'all') {
    result = result.filter((l) => {
      const tab = MODULE_TAB_MAP[l.module] || 'other';
      return tab === activeTab;
    });
  }

  if (filterSeverity) {
    result = result.filter((l) => l.severity === filterSeverity);
  }

  if (filterModule) {
    result = result.filter((l) => l.module.toLowerCase().includes(filterModule.toLowerCase()));
  }

  if (filterAction) {
    result = result.filter((l) => l.action.toLowerCase().includes(filterAction.toLowerCase()));
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    result = result.filter(
      (l) =>
        l.module.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        (l.user && l.user.toLowerCase().includes(q)),
    );
  }

  return result;
}

export function sortLogs(logs: AuditLogEntry[], key: string, dir: 'asc' | 'desc'): AuditLogEntry[] {
  return [...logs].sort((a, b) => {
    const aVal = a[key as keyof typeof a];
    const bVal = b[key as keyof typeof b];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return dir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return dir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });
}

export function paginateLogs(logs: AuditLogEntry[], page: number, pageSize: number): AuditLogEntry[] {
  const start = page * pageSize;
  return logs.slice(start, start + pageSize);
}

export const useAuditStore = create<AuditState>((set) => ({
  activeTab: 'all',
  snapshot: null,
  loading: false,
  error: '',
  lastRefresh: null,
  search: '',
  sortKey: 'timestamp',
  sortDir: 'desc',
  selectedLogId: null,
  page: 0,
  pageSize: 25,
  filterSeverity: '',
  filterModule: '',
  filterAction: '',

  setActiveTab: (activeTab) => set({ activeTab }),
  setSnapshot: (snapshot) => set({ snapshot, loading: false, error: '', lastRefresh: new Date().toISOString() }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  setLastRefresh: (lastRefresh) => set({ lastRefresh }),
  setSearch: (search) => set({ search, page: 0 }),
  setSort: (sortKey, sortDir) => set({ sortKey, sortDir }),
  setSelectedLogId: (selectedLogId) => set({ selectedLogId }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 0 }),
  setFilterSeverity: (filterSeverity) => set({ filterSeverity, page: 0 }),
  setFilterModule: (filterModule) => set({ filterModule, page: 0 }),
  setFilterAction: (filterAction) => set({ filterAction, page: 0 }),
  clearFilters: () => set({ search: '', filterSeverity: '', filterModule: '', filterAction: '', page: 0 }),
  clearSnapshot: () => set({ snapshot: null, lastRefresh: null }),
}));
