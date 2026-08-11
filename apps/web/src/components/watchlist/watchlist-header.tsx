import { Eye, Plus, Activity, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WatchlistHeaderProps {
  onAddList: () => void;
  onRefresh: () => void;
  onExport: () => void;
  loading: boolean;
}

export function WatchlistHeader({ onAddList, onRefresh, onExport, loading }: WatchlistHeaderProps) {
  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <Eye className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold tracking-tight">Canlı İzleme</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onAddList}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
            aria-label="Liste ekle"
          >
            <Plus className="h-3.5 w-3.5" />
            Liste Ekle
          </button>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            aria-label="Yenile"
          >
            <Activity className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
            aria-label="Dışa aktar"
          >
            <Download className="h-3.5 w-3.5" />
            Dışa Aktar
          </button>
        </div>
      </div>
    </div>
  );
}
