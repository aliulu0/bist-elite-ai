import { Card, EmptyState } from '@/components/shared';
import type { PerformanceSnapshot } from './performance-types';
import { formatNumber } from '@/lib/utils';
import { GitBranch, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';

interface PerformanceWorkflowProps {
  snapshot: PerformanceSnapshot | null;
}

export function PerformanceWorkflow({ snapshot }: PerformanceWorkflowProps) {
  if (!snapshot) {
    return <EmptyState title="Workflow verisi yok" description="Workflow verileri toplandığında burada görüntülenecek" />;
  }

  const w = snapshot.workflowMetrics;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2"><GitBranch className="h-4 w-4 text-primary" /></div>
            <div>
              <span className="text-xs text-muted-foreground">Aktif</span>
              <p className="text-lg font-bold">{w.activeCount}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-success/10 p-2"><CheckCircle className="h-4 w-4 text-success" /></div>
            <div>
              <span className="text-xs text-muted-foreground">Tamamlanan</span>
              <p className="text-lg font-bold">{w.completedCount}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-destructive/10 p-2"><AlertCircle className="h-4 w-4 text-destructive" /></div>
            <div>
              <span className="text-xs text-muted-foreground">Başarısız</span>
              <p className="text-lg font-bold">{w.failedCount}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Ortalama Süre</span>
            <p className="text-lg font-bold">{Math.round(w.avgDurationMs)}ms</p>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-warning/10 p-2"><RotateCcw className="h-4 w-4 text-warning" /></div>
            <div>
              <span className="text-xs text-muted-foreground">Yeniden Deneme</span>
              <p className="text-lg font-bold">{w.retryCount}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Kuyruk Gecikmesi</span>
            <p className="text-lg font-bold">{Math.round(w.queueLatencyMs)}ms</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
