import { StatCard } from '@/components/shared';
import type { PerformanceSnapshot } from './performance-types';
import { HEALTH_STATUS_LABELS, HEALTH_STATUS_COLORS } from './performance-types';
import { Activity, Clock, Target, Gauge, Database, GitBranch, ListOrdered, HeartPulse } from 'lucide-react';

interface PerformanceSummaryProps {
  snapshot: PerformanceSnapshot | null;
}

export function PerformanceSummary({ snapshot }: PerformanceSummaryProps) {
  if (!snapshot) return null;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatCard
        title="Toplam İstek"
        value={snapshot.totalRequests.toLocaleString('tr-TR')}
        icon={Activity}
        variant={snapshot.totalRequests > 1000 ? 'success' : 'default'}
      />
      <StatCard
        title="Ortalama Yanıt Süresi"
        value={`${Math.round(snapshot.avgLatencyMs)}ms`}
        icon={Clock}
        variant={snapshot.avgLatencyMs > 500 ? 'danger' : snapshot.avgLatencyMs > 200 ? 'warning' : 'success'}
      />
      <StatCard
        title="P95"
        value={`${Math.round(snapshot.p95LatencyMs)}ms`}
        icon={Target}
        variant={snapshot.p95LatencyMs > 1000 ? 'danger' : 'default'}
      />
      <StatCard
        title="P99"
        value={`${Math.round(snapshot.p99LatencyMs)}ms`}
        icon={Gauge}
        variant={snapshot.p99LatencyMs > 2000 ? 'danger' : 'default'}
      />
      <StatCard
        title="Cache Hit Oranı"
        value={`%${snapshot.cacheHitRate.toFixed(1)}`}
        icon={Database}
        variant={snapshot.cacheHitRate > 80 ? 'success' : snapshot.cacheHitRate > 50 ? 'warning' : 'danger'}
      />
      <StatCard
        title="Workflow Süresi"
        value={`${Math.round(snapshot.workflowAvgDurationMs)}ms`}
        icon={GitBranch}
      />
      <StatCard
        title="Queue Süresi"
        value={`${Math.round(snapshot.queueAvgWaitTimeMs)}ms`}
        icon={ListOrdered}
      />
      <StatCard
        title="Sistem Sağlığı"
        value={HEALTH_STATUS_LABELS[snapshot.systemHealth]}
        icon={HeartPulse}
        variant={snapshot.systemHealth === 'HEALTHY' ? 'success' : snapshot.systemHealth === 'DEGRADED' ? 'warning' : 'danger'}
        className={HEALTH_STATUS_COLORS[snapshot.systemHealth]}
      />
    </div>
  );
}
