import { Search } from 'lucide-react';
import type { AuditSeverity } from './audit-types';
import { SEVERITY_LABELS } from './audit-types';

interface AuditFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  filterSeverity: AuditSeverity | '';
  onSeverityChange: (v: AuditSeverity | '') => void;
  filterModule: string;
  onModuleChange: (v: string) => void;
  filterAction: string;
  onActionChange: (v: string) => void;
}

export function AuditFilters({
  search,
  onSearchChange,
  filterSeverity,
  onSeverityChange,
  filterModule,
  onModuleChange,
  filterAction,
  onActionChange,
}: AuditFiltersProps) {
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
        value={filterSeverity}
        onChange={(e) => onSeverityChange(e.target.value as AuditSeverity | '')}
        className="rounded-md border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        aria-label="Önem filtresi"
      >
        <option value="">Tüm Önemler</option>
        {(Object.keys(SEVERITY_LABELS) as AuditSeverity[]).map((s) => (
          <option key={s} value={s}>{SEVERITY_LABELS[s]}</option>
        ))}
      </select>
      <input
        type="text"
        value={filterModule}
        onChange={(e) => onModuleChange(e.target.value)}
        placeholder="Modül..."
        className="w-[140px] rounded-md border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        aria-label="Modül filtresi"
      />
      <input
        type="text"
        value={filterAction}
        onChange={(e) => onActionChange(e.target.value)}
        placeholder="İşlem..."
        className="w-[140px] rounded-md border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        aria-label="İşlem filtresi"
      />
    </div>
  );
}
