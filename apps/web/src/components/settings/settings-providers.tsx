import { useSettingsStore } from '@/stores/settings-store';

export function SettingsProviders() {
  const providers = useSettingsStore((s) => s.values.providers);
  const updateValues = useSettingsStore((s) => s.updateValues);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Sağlayıcı Ayarları</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Timeout (ms)</label>
          <input type="number" value={providers.timeout} onChange={(e) => updateValues('providers', 'timeout', Number(e.target.value))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Retry</label>
          <input type="number" value={providers.retry} onChange={(e) => updateValues('providers', 'retry', Number(e.target.value))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <span className="text-sm font-medium">Otomatik Failover</span>
          <button
            onClick={() => updateValues('providers', 'failover', !providers.failover)}
            className={`relative h-5 w-9 rounded-full transition-colors ${providers.failover ? 'bg-success' : 'bg-muted'}`}
            role="switch"
            aria-checked={providers.failover}
          >
            <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${providers.failover ? 'translate-x-4' : ''}`} />
          </button>
        </div>
      </div>
      <div>
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Sağlayıcı Önceliği</h4>
        <div className="space-y-2">
          {providers.priority.map((p, i) => (
            <div key={p} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <span className="text-sm font-bold text-muted-foreground">{i + 1}</span>
              <span className="text-sm font-medium">{p === 'yahoo' ? 'Yahoo Finance' : p === 'fintables' ? 'Fintables' : p}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
