import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  TrendingUp,
  Loader2,
  Activity,
  ShieldAlert,
  BarChart3,
  Brain,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/shared/card';
import { Badge } from '@/components/shared/badge';
import { StatCard } from '@/components/shared/stat-card';
import { DataTable, ErrorCard, SectionTitle, LoadingCard, EmptyState } from '@/components/shared';
import { cn } from '@/lib/utils';
import { sdkClient } from '@/lib/sdk';

interface RadarMetrics {
  earlyOpportunityScore: number;
  eliteScore: number;
  signalConvergence: number;
  confidence: number;
  expectedReturn: number;
  risk: string;
  smartMoneyScore: number | null;
  catalystScore: number | null;
  fundamentalScore: number | null;
  dataQualityScore: number | null;
  predictionConfidence: number | null;
  timeframeAgreement: number | null;
  entryZone: { min: number; max: number } | null;
  decisionScore: number | null;
  decisionStatus: string | null;
  earlyOpportunity: boolean;
  dataTimestamp: string;
}

interface OpportunityRadarItem {
  ticker: string;
  company: string;
  sector: string;
  state: string;
  current: RadarMetrics;
  previous: RadarMetrics | null;
  scoreChange: number | null;
  changes: Array<{
    factor: string;
    label: string;
    previous: number | null;
    current: number | null;
    delta: number | null;
  }>;
  reasons: string[];
  radarPriority: number;
  dataFreshness: string;
  providerStatus: string | null;
  evaluatedAt: string;
}

interface RadarTopResponse {
  items: OpportunityRadarItem[];
  total: number;
  hasSnapshot: boolean;
}

interface RadarStatus {
  running: boolean;
  lastRun: string | null;
  lastSuccessfulRun: string | null;
  lastDurationMs: number | null;
  symbolsEvaluated: number;
  candidates: number;
  opportunities: Record<string, number>;
  providerCalls: number;
  cacheHits: number;
  dataQualityWarnings: string[];
  errors: number;
  hasSnapshot: boolean;
}

interface RadarRow {
  ticker: string;
  company: string;
  sector: string;
  state: string;
  score: number;
  confidence: number;
  convergence: number;
  expectedReturn: number;
  risk: string;
  dataQuality: number | null;
  priority: number;
}

interface LearnedConfig {
  id: string;
  version: string;
  createdAt: string;
  isActive: boolean;
  evidenceCount: number;
  weightConfig: Record<string, number | undefined>;
  rationale?: string;
}

function stateVariant(
  state: string,
): 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'default' {
  switch (state) {
    case 'NEW':
      return 'info';
    case 'STRENGTHENING':
    case 'CONFIRMED':
      return 'success';
    case 'WEAKENING':
      return 'warning';
    case 'INVALIDATED':
      return 'danger';
    default:
      return 'outline';
  }
}

function stateLabel(state: string): string {
  switch (state) {
    case 'NEW':
      return 'YENİ';
    case 'STRENGTHENING':
      return 'GÜÇLENİYOR';
    case 'CONFIRMED':
      return 'DOĞRULANDI';
    case 'WEAKENING':
      return 'ZAYIFLIYOR';
    case 'INVALIDATED':
      return 'GEÇERSİZ';
    case 'UNCHANGED':
      return 'DEĞİŞMEDİ';
    default:
      return state;
  }
}

function riskVariant(risk: string): 'success' | 'warning' | 'danger' | 'default' {
  if (risk === 'low') return 'success';
  if (risk === 'medium') return 'warning';
  if (risk === 'high') return 'danger';
  return 'default';
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '--';
  return value.toFixed(1);
}

export default function RadarPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<RadarTopResponse | null>(null);
  const [status, setStatus] = useState<RadarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [minScore, setMinScore] = useState('');
  const [learnedConfigs, setLearnedConfigs] = useState<LearnedConfig[]>([]);
  const [configError, setConfigError] = useState('');

  const fetchTop = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query: Record<string, string | number> = { limit: 50 };
      if (stateFilter) query.state = stateFilter;
      if (sectorFilter) query.sector = sectorFilter;
      if (minScore) query.minScore = Number(minScore);
      const [topRes, statusRes, configsRes] = await Promise.all([
        sdkClient.radar.top(query),
        sdkClient.radar.status(),
        sdkClient.radar.learnedConfigs().catch(() => []),
      ]);
      setData(topRes as unknown as RadarTopResponse);
      setStatus(statusRes as unknown as RadarStatus);
      setLearnedConfigs((configsRes as unknown as LearnedConfig[]) ?? []);
      setConfigError('');
    } catch {
      setError('Radar verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [stateFilter, sectorFilter, minScore]);

  useEffect(() => {
    fetchTop();
  }, [fetchTop]);

  const runRadar = useCallback(async () => {
    setRunning(true);
    setError('');
    try {
      await sdkClient.radar.run({}).catch(() => {
        // Cold runs can exceed the HTTP request timeout; the scan keeps
        // running server-side, so we poll status until it settles.
      });
      const deadline = Date.now() + 5 * 60 * 1000;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const st = (await sdkClient.radar.status()) as unknown as RadarStatus;
        if (!st.running) break;
        if (Date.now() > deadline) break;
        await new Promise((r) => setTimeout(r, 3000));
      }
      await fetchTop();
    } catch {
      setError('Radar taraması başlatılamadı');
    } finally {
      setRunning(false);
    }
  }, [fetchTop]);

  const sectors = useMemo(() => {
    const seen = new Set<string>();
    (data?.items ?? []).forEach((i) => {
      if (i.sector && !seen.has(i.sector)) seen.add(i.sector);
    });
    return Array.from(seen).sort();
  }, [data]);

  const rows: RadarRow[] = useMemo(
    () =>
      (data?.items ?? []).map((item) => ({
        ticker: item.ticker,
        company: item.company,
        sector: item.sector,
        state: item.state,
        score: item.current.earlyOpportunityScore,
        confidence: item.current.confidence,
        convergence: item.current.signalConvergence,
        expectedReturn: item.current.expectedReturn,
        risk: item.current.risk,
        dataQuality: item.current.dataQualityScore,
        priority: item.radarPriority,
      })),
    [data],
  );

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <LoadingCard title="Radar yükleniyor..." description="En son radar taraması getiriliyor" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <ErrorCard message={error} onRetry={fetchTop} />
      </div>
    );
  }

  if (!data?.hasSnapshot) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <Card className="text-center p-12">
          <Activity className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-medium text-slate-300 mb-2">Henüz Bir Radar Taraması Yok</h3>
          <p className="text-slate-500">
            Radar henüz çalıştırılmamış. İlk taramayı başlatmak için aşağıdaki butona basın. Tarama
            veri sağlayıcılarından hisse verilerini toplayıp erken fırsatları analiz eder.
          </p>
          <button
            onClick={runRadar}
            disabled={running}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Activity className="h-4 w-4" />
            )}
            {running ? 'Taranıyor...' : 'Radar Taraması Başlat'}
          </button>
        </Card>
      </div>
    );
  }

  const statusOps = status?.opportunities ?? {};
  const avgScore = rows.length > 0 ? rows.reduce((s, r) => s + r.score, 0) / rows.length : 0;

  function renderLearnedConfigs() {
    if (configError) {
      return <p className="text-sm text-muted-foreground">Öğrenilen konfigürasyonlar alınamadı.</p>;
    }
    if (learnedConfigs.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          Henüz öğrenilen ağırlık konfigürasyonu yok. Radar geri bildirimleri işledikçe burada
          listelenir.
        </p>
      );
    }
    return (
      <div className="space-y-2">
        {learnedConfigs.map((cfg) => (
          <div
            key={cfg.id ?? cfg.version}
            className={cn(
              'flex items-start justify-between gap-3 rounded-md border p-3',
              cfg.isActive ? 'border-primary/40 bg-primary/5' : 'bg-muted/20',
            )}
          >
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={cfg.isActive ? 'success' : 'outline'}>
                  {cfg.isActive ? 'Aktif' : 'Pasif'}
                </Badge>
                <span className="text-sm font-medium">{cfg.version}</span>
                <span className="text-xs text-muted-foreground">
                  {cfg.createdAt ? new Date(cfg.createdAt).toLocaleString('tr-TR') : ''}
                </span>
                {typeof cfg.evidenceCount === 'number' && (
                  <Badge variant="info">{cfg.evidenceCount} kanıt</Badge>
                )}
              </div>
              {cfg.rationale && (
                <p className="mt-1 text-xs text-muted-foreground">{cfg.rationale}</p>
              )}
              <div className="mt-1 flex flex-wrap gap-1">
                {Object.entries(cfg.weightConfig ?? {})
                  .filter(([, v]) => v !== undefined)
                  .map(([k, v]) => (
                    <span
                      key={k}
                      className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {k}: {Number(v).toFixed(3)}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <PageHeader
        title="Fırsat Radarı"
        description="BIST geneli erken fırsat taraması ve öncelik sıralaması (R2-048 Radar)"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={runRadar}
              disabled={running}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              aria-label="Radar taraması yenile"
            >
              <RefreshCw className={cn('h-4 w-4', running && 'animate-spin')} />
              {running ? 'Taranıyor...' : 'Tarama'}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Aktif Fırsat"
          value={status?.candidates ?? rows.length}
          description={
            status?.lastRun
              ? `Son tarama: ${new Date(status.lastRun).toLocaleTimeString('tr-TR')}`
              : 'Taranmadı'
          }
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Ortalama Skor"
          value={formatNumber(avgScore)}
          description="Erken fırsat skoru ortalaması"
          icon={BarChart3}
        />
        <StatCard
          title="Değerlendirilen Sembol"
          value={(status?.symbolsEvaluated ?? 0).toLocaleString('tr-TR')}
          description="Son taramada taranan sembol sayısı"
          icon={Activity}
        />
        <StatCard
          title="Veri Uyarısı"
          value={status?.dataQualityWarnings?.length ?? 0}
          description={
            (status?.errors ?? 0 > 0)
              ? 'Bazı sağlayıcı hataları oluştu'
              : 'Veri kalitesi sorunu yok'
          }
          icon={ShieldAlert}
          variant={(status?.dataQualityWarnings?.length ?? 0) > 0 ? 'warning' : 'default'}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {(['NEW', 'STRENGTHENING', 'CONFIRMED', 'WEAKENING', 'INVALIDATED'] as const).map(
          (state) => (
            <Card key={state} className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{stateLabel(state)}</span>
                <Badge variant={stateVariant(state)}>{statusOps[state] ?? 0}</Badge>
              </div>
            </Card>
          ),
        )}
      </div>

      <div className="mt-6">
        <Card
          title="Öğrenilen Ağırlıklar (Learned Configs)"
          description="Geri bildirimlerden öğrenilen ağırlık konfigürasyonları — aktif sürüm italik gösterilir"
          action={
            <Badge variant="outline">
              <Brain className="mr-1 h-3 w-3" />
              {learnedConfigs.length} sürüm
            </Badge>
          }
        >
          {renderLearnedConfigs()}
        </Card>
      </div>

      <div className="mt-8">
        <SectionTitle
          title="Fırsat Listesi"
          description="Öncelik sırasına göre radar fırsatları — satıra tıklayarak detaya gidin"
        />
        <div className="mb-4 flex flex-wrap gap-2">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="rounded-md border bg-card px-3 py-1.5 text-sm outline-none"
            aria-label="Durum filtresi"
          >
            <option value="">Tüm Durumlar</option>
            {(
              [
                'NEW',
                'STRENGTHENING',
                'CONFIRMED',
                'WEAKENING',
                'INVALIDATED',
                'UNCHANGED',
              ] as const
            ).map((s) => (
              <option key={s} value={s}>
                {stateLabel(s)}
              </option>
            ))}
          </select>
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="rounded-md border bg-card px-3 py-1.5 text-sm outline-none"
            aria-label="Sektör filtresi"
          >
            <option value="">Tüm Sektörler</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            placeholder="Min. skor"
            className="w-28 rounded-md border bg-card px-3 py-1.5 text-sm outline-none"
            aria-label="Minimum skor filtresi"
          />
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="Sıralama yok"
            description="Filtrelerle eşleşen fırsat bulunamadı"
            icon={<TrendingUp className="h-8 w-8 text-muted-foreground" />}
          />
        ) : (
          <DataTable
            columns={[
              { key: 'priority', header: 'Öncelik', width: '70px', sortable: true },
              { key: 'ticker', header: 'Sembol', width: '100px', sortable: true },
              { key: 'company', header: 'Şirket', width: '180px', sortable: true },
              { key: 'sector', header: 'Sektör', width: '120px', sortable: true },
              { key: 'state', header: 'Durum', width: '110px' },
              { key: 'score', header: 'EO Skoru', width: '90px', sortable: true },
              { key: 'confidence', header: 'Güven', width: '90px', sortable: true },
              { key: 'convergence', header: 'Sinyal Yakınsaması', width: '130px', sortable: true },
              {
                key: 'expectedReturn',
                header: 'Beklenen Getiri (%)',
                width: '140px',
                sortable: true,
              },
              { key: 'risk', header: 'Risk', width: '90px' },
              { key: 'dataQuality', header: 'Veri Kalitesi', width: '110px', sortable: true },
            ]}
            data={rows}
            pageSize={20}
            onRowClick={(row) => navigate(`/radar/${row.ticker}`)}
            emptyMessage="Filtrelerle eşleşen fırsat yok"
          />
        )}
      </div>
    </div>
  );
}
