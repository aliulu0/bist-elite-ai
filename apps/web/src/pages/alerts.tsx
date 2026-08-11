import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAlertsStore } from '@/stores/alerts-store';
import {
  AlertsHeader,
  AlertsSummary,
  AlertsTabs,
  AlertsList,
  AlertsFilters,
  AlertsDetail,
  AlertsEmptyState,
  AlertsSettings,
  AlertsExport,
} from '@/components/alerts';
import type { Alert, AlertType, AlertPriority, AlertStatus, AlertGroup } from '@/components/alerts/alerts-types';
import { SkeletonCard } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { sdkClient } from '@/lib/sdk';

function mapPriority(priority: string): AlertPriority {
  switch (String(priority).toUpperCase()) {
    case 'CRITICAL': return 'KRITIK';
    case 'HIGH': return 'YUKSEK';
    case 'MEDIUM': return 'ORTA';
    case 'LOW': return 'DUSUK';
    case 'INFO': return 'BILGI';
    default: return 'ORTA';
  }
}

function mapStatus(status: string): AlertStatus {
  switch (String(status).toUpperCase()) {
    case 'ACTIVE': return 'YENI';
    case 'ACKNOWLEDGED': return 'OKUNDU';
    case 'DISMISSED': return 'ATLADI';
    case 'RESOLVED': return 'COZULDU';
    default: return 'YENI';
  }
}

function mapGroup(type: string): AlertGroup {
  const t = String(type).toUpperCase();
  if (t.includes('WORKFLOW')) return 'WORKFLOW';
  if (t.includes('PROVIDER')) return 'PROVIDER';
  if (t.includes('SISTEM') || t.includes('SYSTEM') || t.includes('CPU') || t.includes('DISK')) return 'SISTEM';
  if (t.includes('PORTFOY') || t.includes('PORTFOLIO')) return 'PORTFOY';
  if (t.includes('WATCHLIST')) return 'WATCHLIST';
  return 'PIYASA';
}

function mapAlert(entry: Record<string, unknown>): Alert {
  const deliveredChannels = Array.isArray(entry.deliveredChannels) ? entry.deliveredChannels.join(', ') : '';
  const extraInfo: Record<string, string> = {};
  if (deliveredChannels) extraInfo['Dağıtım'] = deliveredChannels;
  if (entry.durationMs != null) extraInfo['Süre'] = `${String(entry.durationMs)} ms`;
  return {
    id: String(entry.id ?? ''),
    type: String(entry.type ?? 'BILGI') as AlertType,
    title: String(entry.title ?? ''),
    description: String(entry.message ?? ''),
    priority: mapPriority(String(entry.priority ?? '')),
    status: mapStatus(String(entry.status ?? '')),
    group: mapGroup(String(entry.type ?? '')),
    source: 'Alert Engine',
    symbol: entry.symbol ? String(entry.symbol) : undefined,
    timestamp: String(entry.createdAt ?? entry.deliveredAt ?? ''),
    read: String(entry.status ?? '').toUpperCase() !== 'ACTIVE',
    extraInfo,
  };
}

export default function AlertsPage() {
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeTab = useAlertsStore((s) => s.activeTab);
  const alerts = useAlertsStore((s) => s.alerts);
  const search = useAlertsStore((s) => s.search);
  const sortKey = useAlertsStore((s) => s.sortKey);
  const sortDir = useAlertsStore((s) => s.sortDir);
  const settings = useAlertsStore((s) => s.settings);
  const selectedAlert = useAlertsStore((s) => s.selectedAlert);
  const setSelectedAlert = useAlertsStore((s) => s.setSelectedAlert);
  const markAsRead = useAlertsStore((s) => s.markAsRead);
  const setAlerts = useAlertsStore((s) => s.setAlerts);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await sdkClient.alerts(100, 0);
      const entries = (res.data?.alerts ?? []) as Array<Record<string, unknown>>;
      setAlerts(entries.map(mapAlert));
    } catch {
      setError('Alarm verileri yüklenirken bir hata oluştu.');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [setAlerts]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredAlerts = useMemo(() => {
    const groupMap: Record<string, string> = {
      PIYASA: 'PIYASA',
      WORKFLOW: 'WORKFLOW',
      PROVIDER: 'PROVIDER',
      SISTEM: 'SISTEM',
      PORTFOY: 'PORTFOY',
      WATCHLIST: 'WATCHLIST',
    };
    const q = search.trim().toLowerCase();
    return alerts.filter((a) => {
      if (activeTab !== 'TUMU' && a.group !== groupMap[activeTab]) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.source.toLowerCase().includes(q) ||
        (a.symbol && a.symbol.toLowerCase().includes(q))
      );
    });
  }, [activeTab, alerts, search]);

  const handleExport = useCallback((format: 'csv' | 'json') => {
    const data = filteredAlerts.map((a) => ({
      tür: a.type,
      başlık: a.title,
      öncelik: a.priority,
      durum: a.status,
      kaynak: a.source,
      kod: a.symbol ?? '',
      zaman: a.timestamp,
    }));
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'alarmlar.json';
      link.click();
      URL.revokeObjectURL(url);
    } else {
      const csv = [
        Object.keys(data[0] ?? {}).join(','),
        ...data.map((d) => Object.values(d).join(',')),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'alarmlar.csv';
      link.click();
      URL.revokeObjectURL(url);
    }
  }, [filteredAlerts]);

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <SkeletonCard rows={2} className="h-24" />
        <SkeletonCard rows={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorCard
          title="Alarm Merkezi Yüklenemedi"
          message={error}
          onRetry={fetchData}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AlertsHeader />
      <AlertsSummary />
      <AlertsTabs />
      <AlertsFilters />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {filteredAlerts.length === 0 ? (
            <AlertsEmptyState />
          ) : (
            <AlertsList alerts={filteredAlerts} />
          )}
        </div>
        <div className="space-y-4">
          <AlertsDetail
            alert={selectedAlert}
            onClose={() => setSelectedAlert(null)}
          />
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            {showSettings ? 'Ayarları Gizle' : 'Alarm Ayarları'}
          </button>
          {showSettings && <AlertsSettings />}
          <AlertsExport onExport={handleExport} />
        </div>
      </div>
    </div>
  );
}
