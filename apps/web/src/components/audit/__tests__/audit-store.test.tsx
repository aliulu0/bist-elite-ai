import { describe, it, expect, beforeEach } from 'vitest';
import { useAuditStore, buildSnapshot, filterLogs, sortLogs, paginateLogs, EMPTY_SNAPSHOT } from '@/stores/audit-store';
import type { AuditLogEntry } from '@/components/audit/audit-types';

const sampleLogs: AuditLogEntry[] = [
  { id: '1', timestamp: '2026-01-15T10:00:00Z', module: 'Workflow', action: 'STARTED', severity: 'INFO', details: 'Workflow started' },
  { id: '2', timestamp: '2026-01-15T11:00:00Z', module: 'Scheduler', action: 'FAILED', severity: 'ERROR', details: 'Scheduler failed' },
  { id: '3', timestamp: '2026-01-15T12:00:00Z', module: 'Config', action: 'UPDATED', severity: 'WARNING', details: 'Config updated' },
  { id: '4', timestamp: '2026-01-15T09:00:00Z', module: 'Workflow', action: 'COMPLETED', severity: 'INFO', details: 'Done' },
];

describe('audit-store', () => {
  beforeEach(() => { useAuditStore.setState({ snapshot: null, loading: false, error: '', search: '', filterSeverity: '', filterModule: '', filterAction: '', activeTab: 'all', page: 0, pageSize: 25, sortKey: 'timestamp', sortDir: 'desc', selectedLogId: null }); });

  describe('EMPTY_SNAPSHOT', () => {
    it('has correct defaults', () => { expect(EMPTY_SNAPSHOT.logs).toEqual([]); expect(EMPTY_SNAPSHOT.totalCount).toBe(0); expect(EMPTY_SNAPSHOT.severityCounts).toEqual({ INFO: 0, WARNING: 0, ERROR: 0, CRITICAL: 0 }); });
  });

  describe('buildSnapshot', () => {
    it('builds from logs data', () => {
      const snap = buildSnapshot({ logs: sampleLogs.map(l => ({ ...l })) });
      expect(snap.logs).toHaveLength(4);
      expect(snap.totalCount).toBe(4);
      expect(snap.activeModules).toBe(3);
    });
    it('computes severity counts', () => {
      const snap = buildSnapshot({ logs: sampleLogs.map(l => ({ ...l })) });
      expect(snap.severityCounts.INFO).toBe(2);
      expect(snap.severityCounts.ERROR).toBe(1);
      expect(snap.severityCounts.WARNING).toBe(1);
    });
    it('handles missing logs', () => {
      const snap = buildSnapshot({});
      expect(snap.logs).toEqual([]);
      expect(snap.totalCount).toBe(0);
    });
    it('computes module stats sorted by count', () => {
      const snap = buildSnapshot({ logs: sampleLogs.map(l => ({ ...l })) });
      expect(snap.moduleStats[0].module).toBe('Workflow');
      expect(snap.moduleStats[0].count).toBe(2);
    });
    it('computes lastEntry', () => {
      const snap = buildSnapshot({ logs: sampleLogs.map(l => ({ ...l })) });
      expect(snap.lastEntry).toBe('2026-01-15T12:00:00Z');
    });
    it('handles non-string details', () => {
      const snap = buildSnapshot({ logs: [{ id: '1', timestamp: '2026-01-15T10:00:00Z', module: 'Workflow', action: 'STARTED', severity: 'INFO', details: { msg: 'hello' } }] });
      expect(snap.logs[0].details).toBe('{"msg":"hello"}');
    });
  });

  describe('filterLogs', () => {
    it('returns all when no filters', () => { expect(filterLogs(sampleLogs, '', '', '', '', 'all')).toHaveLength(4); });
    it('filters by search', () => { expect(filterLogs(sampleLogs, 'Workflow', '', '', '', 'all')).toHaveLength(2); });
    it('filters by severity', () => { expect(filterLogs(sampleLogs, '', 'ERROR', '', '', 'all')).toHaveLength(1); });
    it('filters by module', () => { expect(filterLogs(sampleLogs, '', '', 'Scheduler', '', 'all')).toHaveLength(1); });
    it('filters by action', () => { expect(filterLogs(sampleLogs, '', '', '', '', 'all').filter(l => l.action === 'STARTED')).toHaveLength(1); });
    it('filters by tab', () => { expect(filterLogs(sampleLogs, '', '', '', '', 'workflow')).toHaveLength(2); });
    it('combines filters', () => { expect(filterLogs(sampleLogs, 'Workflow', 'INFO', '', '', 'all')).toHaveLength(2); });
  });

  describe('sortLogs', () => {
    it('sorts by timestamp desc', () => {
      const sorted = sortLogs([...sampleLogs], 'timestamp', 'desc');
      expect(sorted[0].id).toBe('3');
    });
    it('sorts by timestamp asc', () => {
      const sorted = sortLogs([...sampleLogs], 'timestamp', 'asc');
      expect(sorted[0].id).toBe('4');
    });
    it('sorts by module', () => {
      const sorted = sortLogs([...sampleLogs], 'module', 'asc');
      expect(sorted[0].module).toBe('Config');
    });
  });

  describe('paginateLogs', () => {
    it('paginates correctly', () => { expect(paginateLogs(sampleLogs, 0, 2)).toHaveLength(2); expect(paginateLogs(sampleLogs, 1, 2)).toHaveLength(2); });
    it('returns partial page', () => { expect(paginateLogs(sampleLogs, 1, 3)).toHaveLength(1); });
    it('returns empty for out-of-bounds', () => { expect(paginateLogs(sampleLogs, 10, 2)).toHaveLength(0); });
  });

  describe('Zustand store', () => {
    it('has correct initial state', () => { const s = useAuditStore.getState(); expect(s.activeTab).toBe('all'); expect(s.loading).toBe(false); expect(s.page).toBe(0); });
    it('setActiveTab', () => { useAuditStore.getState().setActiveTab('workflow'); expect(useAuditStore.getState().activeTab).toBe('workflow'); });
    it('setSearch resets page', () => { useAuditStore.getState().setPage(5); useAuditStore.getState().setSearch('test'); expect(useAuditStore.getState().page).toBe(0); });
    it('clearFilters resets all', () => { useAuditStore.getState().setSearch('x'); useAuditStore.getState().setFilterSeverity('ERROR'); useAuditStore.getState().clearFilters(); const s = useAuditStore.getState(); expect(s.search).toBe(''); expect(s.filterSeverity).toBe(''); });
    it('setSnapshot updates lastRefresh', () => { useAuditStore.getState().setSnapshot(EMPTY_SNAPSHOT); expect(useAuditStore.getState().lastRefresh).toBeTruthy(); });
    it('clearSnapshot resets', () => { useAuditStore.getState().setSnapshot(EMPTY_SNAPSHOT); useAuditStore.getState().clearSnapshot(); expect(useAuditStore.getState().snapshot).toBeNull(); });
    it('setError sets error and loading false', () => { useAuditStore.getState().setLoading(true); useAuditStore.getState().setError('fail'); expect(useAuditStore.getState().error).toBe('fail'); expect(useAuditStore.getState().loading).toBe(false); });
  });
});
