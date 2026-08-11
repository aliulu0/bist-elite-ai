import { Card, Progress, EmptyState } from '@/components/shared';
import type { PerformanceSnapshot } from './performance-types';
import { usePerformanceStore, filterEngines, sortEngines } from '@/stores/performance-store';
import { formatNumber } from '@/lib/utils';

interface PerformanceEngineProps {
  snapshot: PerformanceSnapshot | null;
}

const ENGINE_NAMES: Record<string, string> = {
  financial: 'Finansal',
  technical: 'Teknik',
  smartMoney: 'Akıllı Para',
  confluence: 'Uyum',
  candidate: 'Aday',
  opportunity: 'Fırsat',
  eliteScore: 'Elite Skor',
  scanner: 'Tarayıcı',
  backtest: 'Geri Test',
  workflow: 'İş Akışı',
  configuration: 'Yapılandırma',
};

export function PerformanceEngine({ snapshot }: PerformanceEngineProps) {
  const search = usePerformanceStore((s) => s.search);
  const sortKey = usePerformanceStore((s) => s.sortKey);
  const sortDir = usePerformanceStore((s) => s.sortDir);

  if (!snapshot || snapshot.engines.length === 0) {
    return <EmptyState title="Motor metriği yok" description="Motor çalıştırıldığında metrikler burada görünecek" />;
  }

  const engines = sortEngines(filterEngines(snapshot.engines, search), sortKey, sortDir);

  return (
    <div className="space-y-3">
      {engines.map((engine) => (
        <Card key={engine.name}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{ENGINE_NAMES[engine.name] || engine.name}</span>
              <span className="text-xs text-muted-foreground">{formatNumber(engine.totalCalls)} çağrı</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
              <div>
                <span>Ortalama</span>
                <p className="font-medium text-foreground">{Math.round(engine.avgDurationMs)}ms</p>
              </div>
              <div>
                <span>P95</span>
                <p className="font-medium text-foreground">{Math.round(engine.p95DurationMs)}ms</p>
              </div>
              <div>
                <span>P99</span>
                <p className="font-medium text-foreground">{Math.round(engine.p99DurationMs)}ms</p>
              </div>
              <div>
                <span>Hata</span>
                <p className="font-medium text-foreground">{engine.errorCount}</p>
              </div>
            </div>
            <Progress
              value={engine.successRate}
              size="sm"
              variant={engine.successRate > 95 ? 'success' : engine.successRate > 80 ? 'warning' : 'danger'}
              showLabel
            />
          </div>
        </Card>
      ))}
    </div>
  );
}
