import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkflowDashboardStore, buildSnapshot, filterWorkflows, sortWorkflows, paginateWorkflows, EMPTY_SNAPSHOT } from '@/stores/workflow-dashboard-store';
import type { WorkflowItem } from '@/components/workflow/workflow-types';

const sampleWorkflows: WorkflowItem[] = [
  { id: 'wf-1', type: 'ANALYSIS', status: 'RUNNING', symbol: 'GARAN', steps: [{ step: 'Step1', status: 'completed' }], currentStep: 'Step1', progress: 50, startedAt: '2026-01-15T10:00:00Z', createdAt: '2026-01-15T09:00:00Z' },
  { id: 'wf-2', type: 'SCANNING', status: 'COMPLETED', symbol: 'THYAO', steps: [{ step: 'Step1', status: 'completed' }], currentStep: '', progress: 100, completedAt: '2026-01-15T11:00:00Z', createdAt: '2026-01-15T08:00:00Z', durationMs: 3600000 },
  { id: 'wf-3', type: 'BACKTEST', status: 'FAILED', symbol: 'ASELS', steps: [{ step: 'Step1', status: 'failed', error: 'Error' }], currentStep: 'Step1', progress: 25, createdAt: '2026-01-15T07:00:00Z', retryCount: 2 },
];

describe('workflow-store', () => {
  beforeEach(() => { useWorkflowDashboardStore.setState({ snapshot: null, loading: false, error: '', search: '', filterStatus: '', filterType: '', activeTab: 'overview', page: 0, pageSize: 10, sortKey: 'createdAt', sortDir: 'desc', selectedWorkflow: null }); });

  describe('EMPTY_SNAPSHOT', () => {
    it('has correct defaults', () => { expect(EMPTY_SNAPSHOT.workflows).toEqual([]); expect(EMPTY_SNAPSHOT.statistics.totalCreated).toBe(0); expect(EMPTY_SNAPSHOT.queueStatus.pending).toBe(0); });
  });

  describe('buildSnapshot', () => {
    it('builds from workflows data', () => {
      const snap = buildSnapshot({ workflows: sampleWorkflows.map(w => ({ ...w })), queue: [], queueStatus: { pending: 2, running: 1, completed: 5, failed: 1 }, history: [], statistics: { totalCreated: 3, totalCompleted: 1, totalFailed: 1, totalCancelled: 0, activeWorkflows: 1, avgDurationMs: 3600000, byType: {} }, workers: [] });
      expect(snap.workflows).toHaveLength(3);
      expect(snap.queueStatus.pending).toBe(2);
      expect(snap.activeCount).toBe(1);
    });
    it('handles missing data', () => {
      const snap = buildSnapshot({});
      expect(snap.workflows).toEqual([]);
      expect(snap.statistics.totalCreated).toBe(0);
    });
    it('computes todayCount', () => {
      const snap = buildSnapshot({ workflows: sampleWorkflows.map(w => ({ ...w })), queue: [], queueStatus: { pending: 0, running: 0, completed: 0, failed: 0 }, history: [], statistics: { totalCreated: 3, totalCompleted: 1, totalFailed: 1, totalCancelled: 0, activeWorkflows: 1, avgDurationMs: 0, byType: {} }, workers: [] });
      expect(snap.todayCount).toBeGreaterThanOrEqual(0);
    });
    it('parses steps correctly', () => {
      const snap = buildSnapshot({ workflows: [{ id: '1', type: 'X', status: 'COMPLETED', symbol: 'TEST', steps: [{ step: 'S1', status: 'completed', durationMs: 100 }], currentStep: 'S1', progress: 100, createdAt: '2026-01-15T10:00:00Z' }], queue: [], queueStatus: { pending: 0, running: 0, completed: 0, failed: 0 }, history: [], statistics: { totalCreated: 1, totalCompleted: 1, totalFailed: 0, totalCancelled: 0, activeWorkflows: 0, avgDurationMs: 100, byType: {} }, workers: [] });
      expect(snap.workflows[0].steps[0].durationMs).toBe(100);
    });
  });

  describe('filterWorkflows', () => {
    it('returns all when no filters', () => { expect(filterWorkflows(sampleWorkflows, '', '', '')).toHaveLength(3); });
    it('filters by search', () => { expect(filterWorkflows(sampleWorkflows, 'GARAN', '', '')).toHaveLength(1); });
    it('filters by status', () => { expect(filterWorkflows(sampleWorkflows, '', 'RUNNING', '')).toHaveLength(1); });
    it('filters by type', () => { expect(filterWorkflows(sampleWorkflows, '', '', 'ANALYSIS')).toHaveLength(1); });
    it('combines filters', () => { expect(filterWorkflows(sampleWorkflows, 'ASELS', 'FAILED', '')).toHaveLength(1); });
  });

  describe('sortWorkflows', () => {
    it('sorts by type asc', () => { const s = sortWorkflows([...sampleWorkflows], 'type', 'asc'); expect(s[0].type).toBe('ANALYSIS'); });
    it('sorts by type desc', () => { const s = sortWorkflows([...sampleWorkflows], 'type', 'desc'); expect(s[0].type).toBe('SCANNING'); });
  });

  describe('paginateWorkflows', () => {
    it('paginates correctly', () => { expect(paginateWorkflows(sampleWorkflows, 0, 2)).toHaveLength(2); expect(paginateWorkflows(sampleWorkflows, 1, 2)).toHaveLength(1); });
    it('returns empty for out-of-bounds', () => { expect(paginateWorkflows(sampleWorkflows, 10, 2)).toHaveLength(0); });
  });

  describe('Zustand store', () => {
    it('has correct initial state', () => { const s = useWorkflowDashboardStore.getState(); expect(s.activeTab).toBe('overview'); expect(s.loading).toBe(false); expect(s.page).toBe(0); });
    it('setActiveTab', () => { useWorkflowDashboardStore.getState().setActiveTab('queue'); expect(useWorkflowDashboardStore.getState().activeTab).toBe('queue'); });
    it('setSearch resets page', () => { useWorkflowDashboardStore.getState().setPage(5); useWorkflowDashboardStore.getState().setSearch('test'); expect(useWorkflowDashboardStore.getState().page).toBe(0); });
    it('clearFilters resets all', () => { useWorkflowDashboardStore.getState().setSearch('x'); useWorkflowDashboardStore.getState().setFilterStatus('FAILED'); useWorkflowDashboardStore.getState().clearFilters(); const s = useWorkflowDashboardStore.getState(); expect(s.search).toBe(''); expect(s.filterStatus).toBe(''); });
    it('setSnapshot updates lastRefresh', () => { useWorkflowDashboardStore.getState().setSnapshot(EMPTY_SNAPSHOT); expect(useWorkflowDashboardStore.getState().lastRefresh).toBeTruthy(); });
    it('clearSnapshot resets', () => { useWorkflowDashboardStore.getState().setSnapshot(EMPTY_SNAPSHOT); useWorkflowDashboardStore.getState().clearSnapshot(); expect(useWorkflowDashboardStore.getState().snapshot).toBeNull(); });
    it('setError sets error and loading false', () => { useWorkflowDashboardStore.getState().setLoading(true); useWorkflowDashboardStore.getState().setError('fail'); expect(useWorkflowDashboardStore.getState().error).toBe('fail'); expect(useWorkflowDashboardStore.getState().loading).toBe(false); });
    it('setSelectedWorkflow', () => { useWorkflowDashboardStore.getState().setSelectedWorkflow(sampleWorkflows[0]); expect(useWorkflowDashboardStore.getState().selectedWorkflow?.id).toBe('wf-1'); });
    it('setFilterType resets page', () => { useWorkflowDashboardStore.getState().setPage(3); useWorkflowDashboardStore.getState().setFilterType('X'); expect(useWorkflowDashboardStore.getState().page).toBe(0); });
  });
});
