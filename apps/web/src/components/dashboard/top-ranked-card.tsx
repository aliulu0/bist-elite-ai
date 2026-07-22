'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useApiQuery } from '@/hooks/use-api';
import { useI18n } from '@/hooks/use-i18n';

interface RankedStock {
  rank: number;
  symbol: string;
  name: string;
  score: number;
  change: number;
}

export function TopRankedCard() {
  const { t } = useI18n();
  const { data, isLoading } = useApiQuery<RankedStock[]>(
    ['stocks', 'ranked'],
    '/api/v1/stocks/ranked?limit=10',
    { refetchInterval: 60_000 },
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const stocks = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {t('dashboard.topRanked')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stocks.length > 0 ? (
          <div className="space-y-2">
            {stocks.slice(0, 5).map((stock) => (
              <div
                key={stock.symbol}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{stock.rank}</span>
                  <span className="font-medium">{stock.symbol}</span>
                </div>
                <span className="font-mono">{stock.score.toFixed(1)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground">--</div>
        )}
      </CardContent>
    </Card>
  );
}
