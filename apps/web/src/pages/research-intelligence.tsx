import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Brain, Gauge, ShieldCheck, Search, Radar, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/shared/card';
import { Badge } from '@/components/shared/badge';
import { StatCard } from '@/components/shared/stat-card';
import { ErrorCard } from '@/components/shared/error-card';
import { SectionTitle } from '@/components/shared/section-title';
import { sdkClient } from '@/lib/sdk';
import { cn } from '@/lib/utils';

interface ResearchItem {
  id: string;
  source: string;
  sourceType: string;
  title: string;
  snippet?: string;
  url?: string;
  publishedAt?: string;
  ticker?: string;
  sector?: string;
  importance?: number;
  official: boolean;
}

interface CatalystRow {
  id: string;
  type: string;
  ticker?: string;
  sector?: string;
  title: string;
  statement: string;
  url?: string;
  source: string;
  importance: number;
  verification: string;
  detectedAt: string;
}

interface AiSummary {
  summary: string;
  confidence: number;
  generatedAt: string;
  engine: string;
  sources: Array<{ title: string; url: string }>;
}

interface DashboardData {
  ticker?: string;
  companyName?: string;
  researchScore?: { score: number; grade: string; factors: Record<string, number> } | null;
  score?: { score: number; grade: string; factors: Record<string, number> } | null;
  verifiedSources?: number;
  latestResearch?: ResearchItem[];
  aggregator?: { items: ResearchItem[]; total: number; unique: number; duplicatesRemoved: number; bySourceType: Record<string, number> };
  catalysts?: CatalystRow[];
  aiSummary?: AiSummary | null;
  googleFinanceSummary?: Record<string, unknown> | null;
  googleFinance?: Record<string, unknown> | null;
  generatedAt: string;
  timestamp?: string;
}

interface ProviderStatus {
  name: string;
  engine: string;
  connected: boolean;
  circuitState: string;
  latency: number;
  requests: number;
  errors: number;
  quota: { used: number; limit: number | null } | null;
  lastSync: string | null;
  cacheStatus: string;
}

const CATALYST_LABELS: Record<string, string> = {
  new_investment: 'Yeni Yatırım',
  tender: 'İhale',
  government_contract: 'Kamu Sözleşmesi',
  dividend: 'Temettü',
  bonus_issue: 'Bedelsiz Sermaye',
  capital_increase: 'Sermaye Artırımı',
  patent: 'Patent',
  factory: 'Fabrika / Tesis',
  partnership: 'Ortaklık',
  ceo_change: 'Yönetim Değişikliği',
  spk_decision: 'SPK Kararı',
  foreign_investment: 'Yabancı Yatırım',
  acquisition: 'Satın Alma',
  merger: 'Birleşme',
  rnd: 'Ar-Ge',
  export_contract: 'İhracat Sözleşmesi',
};

function gradeTone(grade?: string): string {
  if (grade === 'A') return 'text-success';
  if (grade === 'B') return 'text-info';
  if (grade === 'C') return 'text-warning';
  return 'text-destructive';
}

function verificationVariant(level: string): 'success' | 'warning' | 'outline' {
  if (level === 'verified') return 'success';
  if (level === 'likely') return 'warning';
  return 'outline';
}

function importanceVariant(importance: number): 'danger' | 'warning' | 'default' {
  if (importance >= 3) return 'danger';
  if (importance === 2) return 'warning';
  return 'default';
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('tr-TR');
}

export default function ResearchIntelligencePage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [companyTicker, setCompanyTicker] = useState('');
  const [company, setCompany] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dashRes, provRes] = await Promise.all([
        sdkClient.researchIntelligence(),
        sdkClient.researchIntelligenceProviders(),
      ]);
      setDashboard(dashRes as unknown as DashboardData);
      setProviders(provRes as ProviderStatus[]);
    } catch {
      setError('Araştırma istihbaratı yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const dashRes = await sdkClient.researchIntelligenceRefresh();
      setDashboard(dashRes as unknown as DashboardData);
    } catch {
      setError('Araştırma istihbaratı yenilenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCompanySearch = useCallback(async () => {
    const ticker = companyTicker.trim().toUpperCase();
    if (!ticker) return;
    setLoading(true);
    setError('');
    try {
      const res = await sdkClient.researchIntelligenceCompany(ticker);
      setCompany(res as unknown as DashboardData);
    } catch {
      setError(`${ticker} için araştırma bilgisi yüklenemedi`);
    } finally {
      setLoading(false);
    }
  }, [companyTicker]);

  const score = company?.score ?? dashboard?.researchScore ?? null;
  const catalysts = company?.catalysts ?? dashboard?.catalysts ?? [];
  const latestResearch = company?.aggregator?.items ?? dashboard?.latestResearch ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Araştırma İstihbaratı"
        description="İnternet araştırması, katalizör tespiti, doğrulama ve araştırma skoru (0-100)."
        actions={
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            aria-label="Araştırma istihbaratını yenile"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Yenile
          </button>
        }
      />

      {error && <ErrorCard message={error} onRetry={fetchDashboard} />}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Araştırma Skoru"
          value={score ? `${score.score}` : '--'}
          description={score ? `Not: ${score.grade}` : 'Veri yok'}
          icon={Gauge}
          variant={score?.grade === 'A' ? 'success' : score?.grade === 'C' || score?.grade === 'D' ? 'warning' : 'default'}
        />
        <StatCard
          title="Doğrulanmış Kaynak"
          value={dashboard?.verifiedSources ?? '--'}
          description="Resmi / KAP / IR kaynak"
          icon={ShieldCheck}
        />
        <StatCard
          title="Katalizör"
          value={dashboard?.catalysts?.length ?? '--'}
          description="Tespit edilen olaylar"
          icon={Radar}
        />
        <StatCard
          title="AI Özet"
          value={dashboard?.aiSummary ? `${Math.round(dashboard.aiSummary.confidence * 100)}%` : '--'}
          description={dashboard?.aiSummary?.engine ?? 'Güven / motor'}
          icon={Brain}
        />
      </div>

      <Card title="Şirket Araştırması" description="Hisse senedi bazında internet araştırması, katalizör ve doğrulama paketi.">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={companyTicker}
              onChange={(event) => setCompanyTicker(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleCompanySearch()}
              placeholder="Örn. ASELS, THYAO, GARAN"
              aria-label="Hisse senedi kodu"
              className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button
            onClick={handleCompanySearch}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Building2 className="h-4 w-4" />
            Araştır
          </button>
        </div>

        {company && (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-lg font-semibold">{company.companyName ?? company.ticker}</span>
              {company.researchScore && (
                <Badge variant="outline">
                  Skor: <span className={cn('ml-1 font-mono', gradeTone(company.researchScore.grade))}>{company.researchScore.score}</span>
                </Badge>
              )}
              {company.aiSummary && <Badge variant="info">AI Özet %{Math.round(company.aiSummary.confidence * 100)}</Badge>}
            </div>

            {company.aiSummary && (
              <div className="rounded-md border bg-muted/40 p-4">
                <p className="text-sm leading-6">{company.aiSummary.summary}</p>
                {company.aiSummary.sources.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {company.aiSummary.sources.map((source) => (
                      <li key={source.url}>
                        <a href={source.url} target="_blank" rel="noreferrer" className="text-xs text-info hover:underline">
                          {source.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionTitle title="Katalizörler" description="Tespit edilen katalizör olayları ve doğrulama seviyeleri." />
          {catalysts.length === 0 ? (
            <Card className="text-sm text-muted-foreground">Henüz katalizör tespit edilmedi.</Card>
          ) : (
            <div className="space-y-3">
              {catalysts.slice(0, 12).map((catalyst) => (
                <Card key={catalyst.id} className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={importanceVariant(catalyst.importance)}>{CATALYST_LABELS[catalyst.type] ?? catalyst.type}</Badge>
                    <Badge variant={verificationVariant(catalyst.verification)}>{catalyst.verification}</Badge>
                    {catalyst.ticker && <span className="font-mono text-xs text-muted-foreground">{catalyst.ticker}</span>}
                  </div>
                  <a href={catalyst.url} target="_blank" rel="noreferrer" className="mt-2 block text-sm font-medium hover:text-info hover:underline">
                    {catalyst.title}
                  </a>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Kaynak: {catalyst.source} · {formatDate(catalyst.detectedAt)}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <SectionTitle title="Son Araştırma" description="En güncel kanıt kayıtları." />
          <div className="space-y-3">
            {latestResearch.length === 0 ? (
              <Card className="text-sm text-muted-foreground">Araştırma kaydı bulunamadı. SERPAPI_API_KEY yapılandırılmadığında kaynak kullanılamaz.</Card>
            ) : (
              latestResearch.slice(0, 10).map((item) => (
                <Card key={item.id} className="p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={item.official ? 'success' : 'outline'}>{item.sourceType}</Badge>
                    {item.ticker && <span className="font-mono text-[10px] text-muted-foreground">{item.ticker}</span>}
                  </div>
                  <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 block text-xs font-medium leading-5 hover:text-info hover:underline">
                    {item.title}
                  </a>
                  {item.snippet && <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{item.snippet}</p>}
                  <div className="mt-1 text-[10px] text-muted-foreground">{item.source} · {formatDate(item.publishedAt)}</div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      <div>
        <SectionTitle title="Araştırma Sağlayıcıları" description="SerpApi ve haber sağlayıcı bağlantı durumu, kota ve devre kesici." />
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                {['Sağlayıcı', 'Motor', 'Durum', 'Devre Kesici', 'Gecikme', 'İstek', 'Hata', 'Kota', 'Önbellek'].map((column) => (
                  <th key={column} className="px-4 py-2 font-medium">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {providers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Sağlayıcı durumu alınamadı</td>
                </tr>
              ) : providers.map((provider) => (
                <tr key={provider.name} className="border-b transition-colors hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">{provider.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{provider.engine}</td>
                  <td className="px-4 py-3">
                    <Badge variant={provider.connected ? 'success' : 'outline'}>{provider.connected ? 'Bağlı' : 'Bağlı değil'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={provider.circuitState === 'OPEN' ? 'danger' : provider.circuitState === 'HALF_OPEN' ? 'warning' : 'outline'}>
                      {provider.circuitState}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono">{provider.latency.toFixed(0)} ms</td>
                  <td className="px-4 py-3 font-mono">{provider.requests}</td>
                  <td className="px-4 py-3 font-mono">{provider.errors}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {provider.quota ? `${provider.quota.used}/${provider.quota.limit ?? '∞'}` : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{provider.cacheStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
