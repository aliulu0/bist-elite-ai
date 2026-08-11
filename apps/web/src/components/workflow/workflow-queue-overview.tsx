import { Card } from '@/components/shared';
import type { WorkflowSnapshot } from './workflow-types';
import { Clock, Play, RotateCcw, CheckCircle2, XCircle, Skull } from 'lucide-react';

interface WorkflowQueueOverviewProps {
  snapshot: WorkflowSnapshot | null;
}

export function WorkflowQueueOverview({ snapshot }: WorkflowQueueOverviewProps) {
  if (!snapshot) return null;

  const items = [
    { label: 'Bekleyen', count: snapshot.queueStatus.pending, icon: Clock, color: 'text-warning' },
    { label: 'Çalışan', count: snapshot.queueStatus.running, icon: Play, color: 'text-info' },
    { label: 'Yeniden Deneyen', count: snapshot.queue.filter((j) => j.status === 'RETRYING').length, icon: RotateCcw, color: 'text-warning' },
    { label: 'Tamamlanan', count: snapshot.queueStatus.completed, icon: CheckCircle2, color: 'text-success' },
    { label: 'Başarısız', count: snapshot.queueStatus.failed, icon: XCircle, color: 'text-destructive' },
    { label: 'Ölü Mektup', count: snapshot.queue.filter((j) => j.status === 'DEAD_LETTER').length, icon: Skull, color: 'text-destructive' },
  ];

  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">Kuyruk Durumu</h3>
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex flex-col items-center gap-1 rounded-md border border-border p-3">
              <Icon className={`h-4 w-4 ${item.color}`} />
              <span className="text-lg font-bold">{item.count}</span>
              <span className="text-[10px] text-muted-foreground">{item.label}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
