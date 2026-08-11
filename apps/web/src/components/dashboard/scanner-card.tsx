import { Card, Badge, LoadingCard } from '@/components/shared';
import { ScanSearch } from 'lucide-react';

export interface ScannerResult {
  symbol: string;
  score: number;
  rank: number;
}

interface ScannerCardProps {
  results: ScannerResult[];
  total?: number;
  loading?: boolean;
  error?: string;
}

function getRankBadge(rank: number) {
  if (rank <= 3) return { variant: 'success' as const, label: `#${rank}` };
  if (rank <= 10) return { variant: 'info' as const, label: `#${rank}` };
  return { variant: 'outline' as const, label: `#${rank}` };
}

export function ScannerCard({ results, total, loading, error }: ScannerCardProps) {
  return (
    <Card
      title="Piyasa Tarama"
      description={total !== undefined ? `${total} hisse tarandı` : undefined}
      action={<ScanSearch className="h-4 w-4 text-muted-foreground" />}
    >
      {loading ? (
        <LoadingCard />
      ) : error ? (
        <p className="py-4 text-center text-xs text-destructive">{error}</p>
      ) : results.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">Tarama sonucu bulunamadı</p>
      ) : (
        <div className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 pr-2 font-medium">Sıra</th>
                <th className="pb-2 pr-2 font-medium">Hisse</th>
                <th className="pb-2 text-right font-medium">Skor</th>
              </tr>
            </thead>
            <tbody>
              {results.slice(0, 10).map((r) => {
                const badge = getRankBadge(r.rank);
                return (
                  <tr key={r.symbol} className="border-b last:border-0">
                    <td className="py-2 pr-2">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                    <td className="py-2 pr-2 font-semibold">{r.symbol}</td>
                    <td className="py-2 text-right tabular-nums">{r.score.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
