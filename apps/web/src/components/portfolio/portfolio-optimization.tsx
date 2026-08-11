import { Card } from '@/components/shared/card';

interface OptimizationResult {
  diversificationScore: number;
  sectorExposure: Array<{ sector: string; current: number; suggested: number; difference: number }>;
  riskContribution: Array<{ symbol: string; name: string; riskContribution: number; percentOfTotalRisk: number }>;
  suggestedAllocation: Array<{ symbol: string; current: number; suggested: number; action: string }>;
  expectedReturn: number;
  expectedVolatility: number;
  riskReward: number;
}

export function PortfolioOptimization({ result }: { result: OptimizationResult }) {
  if (!result) return null;

  return (
    <Card className="p-4">
      <h3 className="mb-4 text-sm font-medium">Portföy Optimizasyonu</h3>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">Çeşitlendirme</p>
          <p className="mt-1 text-lg font-semibold">{result.diversificationScore}/100</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">Beklenen Getiri</p>
          <p className={`mt-1 text-lg font-semibold ${result.expectedReturn >= 0 ? 'text-green-500' : 'text-destructive'}`}>
            %{result.expectedReturn.toFixed(1)}
          </p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">Beklenen Volatilite</p>
          <p className="mt-1 text-lg font-semibold">%{result.expectedVolatility.toFixed(1)}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">Risk/Getiri</p>
          <p className={`mt-1 text-lg font-semibold ${result.riskReward >= 1 ? 'text-green-500' : result.riskReward >= 0 ? 'text-amber-500' : 'text-destructive'}`}>
            {result.riskReward.toFixed(2)}
          </p>
        </div>
      </div>

      {result.sectorExposure.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-2 text-xs font-medium text-muted-foreground">Sektör Dağılımı Önerisi</h4>
          <div className="space-y-2">
            {result.sectorExposure.map((s) => (
              <div key={s.sector} className="flex items-center gap-2 text-sm">
                <span className="w-24 shrink-0">{s.sector}</span>
                <div className="flex-1">
                  <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="bg-primary transition-all"
                      style={{ width: `${Math.min(100, s.current)}%` }}
                    />
                    <div
                      className="bg-primary/30 transition-all"
                      style={{ width: `${Math.max(0, s.suggested - s.current)}%` }}
                    />
                  </div>
                </div>
                <span className="w-16 text-right text-xs text-muted-foreground">
                  %{s.current} → %{s.suggested}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.suggestedAllocation.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-medium text-muted-foreground">Pozisyon Önerileri</h4>
          <div className="space-y-1">
            {result.suggestedAllocation.map((a) => (
              <div key={a.symbol} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <span className="font-medium">{a.symbol}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">%{a.current} → %{a.suggested}</span>
                  <span className={`text-xs font-medium ${
                    a.action === 'reduce' ? 'text-destructive' : a.action === 'increase' ? 'text-green-500' : 'text-muted-foreground'
                  }`}>
                    {a.action === 'reduce' ? 'AZALT' : a.action === 'increase' ? 'ARTTIR' : 'TUT'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
