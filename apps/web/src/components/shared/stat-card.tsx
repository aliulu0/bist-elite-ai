import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: LucideIcon;
  description?: string;
  variant?: 'default' | 'success' | 'danger' | 'warning';
  className?: string;
}

function getChangeColor(change: number) {
  if (change > 0) return 'text-success';
  if (change < 0) return 'text-destructive';
  return 'text-muted-foreground';
}

function getChangeIcon(change: number) {
  if (change > 0) return TrendingUp;
  if (change < 0) return TrendingDown;
  return Minus;
}

export function StatCard({ title, value, change, icon: Icon, description, variant = 'default', className }: StatCardProps) {
  const ChangeIcon = change !== undefined ? getChangeIcon(change) : null;

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md',
        variant === 'success' && 'border-success/20',
        variant === 'danger' && 'border-destructive/20',
        variant === 'warning' && 'border-warning/20',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
        </div>
        {Icon && (
          <div className="rounded-md bg-muted p-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
      {(change !== undefined || description) && (
        <div className="mt-2 flex items-center gap-2">
          {change !== undefined && ChangeIcon && (
            <span className={cn('flex items-center gap-0.5 text-xs font-medium', getChangeColor(change))}>
              <ChangeIcon className="h-3 w-3" />
              {change > 0 ? '+' : ''}{change}%
            </span>
          )}
          {description && <span className="text-xs text-muted-foreground">{description}</span>}
        </div>
      )}
    </div>
  );
}
