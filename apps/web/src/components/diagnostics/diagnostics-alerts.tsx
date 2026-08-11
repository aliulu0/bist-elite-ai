import { Card, EmptyState } from '@/components/shared';
import type { DiagnosticsSnapshot } from './diagnostics-types';
import { AlertTriangle, XCircle, Clock, Radio } from 'lucide-react';

interface DiagnosticsAlertsProps {
  snapshot: DiagnosticsSnapshot | null;
}

export function DiagnosticsAlerts({ snapshot }: DiagnosticsAlertsProps) {
  if (!snapshot) {
    return <EmptyState title="Uyarı bulunmuyor" description="Tanılama uyarıları burada görüntülenecek" />;
  }

  if (snapshot.alerts.length === 0) {
    return <EmptyState title="Uyarı bulunmuyor" description="Aktif uyarı bulunmuyor" />;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'TIMEOUT':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'FAILED_CHECK':
      case 'WORKFLOW_FAILURE':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'PROVIDER_ERROR':
      case 'QUEUE_OVERLOAD':
        return <Radio className="h-4 w-4 text-destructive" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-warning" />;
    }
  };

  return (
    <Card title="Tanılama Uyarıları">
      <div className="space-y-2">
        {snapshot.alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start gap-3 rounded-md px-3 py-2 border ${
              alert.severity === 'CRITICAL'
                ? 'bg-destructive/5 border-destructive/20'
                : 'bg-warning/5 border-warning/20'
            }`}
          >
            {getIcon(alert.type)}
            <div className="flex-1">
              <p className="text-xs font-medium">{alert.title}</p>
              <p className="text-[10px] text-muted-foreground">{alert.description}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {new Date(alert.timestamp).toLocaleString('tr-TR')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
