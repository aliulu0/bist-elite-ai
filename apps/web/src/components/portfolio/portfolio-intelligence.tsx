import { useState, useCallback, useEffect } from 'react';
import { Brain, RefreshCw, TrendingUp, TrendingDown, ShieldAlert, AlertTriangle, Target, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/shared/card';
import { SkeletonCard } from '@/components/shared/skeleton';
import { sdkClient } from '@/lib/sdk';

interface PositionAnalysis {
  ticker: string;
  company: string;
  sector: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  positionValue: number;
  investedCapital: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  portfolioWeight: number;
  riskScore: number;
  eliteScore: number;
  earlyOpportunityScore: number;
  multiTimeframeScore: number | null;
  confidence: number;
  expectedReturn: number;
  smartMoneyScore: number | null;
  catalystScore: number | null;
  verificationStatus: string;
  status: string;
  recommendation: string;
  recommendationReason: string;
}

interface PortfolioRisk {
  totalValue: number;
  investedCapital: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  maxPositionWeight: number;
  sectorConcentration: number;
  diversificationScore: number;
  portfolioRiskScore: number;
  portfolioConfidence: number;
  portfolioOpportunityScore: number;
  portfolioExpectedReturn: number;
  portfolioDownsideRisk: number;
  portfolioRiskReward: number;
  warnings: string[];
}

interface RebalanceRecommendation {
  ticker: string;
  company: string;
  currentWeight: number;
  recommendedMin: number;
  recommendedMax: number;
  status: string;
  reason: string;
  priority: string;
}

interface PortfolioAnalysis {
  statusLabel: string;
  score: number;
  scoreBreakdown: Record<string, number>;
  risk: PortfolioRisk;
  positions: PositionAnalysis[];
  rebalance: RebalanceRecommendation[];
  scenarios: {
    bull: { expectedPortfolioReturn: number; mainDrivers: string[]; explanation: string };
    base: { expectedPortfolioReturn: number; mainDrivers: string[]; explanation: string };
    bear: { expectedPortfolioReturn: number; mainDrivers: string[]; explanation: string };
  };
  opportunities: {
    improvingHoldings: PositionAnalysis[];
    deterioratingHoldings: PositionAnalysis[];
    newOpportunities: Array<{ ticker: string; company: string; earlyOpportunityScore: number; confidence: number; expectedReturn: number }>;
  };
  recommendations: Array<{ ticker: string; text: string }>;
}

function toNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function pct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function statusTone(status: string): string {
  if (status === 'REDUCE_CONCENTRATION') return 'text-destructive';
  if (status === 'CONSIDER_INCREASE') return 'text-green-600';
  return 'text-muted-foreground';
}

function statusLabel(status: string): string {
  if (status === 'REDUCE_CONCENTRATION') return 'AZALT';
  if (status === 'CONSIDER_INCREASE') return 'ARTTIR';
  return 'ARALIKTA';
}

function positionStatusTone(status: string): string {
  if (status === 'STRONG_HOLD' || status === 'HOLD') return 'text-green-600';
  if (status === 'WATCH') return 'text-amber-500';
  return 'text-destructive';
}

export function PortfolioIntelligence() {
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (bypassCache = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = bypassCache
        ? await sdkClient.portfolioIntelligenceRefresh()
        : await sdkClient.portfolioIntelligenceAnalysis();
      setAnalysis((res.data ?? null) as unknown as PortfolioAnalysis | null);
    } catch {
      setError('Portföy zekâsı analizi yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonCard rows={2} className="h-28" />
        <SkeletonCard rows={2} className="h-28" />
        <SkeletonCard rows={2} className="h-28" />
        <SkeletonCard rows={6} className="lg:col-span-3" />
      </div>
    );
  }

  if (error) {
    return (
      <Card title="Portföy Zekâsı" className="p-4">
        <p className="text-sm text-muted-foreground">{error}</p>
      </Card>
    );
  }

  if (!analysis || !analysis.risk) {
    return (
      <Card title="Portföy Zekâsı" className="p-4">
        <p className="text-sm text-muted-foreground">Henüz analiz edilmiş portföy bulunmuyor.</p>
      </Card>
    );
  }

  const risk = analysis.risk;
  const breakdownEntries = Object.entries(analysis.scoreBreakdown ?? {});

  return (
    <div className="space-y-4">
      <Card
        title="Portföy Zekâsı"
        description={analysis.statusLabel}
        action={
          <button
            onClick={() => fetchData(true)}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Yenile
          </button>
        }
        className="p-4"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">Zekâ Skoru</p>
            <p className="mt-1 text-xl font-semibold">{Math.round(toNumber(analysis.score))}/100</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">Portföy Değeri</p>
            <p className="mt-1 text-xl font-semibold">₺{toNumber(risk.totalValue).toLocaleString('tr-TR')}</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">Gerçekleşmemiş K/Z</p>
            <p className={cn('mt-1 text-xl font-semibold', toNumber(risk.unrealizedPnl) >= 0 ? 'text-green-600' : 'text-destructive')}>
              {pct(toNumber(risk.unrealizedPnlPercent))}
            </p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">Beklenen Getiri</p>
            <p className={cn('mt-1 text-xl font-semibold', toNumber(risk.portfolioExpectedReturn) >= 0 ? 'text-green-600' : 'text-destructive')}>
              {pct(toNumber(risk.portfolioExpectedReturn))}
            </p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">Risk Skoru</p>
            <p className="mt-1 text-xl font-semibold">{Math.round(toNumber(risk.portfolioRiskScore))}/100</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">Güven</p>
            <p className="mt-1 text-xl font-semibold">%{Math.round(toNumber(risk.portfolioConfidence))}</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">Çeşitlendirme</p>
            <p className="mt-1 text-xl font-semibold">{Math.round(toNumber(risk.diversificationScore))}/100</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">Risk/Getiri</p>
            <p className="mt-1 text-xl font-semibold">{toNumber(risk.portfolioRiskReward).toFixed(2)}</p>
          </div>
        </div>

        {breakdownEntries.length > 0 && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {breakdownEntries.map(([key, value]) => (
              <div key={key} className="rounded-lg border px-3 py-2">
                <p className="text-[11px] text-muted-foreground">{key}</p>
                <p className="text-sm font-medium">{toNumber(value).toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}

        {risk.warnings.length > 0 && (
          <div className="mt-4 space-y-1.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            {risk.warnings.map((w) => (
              <p key={w} className="flex items-start gap-2 text-xs text-destructive">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {w}
              </p>
            ))}
          </div>
        )}
      </Card>

      {analysis.positions.length > 0 && (
        <Card title="Hisse Senetleri" className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="px-2 py-2 font-medium">Hisse</th>
                  <th className="px-2 py-2 font-medium">Ağırlık</th>
                  <th className="px-2 py-2 font-medium">K/Z</th>
                  <th className="px-2 py-2 font-medium">Elite</th>
                  <th className="px-2 py-2 font-medium">Erken Fırsat</th>
                  <th className="px-2 py-2 font-medium">MTF</th>
                  <th className="px-2 py-2 font-medium">SM</th>
                  <th className="px-2 py-2 font-medium">Katalizör</th>
                  <th className="px-2 py-2 font-medium">Güven</th>
                  <th className="px-2 py-2 font-medium">Risk</th>
                  <th className="px-2 py-2 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {analysis.positions.map((p) => (
                  <tr key={p.ticker} className="border-b last:border-0">
                    <td className="px-2 py-2">
                      <p className="font-medium">{p.ticker}</p>
                      <p className="text-xs text-muted-foreground">{p.company}</p>
                    </td>
                    <td className="px-2 py-2">%{toNumber(p.portfolioWeight).toFixed(1)}</td>
                    <td className={cn('px-2 py-2', toNumber(p.unrealizedPnlPercent) >= 0 ? 'text-green-600' : 'text-destructive')}>
                      {pct(toNumber(p.unrealizedPnlPercent))}
                    </td>
                    <td className="px-2 py-2">{Math.round(toNumber(p.eliteScore))}</td>
                    <td className="px-2 py-2">{Math.round(toNumber(p.earlyOpportunityScore))}</td>
                    <td className="px-2 py-2">{p.multiTimeframeScore != null ? Math.round(toNumber(p.multiTimeframeScore)) : '-'}</td>
                    <td className="px-2 py-2">{p.smartMoneyScore != null ? Math.round(toNumber(p.smartMoneyScore)) : '-'}</td>
                    <td className="px-2 py-2">{p.catalystScore != null ? Math.round(toNumber(p.catalystScore)) : '-'}</td>
                    <td className="px-2 py-2">%{Math.round(toNumber(p.confidence))}</td>
                    <td className="px-2 py-2">{Math.round(toNumber(p.riskScore))}</td>
                    <td className={cn('px-2 py-2 font-medium', positionStatusTone(p.status))}>{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {analysis.rebalance.length > 0 && (
        <Card title="Yeniden Dengeleme" className="p-4">
          <div className="space-y-2">
            {analysis.rebalance.map((r) => (
              <div key={r.ticker} className="flex flex-col gap-1 rounded-lg border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{r.ticker}</span>
                  <span className="text-xs text-muted-foreground">%{toNumber(r.currentWeight).toFixed(1)} → %{toNumber(r.recommendedMin).toFixed(1)}–%{toNumber(r.recommendedMax).toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs font-semibold', statusTone(r.status))}>{statusLabel(r.status)}</span>
                  <span className="text-xs text-muted-foreground">Öncelik: {r.priority}</span>
                </div>
                <p className="text-xs text-muted-foreground sm:w-1/2">{r.reason}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {analysis.scenarios && (
        <div className="grid gap-4 lg:grid-cols-3">
          {(['bull', 'base', 'bear'] as const).map((key) => {
            const s = analysis.scenarios[key];
            if (!s) return null;
            const tone = key === 'bull' ? 'text-green-600' : key === 'bear' ? 'text-destructive' : 'text-muted-foreground';
            const icon = key === 'bull' ? <TrendingUp className="h-4 w-4" /> : key === 'bear' ? <TrendingDown className="h-4 w-4" /> : <Brain className="h-4 w-4" />;
            return (
              <Card key={key} title={`${key.charAt(0).toUpperCase() + key.slice(1)} Senaryo`} className="p-4">
                <p className={cn('text-lg font-semibold', tone)}>{pct(toNumber(s.expectedPortfolioReturn))}</p>
                <p className="mt-2 text-xs text-muted-foreground">{s.explanation}</p>
                {s.mainDrivers.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">Ana sürükleyiciler: {s.mainDrivers.join(', ')}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {analysis.opportunities && (analysis.opportunities.improvingHoldings.length > 0 || analysis.opportunities.deterioratingHoldings.length > 0 || analysis.opportunities.newOpportunities.length > 0) && (
        <Card title="Portföy Fırsatları" className="p-4">
          <div className="space-y-4">
            {analysis.opportunities.newOpportunities.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" /> Yeni Fırsatlar
                </h4>
                <div className="space-y-1">
                  {analysis.opportunities.newOpportunities.map((o) => (
                    <div key={o.ticker} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{o.ticker}</span>
                        <span className="text-xs text-muted-foreground">{o.company}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span>Skor: {Math.round(toNumber(o.earlyOpportunityScore))}</span>
                        <span>Güven: %{Math.round(toNumber(o.confidence))}</span>
                        <span className={cn(toNumber(o.expectedReturn) >= 0 ? 'text-green-600' : 'text-destructive')}>{pct(toNumber(o.expectedReturn))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {analysis.opportunities.improvingHoldings.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" /> Güçlenen Pozisyonlar
                </h4>
                <p className="text-xs text-muted-foreground">
                  {analysis.opportunities.improvingHoldings.map((p) => p.ticker).join(', ')}
                </p>
              </div>
            )}
            {analysis.opportunities.deterioratingHoldings.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <ShieldAlert className="h-3.5 w-3.5" /> Zayıflayan Pozisyonlar
                </h4>
                <p className="text-xs text-muted-foreground">
                  {analysis.opportunities.deterioratingHoldings.map((p) => p.ticker).join(', ')}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {analysis.recommendations.length > 0 && (
        <Card title="AI Önerileri" className="p-4">
          <div className="space-y-2">
            {analysis.recommendations.map((r) => (
              <p key={`${r.ticker}-${r.text}`} className="flex items-start gap-2 text-sm">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span><span className="font-medium">{r.ticker}:</span> {r.text}</span>
              </p>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
