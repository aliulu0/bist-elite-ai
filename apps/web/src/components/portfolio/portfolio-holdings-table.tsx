import { useState } from 'react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/shared';
import { TableIcon } from 'lucide-react';
import type { Holding } from './portfolio-types';
import { filterHoldings, sortHoldings } from '@/stores/portfolio-store';
import { usePortfolioStore } from '@/stores/portfolio-store';
import { RISK_LEVEL_LABELS, RATING_LABELS } from './portfolio-types';

interface PortfolioHoldingsTableProps {
  holdings: Holding[];
  onSelect?: (symbol: string) => void;
}

export function PortfolioHoldingsTable({ holdings, onSelect }: PortfolioHoldingsTableProps) {
  const { search, setSearch, sortKey, sortDir, setSort, page, setPage, pageSize, selectedSymbol, compactMode } = usePortfolioStore();
  const [showFilters, setShowFilters] = useState(false);

  const filtered = filterHoldings(holdings, search);
  const sorted = sortHoldings(filtered, sortKey, sortDir);
  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (key === sortKey) {
      setSort(key, sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(key, 'desc');
    }
  };

  if (holdings.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold">Hisse Senetleri</h3>
        <EmptyState
          title="Henüz portföy verisi bulunmuyor"
          description="İşlem ekledikten sonra hisse senetleri burada görünecek"
          icon={<TableIcon className="h-6 w-6 text-muted-foreground" />}
        />
      </div>
    );
  }

  const columns = [
    { key: 'symbol', label: 'Hisse' },
    { key: 'lots', label: 'Lot' },
    { key: 'avgCost', label: 'Maliyet' },
    { key: 'currentPrice', label: 'Güncel' },
    { key: 'pnl', label: 'K/Z' },
    { key: 'pnlPercent', label: '%' },
    { key: 'portfolioWeight', label: 'Portföy %' },
    { key: 'aiScore', label: 'AI Skoru' },
    { key: 'risk', label: 'Risk' },
    { key: 'eliteRating', label: 'Elite' },
    { key: 'opportunityLevel', label: 'Fırsat' },
  ];

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-sm font-semibold">Hisse Senetleri ({filtered.length})</h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hisse ara..."
            className="w-40 rounded-md border bg-muted/50 px-3 py-1.5 text-xs outline-none placeholder:text-muted-foreground"
            aria-label="Hisse ara"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-md border px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent"
          >
            Filtrele
          </button>
        </div>
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
            {paged.map((h) => (
              <tr
                key={h.symbol}
                className={cn(
                  'cursor-pointer border-t hover:bg-muted/30',
                  selectedSymbol === h.symbol && 'bg-muted/50',
                  compactMode && 'py-0',
                )}
                onClick={() => onSelect?.(h.symbol)}
              >
                <td className="px-3 py-2 font-medium">{h.symbol}</td>
                <td className="px-3 py-2 text-right">{h.lots}</td>
                <td className="px-3 py-2 text-right font-mono">₺{h.avgCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                <td className="px-3 py-2 text-right font-mono">₺{h.currentPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                <td className={cn('px-3 py-2 text-right font-mono font-semibold', h.pnl >= 0 ? 'text-success' : 'text-destructive')}>
                  {h.pnl >= 0 ? '+' : ''}₺{h.pnl.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </td>
                <td className={cn('px-3 py-2 text-right font-mono', h.pnlPercent >= 0 ? 'text-success' : 'text-destructive')}>
                  {h.pnlPercent >= 0 ? '+' : ''}{h.pnlPercent.toFixed(2)}%
                </td>
                <td className="px-3 py-2 text-right">{h.portfolioWeight.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right font-mono">{h.aiScore.toFixed(0)}</td>
                <td className="px-3 py-2 text-center">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{RISK_LEVEL_LABELS[h.risk] || h.risk}</span>
                </td>
                <td className="px-3 py-2 text-center">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{RATING_LABELS[h.eliteRating] || h.eliteRating}</span>
                </td>
                <td className="px-3 py-2 text-center">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{h.opportunityLevel}</span>
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
