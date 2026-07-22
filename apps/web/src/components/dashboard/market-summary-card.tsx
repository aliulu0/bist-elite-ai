'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useApiQuery } from '@/hooks/use-api';
import { useI18n } from '@/hooks/use-i18n';

interface MarketSummary {
  xuu100: { value: number; change: number; changePercent: number };
  bist30: { value: number; change: number; changePercent: number };
  bist100: { value: number; change: number; changePercent: number };
  totalVolume: number;
  totalTurnover: number;
}

export function MarketSummaryCard() {
  const { t } = useI18n();
  const { data, isLoading } = useApiQuery<MarketSummary>(
    ['market', 'summary'],
    '/api/v1/market/summary',
    { refetchInterval: 60_000 },
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24" />
        </CardContent>
      </Card>
    );
  }

  const summary = data?.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {t('dashboard.marketSummary')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {summary ? (
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {summary.xuu100.value.toLocaleString('tr-TR')}
            </div>
            <div
              className={
                summary.xuu100.change >= 0
                  ? 'text-green-500 text-sm'
                  : 'text-red-500 text-sm'
              }
            >
              {summary.xuu100.change >= 0 ? '+' : ''}
              {summary.xuu100.changePercent.toFixed(2)}%
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground">--</div>
        )}
      </CardContent>
    </Card>
  );
}
