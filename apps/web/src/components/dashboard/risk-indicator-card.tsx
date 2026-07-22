'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useApiQuery } from '@/hooks/use-api';
import { useI18n } from '@/hooks/use-i18n';

interface RiskIndicator {
  overallRisk: string;
  portfolioBeta: number;
  var95: number;
  maxDrawdown: number;
}

const riskColors: Record<string, string> = {
  LOW: 'text-green-500',
  MEDIUM: 'text-yellow-500',
  HIGH: 'text-orange-500',
  VERY_HIGH: 'text-red-500',
};

export function RiskIndicatorCard() {
  const { t } = useI18n();
  const { data, isLoading } = useApiQuery<RiskIndicator>(
    ['risk', 'indicator'],
    '/api/v1/risk/indicator',
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

  const risk = data?.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {t('dashboard.riskIndicator')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {risk ? (
          <div className="space-y-2">
            <div className={`text-2xl font-bold ${riskColors[risk.overallRisk] || ''}`}>
              {risk.overallRisk}
            </div>
            <div className="text-sm text-muted-foreground">
              Beta: {risk.portfolioBeta.toFixed(2)}
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground">--</div>
        )}
      </CardContent>
    </Card>
  );
}
