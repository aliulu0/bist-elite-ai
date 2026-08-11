import { Card, EmptyState } from '@/components/shared';
import type { ProviderHealthSnapshot } from './provider-types';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface ProviderFailoverPanelProps {
  snapshot: ProviderHealthSnapshot | null;
}

export function ProviderFailoverPanel({ snapshot }: ProviderFailoverPanelProps) {
  if (!snapshot || snapshot.failoverOrder.length === 0) {
    return <EmptyState title="Arıza kaydı yok" description="Arıza yönlendirme bilgisi toplandığında burada görüntülenecek" />;
  }

  return (
    <Card title="Arıza Yönlendirme Sırası">
      <div className="space-y-2">
        {snapshot.failoverOrder.map((providerName, i) => {
          const provider = snapshot.providers.find((p) => p.name === providerName);
          const isHealthy = provider?.status === 'HEALTHY';
          return (
            <div key={providerName} className="flex items-center gap-3 rounded-md bg-muted/50 px-3 py-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                {i + 1}
              </span>
              <span className="flex-1 text-sm font-medium">{providerName}</span>
              {provider ? (
                isHealthy ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-warning" />
                )
              ) : (
                <span className="text-xs text-muted-foreground">Bilinmiyor</span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
