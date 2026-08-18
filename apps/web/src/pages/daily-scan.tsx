import { useCallback, useEffect, useState } from 'react';
import {
  RefreshCw,
  Loader2,
  TrendingUp,
  ShieldAlert,
  Activity,
  BarChart3,
  Radar,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/shared/card';
import { Badge } from '@/components/shared/badge';
import { StatCard } from '@/components/shared/stat-card';
import { DataTable, ErrorCard, SectionTitle, LoadingCard, EmptyState } from '@/components/shared';
import { cn } from '@/lib/utils';
import { sdkClient } from '@/lib/sdk';
import type {
  DailyScanSummary,
  OpportunityRadarEvent,
  ProviderScanSummary,
  ScannerRankingResultEntry,
  ScannerRankingSnapshot,
} from '@/lib/sdk';

const EVENT_TYPE_LABELS: Record<string, string> = {
  NEW_OPPORTUNITY: 'Yeni Fırsat',
  OPPORTUNITY_STRENGTHENING: 'Güçlenen Sinyal',
  RANK_IMPROVEMENT: 'Sıralama İyileşmesi',
  SCORE_SURGE: 'Skor Artışı',
  BREAKOUT_DEVELOPING: 'Gelişen Kırılım',
  VOLUME_EXPANSION: 'Hacim Genişlemesi',
  MOMENTUM_ACCELERATION: 'Momentum Hızlanması',
  MULTI_TIMEFRAME_ALIGNMENT: 'Çoklu Zaman Uyumu',
  DNA_RELEVANCE: 'DNA İlgi',
  SIGNAL_WEAKENING: 'Sinyal Zayıflaması',
  RANK_DETERIORATION: 'Sıralama Bozulması',
  SIGNAL_LOST: 'Sinyal Kaybı',
  DATA_QUALITY_DETERIORATION: 'Veri Kalitesi Bozulması',
  DATA_BECAME_UNAVAILABLE: 'Veri Kullanılamaz Oldu',
  DATA_BECAME_AVAILABLE: 'Veri Kullanılabilir Oldu',
};

function eventVariant(
  type: string,
): 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'default' {
  if (['NEW_OPPORTUNITY', 'OPPORTUNITY_STRENGTHENING', 'MULTI_TIMEFRAME_ALIGNMENT'].includes(type))
    return 'success';
  if (['SIGNAL_WEAKENING', 'RANK_DETERIORATION'].includes(type)) return 'warning';
  if (['SIGNAL_LOST', 'DATA_QUALITY_DETERIORATION', 'DATA_BECAME_UNAVAILABLE'].includes(type))
    return 'danger';
  if (
    [
      'SCORE_SURGE',
      'RANK_IMPROVEMENT',
      'BREAKOUT_DEVELOPING',
      'VOLUME_EXPANSION',
      'MOMENTUM_ACCELERATION',
    ].includes(type)
  )
    return 'info';
  return 'outline';
}

function statusVariant(status: string): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'COMPLETE') return 'success';
  if (status === 'PARTIAL') return 'warning';
  if (status === 'DEGRADED' || status === 'FAILED') return 'danger';
  return 'default';
}

function statusLabel(status: string): string {
  switch (status) {
    case 'COMPLETE':
      return 'TAMAMLANDI';
    case 'PARTIAL':
      return 'KISMİ';
    case 'DEGRADED':
      return 'BOZULMUŞ';
    case 'FAILED':
      return 'BAŞARISIZ';
    default:
      return status;
  }
}

function dataStatusVariant(dataStatus: string): 'success' | 'warning' | 'danger' | 'default' {
  if (dataStatus === 'VALID') return 'success';
  if (dataStatus === 'PARTIAL') return 'warning';
  return 'danger';
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '--';
  return value.toLocaleString('tr-TR');
}

function formatScore(value: number | null | undefined): string {
  if (value === null || value === undefined) return '--';
  return value.toFixed(1);
}

interface DailyScanRow {
  rank: number;
  symbol: string;
  eliteScore: number;
  financialScore: number;
  technicalScore: number;
  confluence: string;
  multiTimeframeScore: number | null;
  regime: string;
  status: string;
  dataStatus: string;
}

interface GroupedEvents {
  newOpportunities: OpportunityRadarEvent[];
  strengthening: OpportunityRadarEvent[];
  rankImprovements: OpportunityRadarEvent[];
  scoreSurges: OpportunityRadarEvent[];
  volumeExpansions: OpportunityRadarEvent[];
  momentumAccelerations: OpportunityRadarEvent[];
  breakoutDevelopments: OpportunityRadarEvent[];
  multiTimeframeAlignments: OpportunityRadarEvent[];
  weakened: OpportunityRadarEvent[];
  lost: OpportunityRadarEvent[];
}

function groupEvents(events: OpportunityRadarEvent[]): GroupedEvents {
  const grouped: GroupedEvents = {
    newOpportunities: [],
    strengthening: [],
    rankImprovements: [],
    scoreSurges: [],
    volumeExpansions: [],
    momentumAccelerations: [],
    breakoutDevelopments: [],
    multiTimeframeAlignments: [],
    weakened: [],
    lost: [],
  };
  events.forEach((e) => {
    switch (e.type) {
      case 'NEW_OPPORTUNITY':
        grouped.newOpportunities.push(e);
        break;
      case 'OPPORTUNITY_STRENGTHENING':
        grouped.strengthening.push(e);
        break;
      case 'RANK_IMPROVEMENT':
        grouped.rankImprovements.push(e);
        break;
      case 'SCORE_SURGE':
        grouped.scoreSurges.push(e);
        break;
      case 'VOLUME_EXPANSION':
        grouped.volumeExpansions.push(e);
        break;
      case 'MOMENTUM_ACCELERATION':
        grouped.momentumAccelerations.push(e);
        break;
      case 'BREAKOUT_DEVELOPING':
        grouped.breakoutDevelopments.push(e);
        break;
      case 'MULTI_TIMEFRAME_ALIGNMENT':
        grouped.multiTimeframeAlignments.push(e);
        break;
      case 'SIGNAL_WEAKENING':
        grouped.weakened.push(e);
        break;
      case 'SIGNAL_LOST':
        grouped.lost.push(e);
        break;
      default:
        break;
    }
  });
  return grouped;
}

function renderEventList(events: OpportunityRadarEvent[], emptyMessage: string) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }
  return (
    <div className="space-y-2">
      {events.map((e, i) => (
        <div
          key={`${e.symbol}-${e.type}-${i}`}
          className="flex items-start justify-between gap-3 rounded-md border p-3"
        >
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={eventVariant(e.type)}>{EVENT_TYPE_LABELS[e.type] ?? e.type}</Badge>
              <span className="text-sm font-medium">{e.symbol}</span>
              {e.eliteScore !== null && (
                <span className="text-xs text-muted-foreground">
                  Elite: {formatScore(e.eliteScore)}
                </span>
              )}
              {e.rank !== null && (
                <span className="text-xs text-muted-foreground">Sıra: {e.rank}</span>
              )}
              <span className="text-xs text-muted-foreground">{e.confidence}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{e.reason}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DailyScanPage() {
  const [summary, setSummary] = useState<DailyScanSummary | null>(null);
  const [snapshot, setSnapshot] = useState<ScannerRankingSnapshot | null>(null);
  const [radarEvents, setRadarEvents] = useState<OpportunityRadarEvent[]>([]);
  const [hasSnapshot, setHasSnapshot] = useState(false);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryRes, snapshotRes, radarRes] = await Promise.allSettled([
        sdkClient.dailyScanSummary(),
        sdkClient.dailyScanLatest(),
        sdkClient.dailyScanRadar(),
      ]);
      const hasAny =
        summaryRes.status === 'fulfilled' ||
        snapshotRes.status === 'fulfilled' ||
        (radarRes.status === 'fulfilled' && radarRes.value.eventCount > 0);
      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value);
      } else {
        setSummary(null);
      }
      if (snapshotRes.status === 'fulfilled') {
        setSnapshot(snapshotRes.value);
      } else {
        setSnapshot(null);
      }
      if (radarRes.status === 'fulfilled') {
        setRadarEvents(radarRes.value.events ?? []);
      } else {
        setRadarEvents([]);
      }
      setHasSnapshot(hasAny);
    } catch {
      setError('Günlük tarama verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const runDailyScan = useCallback(async () => {
    setRunning(true);
    setError('');
    try {
      const before = summary?.scanId ?? null;
      await sdkClient.dailyScanRun({}).catch(() => {
        // Cold runs can exceed the HTTP request timeout; the scan keeps
        // running server-side, so we poll for a new snapshot until it settles.
      });
      const deadline = Date.now() + 5 * 60 * 1000;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const next = await sdkClient.dailyScanLatest().catch(() => null);
        if (next && next.scanId !== before) break;
        if (Date.now() > deadline) break;
        await new Promise((r) => setTimeout(r, 5000));
      }
      await fetchData();
    } catch {
      setError('Günlük tarama başlatılamadı');
    } finally {
      setRunning(false);
    }
  }, [fetchData, summary]);

  if (loading && !hasSnapshot) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <LoadingCard
          title="Günlük tarama yükleniyor..."
          description="En son tarama özeti getiriliyor"
        />
      </div>
    );
  }

  if (error && !hasSnapshot) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <ErrorCard message={error} onRetry={fetchData} />
      </div>
    );
  }

  if (!hasSnapshot) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <Card className="text-center p-12">
          <Radar className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-medium text-slate-300 mb-2">Henüz Günlük Tarama Yok</h3>
          <p className="text-slate-500">
            R2-078 günlük tarama henüz çalıştırılmamış. İlk taramayı başlatmak için aşağıdaki butona
            basın. Tarama BIST evrenindeki hisseleri analiz eder, Elite Score ile sıralar ve fırsat
            radarı olaylarını tespit eder. Tam tarama veri sağlayıcılarına bağlı olarak uzun
            sürebilir.
          </p>
          <button
            onClick={runDailyScan}
            disabled={running}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Activity className="h-4 w-4" />
            )}
            {running ? 'Taranıyor...' : 'Günlük Tarama Başlat'}
          </button>
        </Card>
      </div>
    );
  }

  const grouped = groupEvents(radarEvents);
  const results = (snapshot?.results ?? summary?.top10 ?? []).slice(0, 50);
  const rows: DailyScanRow[] = results.map((r) => ({
    rank: r.rank,
    symbol: r.symbol,
    eliteScore: r.eliteScore,
    financialScore: r.financialScore,
    technicalScore: r.technicalScore,
    confluence: r.multiTimeframeConfluence,
    multiTimeframeScore: r.multiTimeframeScore,
    regime: r.marketRegime ?? '--',
    status: r.status,
    dataStatus: r.dataStatus,
  }));
  const providers: ProviderScanSummary[] =
    summary?.providerSummary ?? snapshot?.providerSummary ?? [];
  const totalEvents =
    grouped.newOpportunities.length +
    grouped.strengthening.length +
    grouped.rankImprovements.length +
    grouped.scoreSurges.length +
    grouped.volumeExpansions.length +
    grouped.momentumAccelerations.length +
    grouped.breakoutDevelopments.length +
    grouped.multiTimeframeAlignments.length;

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <PageHeader
        title="Günlük BIST Taraması"
        description="R2-078 günlük tarama özeti, TOP sıralama ve fırsat radarı olayları"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={runDailyScan}
              disabled={running}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              aria-label="Günlük taramayı yenile"
            >
              <RefreshCw className={cn('h-4 w-4', running && 'animate-spin')} />
              {running ? 'Taranıyor...' : 'Günlük Tarama Çalıştır'}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Durum"
          value={statusLabel(summary?.status ?? '')}
          description={
            summary ? `Tarama: ${new Date(summary.timestamp).toLocaleString('tr-TR')}` : 'Veri yok'
          }
          icon={CheckCircle2}
          variant={statusVariant(summary?.status ?? '')}
        />
        <StatCard
          title="Evren"
          value={formatNumber(summary?.universeSize)}
          description="Keşfedilen sembol sayısı"
          icon={BarChart3}
        />
        <StatCard
          title="Değerlendirilen"
          value={formatNumber(summary?.evaluatedCount)}
          description="Taranan hisse sayısı"
          icon={Activity}
        />
        <StatCard
          title="Sinyal"
          value={formatNumber(summary?.signalCount)}
          description="Fırsat radarı olayı sayısı"
          icon={TrendingUp}
          variant={totalEvents > 0 ? 'success' : 'default'}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Aday (TOP CANDIDATE)"
          value={formatNumber(summary?.eligibleCount)}
          description="Top aday sayısı"
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Kullanılabilir"
          value={formatNumber(summary?.availableCount)}
          description="Verisi mevcut sembol sayısı"
          icon={Activity}
        />
        <StatCard
          title="Kullanılamaz"
          value={formatNumber(summary?.unavailableCount)}
          description="Veri bulunamayan sembol sayısı"
          icon={ShieldAlert}
          variant={(summary?.unavailableCount ?? 0) > 0 ? 'warning' : 'default'}
        />
        <StatCard
          title="Veri Kalitesi"
          value={summary?.dataQuality ?? '--'}
          description="Tarama veri kalitesi"
          icon={ShieldAlert}
          variant={dataStatusVariant(summary?.dataQuality ?? '')}
        />
      </div>

      <div className="mt-8">
        <SectionTitle
          title="TOP Sıralama"
          description="Elite Score'a göre sıralanan son tarama sonuçları"
        />
        {rows.length === 0 ? (
          <EmptyState
            title="Sıralama yok"
            description="Tarama sonucu bulunamadı"
            icon={<TrendingUp className="h-8 w-8 text-muted-foreground" />}
          />
        ) : (
          <DataTable
            columns={[
              { key: 'rank', header: 'Sıra', width: '70px', sortable: true },
              { key: 'symbol', header: 'Sembol', width: '100px', sortable: true },
              { key: 'eliteScore', header: 'Elite Skoru', width: '110px', sortable: true },
              { key: 'financialScore', header: 'Finansal', width: '90px', sortable: true },
              { key: 'technicalScore', header: 'Teknik', width: '90px', sortable: true },
              { key: 'confluence', header: 'Çoklu Zaman', width: '120px' },
              { key: 'multiTimeframeScore', header: 'MTF Skoru', width: '90px', sortable: true },
              { key: 'regime', header: 'Rejim', width: '100px' },
              { key: 'status', header: 'Durum', width: '120px' },
              { key: 'dataStatus', header: 'Veri Durumu', width: '120px' },
            ]}
            data={rows}
            pageSize={20}
            emptyMessage="Sıralama verisi yok"
          />
        )}
      </div>

      <div className="mt-8">
        <SectionTitle
          title="Fırsat Radarı Olayları"
          description="Önceki taramayla karşılaştırılarak tespit edilen değişiklikler"
        />
        {radarEvents.length === 0 ? (
          <EmptyState
            title="Olay yok"
            description="Son taramada radar olayı tespit edilmedi"
            icon={<Radar className="h-8 w-8 text-muted-foreground" />}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card
              title="Yeni Fırsatlar"
              description="Önceki taramada olmayan yeni fırsat sinyalleri"
            >
              {renderEventList(grouped.newOpportunities, 'Yeni fırsat tespit edilmedi')}
            </Card>
            <Card title="Güçlenen Sinyaller" description="Fırsat sinyali güçlenen hisseler">
              {renderEventList(grouped.strengthening, 'Güçlenen sinyal yok')}
            </Card>
            <Card title="Sıralama İyileşmeleri" description="Sıralaması yükselen hisseler">
              {renderEventList(grouped.rankImprovements, 'Sıralama iyileşmesi yok')}
            </Card>
            <Card title="Skor Artışları" description="Elite skoru anlamlı yükselen hisseler">
              {renderEventList(grouped.scoreSurges, 'Skor artışı yok')}
            </Card>
            <Card title="Hacim ve Momentum" description="Hacim genişlemesi ve momentum hızlanması">
              {renderEventList(
                [...grouped.volumeExpansions, ...grouped.momentumAccelerations],
                'Hacim/momentum olayı yok',
              )}
            </Card>
            <Card
              title="Kırılım ve Çoklu Zaman Uyumu"
              description="Gelişen kırılımlar ve zaman dilimi uyumu"
            >
              {renderEventList(
                [...grouped.breakoutDevelopments, ...grouped.multiTimeframeAlignments],
                'Kırılım/uyum olayı yok',
              )}
            </Card>
            <Card title="Zayıflayan Sinyaller" description="Sinyali zayıflayan hisseler">
              {renderEventList(grouped.weakened, 'Zayıflayan sinyal yok')}
            </Card>
            <Card title="Kaybolan Sinyaller" description="Sinyali tamamen kaybolan hisseler">
              {renderEventList(grouped.lost, 'Kaybolan sinyal yok')}
            </Card>
          </div>
        )}
      </div>

      {providers.length > 0 && (
        <div className="mt-8">
          <SectionTitle
            title="Sağlayıcı Özeti"
            description="Tarama sırasında her sağlayıcıya yapılan istek dağılımı"
          />
          <DataTable
            columns={[
              { key: 'provider', header: 'Sağlayıcı', width: '140px' },
              { key: 'requested', header: 'İstenen', width: '90px', sortable: true },
              { key: 'available', header: 'Mevcut', width: '90px', sortable: true },
              { key: 'unavailable', header: 'Kullanılamaz', width: '110px', sortable: true },
              { key: 'rateLimited', header: 'Limit Aşımı', width: '100px', sortable: true },
              { key: 'failed', header: 'Hata', width: '80px', sortable: true },
              { key: 'cacheHits', header: 'Önbellek', width: '90px', sortable: true },
            ]}
            data={providers}
            pageSize={10}
            emptyMessage="Sağlayıcı verisi yok"
          />
        </div>
      )}
    </div>
  );
}
