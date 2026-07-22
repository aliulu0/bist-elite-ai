'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useApiQuery } from '@/hooks/use-api';
import { useI18n } from '@/hooks/use-i18n';

interface PortfolioData {
  totalValue: number;
  cashBalance: number;
  investedValue: number;
  dailyReturn: number;
  totalReturn: number;
  positions: Array<{
    symbol: string;
    name: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    weight: number;
    pnl: number;
  }>;
}

export function PortfolioPage() {
  const { t } = useI18n();
  const { data, isLoading } = useApiQuery<PortfolioData>(
    ['portfolio'],
    '/api/v1/portfolio',
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const portfolio = data?.data;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('nav.portfolio')}</h2>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portfolio?.totalValue.toLocaleString('tr-TR', {
                style: 'currency',
                currency: 'TRY',
              }) || '--'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Cash Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portfolio?.cashBalance.toLocaleString('tr-TR', {
                style: 'currency',
                currency: 'TRY',
              }) || '--'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Daily Return</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                (portfolio?.dailyReturn ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {portfolio?.dailyReturn !== undefined
                ? `${portfolio.dailyReturn >= 0 ? '+' : ''}${portfolio.dailyReturn.toFixed(2)}%`
                : '--'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Positions</CardTitle>
        </CardHeader>
        <CardContent>
          {portfolio?.positions && portfolio.positions.length > 0 ? (
            <div className="space-y-2">
              {portfolio.positions.map((pos) => (
                <div
                  key={pos.symbol}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <div className="font-medium">{pos.symbol}</div>
                    <div className="text-sm text-muted-foreground">{pos.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{pos.weight.toFixed(1)}%</div>
                    <div
                      className={`text-sm ${pos.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}
                    >
                      {pos.pnl >= 0 ? '+' : ''}
                      {pos.pnl.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">No positions</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
