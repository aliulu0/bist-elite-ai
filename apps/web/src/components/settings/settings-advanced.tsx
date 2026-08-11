import { useSettingsStore } from '@/stores/settings-store';

export function SettingsAdvanced() {
  const advanced = useSettingsStore((s) => s.values.advanced);
  const updateValues = useSettingsStore((s) => s.updateValues);

  const toggles: Array<{ key: keyof typeof advanced; label: string }> = [
    { key: 'cacheCleanup', label: 'Otomatik Cache Temizleme' },
    { key: 'localStorageCleanup', label: 'Local Storage Temizleme' },
    { key: 'debugMode', label: 'Debug Modu' },
    { key: 'verboseLogging', label: 'Gelişmiş Loglama' },
    { key: 'experimentalFeatures', label: 'Deneysel Özellikler' },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Gelişmiş Ayarlar</h3>
      <div className="space-y-2">
        {toggles.map((t) => (
          <div key={t.key} className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm font-medium">{t.label}</span>
            <button
              onClick={() => updateValues('advanced', t.key, !advanced[t.key])}
              className={`relative h-5 w-9 rounded-full transition-colors ${advanced[t.key] ? 'bg-success' : 'bg-muted'}`}
              role="switch"
              aria-checked={advanced[t.key]}
            >
              <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${advanced[t.key] ? 'translate-x-4' : ''}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
