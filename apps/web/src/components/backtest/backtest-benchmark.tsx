import type { BenchmarkResult } from './backtest-types';

interface BacktestBenchmarkProps {
  benchmark: BenchmarkResult;
}

export function BacktestBenchmark({ benchmark }: BacktestBenchmarkProps) {
  const metrics = [
    { label: 'Alpha', value: benchmark.alpha.toFixed(4), good: benchmark.alpha > 0 },
    { label: 'Beta', value: benchmark.beta.toFixed(4), good: benchmark.beta < 1 && benchmark.beta > 0 },
    { label: 'Takip Hatası', value: `${(benchmark.trackingError * 100).toFixed(2)}%`, good: benchmark.trackingError < 0.1 },
    { label: 'Bilgi Oranı', value: benchmark.informationRatio.toFixed(4), good: benchmark.informationRatio > 0 },
    { label: 'Yakalama Oranı', value: benchmark.captureRatio.toFixed(4), good: benchmark.captureRatio > 1 },
    { label: 'Fazla Getiri', value: `${(benchmark.excessReturn * 100).toFixed(2)}%`, good: benchmark.excessReturn > 0 },
  ];

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold">Benchmark Karşılaştırması</h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.label} className="space-y-1">
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className={`text-lg font-bold font-mono ${m.good ? 'text-success' : 'text-muted-foreground'}`}>{m.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Strateji Getirisi</p>
          <p className="text-sm font-bold font-mono">{(benchmark.strategyReturn * 100).toFixed(2)}%</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Benchmark Getirisi</p>
          <p className="text-sm font-bold font-mono">{(benchmark.benchmarkReturn * 100).toFixed(2)}%</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Sektör Getirisi</p>
          <p className="text-sm font-bold font-mono">{(benchmark.sectorReturn * 100).toFixed(2)}%</p>
        </div>
      </div>
    </div>
  );
}
