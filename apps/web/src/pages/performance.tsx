import { useCallback, useEffect } from 'react';
import { usePerformanceStore, buildSnapshot } from '@/stores/performance-store';
import { sdkClient } from '@/lib/sdk';
import { ErrorCard } from '@/components/shared';
import {
  PerformanceHeader,
  PerformanceSummary,
  PerformanceTabs,
  PerformanceOverview,
  PerformanceEngine,
  PerformancePipeline,
  PerformanceApi,
  PerformanceCache,
  PerformanceSystem,
  PerformanceWorkflow,
  PerformanceQueue,
  PerformanceProvider,
  PerformanceAlerts,
  PerformanceExport,
} from '@/components/performance';

const TAB_PANELS: Record<string, React.FC<{ snapshot: ReturnType<typeof usePerformanceStore.getState>['snapshot'] }>> = {
  overview: PerformanceOverview,
  engines: PerformanceEngine,
  pipeline: PerformancePipeline,
  api: PerformanceApi,
  cache: PerformanceCache,
  system: PerformanceSystem,
  workflow: PerformanceWorkflow,
  queue: PerformanceQueue,
  providers: PerformanceProvider,
  alerts: PerformanceAlerts,
};

export default function PerformancePage() {
  const activeTab = usePerformanceStore((s) => s.activeTab);
  const snapshot = usePerformanceStore((s) => s.snapshot);
  const loading = usePerformanceStore((s) => s.loading);
  const error = usePerformanceStore((s) => s.error);
  const setSnapshot = usePerformanceStore((s) => s.setSnapshot);
  const setLoading = usePerformanceStore((s) => s.setLoading);
  const setError = usePerformanceStore((s) => s.setError);
  const clearSnapshot = usePerformanceStore((s) => s.clearSnapshot);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await sdkClient.performanceMonitor();
      const built = buildSnapshot(res as Record<string, unknown>);
      setSnapshot(built);
    } catch {
      setError('Performans metrikleri yüklenirken hata oluştu');
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
      a.download = `performans-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [snapshot]);

  const TabPanel = TAB_PANELS[activeTab] ?? PerformanceOverview;

  return (
    <div className="space-y-6">
      <PerformanceHeader
        onRefresh={fetchData}
        onExport={handleExport}
        onClear={handleClear}
        loading={loading}
        lastRefresh={usePerformanceStore.getState().lastRefresh}
      />

      {error && (
        <ErrorCard message={error} onRetry={fetchData} />
      )}

      <PerformanceSummary snapshot={snapshot} />
      <PerformanceTabs />

      <div className="rounded-xl border border-border bg-card p-6">
        <TabPanel snapshot={snapshot} />
      </div>

      {activeTab === 'overview' && (
        <div className="rounded-xl border border-border bg-card p-6">
          <PerformanceExport snapshot={snapshot} />
        </div>
      )}
    </div>
  );
}
