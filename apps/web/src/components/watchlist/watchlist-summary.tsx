import { StatCard } from '@/components/shared';
import { Eye, Zap, Award, TrendingUp, TrendingDown, Bell, BarChart3, Shield } from 'lucide-react';
import type { WatchlistSummary } from './watchlist-types';

interface WatchlistSummaryProps {
  summary: WatchlistSummary | null;
}

export function WatchlistSummaryCards({ summary }: WatchlistSummaryProps) {
  if (!summary) return null;

  const stats = [
    { title: 'Toplam İzlenen Hisse', value: String(summary.totalWatched), icon: Eye, variant: 'default' as const },
    { title: 'Erken Fırsat', value: String(summary.earlyOpportunities), icon: Zap, variant: summary.earlyOpportunities > 0 ? 'success' as const : 'default' as const },
    { title: 'AAA', value: String(summary.aaaCount), icon: Award, variant: summary.aaaCount > 0 ? 'success' as const : 'default' as const },
    { title: 'Yükselen', value: String(summary.risingCount), icon: TrendingUp, variant: 'success' as const },
    { title: 'Düşen', value: String(summary.fallingCount), icon: TrendingDown, variant: 'danger' as const },
    { title: 'Yeni Alarm', value: String(summary.newAlerts), icon: Bell, variant: summary.newAlerts > 0 ? 'warning' as const : 'default' as const },
    { title: 'Ort. Elite Skoru', value: summary.avgEliteScore.toFixed(0), icon: BarChart3, variant: 'default' as const },
    { title: 'Ort. Güven', value: `${(summary.avgConfidence * 100).toFixed(0)}%`, icon: Shield, variant: 'default' as const },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
      {stats.map((s) => (
        <StatCard key={s.title} title={s.title} value={s.value} icon={s.icon} variant={s.variant} />
      ))}
    </div>
  );
}
