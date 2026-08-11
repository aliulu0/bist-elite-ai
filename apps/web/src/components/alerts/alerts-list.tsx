import { useState, useMemo } from 'react';
import { useAlertsStore, filterAlerts, sortAlerts } from '@/stores/alerts-store';
import { AlertsItem } from '@/components/alerts/alerts-item';
import type { Alert } from '@/components/alerts/alerts-types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const COLUMNS = [
  { key: 'priority', label: 'Öncelik' },
  { key: 'type', label: 'Tür' },
  { key: 'title', label: 'Başlık' },
  { key: 'status', label: 'Durum' },
  { key: 'source', label: 'Kaynak' },
  { key: 'timestamp', label: 'Zaman' },
  { key: 'symbol', label: 'Kod' },
  { key: 'actions', label: 'İşlem' },
];

interface AlertsListProps {
  alerts: Alert[];
}

export function AlertsList({ alerts: alertsProp }: AlertsListProps) {
  const selectedAlert = useAlertsStore((s) => s.selectedAlert);
  const setSelectedAlert = useAlertsStore((s) => s.setSelectedAlert);
  const markAsRead = useAlertsStore((s) => s.markAsRead);
  const search = useAlertsStore((s) => s.search);
  const sortKey = useAlertsStore((s) => s.sortKey);
  const sortDir = useAlertsStore((s) => s.sortDir);
  const page = useAlertsStore((s) => s.page);
  const setPage = useAlertsStore((s) => s.setPage);
  const setSort = useAlertsStore((s) => s.setSort);
  const pageSize = useAlertsStore((s) => s.pageSize);

  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(COLUMNS.map((c) => [c.key, true])),
  );

  const filtered = useMemo(() => {
    let result = filterAlerts(alertsProp, search);
    result = sortAlerts(result, sortKey, sortDir);
    return result;
  }, [alertsProp, search, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (key === sortKey) {
      setSort(key, sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(key, 'desc');
    }
  };

  const toggleCol = (key: string) => setVisibleCols((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1">
        {COLUMNS.map((col) => (
          <button
            key={col.key}
            onClick={() => toggleCol(col.key)}
            className={`rounded px-2 py-1 text-xs ${
              visibleCols[col.key] ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}
          >
            {col.label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              {COLUMNS.filter((c) => visibleCols[c.key]).map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.key !== 'actions' && handleSort(col.key)}
                  className={`px-3 py-2 text-left text-sm font-medium text-muted-foreground ${
                    col.key !== 'actions' ? 'cursor-pointer hover:text-foreground' : ''
                  }`}
                >
                  {col.label}
                  {sortKey === col.key && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((alert) => (
              <AlertsItem
                key={alert.id}
                alert={alert}
                isSelected={selectedAlert?.id === alert.id}
                onSelect={setSelectedAlert}
                onMarkRead={markAsRead}
                visibleCols={visibleCols}
              />
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">Filtrelere uygun sonuç yok</div>
      )}
      {filtered.length > 0 && (
        <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filtered.length} sonuç ({page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)})
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="rounded border border-border p-1 hover:bg-accent disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="rounded border border-border p-1 hover:bg-accent disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
