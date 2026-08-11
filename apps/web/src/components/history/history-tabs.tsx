import { useHistoryStore } from '@/stores/history-store';
import type { HistoryTab } from './history-types';
import { cn } from '@/lib/utils';

const HISTORY_TABS: Array<{ key: HistoryTab; label: string }> = [
  { key: 'overview', label: 'Genel' },
  { key: 'symbol', label: 'Sembol Detayı' },
  { key: 'backfill', label: 'Backfill' },
];

export function HistoryTabs() {
  const activeTab = useHistoryStore((s) => s.activeTab);
  const setActiveTab = useHistoryStore((s) => s.setActiveTab);

  return (
    <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted p-1">
      {HISTORY_TABS.map((tab) => (
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
