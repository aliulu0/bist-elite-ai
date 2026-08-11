import type { Alert } from '@/components/alerts/alerts-types';
import { ALERT_TYPE_LABELS, PRIORITY_LABELS, STATUS_LABELS, PRIORITY_COLORS, STATUS_COLORS } from '@/components/alerts/alerts-types';

interface AlertsItemProps {
  alert: Alert;
  isSelected: boolean;
  onSelect: (a: Alert) => void;
  onMarkRead: (id: string) => void;
  visibleCols?: Record<string, boolean>;
}

export function AlertsItem({ alert, isSelected, onSelect, onMarkRead, visibleCols }: AlertsItemProps) {
  const show = (key: string) => !visibleCols || visibleCols[key];

  return (
    <tr
      className={`cursor-pointer border-b border-border hover:bg-accent/50 ${isSelected ? 'bg-accent/30' : ''} ${!alert.read ? 'font-medium' : ''}`}
      onClick={() => {
        onSelect(alert);
        if (!alert.read) onMarkRead(alert.id);
      }}
    >
      {show('priority') && (
        <td className="px-3 py-2 text-sm">
          <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[alert.priority]}`}>
            {PRIORITY_LABELS[alert.priority]}
          </span>
        </td>
      )}
      {show('type') && <td className="px-3 py-2 text-sm">{ALERT_TYPE_LABELS[alert.type]}</td>}
      {show('title') && <td className="px-3 py-2 text-sm font-medium">{alert.title}</td>}
      {show('status') && (
        <td className="px-3 py-2 text-sm">
          <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_COLORS[alert.status]}`}>
            {STATUS_LABELS[alert.status]}
          </span>
        </td>
      )}
      {show('source') && <td className="px-3 py-2 text-sm text-muted-foreground">{alert.source}</td>}
      {show('timestamp') && (
        <td className="px-3 py-2 text-sm text-muted-foreground">
          {new Date(alert.timestamp).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </td>
      )}
      {show('symbol') && <td className="px-3 py-2 text-sm font-medium">{alert.symbol ?? '-'}</td>}
      {show('actions') && (
        <td className="px-3 py-2 text-sm">
          {!alert.read && (
            <button
              className="text-xs text-primary hover:underline"
              aria-label="Okundu olarak işaretle"
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead(alert.id);
              }}
            >
              İşle
            </button>
          )}
        </td>
      )}
    </tr>
  );
}
