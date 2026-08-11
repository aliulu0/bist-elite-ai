import { Card, EmptyState, Progress } from '@/components/shared';
import type { HistoricalQuality } from './history-types';
import { FRESHNESS_LABELS, VALIDATION_LABELS } from './history-types';
import { cn } from '@/lib/utils';

interface HistoryQualityPanelProps {
  quality: HistoricalQuality | null;
}

export function HistoryQualityPanel({ quality }: HistoryQualityPanelProps) {
  if (!quality) {
    return <EmptyState title="Kalite verisi yok" description="Sembol seçildiğinde kalite değerlendirmesi burada görüntülenir." />;
  }

  const variant = quality.qualityScore >= 70 ? 'success' : quality.qualityScore >= 40 ? 'warning' : 'danger';

  return (
    <Card title="Backtest Kalite Değerlendirmesi">
      <div className="space-y-4">
        <Progress value={quality.qualityScore} variant={variant} showLabel />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Kalite Skoru</p>
            <p className="text-lg font-semibold">{quality.qualityScore}/100</p>
          </div>
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Doğrulama</p>
            <p className="text-sm font-medium">{VALIDATION_LABELS[quality.validationStatus] ?? quality.validationStatus}</p>
          </div>
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Bütünlük</p>
            <p className={cn('text-sm font-medium', quality.integrityValid ? 'text-success' : 'text-destructive')}>
              {quality.integrityValid ? 'Geçerli' : 'Bozuk'}
            </p>
          </div>
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Tazelik</p>
            <p className="text-sm font-medium">{FRESHNESS_LABELS[quality.freshness] ?? quality.freshness}</p>
          </div>
        </div>

        <div className="rounded-md border p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Backtest için uygunluk</p>
            <span
              className={cn(
                'rounded border px-2 py-0.5 text-xs',
                quality.usableForBacktest
                  ? 'border-success/40 bg-success/10 text-success'
                  : 'border-destructive/40 bg-destructive/10 text-destructive',
              )}
            >
              {quality.usableForBacktest ? 'Uygun' : 'Uygun Değil'}
            </span>
          </div>
          <p className="mt-2 text-sm">{quality.reason}</p>
          {quality.lastAssessmentAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              Son değerlendirme: {new Date(quality.lastAssessmentAt).toLocaleString('tr-TR')}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
