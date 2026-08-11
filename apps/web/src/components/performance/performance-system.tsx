import { Card, Progress, EmptyState } from '@/components/shared';
import type { PerformanceSnapshot } from './performance-types';
import { Cpu, HardDrive, Activity } from 'lucide-react';

interface PerformanceSystemProps {
  snapshot: PerformanceSnapshot | null;
}

export function PerformanceSystem({ snapshot }: PerformanceSystemProps) {
  if (!snapshot) {
    return <EmptyState title="Sistem sağlığı verisi yok" description="Sistem metrikleri toplandığında burada görüntülenecek" />;
  }

  const sys = snapshot.systemMetrics;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card title="CPU & Bellek">
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">CPU Kullanımı</span>
              </div>
              <span className="text-xs text-muted-foreground">{sys.cpuUsagePercent.toFixed(1)}%</span>
            </div>
            <Progress value={sys.cpuUsagePercent} variant={sys.cpuUsagePercent > 80 ? 'danger' : sys.cpuUsagePercent > 60 ? 'warning' : 'success'} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">Bellek Kullanımı</span>
              </div>
              <span className="text-xs text-muted-foreground">{sys.memoryUsageMb.toFixed(0)} MB</span>
            </div>
            <Progress value={sys.memoryUsageMb} max={2048} variant={sys.memoryUsageMb > 1024 ? 'danger' : 'default'} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Heap Kullanımı</span>
              <span className="text-xs text-muted-foreground">{sys.heapUsedMb.toFixed(0)} / {sys.heapTotalMb.toFixed(0)} MB</span>
            </div>
            <Progress value={sys.heapUsedMb} max={sys.heapTotalMb || 1} />
          </div>
        </div>
      </Card>
      <Card title="Node.js Detayı">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-muted/50 p-3">
              <span className="text-[10px] text-muted-foreground">RSS</span>
              <p className="text-sm font-medium">{sys.rssMb.toFixed(1)} MB</p>
            </div>
            <div className="rounded-md bg-muted/50 p-3">
              <span className="text-[10px] text-muted-foreground">Event Loop Gecikmesi</span>
              <p className="text-sm font-medium">{sys.eventLoopDelayMs.toFixed(2)}ms</p>
            </div>
            <div className="rounded-md bg-muted/50 p-3">
              <span className="text-[10px] text-muted-foreground">Node Çalışma Süresi</span>
              <p className="text-sm font-medium">{formatUptime(sys.nodeUptimeSeconds)}</p>
            </div>
            <div className="rounded-md bg-muted/50 p-3">
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">GC Çalıştırma</span>
              </div>
              <p className="text-sm font-medium">{sys.gcRuns}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function formatUptime(seconds: number): string {
  if (seconds <= 0) return '0s';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}g ${h}sa`;
  if (h > 0) return `${h}sa ${m}dk`;
  return `${m}dk`;
}
