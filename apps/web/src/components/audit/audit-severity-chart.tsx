import { Card } from '@/components/shared';
import type { AuditSnapshot } from './audit-types';
import { SEVERITY_LABELS } from './audit-types';

interface AuditSeverityChartProps {
  snapshot: AuditSnapshot | null;
}

export function AuditSeverityChart({ snapshot }: AuditSeverityChartProps) {
  if (!snapshot) return null;

  const { severityCounts } = snapshot;
  const total = snapshot.totalCount || 1;

  const bars = [
    { key: 'INFO', count: severityCounts.INFO, color: 'bg-success' },
    { key: 'WARNING', count: severityCounts.WARNING, color: 'bg-warning' },
    { key: 'ERROR', count: severityCounts.ERROR, color: 'bg-destructive' },
    { key: 'CRITICAL', count: severityCounts.CRITICAL, color: 'bg-destructive' },
  ];

  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">Önem Dağılımı</h3>
      <div className="space-y-3">
        {bars.map((bar) => (
          <div key={bar.key}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{SEVERITY_LABELS[bar.key as keyof typeof SEVERITY_LABELS]}</span>
              <span className="text-xs font-medium">{bar.count}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${bar.color}`}
                style={{ width: `${(bar.count / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
