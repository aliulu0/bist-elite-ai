import { useCallback, useEffect } from 'react';
import { useWorkflowDashboardStore, buildSnapshot, filterWorkflows, sortWorkflows, paginateWorkflows } from '@/stores/workflow-dashboard-store';
import type { WorkflowItem } from '@/components/workflow/workflow-types';
import { sdkClient } from '@/lib/sdk';
import { WorkflowHeader } from '@/components/workflow/workflow-header';
import { WorkflowSummary } from '@/components/workflow/workflow-summary';
import { WorkflowTabs } from '@/components/workflow/workflow-tabs';
import { WorkflowFilters } from '@/components/workflow/workflow-filters';
import { WorkflowQueueOverview } from '@/components/workflow/workflow-queue-overview';
import { WorkflowRunningTable } from '@/components/workflow/workflow-running-table';
import { WorkflowHistoryTable } from '@/components/workflow/workflow-history-table';
import { WorkflowDetail } from '@/components/workflow/workflow-detail';
import { WorkflowProgress } from '@/components/workflow/workflow-progress';
import { WorkflowWorkers } from '@/components/workflow/workflow-workers';
import { WorkflowTimeline } from '@/components/workflow/workflow-timeline';
import { WorkflowStatistics } from '@/components/workflow/workflow-statistics';
import { WorkflowExport } from '@/components/workflow/workflow-export';
import { downloadWorkflowExport } from '@/components/workflow/workflow-export';
import { LoadingCard, ErrorCard } from '@/components/shared';

export default function WorkflowsPage() {
  const store = useWorkflowDashboardStore();
  const {
    snapshot, loading, error, activeTab, search, sortKey, sortDir,
    selectedWorkflow, page, pageSize, filterStatus, filterType,
    setSnapshot, setLoading, setError, setActiveTab, setSearch, setSort,
    setSelectedWorkflow, setPage, setPageSize, setFilterStatus, setFilterType,
    clearFilters,
  } = store;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [wfRes, queueRes, statsRes, histRes] = await Promise.allSettled([
        sdkClient.workflows(),
        sdkClient.workflowQueue(),
        sdkClient.workflowsStats(),
        sdkClient.workflowsHistory(),
      ]);

      if (wfRes.status === 'rejected') throw new Error('İş akışları yüklenemedi');

      const wfData = wfRes.status === 'fulfilled' ? wfRes.value : { data: [] };
      const queueData = queueRes.status === 'fulfilled' ? queueRes.value : { jobs: [] };
      const statsData = statsRes.status === 'fulfilled' ? statsRes.value : {};
      const histData = histRes.status === 'fulfilled' ? histRes.value : { data: [] };

      const workflows = Array.isArray(wfData) ? wfData : (wfData as Record<string, unknown>)['data'] || [];
      const queueInner = ((queueData as Record<string, unknown>)['data'] ?? queueData) as Record<string, unknown>;
      const queue = Array.isArray(queueData) ? queueData : queueInner['jobs'] || [];
      const history = Array.isArray(histData) ? histData : (histData as Record<string, unknown>)['data'] || [];

      const snap = buildSnapshot({
        workflows,
        queue,
        queueStatus: { pending: 0, running: 0, completed: 0, failed: 0 },
        history,
        statistics: statsData,
        workers: [],
      });
      setSnapshot(snap);
    } catch {
      setError('İş akışları yüklenirken hata oluştu');
    }
  }, [setSnapshot, setLoading, setError]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const workflows = snapshot ? snapshot.workflows : [];
  const filtered = filterWorkflows(workflows, search, filterStatus, filterType);
  const sorted = sortWorkflows(filtered, sortKey, sortDir);
  const paginated = paginateWorkflows(sorted, page, pageSize);

  const running = workflows.filter((w) => w.status === 'RUNNING');
  const historyItems = snapshot ? snapshot.history : [];
  const selectedForExport = filtered.length > 0 ? filtered : workflows;

  const handleExport = () => {
    downloadWorkflowExport(selectedForExport, 'csv');
  };

  return (
    <div className="space-y-6">
      <WorkflowHeader
        onRefresh={fetchData}
        onCreateWorkflow={fetchData}
        onExport={handleExport}
        loading={loading}
        lastRefresh={store.lastRefresh}
      />

      {loading && !snapshot ? (
        <LoadingCard />
      ) : error ? (
        <ErrorCard message={error} onRetry={fetchData} />
      ) : (
        <>
          <WorkflowSummary snapshot={snapshot} />
          <WorkflowTabs />

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <WorkflowFilters
                search={search}
                onSearchChange={setSearch}
                filterStatus={filterStatus}
                onStatusChange={setFilterStatus}
                filterType={filterType}
                onTypeChange={setFilterType}
              />
              <WorkflowQueueOverview snapshot={snapshot} />
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <WorkflowRunningTable workflows={running} onSelectWorkflow={setSelectedWorkflow} />
                </div>
                <div className="space-y-6">
                  <WorkflowDetail workflow={selectedWorkflow} onClose={() => setSelectedWorkflow(null)} />
                  <WorkflowTimeline workflow={selectedWorkflow} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'queue' && (
            <div className="space-y-6">
              <WorkflowQueueOverview snapshot={snapshot} />
              <WorkflowExport workflows={workflows} />
            </div>
          )}

          {activeTab === 'workers' && (
            <WorkflowWorkers workers={snapshot?.workers || []} />
          )}

          {activeTab === 'history' && (
            <WorkflowHistoryTable
              workflows={historyItems}
              onSelectWorkflow={setSelectedWorkflow}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              totalCount={historyItems.length}
            />
          )}

          {activeTab === 'statistics' && (
            <WorkflowStatistics snapshot={snapshot} />
          )}

          {activeTab === 'overview' && selectedWorkflow && (
            <WorkflowProgress workflow={selectedWorkflow} />
          )}
        </>
      )}
    </div>
  );
}
