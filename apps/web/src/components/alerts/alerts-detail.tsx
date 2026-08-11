import type { Alert } from '@/components/alerts/alerts-types';
import { ALERT_TYPE_LABELS, PRIORITY_LABELS, STATUS_LABELS, PRIORITY_COLORS, STATUS_COLORS } from '@/components/alerts/alerts-types';
import { X } from 'lucide-react';

interface AlertsDetailProps {
  alert: Alert | null;
  onClose: () => void;
}

export function AlertsDetail({ alert, onClose }: AlertsDetailProps) {
  if (!alert) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="text-center text-muted-foreground">Alarm detayları için yeterli veri yok</div>
      </div>
    );
  }

  const infoRows: Array<{ label: string; value: string }> = [
    { label: 'Başlık', value: alert.title },
    { label: 'Açıklama', value: alert.description },
    { label: 'Kaynak', value: alert.source },
    { label: 'Tür', value: ALERT_TYPE_LABELS[alert.type] },
    { label: 'İlgili Hisse', value: alert.symbol ?? '-' },
    { label: 'İlgili Workflow', value: alert.workflowId ?? '-' },
    { label: 'İlgili Provider', value: alert.providerName ?? '-' },
    { label: 'Oluşma Zamanı', value: new Date(alert.timestamp).toLocaleString('tr-TR') },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Alarm Detayı</h3>
        <button onClick={onClose} className="rounded p-1 hover:bg-accent">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-4 flex gap-2">
        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[alert.priority]}`}>
          {PRIORITY_LABELS[alert.priority]}
        </span>
        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[alert.status]}`}>
          {STATUS_LABELS[alert.status]}
        </span>
      </div>
      <div className="space-y-2">
        {infoRows.map((row) => (
          <div key={row.label} className="flex gap-2">
            <span className="w-28 shrink-0 text-sm text-muted-foreground">{row.label}:</span>
            <span className="text-sm">{row.value}</span>
          </div>
        ))}
      </div>
      {alert.extraInfo && Object.keys(alert.extraInfo).length > 0 && (
        <div className="mt-4 rounded-lg border border-border bg-muted/50 p-3">
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">Ek Bilgiler</h4>
          <div className="space-y-1">
            {Object.entries(alert.extraInfo).map(([k, v]) => (
              <div key={k} className="flex gap-2 text-sm">
                <span className="text-muted-foreground">{k}:</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
