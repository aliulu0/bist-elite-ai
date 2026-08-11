import { useSettingsStore } from '@/stores/settings-store';
import { GROUP_LABELS } from '@/components/alerts/alerts-types';
import type { AlertGroup } from '@/components/alerts/alerts-types';

const NOTIFICATION_GROUPS: AlertGroup[] = ['PIYASA', 'WORKFLOW', 'PROVIDER', 'SISTEM', 'PORTFOY', 'WATCHLIST'];

export function SettingsNotifications() {
  const notifications = useSettingsStore((s) => s.values.notifications);
  const updateValues = useSettingsStore((s) => s.updateValues);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Bildirim Ayarları</h3>
      <div className="space-y-2">
        {NOTIFICATION_GROUPS.map((group) => {
          const key = group.toLowerCase() as keyof typeof notifications;
          return (
            <div key={group} className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm font-medium">{GROUP_LABELS[group]} Alarmları</span>
              <button
                onClick={() => updateValues('notifications', key, !notifications[key])}
                className={`relative h-5 w-9 rounded-full transition-colors ${notifications[key] ? 'bg-success' : 'bg-muted'}`}
                role="switch"
                aria-checked={notifications[key]}
              >
                <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${notifications[key] ? 'translate-x-4' : ''}`} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
