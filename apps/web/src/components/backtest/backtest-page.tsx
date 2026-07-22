'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useApiQuery } from '@/hooks/use-api';
import { useI18n } from '@/hooks/use-i18n';

interface BacktestResult {
  id: string;
  strategyName: string;
  timeframe: string;
  totalReturn: number;
  annualReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
}

export function BacktestPage() {
  const { t } = useI18n();
  const { data, isLoading } = useApiQuery<BacktestResult[]>(
    ['backtest', 'results'],
    '/api/v1/backtest/results?limit=20',
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const results = data?.data ?? [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('nav.backtest')}</h2>

      <Card>
        <CardHeader>
          <CardTitle>Recent Backtests</CardTitle>
        </CardHeader>
        <CardContent>
          {results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="grid grid-cols-4 gap-4 rounded-md border p-4"
                >
                  <div>
                    <div className="text-sm text-muted-foreground">Strategy</div>
                    <div className="font-medium">{result.strategyName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Return</div>
                    <div
                      className={`font-medium ${
                        result.totalReturn >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {result.totalReturn >= 0 ? '+' : ''}
                      {result.totalReturn.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Sharpe</div>
                    <div className="font-medium">{result.sharpeRatio.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Win Rate</div>
                    <div className="font-medium">{result.winRate.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">No backtest results</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
