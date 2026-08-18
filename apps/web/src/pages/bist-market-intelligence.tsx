import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  BarChart3,
  Activity,
  Zap,
  Target,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/shared/card';
import { Badge } from '@/components/shared/badge';
import { StatCard } from '@/components/shared/stat-card';
import { DataTable, ErrorCard, SectionTitle, LoadingCard, EmptyState } from '@/components/shared';
import { cn } from '@/lib/utils';
import { sdkClient } from '@/lib/sdk';

interface MarketOverviewData {
  bist100: { value: number; change: number; changePercent: number };
  sectorHeatmap: Array<{ sector: string; changePercent: number; stocks: number }>;
  topGainers: Array<{ ticker: string; name: string; changePercent: number; price: number }>;
  topLosers: Array<{ ticker: string; name: string; changePercent: number; price: number }>;
  volumeLeaders: Array<{ ticker: string; name: string; volume: number; changePercent: number }>;
  smartMoneyLeaders: Array<{
    ticker: string;
    name: string;
    smartMoneyScore: number;
    accumulation: string;
  }>;
  catalystLeaders: Array<{
    ticker: string;
    name: string;
    catalystScore: number;
    verified: boolean;
  }>;
}

interface TopListItem {
  ticker: string;
  name: string;
  sector: string;
  value: number;
  changePercent?: number;
}

interface TopListsData {
  smartMoney: TopListItem[];
  catalyst: TopListItem[];
  confidence: TopListItem[];
  expectedReturn: TopListItem[];
  eliteScore: TopListItem[];
  opportunity: TopListItem[];
  riskReward: TopListItem[];
}

type ListKey =
  | 'opportunity'
  | 'smartMoney'
  | 'catalyst'
  | 'confidence'
  | 'expectedReturn'
  | 'eliteScore'
  | 'riskReward';

const LIST_LABELS: Record<ListKey, string> = {
  opportunity: 'Erken Fırsat',
  smartMoney: 'Akıllı Para',
  catalyst: 'Katalizör',
  confidence: 'Güven',
  expectedReturn: 'Beklenen Getiri',
  eliteScore: 'Elite Skor',
  riskReward: 'Risk/Getiri',
};

function formatNumber(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  return value.toFixed(digits);
}

function changeClass(v: number | undefined): string {
  if (v === undefined) return 'text-muted-foreground';
  return v > 0 ? 'text-success' : v < 0 ? 'text-destructive' : 'text-muted-foreground';
}

function heatmapColor(change: number): string {
  if (change >= 1.5) return 'bg-emerald-500/20 text-emerald-300';
  if (change >= 0.5) return 'bg-emerald-500/10 text-emerald-400';
  if (change > -0.5) return 'bg-muted/30 text-muted-foreground';
  if (change > -1.5) return 'bg-rose-500/10 text-rose-400';
  return 'bg-rose-500/20 text-rose-300';
}

export default function BISTMarketIntelligencePage() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<MarketOverviewData | null>(null);
  const [topLists, setTopLists] = useState<TopListsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [listTab, setListTab] = useState<ListKey>('opportunity');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [overviewRes, topListsRes] = await Promise.all([
        sdkClient.marketOverview(),
        sdkClient.topLists({ limit: 10 }),
      ]);
      setOverview(overviewRes as unknown as MarketOverviewData);
      setTopLists(topListsRes as unknown as TopListsData);
    } catch {
      setError('BIST pazar verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !overview) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <LoadingCard
          title="BIST pazar verileri yükleniyor..."
          description="Piyasa geneli ve lider listeleri getiriliyor"
        />
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <ErrorCard message={error} onRetry={fetchData} />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <Card className="text-center p-12">
          <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-medium text-slate-300 mb-2">Pazar Verisi Yok</h3>
          <p className="text-slate-500">
            BIST pazar verileri şu an alınamıyor. Sağlayıcı bağlantılarını kontrol edin.
          </p>
          <button
            onClick={fetchData}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" />
            Yenile
          </button>
        </Card>
      </div>
    );
  }

  const listKey: ListKey = listTab;
  const listItems = topLists?.[listKey] ?? [];

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <PageHeader
        title="BIST Pazar İntelligence"
        description="Piyasa geneli, sektör ısı haritası ve lider listeleri — gerçek motor verileriyle"
        actions={
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            aria-label="Pazar verilerini yenile"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Yenile
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="BIST-100 Eşdeğeri"
          value={formatNumber(overview.bist100.value)}
          change={overview.bist100.changePercent}
          description="Sembol ortalamasından hesaplanır"
          icon={BarChart3}
          variant={overview.bist100.changePercent >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          title="Aktif Sektör"
          value={overview.sectorHeatmap.length}
          description="Veri alınan sektör sayısı"
          icon={Zap}
        />
        <StatCard
          title="Yükselen"
          value={overview.topGainers.length}
          description="En çok yükselen listedeki semboller"
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Hacim Liderleri"
          value={overview.volumeLeaders.length}
          description="En yüksek hacimli semboller"
          icon={Activity}
        />
      </div>

      <div className="mt-8">
        <SectionTitle
          title="Sektör Isı Haritası"
          description="Sektörlerin ortalama günlük değişimi (backend verisi)"
        />
        {overview.sectorHeatmap.length === 0 ? (
          <EmptyState
            title="Isı haritası yok"
            description="Sektör verisi mevcut değil — sağlayıcılardan fiyat verisi alınamadı"
            icon={<BarChart3 className="h-8 w-8 text-muted-foreground" />}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {overview.sectorHeatmap.map((s) => (
              <div key={s.sector} className={cn('rounded-md p-3', heatmapColor(s.changePercent))}>
                <p className="text-xs font-medium truncate">{s.sector}</p>
                <p className="text-lg font-semibold">
                  {s.changePercent > 0 ? '+' : ''}
                  {formatNumber(s.changePercent, 2)}%
                </p>
                <p className="text-[10px] opacity-70">{s.stocks} sembol</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="En Çok Yükselenler" description="Günlük değişim — ilk 10">
          {overview.topGainers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Veri mevcut değil.</p>
          ) : (
            <div className="space-y-1">
              {overview.topGainers.map((g) => (
                <button
                  key={g.ticker}
                  onClick={() => navigate(`/stock/${g.ticker}`)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent"
                >
                  <span className="font-medium">{g.ticker}</span>
                  <span
                    className={cn('flex items-center gap-1 text-xs', changeClass(g.changePercent))}
                  >
                    <TrendingUp className="h-3 w-3" />+{formatNumber(g.changePercent)}%
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card title="En Çok Düşenler" description="Günlük değişim — ilk 10">
          {overview.topLosers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Veri mevcut değil.</p>
          ) : (
            <div className="space-y-1">
              {overview.topLosers.map((g) => (
                <button
                  key={g.ticker}
                  onClick={() => navigate(`/stock/${g.ticker}`)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent"
                >
                  <span className="font-medium">{g.ticker}</span>
                  <span
                    className={cn('flex items-center gap-1 text-xs', changeClass(g.changePercent))}
                  >
                    <TrendingDown className="h-3 w-3" />
                    {formatNumber(g.changePercent)}%
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card title="Hacim Liderleri" description="En yüksek hacimli semboller">
          {overview.volumeLeaders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Veri mevcut değil.</p>
          ) : (
            <div className="space-y-1">
              {overview.volumeLeaders.map((g) => (
                <button
                  key={g.ticker}
                  onClick={() => navigate(`/stock/${g.ticker}`)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent"
                >
                  <span className="font-medium">{g.ticker}</span>
                  <span className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">
                      {g.volume.toLocaleString('tr-TR')}
                    </span>
                    <span className={changeClass(g.changePercent)}>
                      {g.changePercent > 0 ? '+' : ''}
                      {formatNumber(g.changePercent)}%
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-8">
        <SectionTitle
          title="Lider Listeleri"
          description="Motor tarafından hesaplanan gerçek sıralamalar"
        />
        <div className="mb-4 flex flex-wrap gap-2">
          {(Object.keys(LIST_LABELS) as ListKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setListTab(key)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                listKey === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-accent',
              )}
            >
              {LIST_LABELS[key]}
            </button>
          ))}
        </div>

        {listItems.length === 0 ? (
          <EmptyState
            title="Liste boş"
            description="Bu liste için veri mevcut değil"
            icon={<Target className="h-8 w-8 text-muted-foreground" />}
          />
        ) : (
          <DataTable
            columns={[
              { key: 'rank', header: '#', width: '50px' },
              { key: 'ticker', header: 'Sembol', width: '100px', sortable: true },
              { key: 'name', header: 'Şirket', width: '220px', sortable: true },
              { key: 'sector', header: 'Sektör', width: '140px', sortable: true },
              { key: 'value', header: 'Değer', width: '100px', sortable: true },
              { key: 'changePercent', header: 'Değişim (%)', width: '110px', sortable: true },
            ]}
            data={listItems.map((item, i) => ({
              rank: i + 1,
              ticker: item.ticker,
              name: item.name,
              sector: item.sector,
              value: formatNumber(item.value),
              changePercent:
                item.changePercent != null
                  ? `${item.changePercent > 0 ? '+' : ''}${formatNumber(item.changePercent)}`
                  : '--',
            }))}
            pageSize={10}
            onRowClick={(row) => navigate(`/stock/${row.ticker}`)}
            emptyMessage="Liste verisi yok"
          />
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Akıllı Para Liderleri" description="Gerçek akıllı para skoru ile">
          {overview.smartMoneyLeaders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Akıllı para verisi mevcut değil.</p>
          ) : (
            <div className="space-y-1">
              {overview.smartMoneyLeaders.map((g) => (
                <button
                  key={g.ticker}
                  onClick={() => navigate(`/stock/${g.ticker}`)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent"
                >
                  <span className="font-medium">{g.ticker}</span>
                  <span className="flex items-center gap-2 text-xs">
                    <Badge
                      variant={
                        g.accumulation === 'strong'
                          ? 'success'
                          : g.accumulation === 'weak'
                            ? 'warning'
                            : 'outline'
                      }
                    >
                      {g.accumulation}
                    </Badge>
                    <span className="text-muted-foreground">{formatNumber(g.smartMoneyScore)}</span>
                    <Sparkles className="h-3 w-3 text-primary" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card title="Katalizör Liderleri" description="Doğrulanmış katalizör verileriyle">
          {overview.catalystLeaders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Katalizör verisi mevcut değil.</p>
          ) : (
            <div className="space-y-1">
              {overview.catalystLeaders.map((g) => (
                <button
                  key={g.ticker}
                  onClick={() => navigate(`/stock/${g.ticker}`)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent"
                >
                  <span className="font-medium">{g.ticker}</span>
                  <span className="flex items-center gap-2 text-xs">
                    {g.verified && <Badge variant="success">Doğrulandı</Badge>}
                    <span className="text-muted-foreground">{formatNumber(g.catalystScore)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
