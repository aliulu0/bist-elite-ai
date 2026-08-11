import { useAlertsStore } from '@/stores/alerts-store';
import { GROUP_LABELS } from '@/components/alerts/alerts-types';
import type { AlertGroup, AlertSettings } from '@/components/alerts/alerts-types';

const SETTINGS_KEYS: Array<{ key: AlertGroup; storeKey: keyof AlertSettings }> = [
  { key: 'PIYASA', storeKey: 'piyasa' },
  { key: 'WORKFLOW', storeKey: 'workflow' },
  { key: 'PROVIDER', storeKey: 'provider' },
  { key: 'SISTEM', storeKey: 'sistem' },
  { key: 'PORTFOY', storeKey: 'portfoy' },
  { key: 'WATCHLIST', storeKey: 'watchlist' },
];

export function AlertsSettings() {
  const settings = useAlertsStore((s) => s.settings);
  const setSettings = useAlertsStore((s) => s.setSettings);

  const toggle = (storeKey: keyof AlertSettings) => {
    const current = useAlertsStore.getState().settings;
    setSettings({ ...current, [storeKey]: !current[storeKey] });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">Alarm Ayarları</h3>
      <div className="space-y-2">
        {SETTINGS_KEYS.map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <span className="text-sm">{GROUP_LABELS[item.key]} Alarmları</span>
            <button
              onClick={() => toggle(item.storeKey)}
              className={`relative h-5 w-9 rounded-full transition-colors ${settings[item.storeKey] ? 'bg-success' : 'bg-muted'}`}
              role="switch"
              aria-checked={settings[item.storeKey]}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                  settings[item.storeKey] ? 'translate-x-4' : ''
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
