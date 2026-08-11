import { describe, it, expect, beforeEach } from 'vitest';
import {
  useProvidersStore,
  buildSnapshot,
  filterProviders,
  sortProviders,
  paginateProviders,
  computeSummary,
  EMPTY_SNAPSHOT,
} from '@/stores/providers-store';
import type { ProviderHealthEntry } from '@/components/providers/provider-types';
import { DEFAULT_FAILOVER_ORDER } from '@/components/providers/provider-types';

const mockProviders: ProviderHealthEntry[] = [
  {
    name: 'Yahoo Finance',
    status: 'HEALTHY',
    latencyMs: 120,
    successRate: 98.5,
    errorRate: 1.5,
    reliabilityScore: 97.2,
    consecutiveFailures: 0,
    totalRequests: 1240,
    failedRequests: 18,
    timeoutCount: 2,
    lastSuccessAt: '2026-01-15T10:00:00Z',
    lastFailureAt: '2026-01-15T08:00:00Z',
    lastRecoveryAt: null,
    recoveryTimeMs: null,
  },
  {
    name: 'Fintables',
    status: 'DEGRADED',
    latencyMs: 850,
    successRate: 82.3,
    errorRate: 17.7,
    reliabilityScore: 80.1,
    consecutiveFailures: 5,
    totalRequests: 430,
    failedRequests: 76,
    timeoutCount: 12,
    lastSuccessAt: '2026-01-15T09:30:00Z',
    lastFailureAt: '2026-01-15T10:00:00Z',
    lastRecoveryAt: '2026-01-15T09:25:00Z',
    recoveryTimeMs: 300000,
  },
  {
    name: 'Investing',
    status: 'CRITICAL',
    latencyMs: 2500,
    successRate: 45.0,
    errorRate: 55.0,
    reliabilityScore: 42.5,
    consecutiveFailures: 15,
    totalRequests: 200,
    failedRequests: 110,
    timeoutCount: 40,
    lastSuccessAt: '2026-01-15T06:00:00Z',
    lastFailureAt: '2026-01-15T10:05:00Z',
    lastRecoveryAt: '2026-01-15T05:50:00Z',
    recoveryTimeMs: 600000,
  },
];

describe('filterProviders', () => {
  it('returns all when empty search', () => {
    expect(filterProviders(mockProviders, '')).toHaveLength(3);
  });

  it('filters by name', () => {
    expect(filterProviders(mockProviders, 'yahoo')).toHaveLength(1);
    expect(filterProviders(mockProviders, 'yahoo')[0].name).toBe('Yahoo Finance');
  });

  it('filters by status', () => {
    expect(filterProviders(mockProviders, 'degraded')).toHaveLength(1);
    expect(filterProviders(mockProviders, 'degraded')[0].name).toBe('Fintables');
  });

  it('filters case insensitive', () => {
    expect(filterProviders(mockProviders, 'YAHOO')).toHaveLength(1);
  });

  it('returns empty when no match', () => {
    expect(filterProviders(mockProviders, 'xyz')).toHaveLength(0);
  });

  it('filters by partial name', () => {
    expect(filterProviders(mockProviders, 'finta')).toHaveLength(1);
  });
});

describe('sortProviders', () => {
  it('sorts name asc', () => {
    const result = sortProviders(mockProviders, 'name', 'asc');
    expect(result.map((p) => p.name)).toEqual(['Fintables', 'Investing', 'Yahoo Finance']);
  });

  it('sorts name desc', () => {
    const result = sortProviders(mockProviders, 'name', 'desc');
    expect(result.map((p) => p.name)).toEqual(['Yahoo Finance', 'Investing', 'Fintables']);
  });

  it('sorts latencyMs asc', () => {
    const result = sortProviders(mockProviders, 'latencyMs', 'asc');
    expect(result.map((p) => p.latencyMs)).toEqual([120, 850, 2500]);
  });

  it('sorts latencyMs desc', () => {
    const result = sortProviders(mockProviders, 'latencyMs', 'desc');
    expect(result.map((p) => p.latencyMs)).toEqual([2500, 850, 120]);
  });

  it('sorts reliabilityScore desc', () => {
    const result = sortProviders(mockProviders, 'reliabilityScore', 'desc');
    expect(result.map((p) => p.reliabilityScore)).toEqual([97.2, 80.1, 42.5]);
  });

  it('does not mutate original', () => {
    const original = [...mockProviders];
    sortProviders(mockProviders, 'name', 'asc');
    expect(mockProviders).toEqual(original);
  });
});

describe('paginateProviders', () => {
  it('returns first page', () => {
    expect(paginateProviders(mockProviders, 0, 2)).toHaveLength(2);
    expect(paginateProviders(mockProviders, 0, 2)[0].name).toBe('Yahoo Finance');
  });

  it('returns second page', () => {
    expect(paginateProviders(mockProviders, 1, 2)).toHaveLength(1);
    expect(paginateProviders(mockProviders, 1, 2)[0].name).toBe('Investing');
  });

  it('returns empty for out of range page', () => {
    expect(paginateProviders(mockProviders, 5, 2)).toHaveLength(0);
  });
});

describe('computeSummary', () => {
  it('computes correct summary', () => {
    const summary = computeSummary(mockProviders);
    expect(summary.total).toBe(3);
    expect(summary.healthy).toBe(1);
    expect(summary.warning).toBe(1);
    expect(summary.critical).toBe(1);
    expect(summary.avgLatency).toBeGreaterThan(0);
    expect(summary.avgReliability).toBeGreaterThan(0);
    expect(summary.totalErrors).toBe(204);
  });

  it('handles empty providers', () => {
    const summary = computeSummary([]);
    expect(summary.total).toBe(0);
    expect(summary.healthy).toBe(0);
    expect(summary.avgLatency).toBe(0);
    expect(summary.avgReliability).toBe(0);
    expect(summary.totalErrors).toBe(0);
  });
});

describe('buildSnapshot', () => {
  it('builds from empty data', () => {
    const result = buildSnapshot({});
    expect(result.providers).toHaveLength(0);
    expect(result.alerts).toHaveLength(0);
    expect(result.failoverOrder).toHaveLength(4);
  });

  it('builds from populated data', () => {
    const result = buildSnapshot({
      data: {
        providers: [
          { provider: 'Yahoo', status: 'healthy', avgLatencyMs: 100, reliabilityScore: 95 },
        ],
        overallStatus: 'healthy',
        totalProviders: 1,
        healthyCount: 1,
        degradedCount: 0,
        unhealthyCount: 0,
        timestamp: '2026-01-15T10:00:00Z',
      },
    });
    expect(result.providers).toHaveLength(1);
    expect(result.providers[0].name).toBe('Yahoo');
    expect(result.alerts).toHaveLength(0);
    expect(result.latencyHistory).toEqual({});
    expect(result.failoverOrder).toEqual(DEFAULT_FAILOVER_ORDER);
    expect(result.lastUpdate).toBe('2026-01-15T10:00:00Z');
  });

  it('handles avgLatencyMs', () => {
    const result = buildSnapshot({
      data: {
        providers: [{ provider: 'Test', status: 'healthy', avgLatencyMs: 250, reliabilityScore: 0 }],
        overallStatus: 'healthy',
      },
    });
    expect(result.providers[0].latencyMs).toBe(250);
  });

  it('handles reliability score', () => {
    const result = buildSnapshot({
      data: {
        providers: [{ provider: 'Test', status: 'healthy', avgLatencyMs: 0, reliabilityScore: 88.5 }],
        overallStatus: 'healthy',
      },
    });
    expect(result.providers[0].reliabilityScore).toBe(88.5);
  });

  it('maps status values', () => {
    const result = buildSnapshot({
      data: {
        providers: [
          { provider: 'A', status: 'healthy', avgLatencyMs: 0, reliabilityScore: 0 },
          { provider: 'B', status: 'degraded', avgLatencyMs: 0, reliabilityScore: 0 },
          { provider: 'C', status: 'unhealthy', avgLatencyMs: 0, reliabilityScore: 0 },
        ],
        overallStatus: 'degraded',
      },
    });
    expect(result.providers[0].status).toBe('HEALTHY');
    expect(result.providers[1].status).toBe('DEGRADED');
    expect(result.providers[2].status).toBe('CRITICAL');
  });
});

describe('useProvidersStore', () => {
  beforeEach(() => {
    useProvidersStore.setState({
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
    });
  });

  it('has default state', () => {
    const state = useProvidersStore.getState();
    expect(state.activeTab).toBe('overview');
    expect(state.snapshot).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('setActiveTab', () => {
    useProvidersStore.getState().setActiveTab('yahoo');
    expect(useProvidersStore.getState().activeTab).toBe('yahoo');
  });

  it('setSnapshot', () => {
    useProvidersStore.getState().setSnapshot(EMPTY_SNAPSHOT);
    expect(useProvidersStore.getState().snapshot).toBeDefined();
    expect(useProvidersStore.getState().loading).toBe(false);
    expect(useProvidersStore.getState().lastRefresh).toBeDefined();
  });

  it('setLoading', () => {
    useProvidersStore.getState().setLoading(true);
    expect(useProvidersStore.getState().loading).toBe(true);
  });

  it('setError', () => {
    useProvidersStore.getState().setError('test error');
    expect(useProvidersStore.getState().error).toBe('test error');
    expect(useProvidersStore.getState().loading).toBe(false);
  });

  it('setSearch resets page', () => {
    useProvidersStore.getState().setPage(3);
    useProvidersStore.getState().setSearch('yahoo');
    expect(useProvidersStore.getState().page).toBe(0);
    expect(useProvidersStore.getState().search).toBe('yahoo');
  });

  it('setSort', () => {
    useProvidersStore.getState().setSort('latencyMs', 'desc');
    expect(useProvidersStore.getState().sortKey).toBe('latencyMs');
    expect(useProvidersStore.getState().sortDir).toBe('desc');
  });

  it('setSelectedProvider', () => {
    useProvidersStore.getState().setSelectedProvider('Yahoo Finance');
    expect(useProvidersStore.getState().selectedProvider).toBe('Yahoo Finance');
  });

  it('setPage', () => {
    useProvidersStore.getState().setPage(2);
    expect(useProvidersStore.getState().page).toBe(2);
  });

  it('setPageSize resets page', () => {
    useProvidersStore.getState().setPage(3);
    useProvidersStore.getState().setPageSize(5);
    expect(useProvidersStore.getState().pageSize).toBe(5);
    expect(useProvidersStore.getState().page).toBe(0);
  });

  it('clearSnapshot', () => {
    useProvidersStore.getState().setSnapshot(EMPTY_SNAPSHOT);
    useProvidersStore.getState().clearSnapshot();
    expect(useProvidersStore.getState().snapshot).toBeNull();
    expect(useProvidersStore.getState().lastRefresh).toBeNull();
  });

  it('setLastRefresh', () => {
    useProvidersStore.getState().setLastRefresh('2026-01-15T10:00:00Z');
    expect(useProvidersStore.getState().lastRefresh).toBe('2026-01-15T10:00:00Z');
  });
});
