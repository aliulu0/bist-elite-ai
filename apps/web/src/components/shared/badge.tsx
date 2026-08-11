import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'outline';
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-primary text-primary-foreground',
  success: 'bg-success text-success-foreground',
  danger: 'bg-destructive text-destructive-foreground',
  warning: 'bg-warning text-warning-foreground',
  info: 'bg-info text-info-foreground',
  outline: 'border border-border text-muted-foreground',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold', variantClasses[variant], className)}>
      {children}
    </span>
  );
}
