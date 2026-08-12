import { Card, Badge, LoadingCard } from '@/components/shared';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Opportunity {
  symbol: string;
  score: number;
  opportunityScore: number;
  reason: string;
  decisionScore?: number | null;
  decisionStatus?: string | null;
  earlyOpportunity?: boolean | null;
  convergence?: number | null;
  trendStage?: string | null;
}

function getDecisionBadge(status: string): { variant: 'success' | 'info' | 'warning' | 'danger' | 'outline'; label: string } {
  switch (status) {
    case 'STRONG_EARLY_OPPORTUNITY':
      return { variant: 'success', label: 'Güçlü Erken' };
    case 'EARLY_OPPORTUNITY':
      return { variant: 'success', label: 'Erken' };
    case 'CONFIRMED_OPPORTUNITY':
      return { variant: 'info', label: 'Doğrulanmış' };
    case 'EXTENDED_OPPORTUNITY':
      return { variant: 'warning', label: 'Uzatılmış' };
    case 'WATCHLIST_OPPORTUNITY':
      return { variant: 'warning', label: 'İzleme' };
    case 'WEAK_OPPORTUNITY':
      return { variant: 'danger', label: 'Zayıf' };
    case 'INVALID_OPPORTUNITY':
      return { variant: 'danger', label: 'Geçersiz' };
    default:
      return { variant: 'outline', label: status ?? '-' };
  }
}

interface OpportunityCardProps {
  opportunities: Opportunity[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

function getScoreBadge(score: number) {
  if (score >= 80) return { variant: 'success' as const, label: 'Güçlü' };
  if (score >= 60) return { variant: 'info' as const, label: 'İyi' };
  if (score >= 40) return { variant: 'warning' as const, label: 'Orta' };
  return { variant: 'danger' as const, label: 'Zayıf' };
}

export function OpportunityCard({ opportunities, loading, error, onRetry }: OpportunityCardProps) {
  return (
    <Card
      title="En İyi Fırsatlar"
      description="Yüksek potansiyelli adaylar"
      action={<TrendingUp className="h-4 w-4 text-success" />}
    >
      {loading ? (
        <LoadingCard />
      ) : error ? (
        <p className="py-4 text-center text-xs text-destructive">{error}</p>
      ) : opportunities.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">Fırsat bulunamadı</p>
      ) : (
        <div className="overflow-hidden">
          <table className="w-full text-sm">
             <thead>
               <tr className="border-b text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                 <th className="pb-2 pr-2 font-medium">Hisse</th>
                 <th className="pb-2 pr-2 font-medium">Skor</th>
                 <th className="pb-2 pr-2 font-medium">Karar</th>
                 {opportunities.some((o) => o.decisionScore != null) && (
                   <th className="pb-2 pr-2 font-medium">Karar Skoru</th>
                 )}
                 {opportunities.some((o) => o.trendStage != null) && (
                   <th className="pb-2 pr-2 font-medium">Trend</th>
                 )}
                 <th className="pb-2 pr-2 font-medium">Neden</th>
               </tr>
             </thead>
             <tbody>
               {opportunities.slice(0, 8).map((opp) => {
                 const badge = getScoreBadge(opp.opportunityScore);
                 const decisionBadge = opp.decisionStatus
                   ? getDecisionBadge(opp.decisionStatus)
                   : badge;
                 return (
                   <tr key={opp.symbol} className="border-b last:border-0">
                     <td className="py-2.5 pr-2">
                       <span className="font-semibold">{opp.symbol}</span>
                     </td>
                     <td className="py-2.5 pr-2">
                       <Badge variant={badge.variant}>{badge.label}</Badge>
                     </td>
                     <td className="py-2.5 pr-2">
                       {opp.decisionStatus ? (
                         <Badge variant={decisionBadge.variant}>{decisionBadge.label}</Badge>
                       ) : (
                         <span className="text-slate-500">-</span>
                       )}
                     </td>
                     {opportunities.some((o) => o.decisionScore != null) && (
                       <td className="py-2.5 pr-2 font-mono">{opp.decisionScore ?? '-'}</td>
                     )}
                     {opportunities.some((o) => o.trendStage != null) && (
                       <td className="py-2.5 pr-2 text-slate-400">{opp.trendStage ?? '-'}</td>
                     )}
                     <td className="max-w-[200px] truncate py-2.5 text-xs text-muted-foreground">
                       {opp.reason}
                     </td>
                   </tr>
                 );
               })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
