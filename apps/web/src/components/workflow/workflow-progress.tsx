import { Card, EmptyState } from '@/components/shared';
import type { WorkflowItem } from './workflow-types';
import { STEP_STATUS_LABELS, STEP_STATUS_COLORS } from './workflow-types';
import { CheckCircle2, Circle, Clock, SkipForward, XCircle } from 'lucide-react';
import type { StepStatus } from './workflow-types';
import { cn } from '@/lib/utils';

interface WorkflowProgressProps {
  workflow: WorkflowItem | null;
}

const STEP_ICONS: Record<StepStatus, React.ComponentType<{ className?: string }>> = {
  completed: CheckCircle2,
  running: Circle,
  waiting: Clock,
  skipped: SkipForward,
  failed: XCircle,
};

export function WorkflowProgress({ workflow }: WorkflowProgressProps) {
  if (!workflow || workflow.steps.length === 0) {
    return <EmptyState title="Adım bilgisi yok" description="İş akışı adım detayı mevcut değil" />;
  }

  const completedCount = workflow.steps.filter((s) => s.status === 'completed').length;
  const percentage = Math.round((completedCount / workflow.steps.length) * 100);

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">İş Akışı İlerlemesi</h3>
        <span className="text-xs text-muted-foreground">%{percentage} tamamlandı</span>
      </div>
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
      </div>
      <div className="space-y-2">
        {workflow.steps.map((step, i) => {
          const status = (step.status || 'waiting') as StepStatus;
          const Icon = STEP_ICONS[status] || Clock;
          const colorClass = STEP_STATUS_COLORS[status] || 'text-muted-foreground';
          return (
            <div key={i} className="flex items-center gap-3 rounded-md border border-border p-2">
              <Icon className={cn('h-4 w-4 shrink-0', colorClass)} />
              <div className="flex-1">
                <p className="text-xs font-medium">{step.step}</p>
                <p className={cn('text-[10px]', colorClass)}>
                  {STEP_STATUS_LABELS[status] || status}
                  {step.durationMs && ` · ${(step.durationMs / 1000).toFixed(1)}s`}
                </p>
              </div>
              {step.error && (
                <p className="text-[10px] text-destructive max-w-[200px] truncate">{step.error}</p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
