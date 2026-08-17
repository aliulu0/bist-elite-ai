import { useCallback, useEffect } from 'react';
import { useProvidersStore, buildSnapshot, EMPTY_SNAPSHOT } from '@/stores/providers-store';
import { sdkClient } from '@/lib/sdk';
import { ErrorCard } from '@/components/shared';
import {
  ProviderHeader,
  ProviderSummary,
  ProviderTabs,
  ProviderOverview,
  ProviderHealthTable,
  ProviderLatencyChart,
  ProviderReliabilityCard,
  ProviderHistoryPanel,
  ProviderFailoverPanel,
  ProviderAlerts,
  ProviderExport,
} from '@/components/providers';
import { PROVIDER_NAMES } from '@/components/providers/provider-types';
import { cn } from '@/lib/utils';

const TAB_PANELS: Record<
  string,
  React.FC<{
    snapshot: ReturnType<typeof useProvidersStore.getState>['snapshot'];
    selectedProvider: string | null;
  }>
> = {
  overview: ProviderOverview,
};

const REQUIRED_PROVIDER_NAMES = ['Yahoo', 'Investing', 'Fintables', 'TCMB', 'KAP', 'MKK'];

export default function ProvidersPage() {
  const activeTab = useProvidersStore((s) => s.activeTab);
  const snapshot = useProvidersStore((s) => s.snapshot);
  const loading = useProvidersStore((s) => s.loading);
  const error = useProvidersStore((s) => s.error);
  const selectedProvider = useProvidersStore((s) => s.selectedProvider);
  const setSelectedProvider = useProvidersStore((s) => s.setSelectedProvider);
  const setSnapshot = useProvidersStore((s) => s.setSnapshot);
  const setLoading = useProvidersStore((s) => s.setLoading);
  const setError = useProvidersStore((s) => s.setError);
  const clearSnapshot = useProvidersStore((s) => s.clearSnapshot);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await sdkClient.providerHealth();
      const built = buildSnapshot(res as Record<string, unknown>);
      setSnapshot(built);
      if (!selectedProvider && built.providers.length > 0) {
        setSelectedProvider(built.providers[0].name);
      }
    } catch {
      setError('Sağlayıcı bilgileri yüklenirken hata oluştu');
    }
  }, [setSnapshot, setLoading, setError, selectedProvider, setSelectedProvider]);

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
      a.download = `saglayici-sagligi-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [snapshot]);

  const isOverview = activeTab === 'overview';
  const providerName = activeTab !== 'overview' ? PROVIDER_NAMES[activeTab] || null : null;
  const providers = REQUIRED_PROVIDER_NAMES.map((name) => {
    const matched = (snapshot?.providers ?? EMPTY_SNAPSHOT.providers).find((provider) =>
      provider.name.toLowerCase().includes(name.toLowerCase()),
    );
    return (
      matched ?? {
        name,
        status: 'UNKNOWN' as const,
        latencyMs: 0,
        successRate: 0,
        errorRate: 0,
        reliabilityScore: 0,
        consecutiveFailures: 0,
        totalRequests: 0,
        failedRequests: 0,
        timeoutCount: 0,
        lastSuccessAt: null,
        lastFailureAt: null,
        lastRecoveryAt: null,
        recoveryTimeMs: null,
      }
    );
  });

  return (
    <div className="space-y-6">
      <ProviderHeader
        onRefresh={fetchData}
        onExport={handleExport}
        onClear={handleClear}
        loading={loading}
        lastRefresh={useProvidersStore.getState().lastRefresh}
      />

      {error && <ErrorCard message={error} onRetry={fetchData} />}

      <ProviderSummary snapshot={snapshot} />
      <ProviderTabs />

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Sağlayıcı Monitörü</h2>
            <p className="text-sm text-muted-foreground">
              Her piyasa veri sağlayıcısı için sağlık, gecikme, önbellek, devre kesici ve
              senkronizasyon durumu.
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            Öncelik sırası: Yahoo, Investing, Fintables, TCMB, KAP, MKK
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                {[
                  'Sağlayıcı',
                  'Durum',
                  'Gecikme',
                  'Sağlık',
                  'Önbellek',
                  'Devre Kesici',
                  'Son Senk.',
                  'Öncelik',
                ].map((column) => (
                  <th key={column} className="px-3 py-2 font-medium">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {providers.map((provider, index) => {
                const circuitBreaker =
                  provider.consecutiveFailures > 2
                    ? 'Açık'
                    : provider.consecutiveFailures > 0
                      ? 'Yarı açık'
                      : 'Kapalı';
                const cacheStatus = provider.totalRequests > 0 ? 'Sıcak' : 'Soğuk';
                const lastSync =
                  provider.lastSuccessAt ??
                  provider.lastFailureAt ??
                  provider.lastRecoveryAt ??
                  'Senkron yok';
                return (
                  <tr key={provider.name} className="border-b transition-colors hover:bg-muted/40">
                    <td className="px-3 py-3 font-medium">{provider.name}</td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          'rounded border px-2 py-0.5 text-xs',
                          provider.status === 'HEALTHY'
                            ? 'border-success/40 bg-success/10 text-success'
                            : provider.status === 'DEGRADED'
                              ? 'border-warning/40 bg-warning/10 text-warning'
                              : provider.status === 'UNKNOWN'
                                ? 'border-muted bg-muted text-muted-foreground'
                                : 'border-destructive/40 bg-destructive/10 text-destructive',
                        )}
                      >
                        {provider.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono">{provider.latencyMs.toFixed(0)} ms</td>
                    <td className="px-3 py-3 font-mono">{provider.reliabilityScore.toFixed(0)}%</td>
                    <td className="px-3 py-3">{cacheStatus}</td>
                    <td className="px-3 py-3">{circuitBreaker}</td>
                    <td className="px-3 py-3 font-mono text-xs">
                      {lastSync === 'Senkron yok'
                        ? lastSync
                        : new Date(lastSync).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-3 py-3 font-mono">P{index + 1}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isOverview ? (
        <div className="rounded-xl border border-border bg-card p-6">
          <ProviderOverview snapshot={snapshot} />
        </div>
      ) : (
        <div className="space-y-6">
          <ProviderReliabilityCard snapshot={snapshot} />

          <ProviderLatencyChart snapshot={snapshot} selectedProvider={providerName} />

          <ProviderHealthTable snapshot={snapshot} />

          <ProviderHistoryPanel snapshot={snapshot} selectedProvider={providerName} />

          <ProviderFailoverPanel snapshot={snapshot} />

          <ProviderAlerts snapshot={snapshot} />
        </div>
      )}

      {isOverview && (
        <div className="rounded-xl border border-border bg-card p-6">
          <ProviderHealthTable snapshot={snapshot} />
        </div>
      )}

      {isOverview && (
        <div className="rounded-xl border border-border bg-card p-6">
          <ProviderExport snapshot={snapshot} />
        </div>
      )}
    </div>
  );
}
