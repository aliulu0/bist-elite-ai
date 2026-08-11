import { useSettingsStore } from '@/stores/settings-store';

export function SettingsGeneral() {
  const general = useSettingsStore((s) => s.values.general);
  const updateValues = useSettingsStore((s) => s.updateValues);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Genel Ayarlar</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Dil</label>
          <select value={general.language} onChange={(e) => updateValues('general', 'language', e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="tr">Türkçe</option>
            <option value="en">İngilizce</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Saat Dilimi</label>
          <select value={general.timezone} onChange={(e) => updateValues('general', 'timezone', e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="Europe/Istanbul">İstanbul (GMT+3)</option>
            <option value="Europe/London">Londra (GMT+0)</option>
            <option value="America/New_York">New York (GMT-5)</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Para Birimi</label>
          <select value={general.currency} onChange={(e) => updateValues('general', 'currency', e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="TRY">TRY (₺)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Varsayılan Sayfa</label>
          <select value={general.defaultPage} onChange={(e) => updateValues('general', 'defaultPage', e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="dashboard">Kontrol Paneli</option>
            <option value="scanner">Tarayıcı</option>
            <option value="analysis">Analiz</option>
            <option value="backtest">Geri Test</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Başlangıç Modu</label>
          <select value={general.startupMode} onChange={(e) => updateValues('general', 'startupMode', e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="last">Son Sayfa</option>
            <option value="default">Varsayılan Sayfa</option>
          </select>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <span className="text-sm font-medium">Otomatik Yenileme</span>
          <button
            onClick={() => updateValues('general', 'autoRefresh', !general.autoRefresh)}
            className={`relative h-5 w-9 rounded-full transition-colors ${general.autoRefresh ? 'bg-success' : 'bg-muted'}`}
            role="switch"
            aria-checked={general.autoRefresh}
          >
            <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${general.autoRefresh ? 'translate-x-4' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
