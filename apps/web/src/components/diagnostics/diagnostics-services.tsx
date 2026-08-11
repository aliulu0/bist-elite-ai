import { Card, EmptyState } from '@/components/shared';
import type { DiagnosticsSnapshot } from './diagnostics-types';
import { CHECK_STATUS_LABELS, CHECK_STATUS_COLORS, SERVICE_NAMES, MODULE_CATEGORY_MAP } from './diagnostics-types';

interface DiagnosticsServicesProps {
  snapshot: DiagnosticsSnapshot | null;
}

export function DiagnosticsServices({ snapshot }: DiagnosticsServicesProps) {
  if (!snapshot || snapshot.checks.length === 0) {
    return <EmptyState title="Servis durumu yok" description="Servis durumları toplandığında burada görüntülenecek" />;
  }

  return (
    <Card title="Servis Durumları">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {SERVICE_NAMES.map((svc) => {
          const matchingChecks = snapshot.checks.filter((c) => {
            const cat = MODULE_CATEGORY_MAP[c.name] || c.category || '';
            return cat === svc.category;
          });
          const hasFailed = matchingChecks.some((c) => c.status === 'fail');
          const hasWarning = matchingChecks.some((c) => c.status === 'warning');
          const status = hasFailed ? 'fail' : hasWarning ? 'warning' : matchingChecks.length > 0 ? 'pass' : 'unknown';

          return (
            <div key={svc.name} className="rounded-lg border bg-muted/50 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{svc.name}</span>
                <span className={`text-xs font-medium ${CHECK_STATUS_COLORS[status]}`}>
                  {CHECK_STATUS_LABELS[status]}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {matchingChecks.length} kontrol
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}


