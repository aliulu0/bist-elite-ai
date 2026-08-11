import { Card } from '@/components/shared';
import type { PerformanceSnapshot } from './performance-types';
import { HEALTH_STATUS_LABELS, HEALTH_STATUS_COLORS } from './performance-types';
import { Progress } from '@/components/shared';
import { EmptyState } from '@/components/shared';

interface PerformanceOverviewProps {
  snapshot: PerformanceSnapshot | null;
}

export function PerformanceOverview({ snapshot }: PerformanceOverviewProps) {
  if (!snapshot) {
    return <EmptyState title="Henüz performans verisi bulunmuyor" description="Veri toplamaya başladığında burada görüntülenecek" />;
  }

  const sys = snapshot.systemMetrics;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card title="Sistem Durumu">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Sağlık</span>
            <span className={`text-sm font-medium ${HEALTH_STATUS_COLORS[snapshot.health]}`}>
              {HEALTH_STATUS_LABELS[snapshot.health]}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs">CPU</span>
              <span className="text-xs text-muted-foreground">{sys.cpuUsagePercent.toFixed(1)}%</span>
            </div>
            <Progress value={sys.cpuUsagePercent} variant={sys.cpuUsagePercent > 80 ? 'danger' : sys.cpuUsagePercent > 60 ? 'warning' : 'success'} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs">RAM</span>
              <span className="text-xs text-muted-foreground">{sys.memoryUsageMb.toFixed(0)} MB</span>
            </div>
            <Progress value={sys.memoryUsageMb} max={2048} variant={sys.memoryUsageMb > 1024 ? 'danger' : 'default'} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs">Heap</span>
              <span className="text-xs text-muted-foreground">{sys.heapUsedMb.toFixed(0)} / {sys.heapTotalMb.toFixed(0)} MB</span>
            </div>
            <Progress value={sys.heapUsedMb} max={sys.heapTotalMb || 1} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs">Çalışma Süresi</span>
            <span className="text-xs text-muted-foreground">{formatUptime(snapshot.uptime || sys.nodeUptimeSeconds)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs">Ortalama Gecikme</span>
            <span className="text-xs text-muted-foreground">{sys.eventLoopDelayMs.toFixed(2)}ms</span>
          </div>
        </div>
      </Card>
      <Card title="Kritik Uyarılar">
        <div className="space-y-2">
          {snapshot.alerts.filter((a) => a.severity === 'CRITICAL').length === 0 ? (
            <p className="text-sm text-muted-foreground">Kritik uyarı bulunmuyor</p>
          ) : (
            snapshot.alerts
              .filter((a) => a.severity === 'CRITICAL')
              .slice(0, 5)
              .map((alert) => (
                <div key={alert.id} className="rounded-md bg-destructive/5 px-3 py-2 border border-destructive/20">
                  <p className="text-xs font-medium text-destructive">{alert.title}</p>
                  <p className="text-[10px] text-muted-foreground">{alert.description}</p>
                </div>
              ))
          )}
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
