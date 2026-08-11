import { Card, EmptyState } from '@/components/shared';
import type { ProviderHealthSnapshot } from './provider-types';
import { AlertTriangle, XCircle, CheckCircle2, Radio } from 'lucide-react';

interface ProviderAlertsProps {
  snapshot: ProviderHealthSnapshot | null;
}

export function ProviderAlerts({ snapshot }: ProviderAlertsProps) {
  if (!snapshot) {
    return <EmptyState title="Uyarı verisi yok" description="Uyarılar oluşturulduğunda burada görüntülenecek" />;
  }

  if (snapshot.alerts.length === 0) {
    return <EmptyState title="Arıza kaydı yok" description="Aktif uyarı bulunmuyor" />;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'RECOVERY':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'OFFLINE':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'CONSECUTIVE_FAILURES':
        return <Radio className="h-4 w-4 text-destructive" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-warning" />;
    }
  };

  return (
    <Card title="Sağlayıcı Uyarıları">
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
              <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>{alert.provider}</span>
                <span>•</span>
                <span>{new Date(alert.timestamp).toLocaleString('tr-TR')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
