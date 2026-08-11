import { cn } from '@/lib/utils';
import type { AnalysisTab } from '@/stores/analysis-store';
import { ANALYSIS_TABS } from '@/stores/analysis-store';

interface AnalysisTabsProps {
  activeTab: AnalysisTab;
  onTabChange: (tab: AnalysisTab) => void;
  children: React.ReactNode;
}

export function AnalysisTabs({ activeTab, onTabChange, children }: AnalysisTabsProps) {
  return (
    <div>
      <div className="flex items-center gap-1 overflow-x-auto border-b">
        {ANALYSIS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              'whitespace-nowrap px-3 py-2.5 text-xs font-medium transition-colors',
              activeTab === tab.key
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="py-4">{children}</div>
    </div>
  );
}
