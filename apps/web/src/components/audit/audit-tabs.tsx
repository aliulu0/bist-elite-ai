import { useAuditStore } from '@/stores/audit-store';
import { AUDIT_TABS } from './audit-types';
import { cn } from '@/lib/utils';

export function AuditTabs() {
  const activeTab = useAuditStore((s) => s.activeTab);
  const setActiveTab = useAuditStore((s) => s.setActiveTab);

  return (
    <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted p-1">
      {AUDIT_TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={cn(
            'whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors',
            activeTab === tab.key
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
          aria-label={tab.label}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
