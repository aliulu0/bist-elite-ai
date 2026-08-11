import { BarChart3, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import type { WatchlistPerformance } from './watchlist-types';

interface WatchlistPerformanceProps {
  data: WatchlistPerformance[];
}

export function WatchlistPerformance({ data }: WatchlistPerformanceProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold">Performans</h3>
        <EmptyState
          title="Performans verisi için yeterli veri yok"
          description="İzlenen hisselerin performansı burada görünecek"
          icon={<BarChart3 className="h-6 w-6 text-muted-foreground" />}
        />
      </div>
    );
  }

  const avg1w = data.reduce((s, d) => s + d.change1w, 0) / data.length;
  const avg1m = data.reduce((s, d) => s + d.change1m, 0) / data.length;
  const topGainer = [...data].sort((a, b) => b.change1w - a.change1w)[0];
  const topLoser = [...data].sort((a, b) => a.change1w - b.change1w)[0];
  const avgVol = data.reduce((s, d) => s + d.volatility, 0) / data.length;

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Performans</h3>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="space-y-1">
          <p className="text-[10px] uppercase text-muted-foreground">Ort. Haftalık</p>
          <p className={`text-sm font-bold font-mono ${avg1w >= 0 ? 'text-success' : 'text-destructive'}`}>
            {avg1w >= 0 ? '+' : ''}{avg1w.toFixed(2)}%
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase text-muted-foreground">Ort. Aylık</p>
          <p className={`text-sm font-bold font-mono ${avg1m >= 0 ? 'text-success' : 'text-destructive'}`}>
            {avg1m >= 0 ? '+' : ''}{avg1m.toFixed(2)}%
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase text-muted-foreground">En Çok Yükselen</p>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-success" />
            <span className="text-sm font-bold">{topGainer.symbol}</span>
            <span className="text-xs text-success">+{topGainer.change1w.toFixed(2)}%</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase text-muted-foreground">En Çok Düşen</p>
          <div className="flex items-center gap-1">
            <TrendingDown className="h-3 w-3 text-destructive" />
            <span className="text-sm font-bold">{topLoser.symbol}</span>
            <span className="text-xs text-destructive">{topLoser.change1w.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Ort. Volatilite</span>
          <span className="font-mono">{(avgVol * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}
