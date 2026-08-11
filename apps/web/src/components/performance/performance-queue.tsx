import { Card, EmptyState } from '@/components/shared';
import type { PerformanceSnapshot } from './performance-types';
import { ListOrdered, Clock, CheckCircle, AlertCircle, XCircle, Skull } from 'lucide-react';

interface PerformanceQueueProps {
  snapshot: PerformanceSnapshot | null;
}

export function PerformanceQueue({ snapshot }: PerformanceQueueProps) {
  if (!snapshot) {
    return <EmptyState title="Kuyruk verisi yok" description="Kuyruk verileri toplandığında burada görüntülenecek" />;
  }

  const q = snapshot.queueMetrics;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2"><ListOrdered className="h-4 w-4 text-primary" /></div>
            <div>
              <span className="text-xs text-muted-foreground">Kuyruk Uzunluğu</span>
              <p className="text-lg font-bold">{q.queueLength}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-warning/10 p-2"><Clock className="h-4 w-4 text-warning" /></div>
            <div>
              <span className="text-xs text-muted-foreground">Bekleyen</span>
              <p className="text-lg font-bold">{q.waitingCount}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-info/10 p-2"><ListOrdered className="h-4 w-4 text-info" /></div>
            <div>
              <span className="text-xs text-muted-foreground">Çalışan</span>
              <p className="text-lg font-bold">{q.runningCount}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-success/10 p-2"><CheckCircle className="h-4 w-4 text-success" /></div>
            <div>
              <span className="text-xs text-muted-foreground">Tamamlanan</span>
              <p className="text-lg font-bold">{q.completedCount}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-destructive/10 p-2"><AlertCircle className="h-4 w-4 text-destructive" /></div>
            <div>
              <span className="text-xs text-muted-foreground">Başarısız</span>
              <p className="text-lg font-bold">{q.failedCount}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-destructive/10 p-2"><Skull className="h-4 w-4 text-destructive" /></div>
            <div>
              <span className="text-xs text-muted-foreground">Ölü Mektup</span>
              <p className="text-lg font-bold">{q.deadLetterCount}</p>
            </div>
          </div>
        </Card>
      </div>
      <Card title="Ortalama Bekleme Süresi">
        <p className="text-2xl font-bold">{Math.round(q.avgWaitTimeMs)}ms</p>
      </Card>
    </div>
  );
}
