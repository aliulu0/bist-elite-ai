import { describe, it, expect, beforeEach } from 'vitest';
import { useDiagnosticsStore, buildSnapshot, filterChecks, sortChecks, paginateChecks, computeSummary, EMPTY_SNAPSHOT } from '@/stores/diagnostics-store';
import type { DiagnosticCheck } from '@/components/diagnostics/diagnostics-types';

const mockChecks: DiagnosticCheck[] = [
  { name: 'Database', status: 'pass', message: 'OK', duration: 12 },
  { name: 'Redis', status: 'warning', message: 'Slow', duration: 80 },
  { name: 'Workflow', status: 'fail', message: 'Error', duration: 500 },
];

describe('filterChecks', () => {
  it('returns all when empty search', () => {
    expect(filterChecks(mockChecks, '')).toHaveLength(3);
  });

  it('filters by name', () => {
    expect(filterChecks(mockChecks, 'database')).toHaveLength(1);
  });

  it('filters by status', () => {
    expect(filterChecks(mockChecks, 'warning')).toHaveLength(1);
  });

  it('filters case insensitive', () => {
    expect(filterChecks(mockChecks, 'DATABASE')).toHaveLength(1);
  });

  it('returns empty when no match', () => {
    expect(filterChecks(mockChecks, 'xyz')).toHaveLength(0);
  });
});

describe('sortChecks', () => {
  it('sorts name asc', () => {
    const result = sortChecks(mockChecks, 'name', 'asc');
    expect(result.map((c) => c.name)).toEqual(['Database', 'Redis', 'Workflow']);
  });

  it('sorts name desc', () => {
    const result = sortChecks(mockChecks, 'name', 'desc');
    expect(result.map((c) => c.name)).toEqual(['Workflow', 'Redis', 'Database']);
  });

  it('sorts duration asc', () => {
    const result = sortChecks(mockChecks, 'duration', 'asc');
    expect(result.map((c) => c.duration)).toEqual([12, 80, 500]);
  });

  it('sorts duration desc', () => {
    const result = sortChecks(mockChecks, 'duration', 'desc');
    expect(result.map((c) => c.duration)).toEqual([500, 80, 12]);
  });
});

describe('paginateChecks', () => {
  it('returns first page', () => {
    expect(paginateChecks(mockChecks, 0, 2)).toHaveLength(2);
  });

  it('returns second page', () => {
    expect(paginateChecks(mockChecks, 1, 2)).toHaveLength(1);
  });

  it('returns empty for out of range', () => {
    expect(paginateChecks(mockChecks, 5, 2)).toHaveLength(0);
  });
});

describe('computeSummary', () => {
  it('computes correct summary', () => {
    const summary = computeSummary(mockChecks);
    expect(summary.total).toBe(3);
    expect(summary.passed).toBe(1);
    expect(summary.warning).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.avgDuration).toBeGreaterThan(0);
  });

  it('handles empty checks', () => {
    const summary = computeSummary([]);
    expect(summary.total).toBe(0);
    expect(summary.avgDuration).toBe(0);
  });
});

describe('buildSnapshot', () => {
  it('builds from empty data', () => {
    const result = buildSnapshot({});
    expect(result.checks).toHaveLength(0);
    expect(result.alerts).toHaveLength(0);
    expect(result.overallStatus).toBe('warning');
  });

  it('builds from populated data', () => {
    const result = buildSnapshot({
      checks: [{ name: 'Test', status: 'pass', message: 'OK', duration: 10 }],
      modules: [{ name: 'Test Module', status: 'pass' }],
      alerts: [{ id: 'a1', type: 'FAILED_CHECK', title: 'Alert', description: 'desc', severity: 'CRITICAL', timestamp: '2026-01-15' }],
      history: [{ id: 'h1', timestamp: '2026-01-15', module: 'Test', status: 'pass', duration: 10, message: 'OK' }],
      lastRun: '2026-01-15T10:00:00Z',
    });
    expect(result.checks).toHaveLength(1);
    expect(result.modules).toHaveLength(1);
    expect(result.alerts).toHaveLength(1);
    expect(result.history).toHaveLength(1);
    expect(result.overallStatus).toBe('pass');
    expect(result.totalDurationMs).toBe(10);
  });

  it('sets overallStatus to fail when any check fails', () => {
    const result = buildSnapshot({
      checks: [
        { name: 'A', status: 'pass', message: '', duration: 0 },
        { name: 'B', status: 'fail', message: '', duration: 0 },
      ],
    });
    expect(result.overallStatus).toBe('fail');
  });
});

describe('useDiagnosticsStore', () => {
  beforeEach(() => {
    useDiagnosticsStore.setState({
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
    });
  });

  it('has default state', () => {
    const state = useDiagnosticsStore.getState();
    expect(state.activeTab).toBe('overview');
    expect(state.snapshot).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('setActiveTab', () => {
    useDiagnosticsStore.getState().setActiveTab('workflow');
    expect(useDiagnosticsStore.getState().activeTab).toBe('workflow');
  });

  it('setSnapshot', () => {
    useDiagnosticsStore.getState().setSnapshot(EMPTY_SNAPSHOT);
    expect(useDiagnosticsStore.getState().snapshot).toBeDefined();
    expect(useDiagnosticsStore.getState().loading).toBe(false);
    expect(useDiagnosticsStore.getState().lastRefresh).toBeDefined();
  });

  it('setLoading', () => {
    useDiagnosticsStore.getState().setLoading(true);
    expect(useDiagnosticsStore.getState().loading).toBe(true);
  });

  it('setError', () => {
    useDiagnosticsStore.getState().setError('test error');
    expect(useDiagnosticsStore.getState().error).toBe('test error');
    expect(useDiagnosticsStore.getState().loading).toBe(false);
  });

  it('setSearch resets page', () => {
    useDiagnosticsStore.getState().setPage(3);
    useDiagnosticsStore.getState().setSearch('test');
    expect(useDiagnosticsStore.getState().page).toBe(0);
  });

  it('setSort', () => {
    useDiagnosticsStore.getState().setSort('duration', 'desc');
    expect(useDiagnosticsStore.getState().sortKey).toBe('duration');
    expect(useDiagnosticsStore.getState().sortDir).toBe('desc');
  });

  it('setSelectedModule', () => {
    useDiagnosticsStore.getState().setSelectedModule('Workflow');
    expect(useDiagnosticsStore.getState().selectedModule).toBe('Workflow');
  });

  it('setPage', () => {
    useDiagnosticsStore.getState().setPage(2);
    expect(useDiagnosticsStore.getState().page).toBe(2);
  });

  it('setPageSize resets page', () => {
    useDiagnosticsStore.getState().setPage(3);
    useDiagnosticsStore.getState().setPageSize(5);
    expect(useDiagnosticsStore.getState().pageSize).toBe(5);
    expect(useDiagnosticsStore.getState().page).toBe(0);
  });

  it('clearSnapshot', () => {
    useDiagnosticsStore.getState().setSnapshot(EMPTY_SNAPSHOT);
    useDiagnosticsStore.getState().clearSnapshot();
    expect(useDiagnosticsStore.getState().snapshot).toBeNull();
    expect(useDiagnosticsStore.getState().lastRefresh).toBeNull();
  });
});
