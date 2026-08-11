import { RefreshCw, Plus, Download } from 'lucide-react';

interface WorkflowHeaderProps {
  onRefresh: () => void;
  onCreateWorkflow: () => void;
  onExport: () => void;
  loading?: boolean;
  lastRefresh?: string | null;
}

export function WorkflowHeader({ onRefresh, onCreateWorkflow, onExport, loading, lastRefresh }: WorkflowHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">İş Akışları</h1>
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
          onClick={onCreateWorkflow}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
          aria-label="Yeni İş Akışı"
        >
          <Plus className="h-3.5 w-3.5" />
          Yeni İş Akışı
        </button>
        <button
          onClick={onExport}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
          aria-label="Dışa Aktar"
        >
          <Download className="h-3.5 w-3.5" />
          Dışa Aktar
        </button>
      </div>
    </div>
  );
}
