import { create } from 'zustand';
import type { WorkflowTab, WorkflowItem, WorkflowStatus, WorkflowSnapshot } from '@/components/workflow/workflow-types';

export interface WorkflowDashboardState {
  activeTab: WorkflowTab;
  snapshot: WorkflowSnapshot | null;
  loading: boolean;
  error: string;
  lastRefresh: string | null;
  search: string;
  sortKey: string;
  sortDir: 'asc' | 'desc';
  selectedWorkflow: WorkflowItem | null;
  page: number;
  pageSize: number;
  filterStatus: WorkflowStatus | '';
  filterType: string;

  setActiveTab: (tab: WorkflowTab) => void;
  setSnapshot: (snapshot: WorkflowSnapshot) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setLastRefresh: (ts: string) => void;
  setSearch: (search: string) => void;
  setSort: (key: string, dir: 'asc' | 'desc') => void;
  setSelectedWorkflow: (wf: WorkflowItem | null) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setFilterStatus: (status: WorkflowStatus | '') => void;
  setFilterType: (type: string) => void;
  clearFilters: () => void;
  clearSnapshot: () => void;
}

export const EMPTY_SNAPSHOT: WorkflowSnapshot = {
  workflows: [],
  queue: [],
  queueStatus: { pending: 0, running: 0, completed: 0, failed: 0 },
  history: [],
  statistics: { totalCreated: 0, totalCompleted: 0, totalFailed: 0, totalCancelled: 0, activeWorkflows: 0, avgDurationMs: 0, byType: {} },
  workers: [],
  todayCount: 0,
  lastWorkflow: null,
  activeCount: 0,
};

const WORKFLOW_STATUS_MAP: Record<string, WorkflowStatus> = {
  pending: 'PENDING',
  queued: 'QUEUED',
  running: 'RUNNING',
  completed: 'COMPLETED',
  failed: 'FAILED',
  timeout: 'TIMEOUT',
  cancelled: 'CANCELLED',
  retrying: 'RETRYING',
};

const mapStatus = (status: string | undefined): WorkflowStatus => WORKFLOW_STATUS_MAP[(status || '').toLowerCase()] || 'PENDING';

export function buildSnapshot(data: Record<string, unknown>): WorkflowSnapshot {
  const workflowsRaw = data['workflows'] as Array<Record<string, unknown>> | undefined;
  const workflows: WorkflowItem[] = Array.isArray(workflowsRaw)
    ? workflowsRaw.map((w) => ({
        id: (w['id'] as string) || '',
        type: (w['type'] as string) || '',
        status: mapStatus(w['status'] as string),
        symbol: (w['symbol'] as string) || '',
        steps: Array.isArray(w['steps'])
          ? (w['steps'] as Array<Record<string, unknown>>).map((s) => ({
              step: (s['step'] as string) || '',
              status: (s['status'] as string) || 'waiting',
              startedAt: (s['startedAt'] as string) || undefined,
              completedAt: (s['completedAt'] as string) || undefined,
              durationMs: (s['durationMs'] as number) || undefined,
              error: (s['error'] as string) || undefined,
            }))
          : [],
        currentStep: (w['currentStep'] as string) || '',
        progress: (w['progress'] as number) || 0,
        startedAt: (w['startedAt'] as string) || undefined,
        completedAt: (w['completedAt'] as string) || undefined,
        durationMs: (w['durationMs'] as number) || undefined,
        createdAt: (w['createdAt'] as string) || '',
        worker: (w['worker'] as string) || undefined,
        retryCount: (w['retryCount'] as number) || undefined,
        priority: (w['priority'] as string) || undefined,
      }))
    : [];

  const queueRaw = data['queue'] as Array<Record<string, unknown>> | undefined;
  const queue = Array.isArray(queueRaw)
    ? queueRaw.map((j) => ({
        id: (j['id'] as string) || '',
        workflowId: (j['workflowId'] as string) || '',
        status: (j['state'] as string) || (j['status'] as string) || 'PENDING',
        priority: (j['priority'] as string) || 'NORMAL',
        createdAt: (j['createdAt'] as string) || '',
      }))
    : [];

  const queueStatusRaw = data['queueStatus'] as Record<string, unknown> | undefined;
  const queueStatus = {
    pending: (queueStatusRaw?.['pending'] as number) || 0,
    running: (queueStatusRaw?.['running'] as number) || 0,
    completed: (queueStatusRaw?.['completed'] as number) || 0,
    failed: (queueStatusRaw?.['failed'] as number) || 0,
  };

  const historyRaw = data['history'] as Array<Record<string, unknown>> | undefined;
  const history: WorkflowItem[] = Array.isArray(historyRaw)
    ? historyRaw.map((h) => ({
        id: (h['id'] as string) || '',
        type: (h['type'] as string) || '',
        status: mapStatus(h['status'] as string),
        symbol: (h['symbol'] as string) || '',
        steps: [],
        currentStep: '',
        progress: 0,
        startedAt: (h['startedAt'] as string) || undefined,
        completedAt: (h['completedAt'] as string) || undefined,
        durationMs: (h['durationMs'] as number) || undefined,
        createdAt: (h['createdAt'] as string) || '',
      }))
    : [];

  const statsRaw = data['statistics'] as Record<string, unknown> | undefined;
  const statistics = {
    totalCreated: (statsRaw?.['totalCreated'] as number) || 0,
    totalCompleted: (statsRaw?.['totalCompleted'] as number) || 0,
    totalFailed: (statsRaw?.['totalFailed'] as number) || 0,
    totalCancelled: (statsRaw?.['totalCancelled'] as number) || 0,
    activeWorkflows: (statsRaw?.['activeWorkflows'] as number) || 0,
    avgDurationMs: (statsRaw?.['avgDurationMs'] as number) || 0,
    byType: (statsRaw?.['byType'] as Record<string, { created: number; completed: number; failed: number }>) || {},
  };

  const workersRaw = data['workers'] as Array<Record<string, unknown>> | undefined;
  const workers = Array.isArray(workersRaw)
    ? workersRaw.map((wr) => ({
        id: (wr['id'] as string) || '',
        status: (wr['status'] as 'active' | 'idle' | 'offline') || 'idle',
        runningJobs: (wr['runningJobs'] as number) || 0,
        completedJobs: (wr['completedJobs'] as number) || 0,
        failedJobs: (wr['failedJobs'] as number) || 0,
        utilization: (wr['utilization'] as number) || 0,
      }))
    : [];

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const todayCount = workflows.filter((w) => w.createdAt >= todayStart).length;
  const lastWorkflow = workflows.length > 0 ? workflows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0].createdAt : null;
  const activeCount = workflows.filter((w) => w.status === 'RUNNING' || w.status === 'QUEUED').length;

  return { workflows, queue, queueStatus, history, statistics, workers, todayCount, lastWorkflow, activeCount };
}

export function filterWorkflows(
  workflows: WorkflowItem[],
  search: string,
  filterStatus: WorkflowStatus | '',
  filterType: string,
): WorkflowItem[] {
  let result = workflows;

  if (filterStatus) {
    result = result.filter((w) => w.status === filterStatus);
  }
  if (filterType) {
    result = result.filter((w) => w.type.toLowerCase().includes(filterType.toLowerCase()));
  }
  if (search.trim()) {
    const q = search.toLowerCase();
    result = result.filter(
      (w) =>
        w.id.toLowerCase().includes(q) ||
        w.type.toLowerCase().includes(q) ||
        w.symbol.toLowerCase().includes(q) ||
        w.status.toLowerCase().includes(q),
    );
  }
  return result;
}

export function sortWorkflows(workflows: WorkflowItem[], key: string, dir: 'asc' | 'desc'): WorkflowItem[] {
  return [...workflows].sort((a, b) => {
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

export function paginateWorkflows(workflows: WorkflowItem[], page: number, pageSize: number): WorkflowItem[] {
  const start = page * pageSize;
  return workflows.slice(start, start + pageSize);
}

export const useWorkflowDashboardStore = create<WorkflowDashboardState>((set) => ({
  activeTab: 'overview',
  snapshot: null,
  loading: false,
  error: '',
  lastRefresh: null,
  search: '',
  sortKey: 'createdAt',
  sortDir: 'desc',
  selectedWorkflow: null,
  page: 0,
  pageSize: 10,
  filterStatus: '',
  filterType: '',

  setActiveTab: (activeTab) => set({ activeTab }),
  setSnapshot: (snapshot) => set({ snapshot, loading: false, error: '', lastRefresh: new Date().toISOString() }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  setLastRefresh: (lastRefresh) => set({ lastRefresh }),
  setSearch: (search) => set({ search, page: 0 }),
  setSort: (sortKey, sortDir) => set({ sortKey, sortDir }),
  setSelectedWorkflow: (selectedWorkflow) => set({ selectedWorkflow }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 0 }),
  setFilterStatus: (filterStatus) => set({ filterStatus, page: 0 }),
  setFilterType: (filterType) => set({ filterType, page: 0 }),
  clearFilters: () => set({ search: '', filterStatus: '', filterType: '', page: 0 }),
  clearSnapshot: () => set({ snapshot: null, lastRefresh: null }),
}));
