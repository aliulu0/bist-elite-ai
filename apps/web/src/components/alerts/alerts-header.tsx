import { Bell, RefreshCw, Download, CheckCheck } from 'lucide-react';
import { useAlertsStore } from '@/stores/alerts-store';

export function AlertsHeader() {
  const markAllAsRead = useAlertsStore((s) => s.markAllAsRead);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Alarm Merkezi</h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={markAllAsRead}
          className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
        >
          <CheckCheck className="h-4 w-4" />
          Tümünü Okundu İşaretle
        </button>
        <button className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent">
          <RefreshCw className="h-4 w-4" />
          Yenile
        </button>
        <button className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent">
          <Download className="h-4 w-4" />
          Dışa Aktar
        </button>
      </div>
    </div>
  );
}
