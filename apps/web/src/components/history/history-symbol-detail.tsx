import { Card, EmptyState, Progress, Badge } from '@/components/shared';
import type { SymbolHistoricalStatus } from './history-types';
import { HISTORY_STATUS_COLORS, HISTORY_STATUS_LABELS, BACKFILL_STATUS_COLORS, BACKFILL_STATUS_LABELS, FRESHNESS_LABELS } from './history-types';
import { cn } from '@/lib/utils';

interface HistorySymbolDetailProps {
  status: SymbolHistoricalStatus | null;
  loading: boolean;
}

export function HistorySymbolDetail({ status, loading }: HistorySymbolDetailProps) {
  if (loading) {
    return <EmptyState title="Yükleniyor" description="Sembol detayı getiriliyor..." />;
  }

  if (!status) {
    return <EmptyState title="Sembol seçin" description="Detayı görüntülemek için tablodan bir sembol seçin." />;
  }

  const coverage = status.coverage;
  const variant = coverage.coveragePercent >= 90 ? 'success' : coverage.coveragePercent >= 50 ? 'warning' : 'danger';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{status.symbol}</h3>
          <span className={cn('rounded border px-2 py-0.5 text-xs', HISTORY_STATUS_COLORS[status.status])}>
            {HISTORY_STATUS_LABELS[status.status] ?? status.status}
          </span>
          <Badge variant="outline">{status.timeframe}</Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Son güncelleme: {status.lastUpdated ? new Date(status.lastUpdated).toLocaleString('tr-TR') : '—'}</span>
          <span>Sağlayıcı: {status.source.provider === 'none' ? '—' : status.source.provider}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card title="Kapsam">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Beklenen / Mevcut Bar</span>
              <span className="font-mono">{coverage.actualBarCount} / {coverage.expectedBarCount}</span>
            </div>
            <Progress value={coverage.coveragePercent} variant={variant} showLabel />
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-md bg-muted/50 p-2 text-center">
                <p className="text-muted-foreground">Boşluk</p>
                <p className="font-semibold">{coverage.gapCount}</p>
              </div>
              <div className="rounded-md bg-muted/50 p-2 text-center">
                <p className="text-muted-foreground">En Büyük Boşluk</p>
                <p className="font-semibold">{coverage.largestGap} gün</p>
              </div>
              <div className="rounded-md bg-muted/50 p-2 text-center">
                <p className="text-muted-foreground">Kapsam</p>
                <p className="font-semibold">%{coverage.coveragePercent.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Veri Kalitesi">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Kalite Skoru</span>
              <span className="font-mono font-semibold">{status.quality.qualityScore}/100</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Doğrulama</span>
              <span className="font-mono">{status.quality.validationStatus}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Bütünlük</span>
              <span className={cn('font-medium', status.quality.integrityValid ? 'text-success' : 'text-destructive')}>
                {status.quality.integrityValid ? 'Geçerli' : 'Bozuk'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tazelik</span>
              <span>{FRESHNESS_LABELS[status.quality.freshness] ?? status.quality.freshness}</span>
            </div>
            <p className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">{status.quality.reason}</p>
          </div>
        </Card>

        <Card title="Backfill">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Durum</span>
              <span className={cn('rounded border px-2 py-0.5 text-xs', BACKFILL_STATUS_COLORS[status.backfill.status])}>
                {BACKFILL_STATUS_LABELS[status.backfill.status] ?? status.backfill.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Son Çalışma</span>
              <span className="font-mono text-xs">{status.backfill.lastRunAt ? new Date(status.backfill.lastRunAt).toLocaleString('tr-TR') : '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Getirilen Bar</span>
              <span className="font-mono">{status.backfill.fetchedBars}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Kalan Aralık</span>
              <span className="font-mono">{status.backfill.remainingRanges}</span>
            </div>
            {status.backfill.lastError && (
              <p className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">{status.backfill.lastError}</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
