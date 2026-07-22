'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useApiQuery } from '@/hooks/use-api';
import { useI18n } from '@/hooks/use-i18n';

interface Opportunity {
  symbol: string;
  name: string;
  score: number;
  confidence: number;
  action: string;
}

export function OpportunitiesCard() {
  const { t } = useI18n();
  const { data, isLoading } = useApiQuery<Opportunity[]>(
    ['opportunities', 'top'],
    '/api/v1/opportunities?limit=5',
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
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const opportunities = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {t('dashboard.eliteOpportunities')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {opportunities.length > 0 ? (
          <div className="space-y-2">
            {opportunities.map((opp) => (
              <div
                key={opp.symbol}
                className="flex items-center justify-between text-sm"
              >
                <span className="font-medium">{opp.symbol}</span>
                <span className="text-muted-foreground">{opp.score.toFixed(0)}</span>
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
