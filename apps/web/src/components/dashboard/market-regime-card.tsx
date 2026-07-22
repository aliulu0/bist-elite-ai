'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useApiQuery } from '@/hooks/use-api';
import { useI18n } from '@/hooks/use-i18n';

interface MarketRegime {
  regime: string;
  confidence: number;
  detectedAt: string;
  factors: Record<string, number>;
}

const regimeColors: Record<string, string> = {
  BULL: 'bg-green-500',
  BEAR: 'bg-red-500',
  SIDEWAYS: 'bg-yellow-500',
  HIGH_VOLATILITY: 'bg-orange-500',
  LOW_VOLATILITY: 'bg-blue-500',
  CRASH: 'bg-red-700',
  RECOVERY: 'bg-green-300',
};

export function MarketRegimeCard() {
  const { t } = useI18n();
  const { data, isLoading } = useApiQuery<MarketRegime>(
    ['market', 'regime'],
    '/api/v1/market/regime',
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

  const regime = data?.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {t('dashboard.marketRegime')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {regime ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className={regimeColors[regime.regime] || 'bg-gray-500'}>
                {regime.regime}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {(regime.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground">--</div>
        )}
      </CardContent>
    </Card>
  );
}
