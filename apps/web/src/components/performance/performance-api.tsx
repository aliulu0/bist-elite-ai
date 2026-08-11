import { Card, EmptyState } from '@/components/shared';
import type { PerformanceSnapshot } from './performance-types';
import { formatNumber } from '@/lib/utils';

interface PerformanceApiProps {
  snapshot: PerformanceSnapshot | null;
}

export function PerformanceApi({ snapshot }: PerformanceApiProps) {
  if (!snapshot || snapshot.apiMetrics.length === 0) {
    return <EmptyState title="API metriği bulunmuyor" description="API istekleri yapıldığında metrikler burada görünecek" />;
  }

  const sorted = [...snapshot.apiMetrics].sort((a, b) => b.avgLatencyMs - a.avgLatencyMs);

  return (
    <div className="space-y-3">
      <Card title="Top Slow Endpoints">
        <div className="space-y-2">
          {sorted.slice(0, 10).map((api) => (
            <div key={api.endpoint} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">{api.method}</span>
                  <span className="truncate text-xs font-medium">{api.endpoint}</span>
                </div>
                <div className="mt-1 flex gap-3 text-[10px] text-muted-foreground">
                  <span>{formatNumber(api.count)} istek</span>
                  <span>{Math.round(api.avgLatencyMs)}ms ort.</span>
                  <span>{Math.round(api.p95LatencyMs)}ms P95</span>
                  <span>{Math.round(api.p99LatencyMs)}ms P99</span>
                </div>
              </div>
              <div className="ml-3 text-right">
                <p className={`text-xs font-medium ${api.successRate > 99 ? 'text-success' : api.successRate > 95 ? 'text-warning' : 'text-destructive'}`}>
                  %{api.successRate.toFixed(1)}
                </p>
                <p className="text-[10px] text-muted-foreground">başarı</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
