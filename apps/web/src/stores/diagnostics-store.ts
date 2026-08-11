import { create } from 'zustand';
import type { DiagnosticsTab, DiagnosticsSnapshot, DiagnosticCheck, DiagnosticModule, DiagnosticAlert, DiagnosticHistoryEntry } from '@/components/diagnostics/diagnostics-types';

export interface DiagnosticsState {
  activeTab: DiagnosticsTab;
  snapshot: DiagnosticsSnapshot | null;
  loading: boolean;
  error: string;
  lastRefresh: string | null;
  search: string;
  sortKey: string;
  sortDir: 'asc' | 'desc';
  selectedModule: string | null;
  page: number;
  pageSize: number;

  setActiveTab: (tab: DiagnosticsTab) => void;
  setSnapshot: (snapshot: DiagnosticsSnapshot) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setLastRefresh: (ts: string) => void;
  setSearch: (search: string) => void;
  setSort: (key: string, dir: 'asc' | 'desc') => void;
  setSelectedModule: (module: string | null) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  clearSnapshot: () => void;
}

export const EMPTY_SNAPSHOT: DiagnosticsSnapshot = {
  checks: [],
  modules: [],
  alerts: [],
  history: [],
  overallStatus: 'unknown',
  lastRun: null,
  totalDurationMs: 0,
};

const MAP_STATUS: Record<string, DiagnosticCheck['status']> = {
  healthy: 'pass',
  pass: 'pass',
  degraded: 'warning',
  warning: 'warning',
  unhealthy: 'fail',
  fail: 'fail',
};

export function buildSnapshot(data: Record<string, unknown>): DiagnosticsSnapshot {
  const checksRaw = (data['components'] as Array<Record<string, unknown>> | undefined) ?? (data['checks'] as Array<Record<string, unknown>> | undefined);
  const checks: DiagnosticCheck[] = Array.isArray(checksRaw)
    ? checksRaw.map((c) => ({
        name: (c['name'] as string) || '',
        status: MAP_STATUS[(c['status'] as string)?.toLowerCase()] || 'unknown',
        message: (c['message'] as string) || '',
        duration: (c['duration'] as number) || 0,
        category: (c['category'] as string) || undefined,
        details: (c['details'] as string) || undefined,
      }))
    : [];

  const modulesRaw = data['modules'] as Array<Record<string, unknown>> | undefined;
  const modules = Array.isArray(modulesRaw)
    ? modulesRaw.map((m) => ({
        name: (m['name'] as string) || '',
        status: (m['status'] as DiagnosticModule['status']) || 'unknown',
        checks: (m['checks'] as number) || undefined,
        lastRun: (m['lastRun'] as string) || undefined,
      }))
    : [];

  const alertsRaw = data['alerts'] as Array<Record<string, unknown>> | undefined;
  const alerts: DiagnosticAlert[] = Array.isArray(alertsRaw)
    ? alertsRaw.map((a) => ({
        id: (a['id'] as string) || '',
        type: (a['type'] as DiagnosticAlert['type']) || 'FAILED_CHECK',
        title: (a['title'] as string) || '',
        description: (a['description'] as string) || '',
        severity: (a['severity'] as 'WARNING' | 'CRITICAL') || 'WARNING',
        timestamp: (a['timestamp'] as string) || '',
      }))
    : [];

  const historyRaw = data['history'] as Array<Record<string, unknown>> | undefined;
  const history: DiagnosticHistoryEntry[] = Array.isArray(historyRaw)
    ? historyRaw.map((h) => ({
        id: (h['id'] as string) || '',
        timestamp: (h['timestamp'] as string) || '',
        module: (h['module'] as string) || '',
        status: (h['status'] as DiagnosticCheck['status']) || 'unknown',
        duration: (h['duration'] as number) || 0,
        message: (h['message'] as string) || '',
        details: (h['details'] as string) || undefined,
      }))
    : [];

  const passed = checks.filter((c) => c.status === 'pass').length;
  const failed = checks.filter((c) => c.status === 'fail').length;
  const total = checks.length;
  const overallStatus = failed > 0 ? 'fail' : passed === total && total > 0 ? 'pass' : 'warning';
  const totalDurationMs = checks.reduce((s, c) => s + c.duration, 0);

  return {
    checks,
    modules,
    alerts,
    history,
    overallStatus,
    lastRun: (data['lastRun'] as string) || null,
    totalDurationMs,
  };
}

export function computeSummary(checks: DiagnosticCheck[]) {
  const total = checks.length;
  const passed = checks.filter((c) => c.status === 'pass').length;
  const warning = checks.filter((c) => c.status === 'warning').length;
  const failed = checks.filter((c) => c.status === 'fail').length;
  const avgDuration = total > 0 ? checks.reduce((s, c) => s + c.duration, 0) / total : 0;
  return { total, passed, warning, failed, avgDuration };
}

export function filterChecks(checks: DiagnosticCheck[], search: string): DiagnosticCheck[] {
  if (!search.trim()) return checks;
  const q = search.toLowerCase();
  return checks.filter(
    (c) => c.name.toLowerCase().includes(q) || c.status.toLowerCase().includes(q) || (c.message && c.message.toLowerCase().includes(q)),
  );
}

export function sortChecks(checks: DiagnosticCheck[], key: string, dir: 'asc' | 'desc'): DiagnosticCheck[] {
  return [...checks].sort((a, b) => {
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

export function paginateChecks(checks: DiagnosticCheck[], page: number, pageSize: number): DiagnosticCheck[] {
  const start = page * pageSize;
  return checks.slice(start, start + pageSize);
}

export const useDiagnosticsStore = create<DiagnosticsState>((set) => ({
  activeTab: 'overview',
  snapshot: null,
  loading: false,
  error: '',
  lastRefresh: null,
  search: '',
  sortKey: 'name',
  sortDir: 'asc',
  selectedModule: null,
  page: 0,
  pageSize: 10,

  setActiveTab: (activeTab) => set({ activeTab }),
  setSnapshot: (snapshot) => set({ snapshot, loading: false, error: '', lastRefresh: new Date().toISOString() }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  setLastRefresh: (lastRefresh) => set({ lastRefresh }),
  setSearch: (search) => set({ search, page: 0 }),
  setSort: (sortKey, sortDir) => set({ sortKey, sortDir }),
  setSelectedModule: (selectedModule) => set({ selectedModule }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 0 }),
  clearSnapshot: () => set({ snapshot: null, lastRefresh: null }),
}));
