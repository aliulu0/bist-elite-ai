import { useAlertsStore } from '@/stores/alerts-store';
import { ALERT_TABS } from '@/components/alerts/alerts-types';
import type { AlertGroup } from '@/components/alerts/alerts-types';

export function AlertsTabs() {
  const activeTab = useAlertsStore((s) => s.activeTab);
  const setActiveTab = useAlertsStore((s) => s.setActiveTab);

  return (
    <div className="flex gap-1 rounded-lg border border-border bg-muted p-1">
      {ALERT_TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === tab.key
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
