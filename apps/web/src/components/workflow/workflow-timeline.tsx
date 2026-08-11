import { Card, EmptyState } from '@/components/shared';
import type { WorkflowItem } from './workflow-types';
import { STATUS_LABELS, STATUS_COLORS } from './workflow-types';
import { cn } from '@/lib/utils';

interface WorkflowTimelineProps {
  workflow: WorkflowItem | null;
}

export function WorkflowTimeline({ workflow }: WorkflowTimelineProps) {
  if (!workflow) {
    return <EmptyState title="Zaman çizelgesi yok" description="İş akışı seçilmedi" />;
  }

  const events: Array<{ label: string; time?: string; color: string }> = [];

  events.push({ label: 'Oluşturuldu', time: workflow.createdAt, color: 'bg-info' });

  if (workflow.startedAt) {
    events.push({ label: 'Başlatıldı', time: workflow.startedAt, color: 'bg-success' });
  }

  for (const step of workflow.steps) {
    if (step.status === 'completed' && step.completedAt) {
      events.push({ label: `${step.step} tamamlandı`, time: step.completedAt, color: 'bg-success' });
    } else if (step.status === 'failed') {
      events.push({ label: `${step.step} başarısız`, time: step.completedAt, color: 'bg-destructive' });
    } else if (step.status === 'running') {
      events.push({ label: `${step.step} çalışıyor`, time: step.startedAt, color: 'bg-info' });
    }
  }

  if (workflow.completedAt) {
    events.push({ label: 'Tamamlandı', time: workflow.completedAt, color: 'bg-success' });
  }

  if (workflow.status === 'FAILED') {
    events.push({ label: 'Başarısız', time: workflow.completedAt, color: 'bg-destructive' });
  }

  if (workflow.status === 'CANCELLED') {
    events.push({ label: 'İptal', time: workflow.completedAt, color: 'bg-warning' });
  }

  if (events.length === 0) {
    return <EmptyState title="Olay bulunamadı" description="Zaman çizelgesi verisi yok" />;
  }

  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">Zaman Çizelgesi</h3>
      <div className="relative ml-3 border-l-2 border-border pl-6 space-y-4">
        {events.map((event, i) => (
          <div key={i} className="relative">
            <div className={cn('absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-background', event.color)} />
            <div>
              <p className="text-xs font-medium">{event.label}</p>
              {event.time && (
                <p className="text-[10px] text-muted-foreground">
                  {new Date(event.time).toLocaleString('tr-TR')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
