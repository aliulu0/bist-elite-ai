import { useSettingsStore } from '@/stores/settings-store';

export function SettingsWorkflow() {
  const workflow = useSettingsStore((s) => s.values.workflow);
  const updateValues = useSettingsStore((s) => s.updateValues);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">İş Akışı Ayarları</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Varsayılan İş Akışı Türü</label>
          <select value={workflow.defaultType} onChange={(e) => updateValues('workflow', 'defaultType', e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="FULL_SCAN">Tam Tarama</option>
            <option value="QUICK_SCAN">Hızlı Tarama</option>
            <option value="BACKTEST">Geri Test</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Zaman Aşımı (ms)</label>
          <input type="number" value={workflow.timeout} onChange={(e) => updateValues('workflow', 'timeout', Number(e.target.value))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Yeniden Deneme</label>
          <input type="number" value={workflow.retry} onChange={(e) => updateValues('workflow', 'retry', Number(e.target.value))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Kuyruk Önceliği</label>
          <select value={workflow.queuePriority} onChange={(e) => updateValues('workflow', 'queuePriority', e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="CRITICAL">Kritik</option>
            <option value="HIGH">Yüksek</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Düşük</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Maksimum Eşzamanlı İş</label>
          <input type="number" value={workflow.maxConcurrent} onChange={(e) => updateValues('workflow', 'maxConcurrent', Number(e.target.value))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <span className="text-sm font-medium">Otomatik Başlatma</span>
          <button
            onClick={() => updateValues('workflow', 'autoStart', !workflow.autoStart)}
            className={`relative h-5 w-9 rounded-full transition-colors ${workflow.autoStart ? 'bg-success' : 'bg-muted'}`}
            role="switch"
            aria-checked={workflow.autoStart}
          >
            <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${workflow.autoStart ? 'translate-x-4' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
