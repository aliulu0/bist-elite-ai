import { Search } from 'lucide-react';
import type { WorkflowStatus } from './workflow-types';
import { STATUS_LABELS } from './workflow-types';

interface WorkflowFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  filterStatus: WorkflowStatus | '';
  onStatusChange: (v: WorkflowStatus | '') => void;
  filterType: string;
  onTypeChange: (v: string) => void;
}

export function WorkflowFilters({
  search,
  onSearchChange,
  filterStatus,
  onStatusChange,
  filterType,
  onTypeChange,
}: WorkflowFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Arama..."
          className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="Arama"
        />
      </div>
      <select
        value={filterStatus}
        onChange={(e) => onStatusChange(e.target.value as WorkflowStatus | '')}
        className="rounded-md border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        aria-label="Durum filtresi"
      >
        <option value="">Tüm Durumlar</option>
        {(Object.keys(STATUS_LABELS) as WorkflowStatus[]).map((s) => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </select>
      <input
        type="text"
        value={filterType}
        onChange={(e) => onTypeChange(e.target.value)}
        placeholder="Tür..."
        className="w-[140px] rounded-md border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        aria-label="Tür filtresi"
      />
    </div>
  );
}
