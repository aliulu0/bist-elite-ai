import { Card, EmptyState } from '@/components/shared';
import type { DiagnosticsSnapshot } from './diagnostics-types';
import { CHECK_STATUS_LABELS, CHECK_STATUS_COLORS } from './diagnostics-types';
import { computeSummary } from '@/stores/diagnostics-store';
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface DiagnosticsOverviewProps {
  snapshot: DiagnosticsSnapshot | null;
}

export function DiagnosticsOverview({ snapshot }: DiagnosticsOverviewProps) {
  if (!snapshot) {
    return <EmptyState title="Henüz tanılama verisi bulunmuyor" description="Tanılama çalıştırıldığında burada görüntülenecek" />;
  }

  const summary = computeSummary(snapshot.checks);
  const latestError = snapshot.checks.find((c) => c.status === 'fail');

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card title="Genel Durum">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Durum</span>
            <span className={`text-sm font-medium ${CHECK_STATUS_COLORS[snapshot.overallStatus]}`}>
              {CHECK_STATUS_LABELS[snapshot.overallStatus]}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Sağlıklı Modüller</span>
            <span className="text-sm font-medium text-success">{summary.passed}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Uyarı Veren Modüller</span>
            <span className="text-sm font-medium text-warning">{summary.warning}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Hata Veren Modüller</span>
            <span className="text-sm font-medium text-destructive">{summary.failed}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Ortalama Süre</span>
            <span className="text-sm font-medium">{Math.round(summary.avgDuration)}ms</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Toplam Kontrol</span>
            <span className="text-sm font-medium">{summary.total}</span>
          </div>
        </div>
      </Card>
      <Card title="Son Olaylar">
        <div className="space-y-3">
          {snapshot.lastRun ? (
            <div className="rounded-md bg-muted/50 px-3 py-2 border">
              <p className="text-xs font-medium">
                <Clock className="inline h-3 w-3 mr-1" />
                Son Çalıştırma
              </p>
              <p className="text-[10px] text-muted-foreground">
                {new Date(snapshot.lastRun).toLocaleString('tr-TR')}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Son çalışma kaydı yok</p>
          )}
          {latestError ? (
            <div className="rounded-md bg-destructive/5 px-3 py-2 border border-destructive/20">
              <p className="text-xs font-medium text-destructive">
                <AlertTriangle className="inline h-3 w-3 mr-1" />
                Son Hata — {latestError.name}
              </p>
              <p className="text-[10px] text-muted-foreground">{latestError.message}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Son hata kaydı yok
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
