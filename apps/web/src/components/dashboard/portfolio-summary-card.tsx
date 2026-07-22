'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useApiQuery } from '@/hooks/use-api';
import { useI18n } from '@/hooks/use-i18n';

interface PortfolioSummary {
  totalValue: number;
  dailyReturn: number;
  totalReturn: number;
  positions: number;
}

export function PortfolioSummaryCard() {
  const { t } = useI18n();
  const { data, isLoading } = useApiQuery<PortfolioSummary>(
    ['portfolio', 'summary'],
    '/api/v1/portfolio/summary',
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

  const portfolio = data?.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {t('dashboard.portfolioSummary')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {portfolio ? (
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {portfolio.totalValue.toLocaleString('tr-TR', {
                style: 'currency',
                currency: 'TRY',
              })}
            </div>
            <div
              className={
                portfolio.dailyReturn >= 0
                  ? 'text-green-500 text-sm'
                  : 'text-red-500 text-sm'
              }
            >
              {portfolio.dailyReturn >= 0 ? '+' : ''}
              {portfolio.dailyReturn.toFixed(2)}%
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground">--</div>
        )}
      </CardContent>
    </Card>
  );
}
