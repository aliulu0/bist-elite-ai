import { useSettingsStore } from '@/stores/settings-store';
import { SETTINGS_TABS } from '@/components/settings/settings-types';

export function SettingsTabs() {
  const activeTab = useSettingsStore((s) => s.activeTab);
  const setActiveTab = useSettingsStore((s) => s.setActiveTab);

  return (
    <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted p-1">
      {SETTINGS_TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
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
