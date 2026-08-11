import type { WeightOptimizationResult } from './backtest-types';

interface BacktestWeightOptimizerProps {
  optimization: WeightOptimizationResult;
}

export function BacktestWeightOptimizer({ optimization }: BacktestWeightOptimizerProps) {
  const weights = Object.entries(optimization.recommendedWeights)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold">Ağırlık Optimizasyonu</h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Beklenen İyileşme</p>
          <p className="text-lg font-bold text-success">
            +{optimization.expectedImprovement.toFixed(2)}%
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Güven</p>
          <p className="text-lg font-bold">{(optimization.confidence * 100).toFixed(1)}%</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Mevcut Skor</p>
          <p className="text-lg font-bold">{optimization.simulation.currentScore.toFixed(2)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Optimize Edilmiş Skor</p>
          <p className="text-lg font-bold text-success">{optimization.simulation.optimizedScore.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">Önerilen Ağırlıklar</h4>
        {weights.map(([rule, weight]) => (
          <div key={rule} className="flex items-center gap-3">
            <span className="w-40 truncate text-xs font-medium">{rule}</span>
            <div className="flex-1">
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(weight * 100, 100)}%` }}
                />
              </div>
            </div>
            <span className="w-12 text-right text-xs font-mono">{(weight * 100).toFixed(0)}%</span>
          </div>
        ))}
        {weights.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">Ağırlık verisi yok</p>
        )}
      </div>
    </div>
  );
}
