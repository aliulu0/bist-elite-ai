import { useSettingsStore } from '@/stores/settings-store';
import {
  SettingsHeader,
  SettingsTabs,
  SettingsSummary,
  SettingsGeneral,
  SettingsTheme,
  SettingsScanner,
  SettingsAnalysis,
  SettingsWorkflow,
  SettingsScheduler,
  SettingsProviders,
  SettingsNotifications,
  SettingsAdvanced,
  SettingsProfiles,
  SettingsSnapshots,
  SettingsImportExport,
  SettingsDangerZone,
} from '@/components/settings';

const TAB_COMPONENTS: Record<string, React.FC> = {
  general: SettingsGeneral,
  theme: SettingsTheme,
  scanner: SettingsScanner,
  analysis: SettingsAnalysis,
  workflow: SettingsWorkflow,
  scheduler: SettingsScheduler,
  providers: SettingsProviders,
  notifications: SettingsNotifications,
  advanced: SettingsAdvanced,
  profiles: SettingsProfiles,
  snapshots: SettingsSnapshots,
};

export default function SettingsPage() {
  const activeTab = useSettingsStore((s) => s.activeTab);
  const TabComponent = TAB_COMPONENTS[activeTab] ?? SettingsGeneral;

  return (
    <div className="space-y-6">
      <SettingsHeader />
      <SettingsSummary />
      <SettingsTabs />
      <div className="rounded-xl border border-border bg-card p-6">
        <TabComponent />
      </div>
      {activeTab === 'advanced' && (
        <div className="rounded-xl border border-border bg-card p-6">
          <SettingsImportExport />
        </div>
      )}
      {activeTab === 'advanced' && (
        <div className="rounded-xl border border-border bg-card p-6">
          <SettingsDangerZone />
        </div>
      )}
      {activeTab !== 'profiles' && activeTab !== 'snapshots' && activeTab !== 'advanced' && (
        <div className="rounded-xl border border-border bg-card p-6">
          <SettingsImportExport />
        </div>
      )}
    </div>
  );
}
