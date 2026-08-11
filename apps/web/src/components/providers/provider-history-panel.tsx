import { Card, EmptyState } from '@/components/shared';
import type { ProviderHealthSnapshot } from './provider-types';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

interface ProviderHistoryPanelProps {
  snapshot: ProviderHealthSnapshot | null;
  selectedProvider?: string | null;
}

export function ProviderHistoryPanel({ snapshot, selectedProvider }: ProviderHistoryPanelProps) {
  if (!snapshot) {
    return <EmptyState title="İstek geçmişi bulunmuyor" description="İstekler kaydedildikçe burada görüntülenecek" />;
  }

  if (!selectedProvider) {
    return <EmptyState title="Sağlayıcı seçin" description="Gecikme geçmişini görüntülemek için bir sağlayıcı seçin" />;
  }

  const history = snapshot.latencyHistory[selectedProvider] || [];

  if (history.length === 0) {
    return <EmptyState title="Seçili sağlayıcı için veri yok" description="Bu sağlayıcı için istek geçmişi bulunmuyor" />;
  }

  return (
    <Card title={`${selectedProvider} — İstek Geçmişi`}>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {history.slice(0, 20).map((entry, i) => (
          <div key={i} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
              {entry.success ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-destructive" />
              )}
              <span>{entry.success ? 'Başarılı' : 'Başarısız'}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <span>{Math.round(entry.latencyMs)}ms</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(entry.timestamp).toLocaleTimeString('tr-TR')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
