import { useCallback, useEffect } from 'react';
import { useAuditStore, buildSnapshot, filterLogs, sortLogs, paginateLogs, type AuditLogEntry } from '@/stores/audit-store';
import { sdkClient } from '@/lib/sdk';
import { AuditHeader } from '@/components/audit/audit-header';
import { AuditSummary } from '@/components/audit/audit-summary';
import { AuditTabs } from '@/components/audit/audit-tabs';
import { AuditFilters } from '@/components/audit/audit-filters';
import { AuditList } from '@/components/audit/audit-list';
import { AuditDetail } from '@/components/audit/audit-detail';
import { AuditTimeline } from '@/components/audit/audit-timeline';
import { AuditModuleCards } from '@/components/audit/audit-module-cards';
import { AuditSeverityChart } from '@/components/audit/audit-severity-chart';
import { downloadAuditExport } from '@/components/audit/audit-export';
import { LoadingCard, ErrorCard } from '@/components/shared';

export default function AuditPage() {
  const store = useAuditStore();
  const {
    snapshot, loading, error, activeTab, search, sortKey, sortDir,
    selectedLogId, page, pageSize, filterSeverity, filterModule, filterAction,
    setSnapshot, setLoading, setError, setActiveTab, setSearch, setSort,
    setSelectedLogId, setPage, setPageSize, setFilterSeverity, setFilterModule,
    setFilterAction, clearFilters,
  } = store;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await sdkClient.auditLog();
      const snap = buildSnapshot(res as Record<string, unknown>);
      setSnapshot(snap);
    } catch {
      setError('Denetim günlükleri yüklenirken hata oluştu');
    }
  }, [setSnapshot, setLoading, setError]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const logs = snapshot ? snapshot.logs : [];
  const filtered = filterLogs(logs, search, filterSeverity, filterModule, filterAction, activeTab);
  const sorted = sortLogs(filtered, sortKey, sortDir);
  const paginated = paginateLogs(sorted, page, pageSize);
  const selectedLog = logs.find((l) => l.id === selectedLogId) || null;

  const handleExport = () => {
    downloadAuditExport(filtered, 'csv');
  };

  return (
    <div className="space-y-6">
      <AuditHeader
        onRefresh={fetchData}
        onExport={handleExport}
        onClearFilters={clearFilters}
        loading={loading}
        lastRefresh={store.lastRefresh}
      />

      {loading && !snapshot ? (
        <LoadingCard />
      ) : error ? (
        <ErrorCard message={error} onRetry={fetchData} />
      ) : (
        <>
          <AuditSummary snapshot={snapshot} />
          <AuditTabs />
          <AuditFilters
            search={search}
            onSearchChange={setSearch}
            filterSeverity={filterSeverity}
            onSeverityChange={setFilterSeverity}
            filterModule={filterModule}
            onModuleChange={setFilterModule}
            filterAction={filterAction}
            onActionChange={setFilterAction}
          />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <AuditList
                logs={paginated}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={setSort}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                totalCount={filtered.length}
                onSelectLog={(id) => setSelectedLogId(id)}
                selectedLogId={selectedLogId}
              />
            </div>
            <div className="space-y-6">
              <AuditDetail log={selectedLog} onClose={() => setSelectedLogId(null)} />
              <AuditSeverityChart snapshot={snapshot} />
              <AuditTimeline logs={logs.slice(0, 20)} onSelectLog={(id) => setSelectedLogId(id)} />
              <AuditModuleCards snapshot={snapshot} onFilterModule={(m) => setFilterModule(m)} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
