import { useState } from 'react';
import { Card, Badge, EmptyState } from '@/components/shared';
import type { AuditLogEntry } from './audit-types';
import { SEVERITY_LABELS, SEVERITY_BADGE, ACTION_LABELS, moduleDisplay } from './audit-types';
import { ChevronUp, ChevronDown, ChevronRight, ChevronDown as ChevronDownExpanded } from 'lucide-react';

interface AuditListProps {
  logs: AuditLogEntry[];
  sortKey: string;
  sortDir: 'asc' | 'desc';
  onSort: (key: string, dir: 'asc' | 'desc') => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  totalCount: number;
  onSelectLog: (id: string) => void;
  selectedLogId: string | null;
}

const COLUMNS: Array<{ key: string; label: string }> = [
  { key: 'timestamp', label: 'Zaman' },
  { key: 'module', label: 'Modül' },
  { key: 'action', label: 'İşlem' },
  { key: 'severity', label: 'Öncelik' },
  { key: 'details', label: 'Açıklama' },
];

export function AuditList({ logs, sortKey, sortDir, onSort, page, pageSize, onPageChange, totalCount, onSelectLog, selectedLogId }: AuditListProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  if (logs.length === 0) {
    return <EmptyState title="Filtrelere uygun kayıt yok" description="Filtreleri değiştirmeyi deneyin" />;
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      onSort(key, sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(key, 'asc');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortKey !== col) return null;
    return sortDir === 'asc' ? <ChevronUp className="inline h-3 w-3" /> : <ChevronDown className="inline h-3 w-3" />;
  };

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="cursor-pointer px-3 py-2 text-left font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => handleSort(col.key)}
                >
                  {col.label} <SortIcon col={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const isExpanded = expandedRows.has(log.id);
              const isSelected = selectedLogId === log.id;
              return (
                <tr
                  key={log.id}
                  className={`border-b last:border-0 hover:bg-muted/50 cursor-pointer ${isSelected ? 'bg-muted' : ''}`}
                  onClick={() => onSelectLog(log.id)}
                >
                  <td className="px-3 py-2">{new Date(log.timestamp).toLocaleString('tr-TR')}</td>
                  <td className="px-3 py-2 font-medium">{moduleDisplay(log.module)}</td>
                  <td className="px-3 py-2">
                    <Badge variant="outline">{ACTION_LABELS[log.action as keyof typeof ACTION_LABELS] || log.action}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={SEVERITY_BADGE[log.severity]}>
                      {SEVERITY_LABELS[log.severity]}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground max-w-[300px] truncate">{log.details}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-2">
          <span className="text-xs text-muted-foreground">
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalCount)} / {totalCount}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange(Math.max(0, page - 1))}
              disabled={page === 0}
              className="rounded-md border px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
            >
              Önceki
            </button>
            <button
              onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-md border px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
