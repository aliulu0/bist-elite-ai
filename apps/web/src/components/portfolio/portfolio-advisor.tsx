import { useState, useEffect } from 'react';
import { Card } from '@/components/shared/card';
import { LoadingCard } from '@/components/shared/loading-card';
import { ErrorCard } from '@/components/shared/error-card';
import { Badge } from '@/components/shared/badge';
import { Brain, TrendingDown, TrendingUp, AlertTriangle, Scale, DollarSign } from 'lucide-react';

interface Recommendation {
  type: string;
  symbol?: string;
  reason: string;
  priority: string;
  details: string;
}

interface Advice {
  portfolioName: string;
  concentrationRisk: number;
  sectorImbalance: string[];
  correlationNotes: string[];
  cashRatio: number;
  cashSuggestion: string;
  volatility: number;
  expectedReturn: number;
  riskScore: number;
  riskReward: number;
  diversificationScore: number;
  recommendations: Recommendation[];
}

export function PortfolioAdvisor({ portfolioId }: { portfolioId?: string }) {
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAdvice();
  }, [portfolioId]);

  const loadAdvice = async () => {
    setLoading(true);
    setError('');
    try {
      const { sdkClient } = await import('@/lib/sdk');
      const data = await sdkClient.aiAdvisor(portfolioId);
      if (data?.[0]) {
        setAdvice(data[0] as unknown as Advice);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingCard />;
  if (error) return <ErrorCard message={error} onRetry={loadAdvice} />;
  if (!advice) return null;

  const priorityColors: Record<string, string> = {
    high: 'bg-destructive/10 text-destructive border-destructive/20',
    medium: 'bg-warning/10 text-amber-600 border-warning/20',
    low: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center gap-2">
        <Brain className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">AI Portföy Danışmanı</h3>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Scale className="h-3 w-3" /> Risk
          </div>
          <p className={`mt-1 text-lg font-semibold ${advice.riskScore > 60 ? 'text-destructive' : advice.riskScore > 30 ? 'text-amber-500' : 'text-green-500'}`}>
            {advice.riskScore}/100
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" /> Çeşitlendirme
          </div>
          <p className="mt-1 text-lg font-semibold">{advice.diversificationScore}/100</p>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <DollarSign className="h-3 w-3" /> Nakit
          </div>
          <p className="mt-1 text-lg font-semibold">%{(advice.cashRatio * 100).toFixed(0)}</p>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingDown className="h-3 w-3" /> Volatilite
          </div>
          <p className="mt-1 text-lg font-semibold">%{(advice.volatility * 100).toFixed(1)}</p>
        </div>
      </div>

      {advice.cashSuggestion && (
        <div className="mb-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
          {advice.cashSuggestion}
        </div>
      )}

      {advice.recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Öneriler</h4>
          {advice.recommendations.map((r, i) => (
            <div key={i} className={`rounded-lg border p-3 ${priorityColors[r.priority] || ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant={r.type === 'reduce' ? 'danger' : r.type === 'increase' ? 'success' : 'warning'}>
                    {r.type === 'reduce' ? 'AZALT' : r.type === 'increase' ? 'ARTTIR' : r.type === 'rebalance' ? 'YENİDEN DAĞIT' : r.type === 'watch' ? 'İZLE' : 'TUT'}
                  </Badge>
                  {r.symbol && <span className="text-xs font-medium">{r.symbol}</span>}
                </div>
                <Badge variant="outline" className="text-[10px]">{r.priority}</Badge>
              </div>
              <p className="mt-1 text-sm">{r.reason}</p>
              <p className="mt-0.5 text-xs opacity-70">{r.details}</p>
            </div>
          ))}
        </div>
      )}

      {advice.sectorImbalance.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 text-xs font-medium text-muted-foreground">Sektör Dengesizlikleri</h4>
          {advice.sectorImbalance.map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
              <span>{s}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
