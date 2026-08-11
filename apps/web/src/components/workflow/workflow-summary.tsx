import { StatCard } from '@/components/shared';
import type { WorkflowSnapshot } from './workflow-types';
import { Activity, Clock, CheckCircle2, XCircle, Ban, Timer, Zap } from 'lucide-react';

interface WorkflowSummaryProps {
  snapshot: WorkflowSnapshot | null;
}

export function WorkflowSummary({ snapshot }: WorkflowSummaryProps) {
  if (!snapshot) return null;

  const successRate = snapshot.statistics.totalCreated > 0
    ? Math.round((snapshot.statistics.totalCompleted / snapshot.statistics.totalCreated) * 100)
    : 0;

  const formatDuration = (ms: number) => {
    if (ms === 0) return '—';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.round(ms / 60000)}dk`;
  };

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatCard
        title="Toplam İş Akışı"
        value={snapshot.statistics.totalCreated.toLocaleString('tr-TR')}
        icon={Activity}
        variant={snapshot.statistics.totalCreated > 0 ? 'success' : 'default'}
      />
      <StatCard
        title="Bekleyen"
        value={snapshot.queueStatus.pending}
        icon={Clock}
      />
      <StatCard
        title="Çalışıyor"
        value={snapshot.activeCount}
        icon={Zap}
        variant={snapshot.activeCount > 0 ? 'success' : 'default'}
      />
      <StatCard
        title="Tamamlandı"
        value={snapshot.statistics.totalCompleted}
        icon={CheckCircle2}
        variant="success"
      />
      <StatCard
        title="Başarısız"
        value={snapshot.statistics.totalFailed}
        icon={XCircle}
        variant="danger"
      />
      <StatCard
        title="İptal"
        value={snapshot.statistics.totalCancelled}
        icon={Ban}
      />
      <StatCard
        title="Ortalama Süre"
        value={formatDuration(snapshot.statistics.avgDurationMs)}
        icon={Timer}
      />
      <StatCard
        title="Başarı Oranı"
        value={`%${successRate}`}
        icon={CheckCircle2}
        variant={successRate >= 80 ? 'success' : successRate >= 50 ? 'warning' : 'danger'}
      />
    </div>
  );
}
