import { useState } from 'react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/shared';
import { TableIcon } from 'lucide-react';
import { useWatchlistStore, filterItems, sortItems } from '@/stores/watchlist-store';
import type { WatchlistItem } from './watchlist-types';
import { STATUS_LABELS, STATUS_COLORS } from './watchlist-types';

interface WatchlistTableProps {
  items: WatchlistItem[];
  onSelect?: (symbol: string) => void;
}

export function WatchlistTable({ items, onSelect }: WatchlistTableProps) {
  const { search, setSearch, sortKey, sortDir, setSort, page, setPage, pageSize, selectedSymbol, compactMode } = useWatchlistStore();

  const filtered = filterItems(items, search);
  const sorted = sortItems(filtered, sortKey, sortDir);
  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    setSort(key, sortKey === key ? (sortDir === 'asc' ? 'desc' : 'asc') : 'desc');
  };

  if (items.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold">İzleme Listesi</h3>
        <EmptyState
          title="Henüz izleme listesi bulunmuyor"
          description="Hisse ekledikten sonra izleme listesi burada görünecek"
          icon={<TableIcon className="h-6 w-6 text-muted-foreground" />}
        />
      </div>
    );
  }

  const columns = [
    { key: 'symbol', label: 'Hisse' },
    { key: 'name', label: 'Şirket' },
    { key: 'eliteScore', label: 'Elite' },
    { key: 'opportunityLevel', label: 'Fırsat' },
    { key: 'confidence', label: 'Güven' },
    { key: 'currentPrice', label: 'Son Fiyat' },
    { key: 'dailyChangePercent', label: 'Günlük %' },
    { key: 'weeklyChangePercent', label: 'Haftalık %' },
    { key: 'smartMoneyScore', label: 'Akıllı Para' },
    { key: 'trend', label: 'Trend' },
    { key: 'status', label: 'Durum' },
    { key: 'alert', label: 'Alarm' },
  ];

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-sm font-semibold">İzleme Listesi ({filtered.length})</h3>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Hisse ara..."
          className="w-40 rounded-md border bg-muted/50 px-3 py-1.5 text-xs outline-none placeholder:text-muted-foreground"
          aria-label="Hisse ara"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-t bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="cursor-pointer px-3 py-2 text-left font-medium text-muted-foreground hover:text-foreground"
                >
                  {col.label}
                  {sortKey === col.key && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((item) => (
              <tr
                key={item.symbol}
                className={cn(
                  'cursor-pointer border-t hover:bg-muted/30',
                  selectedSymbol === item.symbol && 'bg-muted/50',
                  compactMode && 'py-0',
                )}
                onClick={() => onSelect?.(item.symbol)}
              >
                <td className="px-3 py-2 font-medium">{item.symbol}</td>
                <td className="px-3 py-2 text-muted-foreground">{item.name}</td>
                <td className="px-3 py-2 font-mono font-semibold">{item.eliteScore}</td>
                <td className="px-3 py-2">{item.opportunityLevel}</td>
                <td className="px-3 py-2 font-mono">{(item.confidence * 100).toFixed(0)}%</td>
                <td className="px-3 py-2 text-right font-mono">₺{item.currentPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                <td className={cn('px-3 py-2 text-right font-mono', item.dailyChangePercent >= 0 ? 'text-success' : 'text-destructive')}>
                  {item.dailyChangePercent >= 0 ? '+' : ''}{item.dailyChangePercent.toFixed(2)}%
                </td>
                <td className={cn('px-3 py-2 text-right font-mono', item.weeklyChangePercent >= 0 ? 'text-success' : 'text-destructive')}>
                  {item.weeklyChangePercent >= 0 ? '+' : ''}{item.weeklyChangePercent.toFixed(2)}%
                </td>
                <td className="px-3 py-2 font-mono">{item.smartMoneyScore}</td>
                <td className="px-3 py-2">{item.trend}</td>
                <td className="px-3 py-2">
                  <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', STATUS_COLORS[item.status] || '')}>
                    {STATUS_LABELS[item.status] || item.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  {item.alert && (
                    <span className="inline-block h-2 w-2 rounded-full bg-destructive" aria-label="Alarm var" />
                  )}
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-muted-foreground">Sonuç bulunamadı</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-2">
          <span className="text-xs text-muted-foreground">Sayfa {page + 1} / {totalPages}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="rounded border px-2 py-1 text-xs disabled:opacity-50">Önceki</button>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="rounded border px-2 py-1 text-xs disabled:opacity-50">Sonraki</button>
          </div>
        </div>
      )}
    </div>
  );
}
