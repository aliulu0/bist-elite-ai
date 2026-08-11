import { StatCard } from '@/components/shared';
import { TrendingUp, TrendingDown, Wallet, BarChart3, Target, Minus } from 'lucide-react';
import type { PortfolioSummary } from './portfolio-types';
import { formatCurrency } from '@/lib/utils';

interface PortfolioSummaryProps {
  summary: PortfolioSummary | null;
}

function PnlIcon({ positive }: { positive: boolean }) {
  if (positive) return TrendingUp;
  return TrendingDown;
}

function PnlVariant(value: number): 'success' | 'danger' | 'warning' | 'default' {
  if (value > 0) return 'success';
  if (value < 0) return 'danger';
  return 'default';
}

export function PortfolioSummaryCards({ summary }: PortfolioSummaryProps) {
  if (!summary) return null;

  const stats = [
    { title: 'Toplam Portföy Değeri', value: formatCurrency(summary.totalValue), icon: Wallet, variant: 'default' as const },
    { title: 'Nakit Durumu', value: formatCurrency(summary.cashBalance), icon: BarChart3, variant: 'default' as const },
    { title: 'Bugünkü K/Z', value: formatCurrency(summary.dayPnl), icon: PnlIcon({ positive: summary.dayPnl >= 0 }), variant: PnlVariant(summary.dayPnl), description: `${summary.dayPnlPercent >= 0 ? '+' : ''}${summary.dayPnlPercent.toFixed(2)}%` },
    { title: 'Toplam Getiri', value: formatCurrency(summary.totalPnl), icon: PnlIcon({ positive: summary.totalPnl >= 0 }), variant: PnlVariant(summary.totalPnl), description: `${summary.totalPnlPercent >= 0 ? '+' : ''}${summary.totalPnlPercent.toFixed(2)}%` },
    { title: 'Gerçekleşmiş K/Z', value: formatCurrency(summary.realizedPnl), icon: PnlIcon({ positive: summary.realizedPnl >= 0 }), variant: PnlVariant(summary.realizedPnl) },
    { title: 'Gerçekleşmemiş K/Z', value: formatCurrency(summary.unrealizedPnl), icon: PnlIcon({ positive: summary.unrealizedPnl >= 0 }), variant: PnlVariant(summary.unrealizedPnl) },
    { title: 'Maks. Drawdown', value: `${(summary.maxDrawdown * 100).toFixed(2)}%`, icon: Target, variant: summary.maxDrawdown > 0.2 ? 'danger' as const : 'warning' as const },
    { title: 'Volatilite', value: `${(summary.volatility * 100).toFixed(2)}%`, icon: BarChart3, variant: 'default' as const },
    { title: 'Sharpe', value: summary.sharpeRatio.toFixed(2), icon: BarChart3, variant: summary.sharpeRatio >= 1 ? 'success' as const : 'default' as const },
    { title: 'AI Portföy Skoru', value: summary.aiScore.toFixed(0), icon: Target, variant: summary.aiScore >= 70 ? 'success' as const : summary.aiScore >= 40 ? 'warning' as const : 'danger' as const },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {stats.map((s) => (
        <StatCard key={s.title} title={s.title} value={s.value} icon={s.icon} variant={s.variant} description={s.description} />
      ))}
    </div>
  );
}
