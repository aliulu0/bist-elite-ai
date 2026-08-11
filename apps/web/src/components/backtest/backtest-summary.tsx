import { StatCard } from '@/components/shared';
import { TrendingUp, TrendingDown, Shield, BarChart3, AlertTriangle, Target } from 'lucide-react';
import type { BacktestResult } from './backtest-types';

interface BacktestSummaryProps {
  result: BacktestResult;
}

export function BacktestSummary({ result }: BacktestSummaryProps) {
  const { performance: perf, risk } = result;

  const stats = [
    {
      title: 'Toplam Getiri',
      value: `${perf.totalReturn >= 0 ? '+' : ''}${(perf.totalReturn * 100).toFixed(2)}%`,
      icon: perf.totalReturn >= 0 ? TrendingUp : TrendingDown,
      variant: perf.totalReturn >= 0 ? ('success' as const) : ('danger' as const),
    },
    {
      title: 'CAGR',
      value: `${(perf.cagr * 100).toFixed(2)}%`,
      icon: BarChart3,
      variant: 'default' as const,
    },
    {
      title: 'Sharpe Oranı',
      value: risk.sharpeRatio.toFixed(2),
      icon: Shield,
      variant: risk.sharpeRatio >= 1 ? ('success' as const) : risk.sharpeRatio >= 0 ? ('default' as const) : ('danger' as const),
    },
    {
      title: 'Sortino Oranı',
      value: risk.sortinoRatio.toFixed(2),
      icon: Shield,
      variant: risk.sortinoRatio >= 1 ? ('success' as const) : ('default' as const),
    },
    {
      title: 'Maks. Drawdown',
      value: `${(risk.maxDrawdown * 100).toFixed(2)}%`,
      icon: AlertTriangle,
      variant: risk.maxDrawdown > 0.2 ? ('danger' as const) : ('warning' as const),
      description: `${risk.maxDrawdownDuration} gün`,
    },
    {
      title: 'Kazanma Oranı',
      value: `${(perf.winRate * 100).toFixed(1)}%`,
      icon: Target,
      variant: perf.winRate >= 0.5 ? ('success' as const) : ('warning' as const),
      description: `${perf.winningTrades}K / ${perf.losingTrades}Z`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {stats.map((s) => (
        <StatCard
          key={s.title}
          title={s.title}
          value={s.value}
          icon={s.icon}
          variant={s.variant}
          description={s.description}
        />
      ))}
    </div>
  );
}
