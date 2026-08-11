import { Card, EmptyState } from '@/components/shared';
import type { DiagnosticsSnapshot } from './diagnostics-types';

interface DiagnosticsPerformanceProps {
  snapshot: DiagnosticsSnapshot | null;
}

export function DiagnosticsPerformance({ snapshot }: DiagnosticsPerformanceProps) {
  if (!snapshot || snapshot.checks.length === 0) {
    return <EmptyState title="Performans verisi yok" description="Tanılama performans verileri burada görüntülenecek" />;
  }

  const durations = snapshot.checks.map((c) => c.duration).sort((a, b) => a - b);
  const total = durations.length;
  const avgDuration = total > 0 ? durations.reduce((s, d) => s + d, 0) / total : 0;
  const p95Index = Math.floor(total * 0.95);
  const p99Index = Math.floor(total * 0.99);
  const p95 = durations[p95Index] || 0;
  const p99 = durations[p99Index] || 0;
  const failed = snapshot.checks.filter((c) => c.status === 'fail').length;
  const warned = snapshot.checks.filter((c) => c.status === 'warning').length;
  const failureRate = total > 0 ? (failed / total) * 100 : 0;
  const warningRate = total > 0 ? (warned / total) * 100 : 0;

  return (
    <Card title="Performans Metrikleri">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Toplam Süre</p>
          <p className="text-lg font-bold">{Math.round(snapshot.totalDurationMs)}ms</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Ortalama Süre</p>
          <p className="text-lg font-bold">{Math.round(avgDuration)}ms</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">P95</p>
          <p className="text-lg font-bold">{Math.round(p95)}ms</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">P99</p>
          <p className="text-lg font-bold">{Math.round(p99)}ms</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Hata Oranı</p>
          <p className={`text-lg font-bold ${failureRate > 10 ? 'text-destructive' : 'text-foreground'}`}>{failureRate.toFixed(1)}%</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Uyarı Oranı</p>
          <p className={`text-lg font-bold ${warningRate > 20 ? 'text-warning' : 'text-foreground'}`}>{warningRate.toFixed(1)}%</p>
        </div>
      </div>
    </Card>
  );
}
