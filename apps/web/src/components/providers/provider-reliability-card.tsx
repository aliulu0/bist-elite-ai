import { Card, Progress, EmptyState } from '@/components/shared';
import type { ProviderHealthSnapshot } from './provider-types';
import { PROVIDER_STATUS_LABELS, PROVIDER_STATUS_COLORS } from './provider-types';
import { Shield, Clock, AlertTriangle } from 'lucide-react';

interface ProviderReliabilityCardProps {
  snapshot: ProviderHealthSnapshot | null;
}

export function ProviderReliabilityCard({ snapshot }: ProviderReliabilityCardProps) {
  if (!snapshot || snapshot.providers.length === 0) {
    return <EmptyState title="Güvenilirlik verisi için yeterli veri yok" description="Sağlayıcı bilgileri toplandığında burada görüntülenecek" />;
  }

  return (
    <Card title="Güvenilirlik Kartları">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {snapshot.providers.map((provider) => (
          <div key={provider.name} className="rounded-lg border bg-muted/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{provider.name}</span>
              <span className={`text-xs font-medium ${PROVIDER_STATUS_COLORS[provider.status]}`}>
                {PROVIDER_STATUS_LABELS[provider.status]}
              </span>
            </div>
            <Progress
              value={provider.reliabilityScore}
              variant={provider.reliabilityScore > 95 ? 'success' : provider.reliabilityScore > 80 ? 'warning' : 'danger'}
            />
            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div>
                <Shield className="inline h-3 w-3 mr-1" />
                <span className="font-medium text-foreground">%{provider.reliabilityScore.toFixed(1)}</span>
              </div>
              <div>
                <Clock className="inline h-3 w-3 mr-1" />
                <span className="font-medium text-foreground">{Math.round(provider.latencyMs)}ms</span>
              </div>
              <div>
                <AlertTriangle className="inline h-3 w-3 mr-1" />
                <span className="font-medium text-foreground">{provider.timeoutCount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
