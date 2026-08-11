import { Card, EmptyState } from '@/components/shared';
import type { HistoricalGapReport } from './history-types';

interface HistoryGapsPanelProps {
  gaps: HistoricalGapReport | null;
}

export function HistoryGapsPanel({ gaps }: HistoryGapsPanelProps) {
  if (!gaps) {
    return <EmptyState title="Boşluk verisi yok" description="Sembol seçildiğinde tespit edilen boşluklar burada listelenir." />;
  }

  const anomalies = [
    { label: 'Mükerrer Zaman Damgası', value: gaps.duplicateTimestamps },
    { label: 'Sıra Dışı Mum', value: gaps.outOfOrderCount },
    { label: 'Geçersiz OHLC', value: gaps.invalidOhlcCount },
    { label: 'Sıfır/Eksi Fiyat', value: gaps.zeroOrNegativePriceCount },
    { label: 'Geçersiz Hacim', value: gaps.invalidVolumeCount },
    { label: 'Sağlayıcı Süreksizliği', value: gaps.providerDiscontinuities },
  ];

  return (
    <Card title={`${gaps.symbol} — Boşluk Analizi (${gaps.timeframe})`}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
          {anomalies.map((a) => (
            <div key={a.label} className="rounded-md bg-muted/50 p-2 text-center">
              <p className="text-xs text-muted-foreground">{a.label}</p>
              <p className={a.value > 0 ? 'text-destructive font-semibold' : 'font-semibold'}>{a.value}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <h4 className="font-medium">Eksik Aralıklar ({gaps.gapCount})</h4>
            <span className="text-xs text-muted-foreground">En büyük boşluk: {gaps.largestGap} gün</span>
          </div>
          {gaps.missingRanges.length === 0 ? (
            <p className="rounded-md bg-success/10 p-3 text-xs text-success">Kapsamda boşluk yok.</p>
          ) : (
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {gaps.missingRanges.map((range, i) => {
                const abnormal = gaps.abnormalGaps.some((g) => g.start === range.start && g.end === range.end);
                return (
                  <div key={`${range.start}-${range.end}`} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-1.5 text-xs">
                    <span className="font-mono">{range.start} → {range.end}</span>
                    {abnormal && <span className="text-destructive font-medium">Anormal</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
