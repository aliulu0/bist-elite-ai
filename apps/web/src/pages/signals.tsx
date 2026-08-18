import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Loader2, Activity, Radio, FileText, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/shared/card';
import { Badge } from '@/components/shared/badge';
import { StatCard } from '@/components/shared/stat-card';
import { DataTable, ErrorCard, SectionTitle, LoadingCard, EmptyState } from '@/components/shared';
import { cn } from '@/lib/utils';
import { sdkClient } from '@/lib/sdk';

interface SignalDto {
  id: string;
  ticker: string;
  category: string;
  type: string;
  phase: 'EARLY' | 'CONFIRMED';
  strength: number;
  strengthLabel: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  sourceFields: string[];
  detectedAt: string;
}

interface ConvergenceDto {
  convergenceScore: number;
  totalSignals: number;
  strongSignalCount: number;
  earlyCount: number;
  confirmedCount: number;
  categoryCoverage: number;
  avgStrength: number;
  confirmedShare: number;
  strongestSignals: SignalDto[];
}

interface SignalResultDto {
  ticker: string;
  company: string;
  sector: string;
  signals: SignalDto[];
  convergence: ConvergenceDto;
  dataQualityStatus: string | null;
  scannedAt: string;
}

interface SignalRow {
  ticker: string;
  company: string;
  sector: string;
  convergence: number;
  signalCount: number;
  earlyCount: number;
  confirmedCount: number;
  categoryCoverage: number;
  avgStrength: number;
  topCategory: string;
}

function phaseVariant(phase: string): 'success' | 'warning' | 'default' {
  return phase === 'CONFIRMED' ? 'success' : 'warning';
}

function categoryLabel(category: string): string {
  switch (category) {
    case 'PRICE_VOLUME':
      return 'Fiyat-Hacim';
    case 'SMART_MONEY':
      return 'Akıllı Para';
    case 'FUNDAMENTAL':
      return 'Temel';
    case 'CATALYST':
      return 'Katalizör';
    case 'MULTI_TIMEFRAME':
      return 'Çoklu Zaman';
    case 'MARKET_STRUCTURE':
      return 'Piyasa Yapısı';
    default:
      return category;
  }
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '--';
  return value.toFixed(1);
}

export default function SignalsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<SignalResultDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<SignalResultDto | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [minConvergence, setMinConvergence] = useState('');

  const fetchTop = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query: Record<string, string | number | boolean> = { limit: 25 };
      if (categoryFilter) query.signalCategory = categoryFilter;
      if (minConvergence) query.minSignalConvergence = Number(minConvergence);
      const res = await sdkClient.signalsTop(query);
      setItems(res as unknown as SignalResultDto[]);
    } catch {
      setError('Sinyal verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, minConvergence]);

  useEffect(() => {
    fetchTop();
  }, [fetchTop]);

  const loadExplain = useCallback(async (ticker: string) => {
    setSelected(null);
    setExplanation(null);
    setExplainLoading(true);
    try {
      const res = await sdkClient.signalsExplain(ticker);
      setExplanation((res as unknown as { explanation: string | null }).explanation ?? null);
    } catch {
      setExplanation('Açıklama alınamadı');
    } finally {
      setExplainLoading(false);
    }
  }, []);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    items.forEach((i) => i.signals.forEach((s) => seen.add(s.category)));
    return Array.from(seen).sort();
  }, [items]);

  const rows: SignalRow[] = useMemo(
    () =>
      items.map((item) => {
        const byCat = new Map<string, number>();
        item.signals.forEach((s) => byCat.set(s.category, (byCat.get(s.category) ?? 0) + 1));
        const topCategory = Array.from(byCat.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
        return {
          ticker: item.ticker,
          company: item.company,
          sector: item.sector,
          convergence: item.convergence.convergenceScore,
          signalCount: item.convergence.totalSignals,
          earlyCount: item.convergence.earlyCount,
          confirmedCount: item.convergence.confirmedCount,
          categoryCoverage: item.convergence.categoryCoverage,
          avgStrength: item.convergence.avgStrength,
          topCategory,
        };
      }),
    [items],
  );

  const avgConvergence =
    rows.length > 0 ? rows.reduce((s, r) => s + r.convergence, 0) / rows.length : 0;
  const totalSignals = rows.reduce((s, r) => s + r.signalCount, 0);
  const confirmedTotal = rows.reduce((s, r) => s + r.confirmedCount, 0);

  if (loading && items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <LoadingCard title="Sinyaller yükleniyor..." description="Tüm BIST sembolleri taranıyor" />
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <ErrorCard message={error} onRetry={fetchTop} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <PageHeader
        title="Erken Sinyaller"
        description="Tüm BIST sembollerinde erken sinyal taraması — sinyal yakınsamasına göre sıralama"
        actions={
          <button
            onClick={fetchTop}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            aria-label="Sinyalleri yenile"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Yenile
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Taranan Sembol"
          value={rows.length}
          description="Sinyal tespit edilen semboller"
          icon={Activity}
          variant="success"
        />
        <StatCard
          title="Toplam Sinyal"
          value={totalSignals}
          description="Tespit edilen toplam sinyal"
          icon={Radio}
        />
        <StatCard
          title="Ortalama Yakınsama"
          value={formatNumber(avgConvergence)}
          description="Sinyal konsensüs skoru ortalaması"
          icon={TrendingUp}
        />
        <StatCard
          title="Doğrulanmış Sinyal"
          value={confirmedTotal}
          description="CONFIRMED fazındaki sinyaller"
          icon={FileText}
        />
      </div>

      <div className="mt-8">
        <SectionTitle
          title="Sinyal Listesi"
          description="Satıra tıklayarak Türkçe açıklamayı görün"
        />
        <div className="mb-4 flex flex-wrap gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border bg-card px-3 py-1.5 text-sm outline-none"
            aria-label="Sinyal kategorisi filtresi"
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(c)}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={minConvergence}
            onChange={(e) => setMinConvergence(e.target.value)}
            placeholder="Min. yakınsama"
            className="w-32 rounded-md border bg-card px-3 py-1.5 text-sm outline-none"
            aria-label="Minimum yakınsama filtresi"
          />
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="Sinyal bulunamadı"
            description="Filtrelerle eşleşen sinyal yok veya veri mevcut değil"
            icon={<Radio className="h-8 w-8 text-muted-foreground" />}
          />
        ) : (
          <DataTable
            columns={[
              { key: 'ticker', header: 'Sembol', width: '100px', sortable: true },
              { key: 'company', header: 'Şirket', width: '180px', sortable: true },
              { key: 'sector', header: 'Sektör', width: '120px', sortable: true },
              { key: 'convergence', header: 'Yakınsama', width: '110px', sortable: true },
              { key: 'signalCount', header: 'Sinyal', width: '80px', sortable: true },
              { key: 'earlyCount', header: 'Erken', width: '70px', sortable: true },
              { key: 'confirmedCount', header: 'Doğrulandı', width: '90px', sortable: true },
              {
                key: 'categoryCoverage',
                header: 'Kategori Kapsamı',
                width: '120px',
                sortable: true,
              },
              { key: 'avgStrength', header: 'Ort. Güç', width: '90px', sortable: true },
              { key: 'topCategory', header: 'Ana Kategori', width: '130px' },
            ]}
            data={rows}
            pageSize={20}
            onRowClick={(row) => {
              const item = items.find((i) => i.ticker === row.ticker);
              if (item) setSelected(item);
            }}
            emptyMessage="Sinyal yok"
          />
        )}
      </div>

      {selected && (
        <div className="mt-6">
          <Card
            title={`${selected.ticker} — Sinyal Detayı`}
            description={selected.company}
            action={
              <button
                onClick={() => navigate(`/stock/${selected.ticker}`)}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Hisse Sayfası
              </button>
            }
          >
            <div className="mb-4 flex items-center gap-2">
              <Badge variant="outline">{selected.sector}</Badge>
              <Badge variant={selected.convergence.convergenceScore >= 70 ? 'success' : 'warning'}>
                Yakınsama: {formatNumber(selected.convergence.convergenceScore)}
              </Badge>
              <Badge variant="outline">
                {selected.convergence.earlyCount} erken / {selected.convergence.confirmedCount}{' '}
                doğrulanmış
              </Badge>
            </div>

            <div className="space-y-2">
              {selected.signals.map((s) => (
                <div
                  key={s.id}
                  className="flex items-start justify-between gap-3 rounded-md border bg-muted/30 p-3"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{categoryLabel(s.category)}</Badge>
                      <Badge variant="default">{s.type}</Badge>
                      <Badge variant={phaseVariant(s.phase)}>
                        {s.phase === 'CONFIRMED' ? 'Doğrulandı' : 'Erken'}
                      </Badge>
                      {s.priority === 'HIGH' && <Badge variant="danger">Yüksek Öncelik</Badge>}
                    </div>
                    <p className="mt-1 text-sm">{s.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatNumber(s.strength)}</p>
                    <p className="text-xs text-muted-foreground">{s.strengthLabel}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <h4 className="mb-2 text-xs font-medium text-muted-foreground">Türkçe Açıklama</h4>
              <button
                onClick={() => loadExplain(selected.ticker)}
                disabled={explainLoading}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
              >
                {explainLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileText className="h-3.5 w-3.5" />
                )}
                Açıklamayı Üret
              </button>
              {explanation && (
                <p className="mt-2 rounded-md border bg-muted/30 p-3 text-sm">{explanation}</p>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
