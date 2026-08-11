import { describe, it, expect, beforeEach } from 'vitest';
import { usePerformanceStore, buildSnapshot, filterEngines, sortEngines, EMPTY_SNAPSHOT } from '@/stores/performance-store';

describe('filterEngines', () => {
  const engines = [
    { name: 'financial', totalCalls: 0, avgDurationMs: 0, p95DurationMs: 0, p99DurationMs: 0, successRate: 0, errorCount: 0, lastExecutedAt: null },
    { name: 'technical', totalCalls: 0, avgDurationMs: 0, p95DurationMs: 0, p99DurationMs: 0, successRate: 0, errorCount: 0, lastExecutedAt: null },
    { name: 'scanner', totalCalls: 0, avgDurationMs: 0, p95DurationMs: 0, p99DurationMs: 0, successRate: 0, errorCount: 0, lastExecutedAt: null },
  ];

  it('returns all when empty search', () => {
    expect(filterEngines(engines, '')).toHaveLength(3);
  });

  it('filters by name', () => {
    expect(filterEngines(engines, 'fin')).toHaveLength(1);
    expect(filterEngines(engines, 'fin')[0].name).toBe('financial');
  });

  it('filters case insensitive', () => {
    expect(filterEngines(engines, 'TECH')).toHaveLength(1);
  });

  it('returns empty when no match', () => {
    expect(filterEngines(engines, 'xyz')).toHaveLength(0);
  });
});

describe('sortEngines', () => {
  const engines = [
    { name: 'b', totalCalls: 50, avgDurationMs: 100, p95DurationMs: 0, p99DurationMs: 0, successRate: 0, errorCount: 0, lastExecutedAt: null },
    { name: 'a', totalCalls: 100, avgDurationMs: 50, p95DurationMs: 0, p99DurationMs: 0, successRate: 0, errorCount: 0, lastExecutedAt: null },
    { name: 'c', totalCalls: 25, avgDurationMs: 200, p95DurationMs: 0, p99DurationMs: 0, successRate: 0, errorCount: 0, lastExecutedAt: null },
  ];

  it('sorts name asc', () => {
    const result = sortEngines(engines, 'name', 'asc');
    expect(result.map((e) => e.name)).toEqual(['a', 'b', 'c']);
  });

  it('sorts name desc', () => {
    const result = sortEngines(engines, 'name', 'desc');
    expect(result.map((e) => e.name)).toEqual(['c', 'b', 'a']);
  });

  it('sorts totalCalls asc', () => {
    const result = sortEngines(engines, 'totalCalls', 'asc');
    expect(result.map((e) => e.totalCalls)).toEqual([25, 50, 100]);
  });

  it('sorts totalCalls desc', () => {
    const result = sortEngines(engines, 'totalCalls', 'desc');
    expect(result.map((e) => e.totalCalls)).toEqual([100, 50, 25]);
  });
});

describe('buildSnapshot', () => {
  it('builds from empty metrics', () => {
    const result = buildSnapshot({ data: { metrics: [], system: {}, cache: {}, health: { status: 'HEALTHY' }, totalRecorded: 0, timestamp: '' }, timestamp: '' });
    expect(result.health).toBe('HEALTHY');
    expect(result.engines).toHaveLength(0);
    expect(result.apiMetrics).toHaveLength(0);
  });

  it('builds from populated metrics', () => {
    const result = buildSnapshot({
      data: {
        metrics: [
          { name: 'financial', category: 'engine_execution', count: 100, avg: 45, p50: 40, p95: 80, p99: 120, lastValue: 45, lastTimestamp: 1760000000000, rollingAvg: 98.5 },
          { name: 'yahoo', category: 'provider_latency', count: 10, avg: 120, p50: 110, p95: 200, p99: 300, lastValue: 120, lastTimestamp: 1760000000000, rollingAvg: 98.5 },
        ],
        system: { memoryUsageBytes: 536870912, heapUsedBytes: 209715200, heapTotalBytes: 536870912, externalBytes: 0, uptimeMs: 86400000, cpuUsagePercent: 45, rssBytes: 536870912 },
        cache: { hits: 100, misses: 10, hitRate: 87.5, totalOperations: 110 },
        health: { status: 'HEALTHY', timestamp: '' },
        totalRecorded: 1,
        timestamp: '',
      },
      timestamp: '',
    });
    expect(result.engines).toHaveLength(1);
    expect(result.engines[0].name).toBe('financial');
    expect(result.cacheMetrics.hitRate).toBe(87.5);
    expect(result.providerMetrics).toHaveLength(1);
    expect(result.providerMetrics[0].name).toBe('yahoo');
  });

  it('sets DEGRADED for high CPU', () => {
    const result = buildSnapshot({ data: { metrics: [], system: { cpuUsagePercent: 75, memoryUsageBytes: 0, uptimeMs: 0 }, cache: {}, health: { status: 'HEALTHY' }, totalRecorded: 0, timestamp: '' }, timestamp: '' });
    expect(result.health).toBe('DEGRADED');
  });

  it('sets UNHEALTHY for critical CPU', () => {
    const result = buildSnapshot({ data: { metrics: [], system: { cpuUsagePercent: 95, memoryUsageBytes: 0, uptimeMs: 0 }, cache: {}, health: { status: 'HEALTHY' }, totalRecorded: 0, timestamp: '' }, timestamp: '' });
    expect(result.health).toBe('UNHEALTHY');
  });

  it('extracts api metrics', () => {
    const result = buildSnapshot({
      data: {
        metrics: [
          { name: '/api/test', category: 'api_response', count: 100, avg: 50, p50: 40, p95: 120, p99: 250, lastValue: 50, lastTimestamp: 1760000000000, rollingAvg: 99 },
        ],
        system: {}, cache: {}, health: { status: 'HEALTHY' }, totalRecorded: 1, timestamp: '',
      },
      timestamp: '',
    });
    expect(result.apiMetrics).toHaveLength(1);
    expect(result.totalRequests).toBe(100);
  });

  it('extracts pipeline metrics', () => {
    const result = buildSnapshot({
      data: {
        metrics: [
          { name: 'Analysis', category: 'pipeline', count: 50, avg: 3000, p50: 2800, p95: 4000, p99: 6000, lastValue: 3000, lastTimestamp: 1760000000000, rollingAvg: 96 },
        ],
        system: {}, cache: {}, health: { status: 'HEALTHY' }, totalRecorded: 1, timestamp: '',
      },
      timestamp: '',
    });
    expect(result.pipelines).toHaveLength(1);
    expect(result.pipelines[0].name).toBe('Analysis');
  });
});

describe('usePerformanceStore', () => {
  beforeEach(() => {
    usePerformanceStore.setState({
      activeTab: 'overview',
      snapshot: null,
      loading: false,
      error: '',
      lastRefresh: null,
      search: '',
      sortKey: 'name',
      sortDir: 'asc',
      selectedEngine: null,
    });
  });

  it('has default state', () => {
    const state = usePerformanceStore.getState();
    expect(state.activeTab).toBe('overview');
    expect(state.snapshot).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('setActiveTab', () => {
    usePerformanceStore.getState().setActiveTab('engines');
    expect(usePerformanceStore.getState().activeTab).toBe('engines');
  });

  it('setSnapshot', () => {
    const snap = { ...EMPTY_SNAPSHOT, totalRequests: 100 };
    usePerformanceStore.getState().setSnapshot(snap);
    expect(usePerformanceStore.getState().snapshot?.totalRequests).toBe(100);
    expect(usePerformanceStore.getState().loading).toBe(false);
    expect(usePerformanceStore.getState().lastRefresh).toBeDefined();
  });

  it('setLoading', () => {
    usePerformanceStore.getState().setLoading(true);
    expect(usePerformanceStore.getState().loading).toBe(true);
  });

  it('setError', () => {
    usePerformanceStore.getState().setError('test error');
    expect(usePerformanceStore.getState().error).toBe('test error');
    expect(usePerformanceStore.getState().loading).toBe(false);
  });

  it('setSearch', () => {
    usePerformanceStore.getState().setSearch('financial');
    expect(usePerformanceStore.getState().search).toBe('financial');
  });

  it('setSort', () => {
    usePerformanceStore.getState().setSort('totalCalls', 'desc');
    expect(usePerformanceStore.getState().sortKey).toBe('totalCalls');
    expect(usePerformanceStore.getState().sortDir).toBe('desc');
  });

  it('setSelectedEngine', () => {
    usePerformanceStore.getState().setSelectedEngine('financial');
    expect(usePerformanceStore.getState().selectedEngine).toBe('financial');
  });

  it('clearSnapshot', () => {
    usePerformanceStore.getState().setSnapshot(EMPTY_SNAPSHOT);
    usePerformanceStore.getState().clearSnapshot();
    expect(usePerformanceStore.getState().snapshot).toBeNull();
    expect(usePerformanceStore.getState().lastRefresh).toBeNull();
  });

  it('setLastRefresh', () => {
    usePerformanceStore.getState().setLastRefresh('2026-01-15T10:00:00Z');
    expect(usePerformanceStore.getState().lastRefresh).toBe('2026-01-15T10:00:00Z');
  });
});

