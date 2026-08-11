import { Loader2, CheckCircle2, XCircle, Clock, Play } from 'lucide-react';
import type { WorkflowItem } from './backtest-types';

interface BacktestWorkflowProps {
  workflows: WorkflowItem[];
  onTrigger: () => void;
  loading: boolean;
}

export function BacktestWorkflow({ workflows, onTrigger, loading }: BacktestWorkflowProps) {
  const backtestWorkflows = workflows.filter((w) => w.type === 'backtest');

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'RUNNING':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const StatusLabel: Record<string, string> = {
    PENDING: 'Bekliyor',
    QUEUED: 'Kuyrukta',
    RUNNING: 'Çalışıyor',
    COMPLETED: 'Tamamlandı',
    FAILED: 'Başarısız',
    TIMEOUT: 'Zaman Aşımı',
    CANCELLED: 'İptal',
  };

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Backtest İş Akışları</h3>
        <button
          onClick={onTrigger}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          Yeni Backtest Başlat
        </button>
      </div>

      <div className="space-y-2">
        {backtestWorkflows.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">Henüz backtest çalıştırılmadı</p>
        )}
        {backtestWorkflows.slice(0, 10).map((wf) => (
          <div key={wf.id} className="flex items-center gap-3 rounded-md border px-3 py-2">
            <StatusIcon status={wf.status} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{wf.symbol}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {StatusLabel[wf.status] || wf.status}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {wf.createdAt ? new Date(wf.createdAt).toLocaleString('tr-TR') : '-'}
                {wf.durationMs ? ` • ${(wf.durationMs / 1000).toFixed(1)}s` : ''}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono">{wf.progress}%</div>
              <div className="h-1 w-16 rounded-full bg-muted">
                <div
                  className="h-1 rounded-full bg-primary transition-all"
                  style={{ width: `${wf.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
