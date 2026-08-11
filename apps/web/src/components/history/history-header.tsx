import { RefreshCw, Download, Trash2 } from 'lucide-react';
import { HISTORY_TIMEFRAMES } from './history-types';

interface HistoryHeaderProps {
  onRefresh: () => void;
  onExport: () => void;
  onClear: () => void;
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
  loading?: boolean;
  lastRefresh?: string | null;
}

export function HistoryHeader({ onRefresh, onExport, onClear, timeframe, onTimeframeChange, loading, lastRefresh }: HistoryHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tarihsel Veri</h1>
        <p className="text-sm text-muted-foreground">BIST sembollerinin tarihsel kapsamı, boşlukları, veri kalitesi ve backfill durumu.</p>
        {lastRefresh && (
          <p className="text-xs text-muted-foreground">
            Son güncelleme: {new Date(lastRefresh).toLocaleString('tr-TR')}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={timeframe}
          onChange={(e) => onTimeframeChange(e.target.value)}
          aria-label="Periyot"
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium"
        >
          {HISTORY_TIMEFRAMES.map((tf) => (
            <option key={tf} value={tf}>{tf}</option>
          ))}
        </select>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          aria-label="Yenile"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
        <button
          onClick={onExport}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
          aria-label="Dışa Aktar"
        >
          <Download className="h-3.5 w-3.5" />
          Dışa Aktar
        </button>
        <button
          onClick={onClear}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
          aria-label="Sıfırla"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Sıfırla
        </button>
      </div>
    </div>
  );
}
