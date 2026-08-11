import { useState, useCallback, useEffect } from 'react';
import { Eye, LayoutGrid, Bell, StickyNote, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWatchlistStore } from '@/stores/watchlist-store';
import type { WatchlistItem, WatchlistAlert, WatchlistNote, WatchlistPerformance as WatchlistPerformanceData } from '@/components/watchlist/watchlist-types';
import { WATCHLIST_TAB } from '@/components/watchlist/watchlist-types';
import {
  WatchlistHeader, WatchlistSummaryCards, WatchlistTable, WatchlistFilters,
  WatchlistAlerts, WatchlistNotes, WatchlistPerformance as WatchlistPerformancePanel, WatchlistExport,
} from '@/components/watchlist';
import { SkeletonCard } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { sdkClient } from '@/lib/sdk';

function toNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function mapOpportunity(level: string): string {
  switch (level) {
    case 'VERY_HIGH': return 'Çok Yüksek';
    case 'HIGH': return 'Yüksek';
    case 'MEDIUM': return 'Orta';
    case 'LOW': return 'Düşük';
    default: return '';
  }
}

function mapTrend(level: string): string {
  if (level === 'VERY_HIGH' || level === 'HIGH') return 'YUKARI';
  if (level === 'LOW') return 'ASAGI';
  return 'YATAY';
}

function mapStatus(status: string): WatchlistItem['status'] {
  switch (status) {
    case 'TOP_CANDIDATE': return 'AKTİF';
    case 'WATCHLIST': return 'İZLENEN';
    default: return 'BEKLEMEDE';
  }
}

function mapAlert(entry: Record<string, unknown>): WatchlistAlert {
  const priority = String(entry.priority ?? '').toUpperCase();
  const severity = priority === 'HIGH' || priority === 'CRITICAL' ? 'CRITICAL' : priority === 'MEDIUM' ? 'WARNING' : 'INFO';
  return {
    id: String(entry.id ?? ''),
    symbol: String(entry.symbol ?? ''),
    type: String(entry.type ?? '') as WatchlistAlert['type'],
    message: String(entry.message ?? entry.title ?? ''),
    timestamp: String(entry.createdAt ?? entry.deliveredAt ?? ''),
    severity,
  };
}

const TAB_CONFIG = [
  { key: WATCHLIST_TAB.TABLE, label: 'İzleme Listesi', icon: LayoutGrid },
  { key: WATCHLIST_TAB.ALERTS, label: 'Alarmlar', icon: Bell },
  { key: WATCHLIST_TAB.NOTES, label: 'Notlar', icon: StickyNote },
  { key: WATCHLIST_TAB.PERFORMANCE, label: 'Performans', icon: BarChart3 },
];

export default function WatchlistPage() {
  const [activeTab, setActiveTab] = useState<string>(WATCHLIST_TAB.TABLE);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loading, toggleCompact } = useWatchlistStore();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [alerts, setAlerts] = useState<WatchlistAlert[]>([]);
  const [notes, setNotes] = useState<WatchlistNote[]>([]);
  const [performance, setPerformance] = useState<WatchlistPerformanceData[]>([]);

  const fetchData = useCallback(async () => {
    setLoaded(false);
    setError(null);
    try {
      const [watchlistRes, scannerRes, alertsRes] = await Promise.all([
        sdkClient.watchlist(),
        sdkClient.scanner().catch(() => null),
        sdkClient.alerts().catch(() => null),
      ]);

      const lists = (watchlistRes.data?.lists ?? []) as Array<{ name?: string; entries?: Array<{ symbol?: string }> }>;
      const symbols = [...new Set(lists.flatMap((l) => (l.entries ?? []).map((e) => String(e.symbol ?? '').toUpperCase()).filter(Boolean)))];

      const scanItems: Array<Record<string, unknown>> = [];
      if (scannerRes) {
        const r = scannerRes as Record<string, unknown>;
        for (const key of ['topCandidates', 'watchlist', 'rejected']) {
          const arr = r[key];
          if (Array.isArray(arr)) scanItems.push(...(arr as Array<Record<string, unknown>>));
        }
      }
      const scanMap = new Map<string, Record<string, unknown>>();
      for (const item of scanItems) scanMap.set(String(item.symbol).toUpperCase(), item);

      const mappedItems: WatchlistItem[] = symbols.map((symbol) => {
        const scan = scanMap.get(symbol);
        const opportunity = String(scan?.opportunityLevel ?? '');
        return {
          symbol,
          name: symbol,
          sector: '',
          eliteScore: toNumber(scan?.eliteScore),
          eliteRating: String(scan?.eliteRating ?? ''),
          opportunityLevel: mapOpportunity(opportunity),
          confidence: toNumber(scan?.candidateScore) / 100,
          currentPrice: 0,
          dailyChange: 0,
          dailyChangePercent: 0,
          weeklyChangePercent: 0,
          smartMoneyScore: toNumber(scan?.candidateScore),
          trend: mapTrend(opportunity),
          status: mapStatus(String(scan?.status ?? 'WATCHLIST')),
          alert: false,
          alertMessage: '',
          notes: '',
        };
      });

      const history = (alertsRes?.data?.alerts ?? []) as Array<Record<string, unknown>>;
      const mappedAlerts = history
        .filter((e) => e.symbol && symbols.includes(String(e.symbol).toUpperCase()))
        .map(mapAlert);

      setItems(mappedItems);
      setAlerts(mappedAlerts);
      setNotes([]);
      setPerformance([]);
    } catch {
      setError('İzleme listesi verileri yüklenirken bir hata oluştu.');
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (error) {
    return (
      <div className="p-4">
        <ErrorCard
          title="İzleme Listesi Yüklenemedi"
          message={error}
          onRetry={fetchData}
        />
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="space-y-4 p-4">
        <SkeletonCard rows={2} className="h-24" />
        <div className="grid gap-4 lg:grid-cols-4">
          <SkeletonCard rows={3} />
          <SkeletonCard rows={3} />
          <SkeletonCard rows={3} />
          <SkeletonCard rows={3} />
        </div>
        <SkeletonCard rows={10} />
      </div>
    );
  }

  const sectors = [...new Set(items.map((i) => i.sector))];

  return (
    <div className="animate-fade-in space-y-4 p-4">
      <WatchlistHeader
        onAddList={() => {}}
        onRefresh={fetchData}
        onExport={() => {}}
        loading={loading}
      />

      <WatchlistSummaryCards
        summary={{
          totalWatched: items.length,
          earlyOpportunities: items.filter((i) => i.opportunityLevel === 'Erken' || i.opportunityLevel === 'Çok Yüksek').length,
          aaaCount: items.filter((i) => i.eliteRating === 'AAA').length,
          risingCount: items.filter((i) => i.trend === 'YUKARI').length,
          fallingCount: items.filter((i) => i.trend === 'ASAGI').length,
          newAlerts: alerts.length,
          avgEliteScore: items.length ? items.reduce((s, i) => s + i.eliteScore, 0) / items.length : 0,
          avgConfidence: items.length ? items.reduce((s, i) => s + i.confidence, 0) / items.length : 0,
        }}
      />

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="flex overflow-x-auto border-b">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors',
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.key === WATCHLIST_TAB.ALERTS && alerts.length > 0 && (
                <span className="ml-1 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] text-destructive-foreground">
                  {alerts.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === WATCHLIST_TAB.TABLE && (
            <div className="space-y-4">
              <WatchlistFilters sectors={sectors} onFilterChange={() => {}} />
              <WatchlistExport items={items} />
              <WatchlistTable items={items} onSelect={() => {}} />
            </div>
          )}

          {activeTab === WATCHLIST_TAB.ALERTS && (
            <WatchlistAlerts alerts={alerts} />
          )}

          {activeTab === WATCHLIST_TAB.NOTES && (
            <WatchlistNotes notes={notes} />
          )}

          {activeTab === WATCHLIST_TAB.PERFORMANCE && (
            <WatchlistPerformancePanel data={performance} />
          )}
        </div>
      </div>
    </div>
  );
}
