import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'danger' | 'warning';
  showLabel?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const variantClasses = {
  default: 'bg-primary',
  success: 'bg-success',
  danger: 'bg-destructive',
  warning: 'bg-warning',
};

export function Progress({ value, max = 100, size = 'md', variant = 'default', showLabel, className }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{value}/{max}</span>
          <span className="text-xs font-medium">{Math.round(pct)}%</span>
        </div>
      )}
      <div className={cn('w-full overflow-hidden rounded-full bg-muted', sizeClasses[size])}>
        <div
          className={cn('rounded-full transition-all duration-300', variantClasses[variant])}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}
