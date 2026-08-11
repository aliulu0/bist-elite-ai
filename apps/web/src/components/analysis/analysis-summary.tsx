import { Card, Badge, Progress } from '@/components/shared';
import { Trophy, Target, Shield, Gauge, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalysisResult } from './analysis-types';

interface AnalysisSummaryProps {
  data: AnalysisResult;
}

function RatingBadge({ rating }: { rating: string }) {
  const v = rating?.startsWith('A') ? 'success' : rating?.startsWith('B') ? 'warning' : rating?.startsWith('C') ? 'danger' : 'outline';
  return <Badge variant={v as 'success' | 'warning' | 'danger' | 'outline'}>{rating}</Badge>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const v = priority === 'CRITICAL' || priority === 'VERY_HIGH' ? 'danger' : priority === 'HIGH' ? 'warning' : priority === 'MEDIUM' ? 'info' : 'outline';
  return <Badge variant={v as 'danger' | 'warning' | 'info' | 'outline'}>{priority}</Badge>;
}

function RiskBadge({ score }: { score: number }) {
  if (score >= 70) return <Badge variant="success">Düşük</Badge>;
  if (score >= 40) return <Badge variant="warning">Orta</Badge>;
  return <Badge variant="danger">Yüksek</Badge>;
}

export function AnalysisSummary({ data }: AnalysisSummaryProps) {
  const elite = data.eliteScore;
  const opportunity = data.opportunity;

  const cards = [
    {
      title: 'Elite Derece',
      value: elite?.rating || '-',
      icon: Trophy,
      extra: <RatingBadge rating={elite?.rating || 'D'} />,
      variant: 'default' as const,
    },
    {
      title: 'Fırsat',
      value: opportunity?.opportunityScore?.toFixed(0) || '0',
      icon: Target,
      extra: <Badge variant={opportunity?.opportunityLevel === 'HIGH' || opportunity?.opportunityLevel === 'VERY_HIGH' ? 'success' : 'outline'}>{opportunity?.opportunityLevel || '-'}</Badge>,
      variant: 'default' as const,
    },
    {
      title: 'Güven',
      value: `${((elite?.confidence || 0) * 100).toFixed(0)}%`,
      icon: Shield,
      progress: (elite?.confidence || 0) * 100,
      variant: 'default' as const,
    },
    {
      title: 'Öncelik',
      value: elite?.priority || '-',
      icon: Zap,
      extra: <PriorityBadge priority={elite?.priority || 'NONE'} />,
      variant: 'default' as const,
    },
    {
      title: 'Risk',
      value: '',
      icon: Gauge,
      extra: <RiskBadge score={elite?.eliteScore || 0} />,
      variant: 'default' as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title} className="p-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground">{card.title}</p>
              <p className="text-xl font-bold tracking-tight tabular-nums">{card.value}</p>
            </div>
            <div className="rounded-md bg-muted p-1.5">
              <card.icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
          {card.extra && <div className="mt-2">{card.extra}</div>}
          {card.progress !== undefined && (
            <div className="mt-2">
              <Progress
                value={card.progress}
                variant={card.progress >= 70 ? 'success' : card.progress >= 40 ? 'warning' : 'danger'}
                size="sm"
              />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
