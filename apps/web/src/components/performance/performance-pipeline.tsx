import { Card, Progress, EmptyState } from '@/components/shared';
import type { PerformanceSnapshot } from './performance-types';
import { formatNumber } from '@/lib/utils';

interface PerformancePipelineProps {
  snapshot: PerformanceSnapshot | null;
}

export function PerformancePipeline({ snapshot }: PerformancePipelineProps) {
  if (!snapshot || snapshot.pipelines.length === 0) {
    return <EmptyState title="Pipeline metriği yok" description="Pipeline çalıştırıldığında metrikler burada görünecek" />;
  }

  return (
    <div className="space-y-3">
      {snapshot.pipelines.map((pipeline) => (
        <Card key={pipeline.name}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{pipeline.name}</span>
              <span className="text-xs text-muted-foreground">{formatNumber(pipeline.totalRuns)} çalıştırma</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div>
                <span>Ortalama Süre</span>
                <p className="font-medium text-foreground">{Math.round(pipeline.avgDurationMs)}ms</p>
              </div>
              <div>
                <span>P95</span>
                <p className="font-medium text-foreground">{Math.round(pipeline.p95DurationMs)}ms</p>
              </div>
              <div>
                <span>Başarı</span>
                <p className="font-medium text-foreground">%{pipeline.successRate.toFixed(1)}</p>
              </div>
            </div>
            <Progress
              value={pipeline.successRate}
              size="sm"
              variant={pipeline.successRate > 95 ? 'success' : pipeline.successRate > 80 ? 'warning' : 'danger'}
              showLabel
            />
            {Object.keys(pipeline.stepDurations).length > 0 && (
              <div className="mt-2 space-y-1 border-t pt-2">
                <span className="text-xs font-medium text-muted-foreground">Adım Süreleri</span>
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries(pipeline.stepDurations).map(([step, duration]) => (
                    <div key={step} className="flex items-center justify-between text-[10px]">
                      <span className="truncate text-muted-foreground">{step}</span>
                      <span className="ml-2 shrink-0 font-medium">{Math.round(duration)}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
