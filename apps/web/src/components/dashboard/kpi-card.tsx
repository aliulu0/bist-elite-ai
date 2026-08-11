import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: number;
  icon?: LucideIcon;
  loading?: boolean;
  variant?: 'default' | 'success' | 'danger' | 'warning';
  className?: string;
}

function getTrendIcon(trend: number) {
  if (trend > 0) return TrendingUp;
  if (trend < 0) return TrendingDown;
  return Minus;
}

function getTrendColor(trend: number) {
  if (trend > 0) return 'text-success';
  if (trend < 0) return 'text-destructive';
  return 'text-muted-foreground';
}

const variantBorder: Record<NonNullable<KpiCardProps['variant']>, string> = {
  default: '',
  success: 'border-success/30',
  danger: 'border-destructive/30',
  warning: 'border-warning/30',
};

export function KpiCard({ label, value, trend, icon: Icon, loading, variant = 'default', className }: KpiCardProps) {
  const TrendIcon = trend !== undefined ? getTrendIcon(trend) : null;

  return (
    <div className={cn('rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md', variantBorder[variant], className)}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          {loading ? (
            <div className="mt-1 flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <p className="mt-1 truncate text-2xl font-bold tabular-nums">{value}</p>
          )}
        </div>
        {Icon && (
          <div className="rounded-md bg-muted/80 p-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
      {trend !== undefined && !loading && (
        <div className="mt-2 flex items-center gap-1">
          {TrendIcon && (
            <span className={cn('inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums', getTrendColor(trend))}>
              <TrendIcon className="h-3 w-3" />
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}
