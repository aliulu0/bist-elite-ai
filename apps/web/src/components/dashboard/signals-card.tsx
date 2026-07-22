'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useApiQuery } from '@/hooks/use-api';
import { useI18n } from '@/hooks/use-i18n';

interface SignalSummary {
  buyCount: number;
  sellCount: number;
  holdCount: number;
  strongBuyCount: number;
}

export function SignalsCard() {
  const { t } = useI18n();
  const { data, isLoading } = useApiQuery<SignalSummary>(
    ['signals', 'summary'],
    '/api/v1/signals/summary',
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

  const signals = data?.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {t('dashboard.todaysSignals')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {signals ? (
          <div className="flex flex-wrap gap-2">
            <Badge variant="default" className="bg-green-500">
              BUY {signals.buyCount}
            </Badge>
            <Badge variant="destructive">
              SELL {signals.sellCount}
            </Badge>
            <Badge variant="secondary">
              HOLD {signals.holdCount}
            </Badge>
            {signals.strongBuyCount > 0 && (
              <Badge variant="default" className="bg-green-700">
                A+ {signals.strongBuyCount}
              </Badge>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground">--</div>
        )}
      </CardContent>
    </Card>
  );
}
