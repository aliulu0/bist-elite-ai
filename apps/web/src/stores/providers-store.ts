import { create } from 'zustand';
import type { ProviderHealthTab, ProviderHealthSnapshot, ProviderHealthEntry, ProviderAlert } from '@/components/providers/provider-types';
import { DEFAULT_FAILOVER_ORDER } from '@/components/providers/provider-types';

export interface ProvidersState {
  activeTab: ProviderHealthTab;
  snapshot: ProviderHealthSnapshot | null;
  loading: boolean;
  error: string;
  lastRefresh: string | null;
  search: string;
  sortKey: string;
  sortDir: 'asc' | 'desc';
  selectedProvider: string | null;
  page: number;
  pageSize: number;

  setActiveTab: (tab: ProviderHealthTab) => void;
  setSnapshot: (snapshot: ProviderHealthSnapshot) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setLastRefresh: (ts: string) => void;
  setSearch: (search: string) => void;
  setSort: (key: string, dir: 'asc' | 'desc') => void;
  setSelectedProvider: (provider: string | null) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  clearSnapshot: () => void;
}

export const EMPTY_SNAPSHOT: ProviderHealthSnapshot = {
  providers: [],
  latencyHistory: {},
  alerts: [],
  failoverOrder: DEFAULT_FAILOVER_ORDER,
  lastUpdate: null,
};

const mapProviderStatus = (status: string): ProviderHealthEntry['status'] => {
  if (status === 'healthy') return 'HEALTHY';
  if (status === 'degraded') return 'DEGRADED';
  if (status === 'unhealthy') return 'CRITICAL';
  return 'UNKNOWN';
};

const toIso = (ts: unknown): string | null => (typeof ts === 'number' && ts > 0 ? new Date(ts).toISOString() : null);

export function buildSnapshot(data: Record<string, unknown>): ProviderHealthSnapshot {
  const inner = (data['data'] ?? data) as Record<string, unknown>;
  const providersRaw = inner['providers'] as Array<Record<string, unknown>> | undefined;
  const providers: ProviderHealthEntry[] = Array.isArray(providersRaw)
    ? providersRaw.map((p) => ({
        name: (p['provider'] as string) || (p['name'] as string) || '',
        status: mapProviderStatus((p['status'] as string) || ''),
        latencyMs: (p['avgLatencyMs'] as number) ?? (p['latencyMs'] as number) ?? 0,
        successRate: (p['successRate'] as number) || 0,
        errorRate: (p['errorRate'] as number) || 0,
        reliabilityScore: (p['reliabilityScore'] as number) || 0,
        consecutiveFailures: (p['consecutiveFailures'] as number) || 0,
        totalRequests: (p['totalRequests'] as number) || 0,
        failedRequests: (p['failedRequests'] as number) || 0,
        timeoutCount: (p['timeoutCount'] as number) || 0,
        lastSuccessAt: toIso(p['lastSuccessTime']),
        lastFailureAt: toIso(p['lastFailureTime']),
        lastRecoveryAt: null,
        recoveryTimeMs: (p['recoveryTimeMs'] as number) ?? null,
      }))
    : [];

  const alerts: ProviderAlert[] = [];

  return {
    providers,
    latencyHistory: {},
    alerts,
    failoverOrder: DEFAULT_FAILOVER_ORDER,
    lastUpdate: (inner['timestamp'] as string) || (data['timestamp'] as string) || null,
  };
}

export function computeSummary(providers: ProviderHealthEntry[]) {
  const total = providers.length;
  const healthy = providers.filter((p) => p.status === 'HEALTHY').length;
  const warning = providers.filter((p) => p.status === 'DEGRADED').length;
  const critical = providers.filter((p) => p.status === 'CRITICAL' || p.status === 'OFFLINE').length;
  const avgLatency = total > 0 ? providers.reduce((s, p) => s + p.latencyMs, 0) / total : 0;
  const avgReliability = total > 0 ? providers.reduce((s, p) => s + p.reliabilityScore, 0) / total : 0;
  const totalErrors = providers.reduce((s, p) => s + p.failedRequests, 0);
  return { total, healthy, warning, critical, avgLatency, avgReliability, totalErrors };
}

export function filterProviders(providers: ProviderHealthEntry[], search: string): ProviderHealthEntry[] {
  if (!search.trim()) return providers;
  const q = search.toLowerCase();
  return providers.filter((p) => p.name.toLowerCase().includes(q) || p.status.toLowerCase().includes(q));
}

export function sortProviders(
  providers: ProviderHealthEntry[],
  key: string,
  dir: 'asc' | 'desc',
): ProviderHealthEntry[] {
  return [...providers].sort((a, b) => {
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

export function paginateProviders(providers: ProviderHealthEntry[], page: number, pageSize: number): ProviderHealthEntry[] {
  const start = page * pageSize;
  return providers.slice(start, start + pageSize);
}

export const useProvidersStore = create<ProvidersState>((set) => ({
  activeTab: 'overview',
  snapshot: null,
  loading: false,
  error: '',
  lastRefresh: null,
  search: '',
  sortKey: 'name',
  sortDir: 'asc',
  selectedProvider: null,
  page: 0,
  pageSize: 10,

  setActiveTab: (activeTab) => set({ activeTab }),
  setSnapshot: (snapshot) => set({ snapshot, loading: false, error: '', lastRefresh: new Date().toISOString() }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  setLastRefresh: (lastRefresh) => set({ lastRefresh }),
  setSearch: (search) => set({ search, page: 0 }),
  setSort: (sortKey, sortDir) => set({ sortKey, sortDir }),
  setSelectedProvider: (selectedProvider) => set({ selectedProvider }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 0 }),
  clearSnapshot: () => set({ snapshot: null, lastRefresh: null }),
}));
