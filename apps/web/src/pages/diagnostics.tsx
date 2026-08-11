import { useCallback, useEffect } from 'react';
import { useDiagnosticsStore, buildSnapshot, EMPTY_SNAPSHOT } from '@/stores/diagnostics-store';
import { sdkClient } from '@/lib/sdk';
import { ErrorCard } from '@/components/shared';
import {
  DiagnosticsHeader,
  DiagnosticsSummary,
  DiagnosticsTabs,
  DiagnosticsOverview,
  DiagnosticsChecks,
  DiagnosticsServices,
  DiagnosticsPerformance,
  DiagnosticsHistory,
  DiagnosticsAlerts,
  DiagnosticsExport,
} from '@/components/diagnostics';

const CATEGORY_BY_TAB: Record<string, string | undefined> = {
  workflow: 'workflow',
  queue: 'queue',
  scheduler: 'scheduler',
  providers: 'providers',
  performance: 'performance',
  cache: 'performance',
  eventbus: 'eventbus',
  audit: 'audit',
  analysis: 'analysis',
};

export default function DiagnosticsPage() {
  const activeTab = useDiagnosticsStore((s) => s.activeTab);
  const snapshot = useDiagnosticsStore((s) => s.snapshot);
  const loading = useDiagnosticsStore((s) => s.loading);
  const error = useDiagnosticsStore((s) => s.error);
  const setSnapshot = useDiagnosticsStore((s) => s.setSnapshot);
  const setLoading = useDiagnosticsStore((s) => s.setLoading);
  const setError = useDiagnosticsStore((s) => s.setError);
  const clearSnapshot = useDiagnosticsStore((s) => s.clearSnapshot);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await sdkClient.diagnostics();
      const built = buildSnapshot(res as Record<string, unknown>);
      setSnapshot(built);
    } catch {
      setError('Tanılama bilgileri yüklenirken hata oluştu');
    }
  }, [setSnapshot, setLoading, setError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClear = useCallback(() => {
    clearSnapshot();
  }, [clearSnapshot]);

  const handleExport = useCallback(() => {
    if (snapshot) {
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tanilama-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [snapshot]);

  const isOverview = activeTab === 'overview';
  const filterCategory = CATEGORY_BY_TAB[activeTab];

  return (
    <div className="space-y-6">
      <DiagnosticsHeader
        onRefresh={fetchData}
        onExport={handleExport}
        onClear={handleClear}
        loading={loading}
        lastRefresh={useDiagnosticsStore.getState().lastRefresh}
      />

      {error && (
        <ErrorCard message={error} onRetry={fetchData} />
      )}

      <DiagnosticsSummary snapshot={snapshot} />
      <DiagnosticsTabs />

      {isOverview ? (
        <div className="rounded-xl border border-border bg-card p-6">
          <DiagnosticsOverview snapshot={snapshot} />
        </div>
      ) : (
        <div className="space-y-6">
          <DiagnosticsChecks snapshot={snapshot} filterCategory={filterCategory} />
          <DiagnosticsServices snapshot={snapshot} />
          <DiagnosticsPerformance snapshot={snapshot} />
          <DiagnosticsHistory snapshot={snapshot} />
          <DiagnosticsAlerts snapshot={snapshot} />
        </div>
      )}

      {isOverview && (
        <div className="rounded-xl border border-border bg-card p-6">
          <DiagnosticsServices snapshot={snapshot} />
        </div>
      )}

      {isOverview && (
        <div className="rounded-xl border border-border bg-card p-6">
          <DiagnosticsPerformance snapshot={snapshot} />
        </div>
      )}

      {isOverview && (
        <div className="rounded-xl border border-border bg-card p-6">
          <DiagnosticsExport snapshot={snapshot} />
        </div>
      )}
    </div>
  );
}
