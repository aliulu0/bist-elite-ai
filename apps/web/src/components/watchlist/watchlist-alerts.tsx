import { Bell, AlertTriangle, Zap, TrendingUp, Minus, Activity } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import type { WatchlistAlert } from './watchlist-types';
import { ALERT_TYPE_LABELS, SEVERITY_COLORS } from './watchlist-types';

interface WatchlistAlertsProps {
  alerts: WatchlistAlert[];
}

const ALERT_ICONS: Record<string, typeof Zap> = {
  ERKEN_FIRSAT: Zap,
  ELITE_YUKSELDI: TrendingUp,
  SMART_MONEY: Activity,
  DESTEK_KRILDI: AlertTriangle,
  SIKISMA: Minus,
};

export function WatchlistAlerts({ alerts }: WatchlistAlertsProps) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold">Alarmlar</h3>
        <EmptyState
          title="Alarm verisi yok"
          description="Yeni alarmlar burada görünecek"
          icon={<Bell className="h-6 w-6 text-muted-foreground" />}
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Bell className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Alarmlar ({alerts.length})</h3>
      </div>
      <div className="space-y-2">
        {alerts.map((a) => {
          const Icon = ALERT_ICONS[a.type] || Bell;
          return (
            <div key={a.id} className="flex items-start gap-3 rounded-md border p-3 text-xs">
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${SEVERITY_COLORS[a.severity] || 'text-muted-foreground'}`} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{a.symbol}</span>
                  <span className="text-muted-foreground">{new Date(a.timestamp).toLocaleString('tr-TR')}</span>
                </div>
                <p className="mt-0.5 text-muted-foreground">{ALERT_TYPE_LABELS[a.type] || a.type}</p>
                <p className="mt-0.5">{a.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
