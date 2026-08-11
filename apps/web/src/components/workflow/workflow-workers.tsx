import { Card, EmptyState } from '@/components/shared';
import type { WorkerInfo } from './workflow-types';
import { Users, Activity, CheckCircle2, XCircle } from 'lucide-react';

interface WorkflowWorkersProps {
  workers: WorkerInfo[];
}

export function WorkflowWorkers({ workers }: WorkflowWorkersProps) {
  if (workers.length === 0) {
    return <EmptyState title="İşçi bilgisi yok" description="Aktif işçi bulunmuyor" />;
  }

  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">İşçi Durumu</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">İşçi ID</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Durum</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Çalışan İş</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Tamamlanan</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Başarısız</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Kullanım</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((w) => (
              <tr key={w.id} className="border-b last:border-0">
                <td className="px-3 py-2 font-mono text-[10px]">{w.id.slice(0, 8)}</td>
                <td className="px-3 py-2">
                  <span className={w.status === 'active' ? 'text-success' : w.status === 'idle' ? 'text-warning' : 'text-destructive'}>
                    {w.status === 'active' ? 'Aktif' : w.status === 'idle' ? 'Boşta' : 'Çevrimdışı'}
                  </span>
                </td>
                <td className="px-3 py-2">{w.runningJobs}</td>
                <td className="px-3 py-2">{w.completedJobs}</td>
                <td className="px-3 py-2">{w.failedJobs}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${w.utilization}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">%{w.utilization}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
