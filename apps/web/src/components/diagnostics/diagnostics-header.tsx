import { RefreshCw, Download, Trash2 } from 'lucide-react';

interface DiagnosticsHeaderProps {
  onRefresh: () => void;
  onExport: () => void;
  onClear: () => void;
  loading?: boolean;
  lastRefresh?: string | null;
}

export function DiagnosticsHeader({ onRefresh, onExport, onClear, loading, lastRefresh }: DiagnosticsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sistem Tanılama</h1>
        {lastRefresh && (
          <p className="text-xs text-muted-foreground">
            Son güncelleme: {new Date(lastRefresh).toLocaleString('tr-TR')}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
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
