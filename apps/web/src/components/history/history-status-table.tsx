import { EmptyState } from '@/components/shared';
import type { HistoricalAllSymbolsReport } from './history-types';
import { HISTORY_STATUS_COLORS, HISTORY_STATUS_LABELS } from './history-types';
import { cn } from '@/lib/utils';

interface HistoryStatusTableProps {
  report: HistoricalAllSymbolsReport | null;
  selectedSymbol: string | null;
  onSelect: (symbol: string) => void;
}

export function HistoryStatusTable({ report, selectedSymbol, onSelect }: HistoryStatusTableProps) {
  if (!report || report.symbols.length === 0) {
    return (
      <EmptyState
        title="Sembol verisi bulunmuyor"
        description="Aktif BIST sembolleri yüklenemedi veya henüz veri toplanmadı."
      />
    );
  }

  const formatDate = (ts: string | null) => (ts ? ts.slice(0, 10) : '—');

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
            {['Sembol', 'Durum', 'Bar Sayısı', 'İlk Tarih', 'Son Tarih', 'Sağlayıcı', 'Backtest'].map((column) => (
              <th key={column} className="px-3 py-2 font-medium">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.symbols.map((row) => {
            const selected = row.symbol === selectedSymbol;
            return (
              <tr
                key={row.symbol}
                onClick={() => onSelect(row.symbol)}
                className={cn('cursor-pointer border-b transition-colors hover:bg-muted/40', selected && 'bg-muted/60')}
                data-testid={`history-row-${row.symbol}`}
              >
                <td className="px-3 py-3 font-medium">{row.symbol}</td>
                <td className="px-3 py-3">
                  <span className={cn('rounded border px-2 py-0.5 text-xs', HISTORY_STATUS_COLORS[row.status] ?? HISTORY_STATUS_COLORS.unknown)}>
                    {HISTORY_STATUS_LABELS[row.status] ?? row.status}
                  </span>
                </td>
                <td className="px-3 py-3 font-mono">{row.barCount}</td>
                <td className="px-3 py-3 font-mono text-xs">{formatDate(row.firstTimestamp)}</td>
                <td className="px-3 py-3 font-mono text-xs">{formatDate(row.lastTimestamp)}</td>
                <td className="px-3 py-3 text-xs">{row.provider === 'none' ? '—' : row.provider}</td>
                <td className="px-3 py-3">
                  <span
                    className={cn(
                      'rounded border px-2 py-0.5 text-xs',
                      row.usableForBacktest
                        ? 'border-success/40 bg-success/10 text-success'
                        : 'border-muted bg-muted text-muted-foreground',
                    )}
                  >
                    {row.usableForBacktest ? 'Uygun' : 'Değil'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
