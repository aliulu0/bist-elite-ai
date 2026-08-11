import { Download } from 'lucide-react';
import type { BacktestResult, BenchmarkResult, RuleAnalyticsResult, WeightOptimizationResult } from './backtest-types';

interface BacktestExportProps {
  result: BacktestResult | null;
  benchmark: BenchmarkResult | null;
  ruleAnalytics: RuleAnalyticsResult | null;
  weightOptimization: WeightOptimizationResult | null;
  symbol: string;
}

export function BacktestExport({ result, benchmark, ruleAnalytics, weightOptimization, symbol }: BacktestExportProps) {
  const exportJSON = () => {
    const data = {
      symbol,
      exportedAt: new Date().toISOString(),
      result,
      benchmark,
      ruleAnalytics,
      weightOptimization,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backtest-${symbol}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    if (!result) return;
    const headers = ['Giriş Tarihi', 'Çıkış Tarihi', 'Giriş Fiyatı', 'Çıkış Fiyatı', 'Gün', 'Getiri %', 'Getiri ₺', 'Çıkış Nedeni'];
    const rows = result.trades.map((t) => [
      t.entryTimestamp,
      t.exitTimestamp,
      t.entryPrice,
      t.exitPrice,
      t.holdingDays,
      (t.returnPercent * 100).toFixed(2),
      t.returnAbsolute.toFixed(2),
      t.exitReason,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backtest-${symbol}-trades-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasData = result || benchmark || ruleAnalytics || weightOptimization;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={exportCSV}
        disabled={!result}
        className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
      >
        <Download className="h-3 w-3" />
        CSV
      </button>
      <button
        onClick={exportJSON}
        disabled={!hasData}
        className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
      >
        <Download className="h-3 w-3" />
        JSON
      </button>
    </div>
  );
}
