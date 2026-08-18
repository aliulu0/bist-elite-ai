import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  Brain,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/shared/card';
import { Badge } from '@/components/shared/badge';
import { StatCard } from '@/components/shared/stat-card';
import { ErrorCard, LoadingCard } from '@/components/shared';
import { cn } from '@/lib/utils';
import { sdkClient } from '@/lib/sdk';

interface LatestPriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  timestamp: string;
  dataFreshness?: string;
  provider?: string;
  cached?: boolean;
  previousPrice?: number;
}

interface HistoryPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface IndicatorRow {
  indicator: string;
  timeframe: string;
  timestamp: string;
  value: number | number[] | Record<string, number | boolean> | null;
  metadata: Record<string, unknown>;
  isValid: boolean;
}

interface EntryZoneResult {
  ticker?: string;
  success?: boolean;
  isValid?: boolean;
  minPrice?: number;
  maxPrice?: number;
  entryZone?: { min: number; max: number };
  confidence?: number;
  decision?: string;
  [key: string]: unknown;
}

function formatValue(v: unknown, digits = 2): string {
  if (typeof v === 'number') return v.toFixed(digits);
  if (typeof v === 'string') return v;
  return '--';
}

function positiveClass(v: number | undefined): string {
  if (v === undefined) return 'text-muted-foreground';
  return v > 0 ? 'text-success' : v < 0 ? 'text-destructive' : 'text-muted-foreground';
}

function statusVariant(
  status: string | undefined,
): 'success' | 'warning' | 'danger' | 'outline' | 'default' {
  if (status === 'PASS') return 'success';
  if (status === 'WARNING') return 'warning';
  if (status === 'FAIL') return 'danger';
  return 'outline';
}

export default function StockPage() {
  const { ticker = '' } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState('1d');
  const [latest, setLatest] = useState<LatestPriceData | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [indicators, setIndicators] = useState<IndicatorRow[]>([]);
  const [entry, setEntry] = useState<EntryZoneResult | null>(null);
  const [smartMoney, setSmartMoney] = useState<Record<string, unknown> | null>(null);
  const [catalyst, setCatalyst] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const symbol = ticker.toUpperCase();
      const [latestRes, historyRes, indicatorsRes, entryRes, smRes, catRes] = await Promise.all([
        sdkClient.marketData(symbol),
        sdkClient.marketDataHistorical(symbol, timeframe),
        sdkClient.technicalAnalysis(symbol, timeframe),
        sdkClient.entryTicker(symbol),
        sdkClient.smartMoneyTicker(symbol, timeframe),
        sdkClient.catalystTicker(symbol),
      ]);
      setLatest(latestRes as unknown as LatestPriceData);
      setHistory((historyRes as unknown as { data: HistoryPoint[] }).data ?? []);
      setIndicators(
        (indicatorsRes as unknown as { indicatorSummary?: IndicatorRow[] }).indicatorSummary ?? [],
      );
      setEntry(entryRes as unknown as EntryZoneResult);
      setSmartMoney(smRes as unknown as Record<string, unknown>);
      setCatalyst(catRes as unknown as Record<string, unknown>);
    } catch {
      setError(`Veri alınamadı: ${ticker}`);
    } finally {
      setLoading(false);
    }
  }, [ticker, timeframe]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const chartData = useMemo(
    () =>
      history.map((p) => ({
        ...p,
        time: new Date(p.timestamp).toLocaleDateString('tr-TR'),
      })),
    [history],
  );

  const indicatorValues = useMemo(() => {
    const byName = new Map<string, number | null>();
    for (const row of indicators) {
      if (row.isValid && typeof row.value === 'number') byName.set(row.indicator, row.value);
    }
    return Array.from(byName.entries());
  }, [indicators]);

  const change = latest?.changePercent;
  const entryZone =
    entry?.entryZone ??
    (entry?.minPrice != null && entry?.maxPrice != null
      ? { min: entry.minPrice, max: entry.maxPrice }
      : null);
  const entryConfidence =
    typeof entry?.confidence === 'number'
      ? entry.confidence
      : typeof entry?.güven === 'number'
        ? (entry.güven as number)
        : undefined;

  if (loading && !latest) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <LoadingCard title="Hisse verileri yükleniyor..." description={ticker.toUpperCase()} />
      </div>
    );
  }

  if (error && !latest) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <ErrorCard message={error} onRetry={fetchAll} />
      </div>
    );
  }

  const timeframes = ['4h', '1d', '1w', '1m'];

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <PageHeader
        title={ticker.toUpperCase()}
        description={`Hisse detay sayfası — fiyat, teknik göstergeler, giriş bölgesi, akıllı para ve katalizör`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4" /> Geri
            </button>
            <button
              onClick={fetchAll}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              aria-label="Verileri yenile"
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              Yenile
            </button>
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-1">
        {timeframes.map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              timeframe === tf
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent',
            )}
          >
            {tf.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Son Fiyat"
          value={latest ? formatValue(latest.price) : '--'}
          change={change}
          description={
            latest?.timestamp ? new Date(latest.timestamp).toLocaleString('tr-TR') : undefined
          }
          icon={TrendingUp}
          variant={(change ?? 0) >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          title="Değişim (TL)"
          value={latest ? formatValue(latest.change) : '--'}
          description="Günlük değişim"
          icon={TrendingUp}
          variant={(latest?.change ?? 0) >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          title="Hacim"
          value={latest?.volume ? latest.volume.toLocaleString('tr-TR') : '--'}
          description="İşlem hacmi"
          icon={Activity}
        />
        <StatCard
          title="Giriş Bölgesi"
          value={entryZone ? `${formatValue(entryZone.min)} - ${formatValue(entryZone.max)}` : '--'}
          description={
            entryConfidence != null
              ? `Giriş güveni: %${formatValue(entryConfidence)}`
              : 'Veri mevcut değil'
          }
          icon={Target}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card
          title="Fiyat Grafiği"
          description={`Kapanış fiyatı — ${timeframe.toUpperCase()} (backend teknik veri) `}
          className="lg:col-span-2"
        >
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tarihsel fiyat verisi mevcut değil.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="rgba(148,163,184,0.5)" />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    stroke="rgba(148,163,184,0.5)"
                    domain={['auto', 'auto']}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="close"
                    stroke="#3b82f6"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card
          title="Teknik Gösterge Değerleri"
          description="Backend analiz motorundan gelen göstergeler"
        >
          {indicatorValues.length === 0 ? (
            <p className="text-sm text-muted-foreground">Teknik gösterge verisi mevcut değil.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {indicatorValues.map(([name, value]) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2"
                >
                  <span className="text-xs text-muted-foreground">{name}</span>
                  <span className="text-sm font-semibold">
                    {value != null ? value.toFixed(2) : '--'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Giriş Bölgesi & Akıllı Para"
          description="Giriş analizi ve akıllı para tespiti"
        >
          <div className="mb-4 space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Giriş Bölgesi</h4>
            {entryZone ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Alt Sınır</p>
                  <p className="text-lg font-semibold">{formatValue(entryZone.min)}</p>
                </div>
                <div className="rounded-md bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Üst Sınır</p>
                  <p className="text-lg font-semibold">{formatValue(entryZone.max)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Bu sembol için giriş bölgesi hesaplanmamış (veri mevcut değil).
              </p>
            )}
          </div>
          <div>
            <h4 className="text-xs font-medium text-muted-foreground">Akıllı Para</h4>
            {smartMoney && Object.keys(smartMoney).length > 0 ? (
              <div className="space-y-1">
                {(Object.entries(smartMoney) as Array<[string, unknown]>)
                  .slice(0, 6)
                  .map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between py-1">
                      <span className="text-xs text-muted-foreground">{k}</span>
                      <span className="text-sm font-medium">{formatValue(v as number, 3)}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Akıllı para verisi mevcut değil.</p>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Katalizör" description="Katalizör analizi">
          {catalyst && Object.keys(catalyst).length > 0 ? (
            <div className="space-y-1">
              {(Object.entries(catalyst) as Array<[string, unknown]>).slice(0, 8).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-1">
                  <span className="text-xs text-muted-foreground">{k}</span>
                  <span className="text-sm font-medium">{formatValue(v as number, 3)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Katalizör verisi mevcut değil.</p>
          )}
        </Card>

        <Card title="Hacim Dağılımı" description="Son veri noktalarının hacmi">
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Hacim verisi mevcut değil.</p>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.slice(-20)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="rgba(148,163,184,0.5)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="rgba(148,163,184,0.5)" />
                  <Tooltip />
                  <Bar dataKey="volume" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link
          to={`/analysis`}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          <Brain className="h-4 w-4" /> Kapsamlı Analiz
        </Link>
        <Link
          to={`/radar/${ticker}`}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          <Target className="h-4 w-4" /> Radar Detayı
        </Link>
        <button
          onClick={() => navigate(`/ai-reports`)}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          <FileText className="h-4 w-4" /> AI Rapor
        </button>
        {latest?.dataFreshness && (
          <Badge
            variant={
              latest.dataFreshness === 'no-data'
                ? 'danger'
                : latest.dataFreshness === 'stale'
                  ? 'warning'
                  : 'success'
            }
          >
            Veri: {latest.dataFreshness}
          </Badge>
        )}
      </div>
    </div>
  );
}
