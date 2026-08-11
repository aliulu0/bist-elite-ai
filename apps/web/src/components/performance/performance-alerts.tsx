import { Card, EmptyState } from '@/components/shared';
import type { PerformanceSnapshot } from './performance-types';
import { AlertTriangle, AlertCircle, Server, Activity, ListOrdered, Radio } from 'lucide-react';

interface PerformanceAlertsProps {
  snapshot: PerformanceSnapshot | null;
}

const ALERT_ICONS: Record<string, React.FC<{ className?: string }>> = {
  SLOW_ENDPOINT: Activity,
  HIGH_MEMORY: Server,
  QUEUE_OVERLOAD: ListOrdered,
  PROVIDER_FAILURE: Radio,
  PERF_WARNING: AlertTriangle,
  CRITICAL_WARNING: AlertCircle,
};

const SEVERITY_COLORS: Record<string, string> = {
  WARNING: 'border-warning/20 bg-warning/5',
  CRITICAL: 'border-destructive/20 bg-destructive/5',
};

const SEVERITY_TEXT: Record<string, string> = {
  WARNING: 'text-warning',
  CRITICAL: 'text-destructive',
};

export function PerformanceAlerts({ snapshot }: PerformanceAlertsProps) {
  if (!snapshot || snapshot.alerts.length === 0) {
    return <EmptyState title="Performans uyarısı yok" description="Sistem_normal çalışırken uyarı burada görünecek" />;
  }

  return (
    <div className="space-y-2">
      {snapshot.alerts.map((alert) => {
        const Icon = ALERT_ICONS[alert.type] || AlertTriangle;
        return (
          <Card key={alert.id}>
            <div className={`flex items-start gap-3 rounded-md border p-3 ${SEVERITY_COLORS[alert.severity] || ''}`}>
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${SEVERITY_TEXT[alert.severity] || 'text-muted-foreground'}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{alert.title}</p>
                  <span className={`text-[10px] font-medium ${SEVERITY_TEXT[alert.severity] || ''}`}>
                    {alert.severity === 'CRITICAL' ? 'KRİTİK' : 'UYARI'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{alert.description}</p>
                <div className="mt-1 flex gap-3 text-[10px] text-muted-foreground">
                  <span>Kaynak: {alert.source}</span>
                  <span>{new Date(alert.timestamp).toLocaleString('tr-TR')}</span>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
