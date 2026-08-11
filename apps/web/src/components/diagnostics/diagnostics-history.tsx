import { Card, EmptyState, Badge } from '@/components/shared';
import type { DiagnosticsSnapshot } from './diagnostics-types';
import { CHECK_STATUS_LABELS, CHECK_STATUS_BADGE, moduleDisplay } from './diagnostics-types';

interface DiagnosticsHistoryProps {
  snapshot: DiagnosticsSnapshot | null;
}

export function DiagnosticsHistory({ snapshot }: DiagnosticsHistoryProps) {
  if (!snapshot || snapshot.history.length === 0) {
    return <EmptyState title="Geçmiş kayıt yok" description="Tanılama çalıştırma geçmişi burada görüntülenecek" />;
  }

  return (
    <Card title="Tanılama Geçmişi">
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {snapshot.history.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-xs">
            <div className="flex items-center gap-3">
              <Badge variant={CHECK_STATUS_BADGE[entry.status]}>
                {CHECK_STATUS_LABELS[entry.status]}
              </Badge>
              <span className="font-medium">{moduleDisplay(entry.module)}</span>
              <span className="text-muted-foreground">{entry.message}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <span>{entry.duration}ms</span>
              <span>{new Date(entry.timestamp).toLocaleString('tr-TR')}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
