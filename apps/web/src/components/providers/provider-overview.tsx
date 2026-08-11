import { Card, EmptyState, Progress } from '@/components/shared';
import type { ProviderHealthSnapshot } from './provider-types';
import { PROVIDER_STATUS_LABELS, PROVIDER_STATUS_COLORS } from './provider-types';
import { computeSummary } from '@/stores/providers-store';
import { Server, Clock, Shield, AlertTriangle } from 'lucide-react';

interface ProviderOverviewProps {
  snapshot: ProviderHealthSnapshot | null;
}

export function ProviderOverview({ snapshot }: ProviderOverviewProps) {
  if (!snapshot) {
    return <EmptyState title="Henüz sağlayıcı verisi bulunmuyor" description="Veri toplamaya başladığında burada görüntülenecek" />;
  }

  const summary = computeSummary(snapshot.providers);
  const latestFailure = snapshot.providers
    .filter((p) => p.lastFailureAt)
    .sort((a, b) => (b.lastFailureAt || '').localeCompare(a.lastFailureAt || ''))[0];
  const latestRecovery = snapshot.providers
    .filter((p) => p.lastRecoveryAt)
    .sort((a, b) => (b.lastRecoveryAt || '').localeCompare(a.lastRecoveryAt || ''))[0];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card title="Genel Durum">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Sağlıklı Sağlayıcılar</span>
            <span className="text-sm font-medium text-success">{summary.healthy}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Uyarı Durumunda</span>
            <span className="text-sm font-medium text-warning">{summary.warning}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Kritik Durumda</span>
            <span className="text-sm font-medium text-destructive">{summary.critical}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Ortalama Gecikme</span>
            <span className="text-sm font-medium">{Math.round(summary.avgLatency)}ms</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Ortalama Güvenilirlik</span>
            <span className="text-sm font-medium">%{summary.avgReliability.toFixed(1)}</span>
          </div>
          <Progress
            value={summary.avgReliability}
            variant={summary.avgReliability > 90 ? 'success' : summary.avgReliability > 70 ? 'warning' : 'danger'}
          />
        </div>
      </Card>
      <Card title="Son Olaylar">
        <div className="space-y-3">
          {latestFailure ? (
            <div className="rounded-md bg-destructive/5 px-3 py-2 border border-destructive/20">
              <p className="text-xs font-medium text-destructive">
                <AlertTriangle className="inline h-3 w-3 mr-1" />
                Son Hata — {latestFailure.name}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {latestFailure.lastFailureAt ? new Date(latestFailure.lastFailureAt).toLocaleString('tr-TR') : '—'}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Son hata kaydı yok
            </div>
          )}
          {latestRecovery ? (
            <div className="rounded-md bg-success/5 px-3 py-2 border border-success/20">
              <p className="text-xs font-medium text-success">
                <Shield className="inline h-3 w-3 mr-1" />
                Son Kurtarma — {latestRecovery.name}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {latestRecovery.lastRecoveryAt ? new Date(latestRecovery.lastRecoveryAt).toLocaleString('tr-TR') : '—'}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Server className="h-4 w-4" />
              Son kurtarma kaydı yok
            </div>
          )}
          {snapshot.alerts.length > 0 && (
            <div className="rounded-md bg-warning/5 px-3 py-2 border border-warning/20">
              <p className="text-xs font-medium text-warning">
                {snapshot.alerts.length} aktif uyarı
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
