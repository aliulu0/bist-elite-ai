import { StatCard } from '@/components/shared';
import type { ProviderHealthSnapshot } from './provider-types';
import { PROVIDER_STATUS_LABELS, PROVIDER_STATUS_COLORS } from './provider-types';
import { computeSummary } from '@/stores/providers-store';
import { Server, CheckCircle2, AlertTriangle, XCircle, Clock, Shield, AlertOctagon, RefreshCw } from 'lucide-react';

interface ProviderSummaryProps {
  snapshot: ProviderHealthSnapshot | null;
}

export function ProviderSummary({ snapshot }: ProviderSummaryProps) {
  if (!snapshot) return null;

  const summary = computeSummary(snapshot.providers);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatCard
        title="Toplam Sağlayıcı"
        value={summary.total}
        icon={Server}
      />
      <StatCard
        title="Sağlıklı"
        value={summary.healthy}
        icon={CheckCircle2}
        variant="success"
      />
      <StatCard
        title="Uyarı"
        value={summary.warning}
        icon={AlertTriangle}
        variant="warning"
      />
      <StatCard
        title="Kritik"
        value={summary.critical}
        icon={XCircle}
        variant="danger"
      />
      <StatCard
        title="Ort. Gecikme"
        value={`${Math.round(summary.avgLatency)}ms`}
        icon={Clock}
        variant={summary.avgLatency > 500 ? 'danger' : summary.avgLatency > 200 ? 'warning' : 'success'}
      />
      <StatCard
        title="Ort. Güvenilirlik"
        value={`%${summary.avgReliability.toFixed(1)}`}
        icon={Shield}
        variant={summary.avgReliability > 90 ? 'success' : summary.avgReliability > 70 ? 'warning' : 'danger'}
      />
      <StatCard
        title="Toplam Hata"
        value={summary.totalErrors.toLocaleString('tr-TR')}
        icon={AlertOctagon}
        variant={summary.totalErrors > 100 ? 'danger' : 'default'}
      />
      <StatCard
        title="Son Güncelleme"
        value={snapshot.lastUpdate ? new Date(snapshot.lastUpdate).toLocaleTimeString('tr-TR') : '—'}
        icon={RefreshCw}
      />
    </div>
  );
}
