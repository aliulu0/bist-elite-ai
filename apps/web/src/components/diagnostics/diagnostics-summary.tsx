import { StatCard } from '@/components/shared';
import type { DiagnosticsSnapshot } from './diagnostics-types';
import { CHECK_STATUS_LABELS } from './diagnostics-types';
import { computeSummary } from '@/stores/diagnostics-store';
import { Activity, CheckCircle2, AlertTriangle, XCircle, Clock, RefreshCw, AlertOctagon, ListChecks } from 'lucide-react';

interface DiagnosticsSummaryProps {
  snapshot: DiagnosticsSnapshot | null;
}

export function DiagnosticsSummary({ snapshot }: DiagnosticsSummaryProps) {
  if (!snapshot) return null;

  const summary = computeSummary(snapshot.checks);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatCard
        title="Genel Durum"
        value={CHECK_STATUS_LABELS[snapshot.overallStatus]}
        icon={Activity}
        variant={snapshot.overallStatus === 'pass' ? 'success' : snapshot.overallStatus === 'fail' ? 'danger' : 'warning'}
      />
      <StatCard
        title="Sağlıklı Modül"
        value={summary.passed}
        icon={CheckCircle2}
        variant="success"
      />
      <StatCard
        title="Uyarı Veren Modül"
        value={summary.warning}
        icon={AlertTriangle}
        variant="warning"
      />
      <StatCard
        title="Hata Veren Modül"
        value={summary.failed}
        icon={XCircle}
        variant="danger"
      />
      <StatCard
        title="Ortalama Süre"
        value={`${Math.round(summary.avgDuration)}ms`}
        icon={Clock}
        variant={summary.avgDuration > 500 ? 'danger' : 'default'}
      />
      <StatCard
        title="Son Çalışma"
        value={snapshot.lastRun ? new Date(snapshot.lastRun).toLocaleTimeString('tr-TR') : '—'}
        icon={RefreshCw}
      />
      <StatCard
        title="Kritik Uyarı"
        value={snapshot.alerts.filter((a) => a.severity === 'CRITICAL').length}
        icon={AlertOctagon}
        variant={snapshot.alerts.filter((a) => a.severity === 'CRITICAL').length > 0 ? 'danger' : 'success'}
      />
      <StatCard
        title="Toplam Kontrol"
        value={summary.total}
        icon={ListChecks}
      />
    </div>
  );
}
