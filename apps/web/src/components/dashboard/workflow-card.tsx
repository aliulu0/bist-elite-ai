import { Card, Badge, LoadingCard, Progress } from '@/components/shared';
import { GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WorkflowJob {
  id: string;
  workflowId: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface WorkflowCardProps {
  jobs: WorkflowJob[];
  loading?: boolean;
  error?: string;
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; className: string }> = {
  COMPLETED: { label: 'Tamamlandı', variant: 'success', className: 'bg-success' },
  RUNNING: { label: 'Çalışıyor', variant: 'info', className: 'bg-info animate-pulse' },
  WAITING: { label: 'Bekliyor', variant: 'default', className: 'bg-muted-foreground' },
  PAUSED: { label: 'Bekliyor', variant: 'default', className: 'bg-muted-foreground' },
  QUEUED: { label: 'Kuyrukta', variant: 'warning', className: 'bg-warning' },
  RETRYING: { label: 'Kuyrukta', variant: 'warning', className: 'bg-warning' },
  FAILED: { label: 'Başarısız', variant: 'danger', className: 'bg-destructive' },
  DEAD_LETTER: { label: 'Başarısız', variant: 'danger', className: 'bg-destructive' },
  CANCELLED: { label: 'İptal', variant: 'danger', className: 'bg-destructive' },
  PENDING: { label: 'Bekliyor', variant: 'default', className: 'bg-muted-foreground' },
};

const priorityOrder: Record<string, number> = {
  CRITICAL: 0,
  VERY_HIGH: 1,
  HIGH: 2,
  NORMAL: 3,
  LOW: 4,
};

function getStats(jobs: WorkflowJob[]) {
  const completed = jobs.filter((j) => j.status === 'COMPLETED').length;
  const running = jobs.filter((j) => j.status === 'RUNNING').length;
  const pending = jobs.filter((j) => j.status === 'WAITING' || j.status === 'PAUSED' || j.status === 'RETRYING' || j.status === 'PENDING' || j.status === 'QUEUED').length;
  const failed = jobs.filter((j) => j.status === 'FAILED' || j.status === 'DEAD_LETTER').length;
  return { completed, running, pending, failed, total: jobs.length };
}

export function WorkflowCard({ jobs, loading, error }: WorkflowCardProps) {
  const stats = getStats(jobs);
  const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <Card
      title="İş Akışları"
      description={`${stats.total} iş akışı`}
      action={<GitBranch className="h-4 w-4 text-muted-foreground" />}
    >
      {loading ? (
        <LoadingCard />
      ) : error ? (
        <p className="py-4 text-center text-xs text-destructive">{error}</p>
      ) : jobs.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">İş akışı bulunamadı</p>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" />{stats.completed} tamamlandı</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-info animate-pulse" />{stats.running} çalışıyor</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground" />{stats.pending} bekliyor</span>
            {stats.failed > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" />{stats.failed} başarısız</span>}
          </div>
          <Progress value={pct} variant={pct >= 80 ? 'success' : pct >= 50 ? 'default' : 'warning'} size="sm" />
          <div className="mt-3 space-y-1.5">
            {[...jobs]
              .sort((a, b) => (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99))
              .slice(0, 5)
              .map((job) => {
                const cfg = statusConfig[job.status] || statusConfig.PENDING;
                return (
                  <div key={job.id} className="flex items-center justify-between rounded bg-muted/40 px-2.5 py-1.5">
                    <span className="truncate text-xs font-medium">{job.workflowId}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {job.createdAt ? new Date(job.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}
    </Card>
  );
}
