import { StatCard } from '@/components/shared';
import type { AuditSnapshot } from './audit-types';
import { SEVERITY_LABELS, SEVERITY_COLORS } from './audit-types';
import { FileText, Calendar, CheckCircle2, AlertTriangle, XCircle, AlertOctagon, Layers, Clock } from 'lucide-react';

interface AuditSummaryProps {
  snapshot: AuditSnapshot | null;
}

export function AuditSummary({ snapshot }: AuditSummaryProps) {
  if (!snapshot) return null;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatCard
        title="Toplam Kayıt"
        value={snapshot.totalCount.toLocaleString('tr-TR')}
        icon={FileText}
        variant={snapshot.totalCount > 100 ? 'success' : 'default'}
      />
      <StatCard
        title="Bugünkü Kayıt"
        value={snapshot.todayCount.toLocaleString('tr-TR')}
        icon={Calendar}
        variant={snapshot.todayCount > 10 ? 'success' : 'default'}
      />
      <StatCard
        title="Bilgi"
        value={snapshot.severityCounts.INFO}
        icon={CheckCircle2}
        variant="success"
      />
      <StatCard
        title="Uyarı"
        value={snapshot.severityCounts.WARNING}
        icon={AlertTriangle}
        variant="warning"
      />
      <StatCard
        title="Hata"
        value={snapshot.severityCounts.ERROR}
        icon={XCircle}
        variant="danger"
      />
      <StatCard
        title="Kritik"
        value={snapshot.severityCounts.CRITICAL}
        icon={AlertOctagon}
        variant="danger"
      />
      <StatCard
        title="Aktif Modül"
        value={snapshot.activeModules}
        icon={Layers}
      />
      <StatCard
        title="Son Kayıt"
        value={snapshot.lastEntry ? new Date(snapshot.lastEntry).toLocaleTimeString('tr-TR') : '—'}
        icon={Clock}
      />
    </div>
  );
}
