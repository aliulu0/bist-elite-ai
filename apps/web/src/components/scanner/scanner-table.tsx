import { useMemo, useState } from 'react';
import { useScannerStore } from '@/stores/scanner-store';
import { Badge, EmptyState, Card } from '@/components/shared';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Columns3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ScannerRow {
  symbol: string;
  name: string;
  sector: string;
  eliteScore: number;
  opportunityScore: number;
  financialScore: number;
  technicalScore: number;
  smartMoneyScore: number;
  totalScore: number;
  status: string;
  pdRatio?: number;
  pbRatio?: number;
  fdFavok?: number;
  netIncomeGrowth?: number;
  volume?: number;
  liquidity?: number;
  beta?: number;
  dividendYield?: number;
  marketCap?: number;
  rank?: number;
}

const ALL_COLUMNS = [
  { key: 'symbol', header: 'Kod' },
  { key: 'name', header: 'Şirket' },
  { key: 'eliteScore', header: 'Elite' },
  { key: 'opportunityScore', header: 'Fırsat' },
  { key: 'financialScore', header: 'Finansal' },
  { key: 'technicalScore', header: 'Teknik' },
  { key: 'smartMoneyScore', header: 'Akıllı Para' },
  { key: 'totalScore', header: 'Toplam Puan' },
  { key: 'status', header: 'Durum' },
];

function getStatusBadge(status: string) {
  if (status === 'TOP_CANDIDATE') return { variant: 'success' as const, label: 'Aday' };
  if (status === 'WATCHLIST') return { variant: 'warning' as const, label: 'İzleme' };
  if (status === 'REJECTED') return { variant: 'danger' as const, label: 'Red' };
  return { variant: 'outline' as const, label: status };
}

function ScoreCell({ value }: { value: number }) {
  const color = value >= 80 ? 'text-success' : value >= 60 ? 'text-info' : value >= 40 ? 'text-warning' : 'text-destructive';
  return <span className={cn('tabular-nums font-medium', color)}>{value.toFixed(1)}</span>;
}

function ColumnToggle({ visible, onToggle, columns }: { visible: Record<string, boolean>; onToggle: (key: string) => void; columns: typeof ALL_COLUMNS }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent"
        aria-label="Sütun görünürlüğü"
      >
        <Columns3 className="h-3 w-3" /> Sütunlar
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border bg-card p-2 shadow-lg">
          {columns.map((col) => (
            <label key={col.key} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs hover:bg-muted/50">
              <input
                type="checkbox"
                checked={visible[col.key] !== false}
                onChange={() => onToggle(col.key)}
                className="h-3 w-3"
              />
              {col.header}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

interface ScannerTableProps {
  data: ScannerRow[];
  loading?: boolean;
}

const PAGE_SIZE = 20;

export function ScannerTable({ data, loading }: ScannerTableProps) {
  const sortKey = useScannerStore((s) => s.sortKey);
  const sortDir = useScannerStore((s) => s.sortDir);
  const setSort = useScannerStore((s) => s.setSort);
  const columnVisibility = useScannerStore((s) => s.columnVisibility);
  const toggleColumn = useScannerStore((s) => s.toggleColumn);
  const selectedSymbol = useScannerStore((s) => s.selectedSymbol);
  const setSelectedSymbol = useScannerStore((s) => s.setSelectedSymbol);

  const [page, setPage] = useState(0);

  const visibleCols = useMemo(
    () => ALL_COLUMNS.filter((c) => columnVisibility[c.key] !== false),
    [columnVisibility],
  );

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey as keyof ScannerRow];
      const bVal = b[sortKey as keyof ScannerRow];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const cmp = aVal < bVal ? -1 : 1;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSort(key, sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(key, 'asc');
    }
    setPage(0);
  }

  function renderCell(row: ScannerRow, colKey: string) {
    switch (colKey) {
      case 'symbol':
        return <span className="font-semibold">{row.symbol}</span>;
      case 'name':
        return <span className="text-muted-foreground">{row.name || '-'}</span>;
      case 'eliteScore':
      case 'opportunityScore':
      case 'financialScore':
      case 'technicalScore':
      case 'smartMoneyScore':
        return <ScoreCell value={row[colKey as keyof ScannerRow] as number} />;
      case 'totalScore':
        return <span className="font-bold tabular-nums">{(row.totalScore || 0).toFixed(1)}</span>;
      case 'status': {
        const badge = getStatusBadge(row.status);
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      }
      default:
        return String(row[colKey as keyof ScannerRow] ?? '');
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-8">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted/50" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState description="Filtrelere uygun hisse bulunamadı" />;
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-xs text-muted-foreground">{sorted.length} hisse</span>
        <ColumnToggle visible={columnVisibility} onToggle={toggleColumn} columns={ALL_COLUMNS} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {visibleCols.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-3 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground',
                    ['eliteScore', 'opportunityScore', 'financialScore', 'technicalScore', 'smartMoneyScore', 'totalScore'].includes(col.key) && 'text-right',
                    sortKey === col.key && 'text-foreground',
                  )}
                  onClick={() => handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1 cursor-pointer select-none">
                    {col.header}
                    {sortKey === col.key && (
                      sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr
                key={row.symbol || i}
                className={cn(
                  'border-b last:border-0 transition-colors cursor-pointer hover:bg-muted/30',
                  selectedSymbol === row.symbol && 'bg-primary/5 border-l-2 border-l-primary',
                )}
                onClick={() => setSelectedSymbol(selectedSymbol === row.symbol ? null : row.symbol)}
              >
                {visibleCols.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-3 py-2.5 text-xs',
                      ['eliteScore', 'opportunityScore', 'financialScore', 'technicalScore', 'smartMoneyScore', 'totalScore'].includes(col.key) && 'text-right',
                    )}
                  >
                    {renderCell(row, col.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-2">
          <span className="text-xs text-muted-foreground">
            {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, sorted.length)} / {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent disabled:opacity-50"
              aria-label="Önceki sayfa"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(0, Math.min(page - 2, totalPages - 5));
              const idx = start + i;
              if (idx >= totalPages) return null;
              return (
                <button
                  key={idx}
                  onClick={() => setPage(idx)}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium',
                    idx === page ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent',
                  )}
                >
                  {idx + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent disabled:opacity-50"
              aria-label="Sonraki sayfa"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
