import { useAlertsStore } from '@/stores/alerts-store';
import { ALERT_TYPE_LABELS, PRIORITY_LABELS, STATUS_LABELS } from '@/components/alerts/alerts-types';
import type { AlertType, AlertPriority, AlertStatus } from '@/components/alerts/alerts-types';

export function AlertsFilters() {
  const { filterType, setFilterType, filterPriority, setFilterPriority, filterStatus, setFilterStatus, filterRead, setFilterRead, filterSymbol, setFilterSymbol } =
    useAlertsStore();

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">Filtreler</h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Tür Filtresi</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Tümü</option>
            {(Object.entries(ALERT_TYPE_LABELS) as Array<[AlertType, string]>).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Öncelik Filtresi</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Tümü</option>
            {(Object.entries(PRIORITY_LABELS) as Array<[AlertPriority, string]>).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Durum Filtresi</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Tümü</option>
            {(Object.entries(STATUS_LABELS) as Array<[AlertStatus, string]>).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Okunma</label>
          <select
            value={filterRead}
            onChange={(e) => setFilterRead(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Tümü</option>
            <option value="unread">Okunmamış</option>
            <option value="read">Okunmuş</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Hisse Kodu</label>
          <input
            value={filterSymbol}
            onChange={(e) => setFilterSymbol(e.target.value)}
            placeholder="Örn: THYAO"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
