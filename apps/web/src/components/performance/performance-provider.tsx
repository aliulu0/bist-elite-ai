import { Card, Progress, EmptyState } from '@/components/shared';
import type { PerformanceSnapshot } from './performance-types';
import { HEALTH_STATUS_LABELS, HEALTH_STATUS_COLORS } from './performance-types';

interface PerformanceProviderProps {
  snapshot: PerformanceSnapshot | null;
}

export function PerformanceProvider({ snapshot }: PerformanceProviderProps) {
  if (!snapshot || snapshot.providerMetrics.length === 0) {
    return <EmptyState title="Sağlayıcı verisi yok" description="Sağlayıcı durumları toplandığında burada görüntülenecek" />;
  }

  return (
    <div className="space-y-3">
      {snapshot.providerMetrics.map((provider) => (
        <Card key={provider.name}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{provider.name}</span>
              <span className={`text-xs font-medium ${HEALTH_STATUS_COLORS[provider.status]}`}>
                {HEALTH_STATUS_LABELS[provider.status]}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div>
                <span>Gecikme</span>
                <p className="font-medium text-foreground">{Math.round(provider.latencyMs)}ms</p>
              </div>
              <div>
                <span>Güvenilirlik</span>
                <p className="font-medium text-foreground">%{provider.reliabilityScore.toFixed(1)}</p>
              </div>
              <div>
                <span>Hata Sayısı</span>
                <p className="font-medium text-foreground">{provider.failureCount}</p>
              </div>
            </div>
            <Progress
              value={provider.reliabilityScore}
              size="sm"
              variant={provider.reliabilityScore > 95 ? 'success' : provider.reliabilityScore > 80 ? 'warning' : 'danger'}
            />
          </div>
        </Card>
      ))}
    </div>
  );
}
